#!/usr/bin/env npx ts-node
/**
 * Model Audit & Test Script
 *
 * This script performs three functions:
 * 1. Docs Coverage Check: Compares MODEL_CATALOG with ai.mdx documentation
 * 2. Model Testing: Tests each model's supported interfaces
 * 3. Platform Testing: Tests models used by raindrop modules with production-like inputs
 *
 * Usage:
 *   npx ts-node scripts/audit-models.ts [--docs-only] [--test-only] [--modules] [--model <name>]
 *
 * Options:
 *   --docs-only    Only run documentation coverage check
 *   --test-only    Only run model tests (all models, generic inputs)
 *   --modules      Run raindrop modules smoke tests (production-like inputs)
 *   --model <name> Test a specific model only
 *   --help         Show this help message
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const AI_TS_PATH = path.join(__dirname, '../src/ai.ts');
const AI_MDX_PATH = path.join(__dirname, '../../../apps/lm-docs-website/src/content/docs/reference/ai.mdx');

// Model router endpoint (for testing)
const MODEL_ROUTER_URL = process.env.MODEL_ROUTER_URL || 'https://ai.liquidmetal.run';
const MODEL_ROUTER_API_KEY = process.env.MODEL_ROUTER_API_KEY || '';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Global verbose flag (set from CLI args)
let VERBOSE = false;

// Cache for audio data to avoid downloading multiple times
// Using Blob allows us to call .stream() multiple times (each creates a fresh ReadableStream)
let cachedAudioBlob: Blob | null = null;

// Import readline for license prompting
import * as readline from 'readline';

/**
 * Parses rate limit error response to extract retry_after value
 */
function parseRateLimitError(responseText: string): number | null {
  try {
    const data = JSON.parse(responseText);
    // Check for retry_after in various locations
    if (data.retry_after) return data.retry_after;
    if (data.error?.retry_after) return data.error.retry_after;
    // Check for Retry-After in message
    const retryMatch = responseText.match(/retry.?after[:\s]+(\d+)/i);
    if (retryMatch && retryMatch[1]) return parseInt(retryMatch[1], 10);
  } catch {
    // Try regex on raw text
    const retryMatch = responseText.match(/retry.?after[:\s]+(\d+)/i);
    if (retryMatch && retryMatch[1]) return parseInt(retryMatch[1], 10);
  }
  return null;
}

/**
 * Checks if error is a license acceptance error and offers to accept it
 */
async function handleLicenseError(
  errorText: string,
  modelName: string,
  url: string,
  options: RequestInit
): Promise<boolean> {
  const licensePatterns = [
    /accept.*license/i,
    /license.*agreement/i,
    /terms.*service/i,
    /must.*agree/i,
    /requires.*acceptance/i,
    /submit.*['"]?agree['"]?/i,  // "submit the prompt 'agree'"
    /community\s+license/i,      // "Community License"
    /hereby\s+agree/i,           // "hereby agree to"
  ];

  const isLicenseError = licensePatterns.some(pattern => pattern.test(errorText));
  if (!isLicenseError) return false;

  // Extract license URL if present
  const urlMatch = errorText.match(/https?:\/\/[^\s"'<>]+/);
  const licenseUrl = urlMatch ? urlMatch[0] : null;

  console.log(`\n${colors.yellow}⚠ Model '${modelName}' requires license acceptance.${colors.reset}`);
  if (licenseUrl) {
    console.log(`${colors.cyan}License URL: ${licenseUrl}${colors.reset}`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Accept the license and continue? (y/n): ${colors.reset}`, async (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log(`${colors.cyan}Sending 'agree' to accept license...${colors.reset}`);

        try {
          // Send 'agree' to accept the license - use appropriate format based on endpoint and model
          const isChatEndpoint = url.includes('/chat/completions');
          const isVisionModel = modelName.includes('vision') || modelName.includes('llava');

          // 1x1 red pixel PNG for vision model license acceptance
          const tinyImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

          let acceptBody: Record<string, unknown>;
          if (isChatEndpoint) {
            // Vision models need content as array with image AND text
            const content = isVisionModel
              ? [
                  { type: 'text', text: 'agree' },
                  { type: 'image_url', image_url: { url: tinyImage } }
                ]
              : 'agree';
            acceptBody = { model: modelName, messages: [{ role: 'user', content }] };
          } else {
            acceptBody = { model: modelName, prompt: 'agree' };
          }

          const acceptResponse = await fetch(url, {
            ...options,
            body: JSON.stringify(acceptBody)
          });

          const acceptResponseText = await acceptResponse.text();

          // Check for success - either 2xx status OR success message in body
          // (some servers return success messages with error status codes)
          const isSuccessMessage = /thank you for agreeing|you may now use the model/i.test(acceptResponseText);

          if (acceptResponse.ok || isSuccessMessage) {
            console.log(`${colors.green}License accepted! Retrying original request...${colors.reset}`);
            resolve(true);
          } else {
            console.log(`${colors.red}Failed to accept license: ${acceptResponseText.slice(0, 200)}${colors.reset}`);
            resolve(false);
          }
        } catch (error) {
          console.log(`${colors.red}Error accepting license: ${error}${colors.reset}`);
          resolve(false);
        }
      } else {
        console.log(`${colors.gray}Skipping model.${colors.reset}`);
        resolve(false);
      }
    });
  });
}

/**
 * Makes an API request with rate limit retry logic and license handling
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  modelName: string,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const errorText = await response.text();
        const retryAfter = parseRateLimitError(errorText);
        const waitTime = retryAfter ? retryAfter * 1000 : Math.min(1000 * Math.pow(2, attempt), 30000);

        console.log(`${colors.yellow}Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle license errors (can come as 403, 401, or even 500)
      if (!response.ok) {
        const errorText = await response.text();

        // Check if this is a license error (regardless of status code)
        const shouldRetry = await handleLicenseError(errorText, modelName, url, options);
        if (shouldRetry) {
          continue;
        }

        // Return a new response with the same status but we've consumed the body
        // Create a new Response to avoid "body already read" issues
        return new Response(errorText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Network errors - retry with backoff
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`${colors.yellow}Network error. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

interface ModelEntry {
  name: string;
  capability: string[];
  provider: string;
  providerModel: string;
  description: string;
}

interface AuditResult {
  docsCheck: {
    inCatalogNotDocs: string[];
    inDocsNotCatalog: string[];
    documented: string[];
  };
  testResults: Map<string, TestResult>;
}

interface TestResult {
  model: string;
  capability: string;
  success: boolean;
  latencyMs?: number;
  error?: string;
  details?: string;
}

// ============================================
// PART 1: Documentation Coverage Check
// ============================================

function extractModelsFromCatalog(): ModelEntry[] {
  const content = fs.readFileSync(AI_TS_PATH, 'utf-8');

  // Find MODEL_CATALOG array
  const catalogMatch = content.match(/export const MODEL_CATALOG = \[([\s\S]*?)\];/);
  if (!catalogMatch || !catalogMatch[1]) {
    throw new Error('Could not find MODEL_CATALOG in ai.ts');
  }

  const catalogContent: string = catalogMatch[1];
  const models: ModelEntry[] = [];

  // Parse each model entry
  const modelRegex = /\{\s*name:\s*['"]([^'"]+)['"]\s*,\s*capability:\s*\[([^\]]*)\]\s*,\s*provider:\s*['"]([^'"]+)['"]\s*,\s*providerModel:\s*['"]([^'"]+)['"]\s*,\s*description:\s*['"]([^'"]+)['"]/g;

  let match;
  while ((match = modelRegex.exec(catalogContent)) !== null) {
    const capStr = match[2] ?? '';
    const capabilities = capStr
      .split(',')
      .map((c) => c.trim().replace(/['"]/g, ''))
      .filter((c) => c);

    models.push({
      name: match[1] ?? '',
      capability: capabilities,
      provider: match[3] ?? '',
      providerModel: match[4] ?? '',
      description: match[5] ?? '',
    });
  }

  return models;
}

function extractModelsFromDocs(): string[] {
  const content = fs.readFileSync(AI_MDX_PATH, 'utf-8');

  // Find all backtick-quoted model names in list items
  // Pattern: - `model-name` - description
  const modelPattern = /^-\s*`([a-zA-Z0-9][-a-zA-Z0-9_.]*)`\s*-/gm;

  const models: Set<string> = new Set();
  let match;
  while ((match = modelPattern.exec(content)) !== null) {
    if (match[1]) {
      models.add(match[1]);
    }
  }

  return Array.from(models);
}

function checkDocsCoverage(catalogModels: ModelEntry[]): AuditResult['docsCheck'] {
  const catalogNames = new Set(catalogModels.map((m) => m.name));
  const docsNames = new Set(extractModelsFromDocs());

  const inCatalogNotDocs: string[] = [];
  const inDocsNotCatalog: string[] = [];
  const documented: string[] = [];

  for (const name of catalogNames) {
    if (docsNames.has(name)) {
      documented.push(name);
    } else {
      inCatalogNotDocs.push(name);
    }
  }

  for (const name of docsNames) {
    if (!catalogNames.has(name)) {
      inDocsNotCatalog.push(name);
    }
  }

  return {
    inCatalogNotDocs: inCatalogNotDocs.sort(),
    inDocsNotCatalog: inDocsNotCatalog.sort(),
    documented: documented.sort(),
  };
}

function printDocsCoverageReport(result: AuditResult['docsCheck'], catalogModels: ModelEntry[]): void {
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '  DOCUMENTATION COVERAGE REPORT' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);

  const total = catalogModels.length;
  const documented = result.documented.length;
  const coverage = ((documented / total) * 100).toFixed(1);

  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total models in catalog: ${total}`);
  console.log(`  Documented models: ${documented}`);
  console.log(`  Coverage: ${coverage}%`);

  if (result.inCatalogNotDocs.length > 0) {
    console.log(`\n${colors.yellow}⚠ Models in catalog but NOT in docs (${result.inCatalogNotDocs.length}):${colors.reset}`);
    for (const name of result.inCatalogNotDocs) {
      const model = catalogModels.find((m) => m.name === name);
      const caps = model?.capability.join(', ') || 'unknown';
      console.log(`  ${colors.yellow}• ${name}${colors.reset} ${colors.gray}[${caps}]${colors.reset}`);
    }
  }

  if (result.inDocsNotCatalog.length > 0) {
    console.log(`\n${colors.red}✗ Models in docs but NOT in catalog (${result.inDocsNotCatalog.length}):${colors.reset}`);
    for (const name of result.inDocsNotCatalog) {
      console.log(`  ${colors.red}• ${name}${colors.reset} ${colors.gray}(should be removed from docs)${colors.reset}`);
    }
  }

  if (result.inCatalogNotDocs.length === 0 && result.inDocsNotCatalog.length === 0) {
    console.log(`\n${colors.green}✓ Documentation is fully in sync with catalog!${colors.reset}`);
  }
}

// ============================================
// PART 1b: Published Documentation Check
// Compares catalog with live docs at docs.liquidmetal.ai
// ============================================

const PUBLISHED_DOCS_URL = 'https://docs.liquidmetal.ai/reference/ai/';

async function extractModelsFromPublishedDocs(): Promise<string[]> {
  try {
    const response = await fetch(PUBLISHED_DOCS_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();

    // Extract model names from backticks in the HTML
    // Pattern matches: <code>model-name</code> or `model-name` in various contexts
    const models: Set<string> = new Set();

    // Match model names in <code> tags (common in rendered markdown)
    const codePattern = /<code[^>]*>([a-zA-Z0-9][-a-zA-Z0-9_.]*)<\/code>/g;
    let match;
    while ((match = codePattern.exec(html)) !== null) {
      const modelName = match[1];
      // Filter to only include likely model names (exclude common code snippets)
      if (
        modelName &&
        !modelName.includes('=') &&
        !modelName.includes('(') &&
        !modelName.includes('{') &&
        !modelName.startsWith('npm') &&
        !modelName.startsWith('npx') &&
        modelName.length > 2 &&
        modelName.length < 50
      ) {
        models.add(modelName);
      }
    }

    return Array.from(models);
  } catch (error) {
    console.error(`${colors.red}Failed to fetch published docs: ${error}${colors.reset}`);
    return [];
  }
}

interface PublishedDocsCheck {
  inCatalogNotPublished: string[];
  inPublishedNotCatalog: string[];
  synced: string[];
  fetchError?: string;
}

async function checkPublishedDocsCoverage(catalogModels: ModelEntry[]): Promise<PublishedDocsCheck> {
  const catalogNames = new Set(catalogModels.map((m) => m.name));
  const publishedModels = await extractModelsFromPublishedDocs();

  if (publishedModels.length === 0) {
    return {
      inCatalogNotPublished: [],
      inPublishedNotCatalog: [],
      synced: [],
      fetchError: 'Could not fetch or parse published docs',
    };
  }

  // Filter published models to only those that look like our model names
  // (exclude common words, API terms, etc.)
  const knownNonModels = new Set([
    'Authorization', 'Bearer', 'Content-Type', 'application', 'json', 'POST', 'GET',
    'env', 'AI', 'run', 'chat', 'completions', 'embeddings', 'audio', 'transcriptions',
    'model', 'messages', 'role', 'user', 'content', 'max_tokens', 'temperature',
    'response', 'choices', 'message', 'text', 'data', 'embedding', 'object',
    'true', 'false', 'null', 'undefined', 'string', 'number', 'boolean',
    'raindrop', 'framework', 'liquidmetal', 'api', 'key', 'url', 'endpoint',
    'env.AI', // Code reference, not a model
  ]);

  const publishedNames = new Set(
    publishedModels.filter((name) => !knownNonModels.has(name) && !knownNonModels.has(name.toLowerCase()))
  );

  const inCatalogNotPublished: string[] = [];
  const inPublishedNotCatalog: string[] = [];
  const synced: string[] = [];

  for (const name of catalogNames) {
    if (publishedNames.has(name)) {
      synced.push(name);
    } else {
      inCatalogNotPublished.push(name);
    }
  }

  for (const name of publishedNames) {
    if (!catalogNames.has(name)) {
      // Only report if it looks like a model name (has a dash or dot, common in model names)
      if (name.includes('-') || name.includes('.') || name.includes('_')) {
        inPublishedNotCatalog.push(name);
      }
    }
  }

  return {
    inCatalogNotPublished: inCatalogNotPublished.sort(),
    inPublishedNotCatalog: inPublishedNotCatalog.sort(),
    synced: synced.sort(),
  };
}

function printPublishedDocsCoverageReport(result: PublishedDocsCheck, catalogModels: ModelEntry[]): void {
  console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '  PUBLISHED DOCS CHECK (docs.liquidmetal.ai)' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);

  if (result.fetchError) {
    console.log(`\n${colors.red}✗ ${result.fetchError}${colors.reset}`);
    return;
  }

  const total = catalogModels.length;
  const synced = result.synced.length;
  const coverage = ((synced / total) * 100).toFixed(1);

  console.log(`\n${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total models in catalog: ${total}`);
  console.log(`  Models in published docs: ${synced}`);
  console.log(`  Coverage: ${coverage}%`);

  if (result.inCatalogNotPublished.length > 0) {
    console.log(`\n${colors.yellow}⚠ Models in catalog but NOT in published docs (${result.inCatalogNotPublished.length}):${colors.reset}`);
    for (const name of result.inCatalogNotPublished) {
      const model = catalogModels.find((m) => m.name === name);
      const caps = model?.capability.join(', ') || 'unknown';
      console.log(`  ${colors.yellow}• ${name}${colors.reset} ${colors.gray}[${caps}]${colors.reset}`);
    }
  }

  if (result.inPublishedNotCatalog.length > 0) {
    console.log(`\n${colors.red}✗ Models in published docs but NOT in catalog (${result.inPublishedNotCatalog.length}):${colors.reset}`);
    for (const name of result.inPublishedNotCatalog) {
      console.log(`  ${colors.red}• ${name}${colors.reset} ${colors.gray}(stale - should be removed)${colors.reset}`);
    }
  }

  if (result.inCatalogNotPublished.length === 0 && result.inPublishedNotCatalog.length === 0) {
    console.log(`\n${colors.green}✓ Published docs are fully in sync with catalog!${colors.reset}`);
  }
}

// ============================================
// PART 2: Model Testing
// ============================================

function getMinimalTestInput(capability: string): Record<string, unknown> {
  switch (capability) {
    case 'chat':
      return {
        messages: [{ role: 'user', content: 'Say "test" and nothing else.' }],
        max_tokens: 500,
      };

    case 'vision': {
      // 4x4 red pixel PNG as base64 (llava times out on 1x1 pixel images)
      const redPixel4x4 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP4z8AARwzEcQCukw/x0F8jngAAAABJRU5ErkJggg==';
      return {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe what you see in this image briefly.' },
              { type: 'image_url', image_url: { url: redPixel4x4 } },
            ],
          },
        ],
        max_tokens: 100,
      };
    }

    case 'embeddings':
      // Use /v1/ai/run endpoint with 'prompt' field (matches production format)
      return {
        prompt: 'test',
      };

    case 'audio':
      // Audio requires async input - mark for async fetching
      return {
        _async: true,
        _asyncType: 'audio',
      };

    case 'tts':
      // Include voice field so model-router detects this as TTS (not text-classification)
      return {
        text: 'Test.',
        voice: 'default',
      };

    case 'image-generation':
      // Use 512x512 (required by many models like stable-diffusion-xl)
      // Include n=1 to ensure model-router detects this as ImageGenerationInput
      // Use extremely bland prompt - flux models have aggressive content filters
      return {
        prompt: 'abstract colorful gradient',
        width: 512,
        height: 512,
        steps: 4,
        n: 1,
      };

    case 'pii-detection':
      // Use 'prompt' field to match production /v1/ai/run format
      return {
        prompt: 'John Smith lives at 123 Main St. Email: john@test.com',
      };

    case 'text-classification':
      return {
        text: 'I love this product!',
      };

    case 'reranker':
      // Reranker takes a query and documents to rerank (matches smartbucket retriever-agent)
      return {
        query: 'What is the capital of France?',
        documents: [
          'Paris is the capital of France.',
          'London is the capital of the United Kingdom.',
          'Berlin is the capital of Germany.',
        ],
        top_k: 3,
      };

    case 'image-classification':
      // 4x4 red pixel PNG as byte array
      return {
        image: [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 4, 8, 2, 0, 0, 0, 38, 147, 9, 41, 0, 0, 0, 16, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 0, 71, 12, 196, 113, 0, 174, 147, 15, 241, 208, 95, 35, 158, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130],
      };

    case 'translation':
      // Model-router expects target_language (long form) to detect TranslationInput
      // It transforms to target_lang (short form) for Cloudflare
      return {
        text: 'Hello',
        source_language: 'en',
        target_language: 'es',
      };

    case 'summarization':
      return {
        text: 'This is a test sentence that should be summarized. It contains some information.',
        max_length: 20,
      };

    default:
      return {
        _skip: true,
        _reason: `Unknown capability: ${capability}`,
      };
  }
}

function getEndpointForCapability(capability: string): string {
  // Use /v1/ai/run for all capabilities - it routes internally based on model
  // and applies proper input transformations for each model type.
  // This tests the model-router's full routing logic.
  switch (capability) {
    case 'chat':
    case 'vision':
      // Chat/vision still use OpenAI-compatible endpoint for compatibility testing
      return '/v1/chat/completions';
    default:
      // All other capabilities use generic AI run endpoint
      return '/v1/ai/run';
  }
}

/**
 * Fetches async input for capabilities that require external resources
 */
async function getAsyncInput(asyncType: string): Promise<Record<string, unknown>> {
  switch (asyncType) {
    case 'audio': {
      // Fetch and cache audio as Blob if not already cached
      if (!cachedAudioBlob) {
        // Fetch audio for testing
        // Old large audio file (6.6MB) - commented out
        // const audioUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Gandhi_-_His_Spiritual_Message_to_the_World%2C_17_October_1931.mp3';
        // Smaller audio clip for testing
        const audioUrl = 'https://dare.wisc.edu/wp-content/uploads/sites/1051/2017/08/CA138clip.mp3';
        console.log(`${colors.gray}Fetching audio from ${audioUrl}...${colors.reset}`);

        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
        }

        cachedAudioBlob = await response.blob();
        console.log(`${colors.gray}Audio loaded: ${cachedAudioBlob.size} bytes${colors.reset}`);
      }

      // For HTTP/JSON requests via /v1/ai/run, use byte array (JSON-serializable)
      // Production uses ReadableStream via AI.run() directly, but HTTP API needs byte array
      // The model-router converts byte arrays to the format each model needs
      const audioBuffer = await cachedAudioBlob.arrayBuffer();
      return {
        audio: Array.from(new Uint8Array(audioBuffer)),
        contentType: cachedAudioBlob.type || 'audio/mpeg',
        language: 'en',
      };
    }
    default:
      throw new Error(`Unknown async type: ${asyncType}`);
  }
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

/**
 * Validates that a model response is correct and makes sense for the given capability.
 * This goes beyond just checking structure - it verifies the content is reasonable.
 */
function validateResponse(capability: string, responseData: unknown): ValidationResult {
  const data = responseData as Record<string, unknown>;

  switch (capability) {
    case 'chat': {
      // Check structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        return { valid: false, error: 'Missing or empty choices array' };
      }

      const choice = data.choices[0] as Record<string, unknown>;
      if (!choice.message || typeof choice.message !== 'object') {
        return { valid: false, error: 'Missing message in first choice' };
      }

      const message = choice.message as Record<string, unknown>;
      const content = message.content;

      if (typeof content !== 'string') {
        return { valid: false, error: 'Message content is not a string' };
      }

      if (content.trim().length === 0) {
        return { valid: false, error: 'Message content is empty' };
      }

      // We asked the model to say "test" - check if it responded reasonably
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('test') || content.length < 50) {
        // Either contains "test" or is a short response (acceptable for simple prompt)
        return { valid: true, details: `Response: "${content.slice(0, 100)}..."` };
      }

      // If it's a longer response without "test", still accept but note it
      return { valid: true, details: `Response (unexpected length): "${content.slice(0, 100)}..."` };
    }

    case 'vision': {
      // Check structure (same as chat)
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        return { valid: false, error: 'Missing or empty choices array' };
      }

      const choice = data.choices[0] as Record<string, unknown>;
      if (!choice.message || typeof choice.message !== 'object') {
        return { valid: false, error: 'Missing message in first choice' };
      }

      const message = choice.message as Record<string, unknown>;
      const content = message.content;

      if (typeof content !== 'string') {
        return { valid: false, error: 'Message content is not a string' };
      }

      if (content.trim().length === 0) {
        return { valid: false, error: 'Message content is empty' };
      }

      // We sent a red pixel and asked about the color
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('red') || lowerContent.includes('color') || lowerContent.includes('pixel')) {
        return { valid: true, details: `Correctly identified: "${content.slice(0, 100)}"` };
      }

      // Still valid if it gave a response, just note it didn't identify the color
      return { valid: true, details: `Response (color not identified): "${content.slice(0, 100)}"` };
    }

    case 'embeddings': {
      // Handle multiple embedding response formats
      let embedding: number[] | undefined;

      // Format 1: Model router format: { embeddings: [{ embedding: number[] }] }
      const embeddings = data.embeddings as Array<{ embedding: number[] }> | undefined;
      if (Array.isArray(embeddings) && embeddings.length > 0 && embeddings[0]?.embedding) {
        embedding = embeddings[0].embedding;
      }
      // Format 2: OpenAI format: { data: [{ embedding: number[] }] }
      else if (Array.isArray(data.data) && data.data.length > 0) {
        const first = data.data[0] as Record<string, unknown>;
        if (Array.isArray(first.embedding)) {
          embedding = first.embedding as number[];
        }
        // Format 3: Cloudflare format: { data: [[0.1, 0.2, ...]] } - array of arrays
        else if (Array.isArray(first) && typeof first[0] === 'number') {
          embedding = first as unknown as number[];
        }
      }
      // Format 4: Cloudflare flat format: { shape: [1, 384], data: [0.1, 0.2, ...] }
      if (!embedding && Array.isArray(data.data) && data.shape && typeof data.data[0] === 'number') {
        embedding = data.data as number[];
      }
      // Format 5: Direct result array: { result: { data: [[...]] } } (some Cloudflare responses)
      if (!embedding && data.result) {
        const result = data.result as Record<string, unknown>;
        if (Array.isArray(result.data) && result.data.length > 0) {
          const firstResult = result.data[0];
          if (Array.isArray(firstResult) && typeof firstResult[0] === 'number') {
            embedding = firstResult as number[];
          }
        }
      }

      // Format 6: Direct vector in root: { vector: [...] }
      if (!embedding && Array.isArray(data.vector) && typeof data.vector[0] === 'number') {
        embedding = data.vector as number[];
      }
      // Format 7: Single embedding in root: { embedding: [...] }
      if (!embedding && Array.isArray(data.embedding) && typeof data.embedding[0] === 'number') {
        embedding = data.embedding as number[];
      }

      if (!embedding || !Array.isArray(embedding)) {
        // Log what we got for debugging
        const keys = Object.keys(data).join(', ');
        // Also show first 200 chars of stringified data for debugging
        const preview = JSON.stringify(data).slice(0, 200);
        return { valid: false, error: `Missing or invalid embedding array (keys: ${keys}, preview: ${preview})` };
      }

      if (embedding.length < 10) {
        return { valid: false, error: `Embedding too short: ${embedding.length} dimensions` };
      }

      // Check that values are numbers
      if (typeof embedding[0] !== 'number') {
        return { valid: false, error: 'Embedding values are not numbers' };
      }

      // Check for reasonable values (should be normalized, typically -1 to 1 or small floats)
      const sample = embedding.slice(0, 5) as number[];
      const maxAbs = Math.max(...sample.map(Math.abs));
      if (maxAbs > 100) {
        return { valid: false, error: `Embedding values seem too large: max=${maxAbs}` };
      }

      return { valid: true, details: `${embedding.length} dimensions, sample: [${sample.map((n: number) => n.toFixed(4)).join(', ')}...]` };
    }

    case 'tts': {
      const audio = data.audio;

      if (audio === undefined || audio === null) {
        return { valid: false, error: 'Missing audio field' };
      }

      // Audio could be base64 string, array, or ArrayBuffer representation
      if (typeof audio === 'string') {
        if (audio.length < 100) {
          return { valid: false, error: `Audio data too short: ${audio.length} chars` };
        }
        return { valid: true, details: `Base64 audio, ${audio.length} chars` };
      }

      if (Array.isArray(audio)) {
        if (audio.length < 100) {
          return { valid: false, error: `Audio data too short: ${audio.length} bytes` };
        }
        return { valid: true, details: `Audio array, ${audio.length} bytes` };
      }

      return { valid: true, details: `Audio data present (type: ${typeof audio})` };
    }

    case 'pii-detection': {
      // Could be under 'entities' or 'pii_detection'
      const entities = (data.entities || data.pii_detection) as unknown[];

      if (!Array.isArray(entities)) {
        return { valid: false, error: 'Missing entities array' };
      }

      // We sent text with name and email - should detect at least one
      if (entities.length === 0) {
        return { valid: false, error: 'No PII entities detected (expected at least name/email)' };
      }

      const types = entities.map((e) => (e as Record<string, unknown>).entity_type || (e as Record<string, unknown>).label || 'unknown');
      return { valid: true, details: `Detected ${entities.length} entities: ${types.join(', ')}` };
    }

    case 'image-generation': {
      // Could be 'image' field (base64/array) or 'data' array with URLs
      if (data.image) {
        const img = data.image;
        if (typeof img === 'string' && img.length > 100) {
          return { valid: true, details: `Base64 image, ${img.length} chars` };
        }
        if (Array.isArray(img) && img.length > 100) {
          return { valid: true, details: `Image array, ${img.length} bytes` };
        }
        return { valid: false, error: `Image data too small or wrong type` };
      }

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const first = data.data[0] as Record<string, unknown>;
        if (first.url || first.b64_json) {
          return { valid: true, details: `Image in data array (${first.url ? 'URL' : 'base64'})` };
        }
      }

      return { valid: false, error: 'No image data found in response' };
    }

    case 'translation': {
      // Could be 'translation', 'translated_text', or 'text'
      const translated = data.translation || data.translated_text || data.text;

      if (typeof translated !== 'string') {
        return { valid: false, error: 'Missing translation field' };
      }

      if (translated.trim().length === 0) {
        return { valid: false, error: 'Translation is empty' };
      }

      // We translated "Hello" to Spanish - should be "Hola" or similar
      const lower = translated.toLowerCase();
      if (lower.includes('hola') || lower.includes('ola')) {
        return { valid: true, details: `Correct translation: "${translated}"` };
      }

      // Still valid if we got some translation
      return { valid: true, details: `Translation: "${translated}" (expected "Hola")` };
    }

    case 'summarization': {
      const summary = data.summary;

      if (typeof summary !== 'string') {
        return { valid: false, error: 'Missing summary field' };
      }

      if (summary.trim().length === 0) {
        return { valid: false, error: 'Summary is empty' };
      }

      return { valid: true, details: `Summary: "${summary.slice(0, 100)}"` };
    }

    case 'text-classification': {
      // Response is an array of { label, score } objects
      // Handle both array format (Cloudflare) and single object format
      let label: string | undefined;
      let score: number | undefined;

      if (Array.isArray(data) && data.length > 0) {
        // Cloudflare returns array of classifications
        const first = data[0] as Record<string, unknown>;
        label = first.label as string;
        score = first.score as number;
      } else {
        // Single object format
        label = data.label as string;
        score = data.score as number;
      }

      if (typeof label !== 'string' || label.trim().length === 0) {
        return { valid: false, error: 'Missing or empty label' };
      }

      if (typeof score !== 'number') {
        return { valid: false, error: 'Missing or invalid score' };
      }

      // We sent positive sentiment text
      const lower = label.toLowerCase();
      if (lower.includes('positive') || lower.includes('pos') || score > 0.5) {
        return { valid: true, details: `Label: "${label}", score: ${score.toFixed(3)}` };
      }

      return { valid: true, details: `Label: "${label}", score: ${score.toFixed(3)} (expected positive)` };
    }

    case 'reranker': {
      // Reranker returns ranked results with scores
      // Cloudflare format: { response: [{ id: number, score: number }] }
      // Standardized format: { ranked_documents: [{ index: number, relevance_score: number }] }
      const response = data.response as Array<{ id: number; score: number }> | undefined;
      const rankedDocs = data.ranked_documents as Array<{ index: number; relevance_score: number }> | undefined;

      if (rankedDocs && Array.isArray(rankedDocs) && rankedDocs.length > 0) {
        const topDoc = rankedDocs[0];
        return { valid: true, details: `${rankedDocs.length} results, top score: ${topDoc?.relevance_score?.toFixed(3)}` };
      }

      if (response && Array.isArray(response) && response.length > 0) {
        const topResult = response[0];
        return { valid: true, details: `${response.length} results, top: id=${topResult?.id}, score=${topResult?.score?.toFixed(3)}` };
      }

      return { valid: false, error: 'Missing reranker results (expected response or ranked_documents array)' };
    }

    default:
      // For unknown capabilities, just check we got some data back
      if (Object.keys(data).length === 0) {
        return { valid: false, error: 'Empty response' };
      }
      return { valid: true, details: `Response keys: ${Object.keys(data).join(', ')}` };
  }
}

// ============================================
// PART 3: Platform Smoke Tests
// Tests models as they're used in raindrop modules
// ============================================

interface PlatformTest {
  name: string;
  model: string;
  module: 'smartbucket' | 'smartmemory' | 'smartsql';
  description: string;
  endpoint: string;
  input: Record<string, unknown>;
  // Optional async function to generate input at test time (e.g., for fetching audio files)
  getInput?: () => Promise<Record<string, unknown>>;
  // Optional: use multipart/form-data instead of JSON (for file uploads like audio)
  useMultipart?: boolean;
  // Optional: provide a Blob for multipart file upload
  getFile?: () => Promise<Blob>;
  validate: (response: unknown) => ValidationResult;
}

const PLATFORM_TESTS: PlatformTest[] = [
  // SMARTBUCKET - Entity Relationship Extraction
  {
    name: 'Entity Relationship Extraction',
    model: 'llama-3.1-8b-external',
    module: 'smartbucket',
    description: 'Extracts entities and relationships from text',
    endpoint: '/v1/chat/completions',
    input: {
      model: 'llama-3.1-8b-external',
      messages: [
        {
          role: 'system',
          content: `Extract relationships between entities. Output JSON: { "relationships": [{ "firstEntity": "", "firstCategory": "", "relationship": "", "secondEntity": "", "secondCategory": "" }] }. Max 8 relationships. Use UPPER_CASE for relationship types.`,
        },
        {
          role: 'user',
          content: 'Apple Inc. was founded by Steve Jobs in Cupertino. The company released the iPhone in 2007.',
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      if (!data.choices || !Array.isArray(data.choices)) return { valid: false, error: 'Missing choices' };
      const content = ((data.choices[0] as Record<string, unknown>)?.message as Record<string, unknown>)?.content as string;
      if (!content) return { valid: false, error: 'Missing content' };
      try {
        const parsed = JSON.parse(content);
        if (!parsed.relationships?.length) return { valid: false, error: 'No relationships extracted' };
        return { valid: true, details: `${parsed.relationships.length} relationships extracted` };
      } catch {
        return { valid: false, error: 'Invalid JSON response' };
      }
    },
  },

  // SMARTBUCKET/SMARTMEMORY - Embeddings (matches production: env.AI.run('embeddings', { prompt }))
  {
    name: 'Text Embeddings',
    model: 'embeddings',
    module: 'smartbucket',
    description: 'Generates vector embeddings for semantic search',
    endpoint: '/v1/ai/run',
    input: { model: 'embeddings', prompt: 'The quick brown fox jumps over the lazy dog.' },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      // Production expects response.embeddings[0].embedding
      const embeddings = data.embeddings as Array<{ embedding: number[] }>;
      if (!Array.isArray(embeddings) || embeddings.length === 0) return { valid: false, error: 'Missing embeddings array' };
      const embedding = embeddings[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length < 100) return { valid: false, error: 'Invalid embedding' };
      return { valid: true, details: `${embedding.length} dimensions` };
    },
  },

  // SMARTBUCKET - Batch Embeddings (matches production batch format)
  {
    name: 'Batch Embeddings',
    model: 'embeddings',
    module: 'smartbucket',
    description: 'Batch embedding generation (up to 32 texts)',
    endpoint: '/v1/ai/run',
    input: { model: 'embeddings', prompt: ['First document.', 'Second document.', 'Third document.'] },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      const embeddings = data.embeddings as Array<{ embedding: number[] }>;
      if (!Array.isArray(embeddings) || embeddings.length !== 3) {
        return { valid: false, error: `Expected 3 embeddings, got ${embeddings?.length || 0}` };
      }
      return { valid: true, details: '3 embeddings returned' };
    },
  },

  // SMARTBUCKET - PII Detection (matches production: env.AI.run('pii-detection', { prompt }))
  {
    name: 'PII Detection',
    model: 'pii-detection',
    module: 'smartbucket',
    description: 'Detects personally identifiable information',
    endpoint: '/v1/ai/run',
    input: {
      model: 'pii-detection',
      prompt: 'My name is John Smith, email john@example.com, SSN 123-45-6789.',
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      // Production expects response.pii_detection with entity_type, confidence, text, start, end
      const entities = data.pii_detection as Array<{ entity_type: string; confidence: number; text: string }>;
      if (!Array.isArray(entities) || entities.length === 0) {
        return { valid: false, error: 'No PII detected' };
      }
      return { valid: true, details: `${entities.length} PII entities detected` };
    },
  },

  // SMARTSQL - SQL Generation
  {
    name: 'SQL Query Generation',
    model: 'deepseek-v3.1',
    module: 'smartsql',
    description: 'Converts natural language to SQL',
    endpoint: '/v1/chat/completions',
    input: {
      model: 'deepseek-v3.1',
      messages: [
        {
          role: 'system',
          content: `Generate SQL for Cloudflare D1 (SQLite). Output JSON: { "sql_query": "SELECT..." }. Schema: users(id, name, email), orders(id, user_id, total).`,
        },
        { role: 'user', content: 'Show top 5 users by total order value' },
      ],
      temperature: 0.2,
      max_tokens: 5000,  // Matches production (smartsql/manager)
      response_format: { type: 'json_object' },
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      if (!data.choices || !Array.isArray(data.choices)) return { valid: false, error: 'Missing choices' };
      const content = ((data.choices[0] as Record<string, unknown>)?.message as Record<string, unknown>)?.content as string;
      if (!content) return { valid: false, error: 'Missing content' };
      try {
        const parsed = JSON.parse(content);
        if (!parsed.sql_query) return { valid: false, error: 'Missing sql_query' };
        const sql = parsed.sql_query.toLowerCase();
        if (!sql.includes('select')) return { valid: false, error: 'Invalid SQL' };
        return { valid: true, details: `SQL generated: ${sql.slice(0, 60)}...` };
      } catch {
        return { valid: false, error: 'Invalid JSON response' };
      }
    },
  },

  // SMARTMEMORY - Memory Summarization
  {
    name: 'Memory Summarization',
    model: 'llama-3.3-70b',
    module: 'smartmemory',
    description: 'Summarizes agent session memories',
    endpoint: '/v1/chat/completions',
    input: {
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'Summarize the session memories in 2-3 paragraphs focusing on: objectives, errors/solutions, patterns.',
        },
        {
          role: 'user',
          content: 'Session: User deployed app to Cloudflare. Had CORS error, fixed with headers. Prefers TypeScript. Will add auth next.',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      if (!data.choices || !Array.isArray(data.choices)) return { valid: false, error: 'Missing choices' };
      const content = ((data.choices[0] as Record<string, unknown>)?.message as Record<string, unknown>)?.content as string;
      if (!content || content.length < 50) return { valid: false, error: 'Summary too short' };
      return { valid: true, details: `${content.length} chars` };
    },
  },

  // SMARTBUCKET - Vision (llava) - matches production: env.AI.run('llava-1.5-7b', { image, prompt })
  {
    name: 'Image Analysis (llava)',
    model: 'llava-1.5-7b',
    module: 'smartbucket',
    description: 'Extracts text from images',
    endpoint: '/v1/ai/run',
    input: {
      model: 'llava-1.5-7b',
      // 4x4 red pixel PNG as byte array - llava times out on 1x1 pixel images
      image: [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 4, 8, 2, 0, 0, 0, 38, 147, 9, 41, 0, 0, 0, 16, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 0, 71, 12, 196, 113, 0, 174, 147, 15, 241, 208, 95, 35, 158, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130],
      prompt: 'Describe this image briefly.',
      max_tokens: 512,  // Matches production
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      // Production expects { description: "..." } from llava
      if (typeof data.description === 'string' && data.description.length > 0) {
        return { valid: true, details: `"${data.description.slice(0, 50)}..."` };
      }
      return { valid: false, error: 'No description in response' };
    },
  },

  // SMARTBUCKET - Vision (maverick fallback) - uses OpenAI chat format for external models
  {
    name: 'Image Analysis (maverick)',
    model: 'llama-4-maverick-17b',
    module: 'smartbucket',
    description: 'Fallback vision model',
    endpoint: '/v1/chat/completions',
    input: {
      model: 'llama-4-maverick-17b',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What do you see?' },
          // 4x4 red pixel PNG (base64) - consistent with llava test
          { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP4z8AARwzEcQCukw/x0F8jngAAAABJRU5ErkJggg==' } },
        ],
      }],
      max_tokens: 200,
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      if (!data.choices || !Array.isArray(data.choices)) return { valid: false, error: 'Missing choices' };
      const content = ((data.choices[0] as Record<string, unknown>)?.message as Record<string, unknown>)?.content as string;
      if (!content) return { valid: false, error: 'No response' };
      return { valid: true, details: `"${content.slice(0, 50)}..."` };
    },
  },

  // SMARTBUCKET - Image Classification (resnet) - matches production: { image, prompt }
  {
    name: 'Image Classification',
    model: 'resnet-50',
    module: 'smartbucket',
    description: 'Classifies images using ResNet-50',
    endpoint: '/v1/ai/run',
    input: {
      model: 'resnet-50',
      // 4x4 red pixel PNG as byte array (minimum size required by model)
      image: [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 4, 8, 2, 0, 0, 0, 38, 147, 9, 41, 0, 0, 0, 16, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 0, 71, 12, 196, 113, 0, 174, 147, 15, 241, 208, 95, 35, 158, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130],
      prompt: 'Classify this image and return the main object or category you see',  // Matches production
    },
    validate: (response: unknown): ValidationResult => {
      // ResNet returns array of { label, score } directly
      if (Array.isArray(response) && response.length > 0) {
        const top = response[0] as { label?: string; score?: number };
        if (top.label) {
          return { valid: true, details: `Top: ${top.label} (${(top.score || 0).toFixed(2)})` };
        }
      }
      const data = response as Record<string, unknown>;
      // Also check for wrapped responses
      if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
        return { valid: true, details: `${data.predictions.length} predictions` };
      }
      if (data.label || data.class) {
        return { valid: true, details: `Class: ${data.label || data.class}` };
      }
      if (data.result) {
        return { valid: true, details: `Result received` };
      }
      return { valid: false, error: 'No classification result' };
    },
  },

  // SMARTBUCKET - Audio Transcription (whisper) - uses multipart/form-data like OpenAI API
  // Production uses AI.run() with ReadableStream; HTTP API uses multipart file upload
  {
    name: 'Audio Transcription',
    model: 'whisper-large-v3',
    module: 'smartbucket',
    description: 'Transcribes audio using Whisper',
    endpoint: '/v1/audio/transcriptions',
    input: { language: 'en' }, // Additional form fields
    useMultipart: true,
    getFile: async (): Promise<Blob> => {
      // Use cached audio blob, fetch if needed
      if (!cachedAudioBlob) {
        // Fetch audio for testing
        // Old large audio file (6.6MB) - commented out
        // const audioUrl = 'https://upload.wikimedia.org/wikipedia/commons/9/97/Gandhi_-_His_Spiritual_Message_to_the_World%2C_17_October_1931.mp3';
        // Smaller audio clip for testing
        const audioUrl = 'https://dare.wisc.edu/wp-content/uploads/sites/1051/2017/08/CA138clip.mp3';
        console.log(`${colors.gray}Fetching audio from ${audioUrl}...${colors.reset}`);

        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
        }

        cachedAudioBlob = await response.blob();
        console.log(`${colors.gray}Audio loaded: ${cachedAudioBlob.size} bytes${colors.reset}`);
      }
      return cachedAudioBlob;
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      // Whisper returns { text: "..." }
      if (typeof data.text === 'string') {
        if (data.text.trim().length === 0) {
          return { valid: false, error: 'Transcription is empty (expected speech)' };
        }
        // Gandhi speech should contain recognizable words
        return { valid: true, details: `"${data.text.slice(0, 80)}..."` };
      }
      return { valid: false, error: 'No transcription text' };
    },
  },

  // SMARTBUCKET - Reranker (retriever-agent) - matches production: { query, documents, top_k }
  {
    name: 'Document Reranking',
    model: 'bge-reranker-base',
    module: 'smartbucket',
    description: 'Reranks search results by relevance to query',
    endpoint: '/v1/ai/run',
    input: {
      model: 'bge-reranker-base',
      // Matches smartbucket retriever-agent format exactly
      query: 'What is the capital of France?',
      documents: [
        'Paris is the capital and most populous city of France.',
        'The Eiffel Tower is a famous landmark in Paris.',
        'London is the capital of the United Kingdom.',
        'Berlin is the capital of Germany.',
      ],
      top_k: 4,
    },
    validate: (response: unknown): ValidationResult => {
      const data = response as Record<string, unknown>;
      // Cloudflare format: { response: [{ id: number, score: number }] }
      // Standardized format: { ranked_documents: [{ index: number, relevance_score: number }] }
      const cfResponse = data.response as Array<{ id: number; score: number }> | undefined;
      const rankedDocs = data.ranked_documents as Array<{ index: number; relevance_score: number }> | undefined;

      if (rankedDocs && Array.isArray(rankedDocs) && rankedDocs.length > 0) {
        // Check that Paris document (index 0) is ranked highest
        const topIndex = rankedDocs[0]?.index;
        if (topIndex === 0) {
          return { valid: true, details: `Correctly ranked Paris doc first (score: ${rankedDocs[0]?.relevance_score?.toFixed(3)})` };
        }
        return { valid: true, details: `${rankedDocs.length} results (top index: ${topIndex}, expected 0)` };
      }

      if (cfResponse && Array.isArray(cfResponse) && cfResponse.length > 0) {
        // Check that Paris document (id 0) is ranked highest
        const topId = cfResponse[0]?.id;
        if (topId === 0) {
          return { valid: true, details: `Correctly ranked Paris doc first (score: ${cfResponse[0]?.score?.toFixed(3)})` };
        }
        return { valid: true, details: `${cfResponse.length} results (top id: ${topId}, expected 0)` };
      }

      return { valid: false, error: 'No reranker results returned' };
    },
  },
];

async function runPlatformTests(filterModel?: string): Promise<Map<string, TestResult>> {
  const results = new Map<string, TestResult>();

  console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '  PLATFORM SMOKE TESTS (Raindrop Modules)' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);

  if (!MODEL_ROUTER_API_KEY) {
    console.log(`\n${colors.yellow}⚠ MODEL_ROUTER_API_KEY not set. Set it to run platform tests.${colors.reset}`);
    return results;
  }

  const tests = filterModel ? PLATFORM_TESTS.filter((t) => t.model === filterModel) : PLATFORM_TESTS;

  if (tests.length === 0) {
    console.log(`\n${colors.yellow}No platform tests match the filter${colors.reset}`);
    return results;
  }

  // Group by module
  const byModule = new Map<string, PlatformTest[]>();
  for (const test of tests) {
    if (!byModule.has(test.module)) byModule.set(test.module, []);
    byModule.get(test.module)!.push(test);
  }

  for (const [module, moduleTests] of byModule) {
    console.log(`\n${colors.blue}${module.toUpperCase()}${colors.reset}`);

    for (const test of moduleTests) {
      process.stdout.write(`  ${test.name} (${colors.gray}${test.model}${colors.reset})... `);

      // Get input - either from async function or static object
      let input: Record<string, unknown>;
      try {
        input = test.getInput ? await test.getInput() : test.input;
      } catch (inputError) {
        results.set(test.name, {
          model: test.model,
          capability: test.module,
          success: false,
          error: `Failed to generate input: ${inputError instanceof Error ? inputError.message : String(inputError)}`,
        });
        console.log(`${colors.red}✗ Input generation failed: ${inputError instanceof Error ? inputError.message : inputError}${colors.reset}`);
        continue;
      }

      // Check for skip flag in input
      if (input._skip) {
        results.set(test.name, {
          model: test.model,
          capability: test.module,
          success: true,
          error: `Skipped: ${input._reason || 'No reason provided'}`,
        });
        console.log(`${colors.yellow}⏭ ${input._reason || 'Skipped'}${colors.reset}`);
        continue;
      }

      const startTime = Date.now();
      const url = `${MODEL_ROUTER_URL}${test.endpoint}`;

      if (VERBOSE) {
        console.log(`\n${colors.gray}    URL: ${url}${colors.reset}`);
        // Truncate large arrays (like audio bytes) in verbose output
        const inputForLog = { ...input };
        if (Array.isArray(inputForLog.audio) && inputForLog.audio.length > 100) {
          inputForLog.audio = `[${inputForLog.audio.length} bytes]` as unknown as number[];
        }
        console.log(`${colors.gray}    Request: ${test.useMultipart ? 'multipart/form-data' : JSON.stringify(inputForLog, null, 2).split('\n').join('\n    ')}${colors.reset}`);
      }

      try {
        let response: Response;

        if (test.useMultipart && test.getFile) {
          // Use multipart/form-data for file uploads (matches OpenAI API)
          const file = await test.getFile();
          const formData = new FormData();
          formData.append('file', file, 'audio.mp3');
          formData.append('model', test.model);
          // Add any additional form fields from input
          for (const [key, value] of Object.entries(input)) {
            if (key !== 'model' && value !== undefined) {
              formData.append(key, String(value));
            }
          }

          response = await fetchWithRetry(
            url,
            {
              method: 'POST',
              headers: {
                // Don't set Content-Type - let browser set it with boundary for multipart
                Authorization: `Bearer ${MODEL_ROUTER_API_KEY}`,
              },
              body: formData,
            },
            test.model
          );
        } else {
          // Use JSON for non-file requests
          response = await fetchWithRetry(
            url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${MODEL_ROUTER_API_KEY}`,
              },
              body: JSON.stringify(input),
            },
            test.model
          );
        }

        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          if (VERBOSE) {
            console.log(`${colors.gray}    Response (${response.status}): ${errorText}${colors.reset}`);
          }
          results.set(test.name, {
            model: test.model,
            capability: test.module,
            success: false,
            latencyMs,
            error: `HTTP ${response.status}: ${errorText.slice(0, 100)}`,
          });
          console.log(`${colors.red}✗ HTTP ${response.status}${colors.reset}`);
          continue;
        }

        const responseData = await response.json();

        if (VERBOSE) {
          const responseStr = JSON.stringify(responseData, null, 2);
          const truncated = responseStr.length > 1000 ? responseStr.slice(0, 1000) + '...' : responseStr;
          console.log(`${colors.gray}    Response: ${truncated.split('\n').join('\n    ')}${colors.reset}`);
        }

        const validation = test.validate(responseData);

        results.set(test.name, {
          model: test.model,
          capability: test.module,
          success: validation.valid,
          latencyMs,
          error: validation.error,
          details: validation.details,
        });

        if (validation.valid) {
          console.log(`${colors.green}✓${colors.reset} ${colors.gray}(${latencyMs}ms) ${validation.details || ''}${colors.reset}`);
        } else {
          console.log(`${colors.red}✗ ${validation.error}${colors.reset}`);
        }
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        results.set(test.name, {
          model: test.model,
          capability: test.module,
          success: false,
          latencyMs,
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(`${colors.red}✗ ${error instanceof Error ? error.message : error}${colors.reset}`);
      }
    }
  }

  return results;
}

// 4x4 red pixel PNG as byte array (reusable for image inputs)
const RED_PIXEL_4x4_PNG = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 4, 0, 0, 0, 4, 8, 2, 0, 0, 0, 38, 147, 9, 41, 0, 0, 0, 16, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 0, 71, 12, 196, 113, 0, 174, 147, 15, 241, 208, 95, 35, 158, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];

async function testModel(model: ModelEntry, capability: string): Promise<TestResult> {
  let input = getMinimalTestInput(capability);

  // Skip if input indicates we can't test this capability
  if ('_skip' in input && input._skip) {
    return {
      model: model.name,
      capability,
      success: true, // Mark as success but note it was skipped
      error: `Skipped: ${input._reason}`,
    };
  }

  // Handle model-specific input requirements
  if (model.name.includes('inpainting')) {
    // Inpainting models require image and mask inputs
    input = {
      ...input,
      image: RED_PIXEL_4x4_PNG,
      mask: RED_PIXEL_4x4_PNG, // Use same image as mask for testing
    };
  } else if (model.name.includes('img2img')) {
    // Img2img models require an image input to transform
    input = {
      ...input,
      image: RED_PIXEL_4x4_PNG,
    };
  } else if (model.name.includes('melotts')) {
    // melotts uses { prompt, lang } format directly
    input = {
      prompt: 'Test.',
      lang: 'en',
    };
  } else if (model.name === 'flux-2-dev') {
    // flux-2-dev requires multipart format for file upload API
    // This model uses a special form-based upload format
    // Use minimal prompt to avoid content filters (flux has very aggressive filtering)
    input = {
      multipart: {
        body: {},
        contentType: 'application/json',
      },
      prompt: 'noise',
      num_steps: 4,
    };
  } else if (model.name.includes('indictrans2')) {
    // indictrans2-en-indic models require Indic language as target (not Spanish/French/etc)
    // Use Hindi (hi) as target language
    input = {
      text: 'Hello',
      source_language: 'en',
      target_language: 'hi',
    };
  }

  // Handle async inputs (like audio that needs to be fetched)
  if ('_async' in input && input._async) {
    try {
      // Get standard AudioInput format: { audio: number[], contentType: string, language?: string }
      // The model-router handles conversion to model-specific formats internally
      input = await getAsyncInput(input._asyncType as string);
    } catch (error) {
      return {
        model: model.name,
        capability,
        success: false,
        error: `Failed to fetch async input: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // Post-async model-specific handling (for audio models that need extra params after audio is loaded)
  if (model.name === 'flux' && capability === 'audio') {
    // flux requires linear16 PCM audio, not MP3 - generate synthetic PCM
    // Generate 1 second of synthetic PCM audio (16kHz, 16-bit, mono = 32000 bytes)
    const sampleRate = 16000;
    const duration = 1; // 1 second
    const frequency = 440; // 440Hz tone
    const samples = sampleRate * duration;
    const pcmData = new Int16Array(samples);
    for (let i = 0; i < samples; i++) {
      // Generate sine wave, scale to 16-bit range
      pcmData[i] = Math.round(Math.sin(2 * Math.PI * frequency * i / sampleRate) * 16000);
    }
    // Convert to byte array for JSON serialization
    const pcmBytes = Array.from(new Uint8Array(pcmData.buffer));
    input = {
      audio: pcmBytes,
      contentType: 'audio/pcm',
      sample_rate: sampleRate,
      encoding: 'linear16',
    };
  }

  if (!MODEL_ROUTER_API_KEY) {
    return {
      model: model.name,
      capability,
      success: false,
      error: 'MODEL_ROUTER_API_KEY not set',
    };
  }

  const endpoint = getEndpointForCapability(capability);
  const url = `${MODEL_ROUTER_URL}${endpoint}`;

  const body: Record<string, unknown> = {
    model: model.name,
    ...input,
  };

  if (VERBOSE) {
    console.log(`\n${colors.gray}    URL: ${url}${colors.reset}`);
    // Truncate large arrays (like audio bytes) in verbose output
    const bodyForLog: Record<string, unknown> = { ...body };
    if (Array.isArray(bodyForLog.audio)) {
      bodyForLog.audio = `[${bodyForLog.audio.length} bytes]`;
    } else if (bodyForLog.audio && typeof bodyForLog.audio === 'object') {
      const audioObj = bodyForLog.audio as Record<string, unknown>;
      if (Array.isArray(audioObj.body)) {
        bodyForLog.audio = { ...audioObj, body: `[${audioObj.body.length} bytes]` };
      }
    }
    console.log(`${colors.gray}    Request: ${JSON.stringify(bodyForLog, null, 2).split('\n').join('\n    ')}${colors.reset}`);
  }

  const startTime = Date.now();

  try {
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MODEL_ROUTER_API_KEY}`,
        },
        body: JSON.stringify(body),
      },
      model.name
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        model: model.name,
        capability,
        success: false,
        latencyMs,
        error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    // Try to parse response to verify it's valid
    const responseData = await response.json();

    if (VERBOSE) {
      console.log(`${colors.gray}    Response: ${JSON.stringify(responseData, null, 2).slice(0, 500)}${colors.reset}`);
    }

    // Validate response content
    const validation = validateResponse(capability, responseData);

    if (!validation.valid) {
      if (VERBOSE) {
        console.log(`${colors.gray}    Full response for debugging: ${JSON.stringify(responseData)}${colors.reset}`);
      }
      return {
        model: model.name,
        capability,
        success: false,
        latencyMs,
        error: validation.error || 'Validation failed',
      };
    }

    return {
      model: model.name,
      capability,
      success: true,
      latencyMs,
      details: validation.details,
    };
  } catch (error) {
    return {
      model: model.name,
      capability,
      success: false,
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runModelTests(
  models: ModelEntry[],
  specificModel?: string
): Promise<Map<string, TestResult>> {
  const results = new Map<string, TestResult>();

  const modelsToTest = specificModel ? models.filter((m) => m.name === specificModel) : models;

  if (specificModel && modelsToTest.length === 0) {
    console.log(`${colors.red}Model '${specificModel}' not found in catalog${colors.reset}`);
    return results;
  }

  console.log('\n' + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '  MODEL TESTING' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);

  if (!MODEL_ROUTER_API_KEY) {
    console.log(`\n${colors.yellow}⚠ MODEL_ROUTER_API_KEY not set. Set it to run live tests.${colors.reset}`);
    console.log(`  export MODEL_ROUTER_API_KEY="your-api-key"`);
    return results;
  }

  console.log(`\n${colors.blue}Testing ${modelsToTest.length} models against ${MODEL_ROUTER_URL}${colors.reset}\n`);

  // Group models by capability for organized output
  const capabilityGroups = new Map<string, ModelEntry[]>();
  for (const model of modelsToTest) {
    for (const cap of model.capability) {
      if (!capabilityGroups.has(cap)) {
        capabilityGroups.set(cap, []);
      }
      capabilityGroups.get(cap)!.push(model);
    }
  }

  for (const [capability, capModels] of capabilityGroups) {
    console.log(`\n${colors.blue}Testing ${capability} models (${capModels.length}):${colors.reset}`);

    for (const model of capModels) {
      process.stdout.write(`  ${model.name}... `);

      const result = await testModel(model, capability);
      results.set(`${model.name}:${capability}`, result);

      if (result.success) {
        if (result.error?.startsWith('Skipped:')) {
          console.log(`${colors.yellow}⏭ ${result.error}${colors.reset}`);
        } else {
          const detailStr = result.details ? ` - ${result.details}` : '';
          console.log(`${colors.green}✓${colors.reset} ${colors.gray}(${result.latencyMs}ms)${detailStr}${colors.reset}`);
        }
      } else {
        console.log(`${colors.red}✗ ${result.error}${colors.reset}`);
      }
    }
  }

  return results;
}

function printTestSummary(results: Map<string, TestResult>): void {
  if (results.size === 0) return;

  console.log('\n' + colors.cyan + '───────────────────────────────────────────────────────────────' + colors.reset);
  console.log(colors.cyan + '  TEST SUMMARY' + colors.reset);
  console.log(colors.cyan + '───────────────────────────────────────────────────────────────' + colors.reset);

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures: TestResult[] = [];

  for (const result of results.values()) {
    if (result.success) {
      if (result.error?.startsWith('Skipped:')) {
        skipped++;
      } else {
        passed++;
      }
    } else {
      failed++;
      failures.push(result);
    }
  }

  console.log(`\n  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped: ${skipped}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);

  if (failures.length > 0) {
    console.log(`\n${colors.red}Failed tests:${colors.reset}`);
    for (const f of failures) {
      console.log(`  ${colors.red}• ${f.model} [${f.capability}]: ${f.error}${colors.reset}`);
    }
  }
}

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log(`
Model Audit & Test Script

Usage:
  npx ts-node scripts/audit-models.ts [options]

Options:
  --docs-only       Only run documentation coverage check (source + published)
  --skip-published  Skip checking published docs at docs.liquidmetal.ai
  --test-only       Only run model tests (all models, generic inputs)
  --modules         Run raindrop modules smoke tests (production-like inputs)
  --model <name>    Test a specific model only
  --verbose         Show detailed request/response info for debugging
  --help            Show this help message

Environment Variables:
  MODEL_ROUTER_URL     API endpoint (default: https://ai.liquidmetal.run)
  MODEL_ROUTER_API_KEY API key for authentication (required for tests)
`);
    process.exit(0);
  }

  const docsOnly = args.includes('--docs-only');
  const testOnly = args.includes('--test-only');
  const runModules = args.includes('--modules');
  const skipPublished = args.includes('--skip-published');
  // Check published docs by default (unless --test-only or --skip-published)
  const checkPublished = !testOnly && !skipPublished;
  VERBOSE = args.includes('--verbose');
  const modelIndex = args.indexOf('--model');
  const specificModel = modelIndex !== -1 ? args[modelIndex + 1] : undefined;

  console.log(colors.cyan + '\n🔍 Model Audit & Test Script' + colors.reset);
  console.log(colors.gray + '─────────────────────────────' + colors.reset);

  // Load catalog
  const catalogModels = extractModelsFromCatalog();
  console.log(`\nLoaded ${catalogModels.length} models from catalog`);

  // Run docs coverage check (source file)
  if (!testOnly) {
    const docsResult = checkDocsCoverage(catalogModels);
    printDocsCoverageReport(docsResult, catalogModels);
  }

  // Run published docs check (live website)
  if (checkPublished) {
    const publishedResult = await checkPublishedDocsCoverage(catalogModels);
    printPublishedDocsCoverageReport(publishedResult, catalogModels);
  }

  // Run model tests
  if (!docsOnly && !runModules) {
    const testResults = await runModelTests(catalogModels, specificModel);
    printTestSummary(testResults);
  }

  // Run platform/module smoke tests
  if (runModules) {
    const platformResults = await runPlatformTests(specificModel);
    printTestSummary(platformResults);
  }

  console.log('\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

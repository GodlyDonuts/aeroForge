# aero-forge

A Raindrop application built with Hono.js and modern web technologies.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Raindrop CLI installed (`npm install -g @liquidmetal-ai/raindrop`)
- Authenticated with Raindrop (`raindrop auth login`)

### Development Workflow

1. **Initialize your project** (already done if you're reading this)
   ```bash
   raindrop build init .
   npm install
   ```

2. **Generate initial code**
   ```bash
   raindrop build generate
   ```

3. **Discover available features** (recommended for new apps)
   ```bash
   raindrop build features
   ```

4. **Add features you need** (example)
   ```bash
   raindrop build smartmemory setup
   raindrop build smartsql setup
   ```

5. **Deploy to Raindrop**
   ```bash
   raindrop build deploy --start
   ```

   Or use the convenience script:
   ```bash
   npm run start
   ```

## Best Practices for Using Examples

When adding features to your app, follow this workflow to avoid issues:

### ✅ Recommended Workflow

1. **Run setup commands to get examples**
   ```bash
   raindrop build smartmemory setup
   raindrop build smartsql setup
   ```

2. **Test that examples compile**
   ```bash
   npm run build
   ```
   If examples don't compile, check that you ran `raindrop build generate` first.

3. **Study the examples for correct API usage**
   ```bash
   cat src/examples/smartmemory-minimal.ts
   ```
   Examples show actual available methods - do not guess at APIs!

4. **Adapt examples for your use case**
   Copy patterns from examples into your handlers. Don't rewrite from scratch.

### ❌ Common Mistakes to Avoid

- **Don't remove template example endpoints** - The `/api/hello`, `/api/echo` endpoints are used by tests. Add your endpoints alongside them, don't replace them.
- **Don't manually edit manifest without running generate** - You'll be missing TypeScript types
- **Don't guess at API methods** - Check examples for actual available methods
  - SmartBucket has: `put()`, `get()`, `list()`, `delete()`, `head()` (no `search()`!)
  - SmartMemory has: `startWorkingMemorySession()`, `getWorkingMemorySession(sessionId)`
  - SmartSQL has: `executeQuery({ sqlQuery })`, `executeQuery({ textQuery })`
- **Don't ignore binding names** - Use the exact names from your manifest in examples
- **Don't skip `npm run build`** - Compile errors catch API mistakes early
- **Don't declare `ai` in manifest** - AI is auto-available via `this.env.AI`

### 🔍 Troubleshooting

If you see errors about missing types or methods:
1. Run `raindrop build generate` to update types
2. Check `src/examples/` for correct API patterns
3. Verify binding names match between manifest and code
4. Run `npm run build` to catch TypeScript errors

## Raindrop Commands

### Essential Commands

| Command | Description | When to Use |
|---------|-------------|-------------|
| `raindrop build validate` | Validate your manifest | After changing `raindrop.manifest` |
| `raindrop build generate` | Generate TypeScript types and handler scaffolding | After changing `raindrop.manifest` |
| `raindrop build features` | List available features and integrations | When starting or adding functionality |
| `raindrop build deploy --start` | Build, upload and start your application | When ready to deploy |
| `raindrop build stop` | Stop your running application | To stop services |
| `raindrop build status` | Check deployment status | To see current state |
| `raindrop build find` | Get service locations | To see current service URLs |

### Advanced Commands

| Command | Description | Example |
|---------|-------------|---------|
| `raindrop logs tail` | View real-time logs | `raindrop logs tail` |
| `raindrop logs query` | Query historical logs | `raindrop logs query --since 30s` |

### Utility Commands

| Command | Description | Example |
|---------|-------------|---------|
| `raindrop auth login` | Authenticate with Raindrop | `raindrop auth login` |
| `raindrop auth list` | List authentications | `raindrop auth list` |

## Project Structure

```
aero-forge/
├── src/
│   ├── _app/              # App-level configuration (see below)
│   └── handlers/          # Your service/actor/observer handlers
├── db/                    # Database migration files
│   └──<db_name>/          # Database-specific SQL migrations
│       ├── 0000_initial_schema.sql
│       ├── 0001_add_users_table.sql
│       └── ...
├── raindrop.manifest      # Your application manifest (resources, modules)
├── package.json           # Node.js dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── RAINDROP.md            # This file
```

## NPM Scripts

Your `package.json` includes convenient scripts:

```json
{
  "scripts": {
    "build": "shx rm -rf dist && tsc -b",     # Build TypeScript
    "start": "raindrop build deploy --start",  # Deploy and start
    "stop": "raindrop build stop",             # Stop application
    "restart": "raindrop build deploy --start",# "Restart" application
    "format": "prettier --write \"**/*.{ts,tsx,md}\"", # Format code
    "lint": "eslint . --max-warnings=0",       # Lint code
    "test": "vitest run",                      # Run tests
    "test:watch": "vitest"                     # Watch mode tests
  }
}
```

## App-Level Configuration (`src/_app/`)

The `_app` directory contains application-wide configuration that affects all handlers:

### Authentication (`src/_app/auth.ts`)

Controls JWT verification and authorization for your entire application:

- **`verify`**: JWT verification hook - validates tokens
- **`authorize`**: Authorization hook - controls access

**Common patterns:**
```typescript
// Default: Require authenticated users
export const authorize = requireAuthenticated;

// Custom: Allow public access with optional auth
export const authorize = (request, env) => {
  // Custom logic here
  return true; // Allow all, or false to deny
};
```

### CORS (`src/_app/cors.ts`)

Controls Cross-Origin Resource Sharing for all HTTP services:

**Default**: CORS disabled (most secure)

**Enable for web applications:**
```typescript
import { createCorsHandler } from '@liquidmetal-ai/raindrop-framework/core/cors';
export const cors = createCorsHandler({
  origin: ['https://your-frontend.com'],
  credentials: true
});
```

**Public API (use with caution):**
```typescript
import { corsAllowAll } from '@liquidmetal-ai/raindrop-framework/core/cors';
export const cors = corsAllowAll;
```

## Available Features

Raindrop provides powerful features you can add to your application. Discover them with:

```bash
raindrop build features
```

### Popular Features

| Feature | Description | Setup Command |
|---------|-------------|---------------|
| **SmartMemory** | AI conversation memory management | `raindrop build smartmemory setup` |
| **SmartSQL** | PostgreSQL with natural language queries | `raindrop build smartsql setup` |
| **SmartBucket** | File storage with AI-powered search | `raindrop build smartbucket setup` |
| **Stateful Actor** | Durable objects with state management | `raindrop build actor setup` |
| **Queue Consumer** | Background message processing | `raindrop build queue setup` |
| **WorkOS Auth** | Authentication with WorkOS | `raindrop build workos setup` |
| **Stripe Payments** | Payment processing with Stripe | `raindrop build stripe setup` |

### Example: Adding SmartMemory

```bash
# 1. Set up SmartMemory in your app
raindrop build smartmemory setup

# 2. Generate updated types
raindrop build generate

# 3. Use in your handler
const { workingMemory } = await this.env.MEMORY.startWorkingMemorySession();
await workingMemory.putMemory({ content: 'Hello', agent: 'user' });
```

## Manifest Configuration

Your `raindrop.manifest` defines all resources and modules:

```raindrop
application "aero-forge" {
  // Services (HTTP endpoints)
  service "api" {
    visibility = "protected"  // public, protected, private
    domain {
      fqdn = "api.yourdomain.com"  // Optional custom domain
    }
  }

  // Actors (stateful background processors)
  actor "state-manager" {
    visibility = "private"
  }

  // SmartBucket (AI-powered document storage)
  smartbucket "documents" {}

  // KV Cache (fast key-value storage)
  kv_cache "cache" {}

  // Queues (message processing)
  queue "tasks" {}
}
```

## Handler Examples

Your handlers are generated in `src/handlers/` with comprehensive examples:

### HTTP Service (`src/handlers/http-service/`)
- ✅ **Working**: Basic Hono setup with `/health` and `/api/hello` endpoints
- 💡 **Examples**: Actor calls, SmartBucket operations, KV cache, queues (commented)

### Actor (`src/handlers/actor/`)
- 💡 **Examples**: State management, SmartBucket integration, caching, alarms (commented)

### Other Handlers
- **Observers**: React to bucket events
- **Tasks**: Scheduled operations
- **MCP Services**: Model Context Protocol integrations

## Development Workflow

### 1. Initial Setup
```bash
# After raindrop init
npm install
raindrop build generate

# Optional but recommended: explore features
raindrop build features
```

### 2. Development Cycle
```bash
# 1. Update manifest or handlers
# 2. Generate types if manifest changed
raindrop build generate

# 3. Validate configuration
raindrop build validate

# 4. Deploy
raindrop build deploy

# 5. Start application
raindrop build start

# Or combine deploy + start:
npm run start
```

### 3. Testing and Debugging
```bash
# Check status
raindrop build status

# View logs
raindrop logs tail

# Query logs
raindrop logs query --limit 100

# List resources
raindrop build list
```

### 4. Environment Variables
Set secrets in your manifest:
```raindrop
application "my-app" {
  env "DATABASE_URL" {
    secret = true
  }

  env "PUBLIC_KEY" {
    default = "default-value"
  }
}
```

### 5. Resource Binding
Access bound resources in handlers:
```typescript
// In HTTP service
const smartbucket = c.env.MY_SMARTBUCKET;  // Name from manifest
const cache = c.env.MY_CACHE_KV;

// In actor
const queue = this.env.MY_QUEUE;
```

### 6. Type Safety
All generated types are in `raindrop.gen.ts`:
```typescript
import { Env } from './raindrop.gen';

export default class extends Service<Env> {
  // Full type safety for env.MY_RESOURCE
}
```

## Common Workflows

### Adding a New Module
1. Add to `raindrop.manifest`
2. Run `raindrop build generate`
3. Implement handler logic
4. Validate: `raindrop build validate`
5. Deploy: `raindrop build deploy`

### Updating Existing Code
1. Make code changes
2. Build TypeScript: `npm run build`
3. Validate: `raindrop build validate`
4. Deploy: `raindrop build deploy`

### Branching for Development
```bash
# Create development branch
raindrop build branch dev

# Switch to branch
raindrop build checkout dev

# Deploy to branch
raindrop build deploy
```

## Framework Features

### Built-in Integrations
- **SmartBucket**: AI-powered document storage and search
- **SmartMemory**: Semantic memory and context management
- **SmartSQL**: Natural language database queries
- **Vector Index**: Similarity search and embeddings
- **AI**: Access to language models via `env.AI`

### Service Types
- **HTTP Services**: REST APIs with Hono.js
- **Actors**: Stateful background processors
- **Observers**: Event-driven processors
- **Tasks**: Scheduled operations
- **MCP Services**: AI model integrations

### Storage Options
- **Buckets**: Object storage
- **KV Cache**: Fast key-value storage
- **SQL Databases**: Relational data with automatic migrations
- **SmartBucket**: AI-enhanced storage

### Database Migrations

Database migration files are automatically executed during deployment:

**Location**: `db/<db_name>/<migration>`

**Naming Convention**: `4-digit_number_description.sql`
- `0000_initial_schema.sql`
- `0001_add_users_table.sql`
- `0002_add_foreign_keys.sql`

**Execution Order**: Files run in alphabetical order during `raindrop build deploy`

**Example**:
```sql
-- db/app-db/0000_initial_schema.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Getting Help

- **Documentation**: [Raindrop Docs](https://docs.liquidmetal.ai)
- **Examples**: Check the generated handler templates for patterns
- **Community**: Join our Discord community
- **Issues**: Report bugs on GitHub

## Next Steps

1. **Explore the manifest** - Uncomment modules you need in `raindrop.manifest`
2. **Check the examples** - Browse handler templates in `src/handlers/`
3. **Build something** - Start by uncommenting a service in the manifest
4. **Add intelligence** - Try SmartBucket for AI-powered features
5. **Scale up** - Add actors for background processing

Welcome to Raindrop! 🚀

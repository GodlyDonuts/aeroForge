#!/bin/bash
# Quick Start Script for aeroForge-G3

echo "=========================================="
echo "aeroForge-G3 Quick Start"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

if [ $? -ne 0 ]; then
    echo "ERROR: Python 3 is required but not found."
    exit 1
fi

echo "✓ Python found"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

echo ""
echo "Activating virtual environment..."
source venv/bin/activate

echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Before running, make sure your OpenRouter API Key is set:"
echo "  export OPENROUTER_API_KEY='your_api_key_here'"
echo ""
echo "Then launch the application:"
echo "  streamlit run app.py"
echo ""
echo "Or run directly:"
echo "  python main.py"
echo ""

#!/bin/bash

# MJBalm Admin Setup - Deployment Script
echo "🐎 MJBalm Admin Setup - Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  Environment file not found. Creating from template..."
    
    if [ -f "env.example" ]; then
        cp env.example .env.local
        echo "✅ Created .env.local from template"
        echo ""
        echo "🔧 Please edit .env.local with your configuration:"
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
        echo "   - ADMIN_PASSWORD"
        echo ""
        echo "Then run: npm run dev"
    else
        echo "❌ env.example not found. Please create .env.local manually."
        exit 1
    fi
else
    echo "✅ Environment file exists"
    
    # Check if required environment variables are set
    echo ""
    echo "🔍 Checking environment configuration..."
    
    source .env.local
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "⚠️  NEXT_PUBLIC_SUPABASE_URL not set"
    else
        echo "✅ Supabase URL configured"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        echo "⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    else
        echo "✅ Supabase anon key configured"
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set"
    else
        echo "✅ Supabase service role key configured"
    fi
    
    if [ -z "$ADMIN_PASSWORD" ]; then
        echo "⚠️  ADMIN_PASSWORD not set"
    else
        echo "✅ Admin password configured"
    fi
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "📚 For more information, see README.md" 
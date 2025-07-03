#!/bin/bash

# Deploy script for Netlify
# This script helps deploy the MJBalm Admin Setup Web Application to Netlify

set -e

echo "🚀 Starting Netlify deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Are you in the correct directory?"
  exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  Warning: .env.local not found. Make sure to set environment variables in Netlify dashboard."
  echo "📝 Required variables:"
  echo "   - NEXT_PUBLIC_SUPABASE_URL"
  echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  echo "   - ADMIN_PASSWORD"
  echo "   - NEXT_PUBLIC_APP_URL"
  echo "   - NODE_ENV"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
  echo "⚠️  Netlify CLI not found. Installing..."
  npm install -g netlify-cli
fi

# Ask if user wants to deploy
echo "📤 Ready to deploy to Netlify!"
echo "Make sure you have:"
echo "   ✅ Connected your GitHub repository to Netlify"
echo "   ✅ Set all environment variables in Netlify dashboard"
echo "   ✅ Configured build settings (Build command: npm run build, Publish directory: .next)"

read -p "Do you want to deploy now? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Deploying to Netlify..."
  netlify deploy --prod --dir=.next
  echo "✅ Deployment complete!"
  echo "🌐 Your site should be live at your Netlify URL"
else
  echo "📝 To deploy manually:"
  echo "   1. Push your code to GitHub"
  echo "   2. Netlify will automatically build and deploy"
  echo "   OR run: netlify deploy --prod --dir=.next"
fi

echo "🎉 Deployment process finished!" 
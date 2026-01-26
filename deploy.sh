#!/bin/bash

# WebDPro Deployment Script
# Deploys all services in the correct order

set -e

echo "🚀 Starting WebDPro deployment..."

# Check if stage is provided
STAGE=${1:-dev}
echo "📦 Deploying to stage: $STAGE"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if Node.js dependencies are installed
echo "📋 Installing dependencies..."
npm install

# Deploy services in order
echo "🔧 Deploying backend service..."
cd backend
npm install
npx serverless deploy --stage $STAGE
BACKEND_URL=$(npx serverless info --stage $STAGE | grep ServiceEndpoint | awk '{print $2}')
cd ..

echo "🤖 Deploying AI services..."
cd ai_services
npm install
npx serverless deploy --stage $STAGE
AI_URL=$(npx serverless info --stage $STAGE | grep ServiceEndpoint | awk '{print $2}')
cd ..

echo "📦 Deploying inventory service..."
cd inventory
npm install
npx serverless deploy --stage $STAGE
INVENTORY_URL=$(npx serverless info --stage $STAGE | grep ServiceEndpoint | awk '{print $2}')
cd ..

echo "🚚 Deploying delivery service..."
cd delivery
npm install
npx serverless deploy --stage $STAGE
DELIVERY_URL=$(npx serverless info --stage $STAGE | grep ServiceEndpoint | awk '{print $2}')
cd ..

# Update environment variables with service URLs
echo "🔗 Updating service URLs..."
echo "BACKEND_SERVICE_URL=$BACKEND_URL" >> .env.local
echo "AI_SERVICE_URL=$AI_URL" >> .env.local
echo "INVENTORY_SERVICE_URL=$INVENTORY_URL" >> .env.local
echo "DELIVERY_SERVICE_URL=$DELIVERY_URL" >> .env.local

# Deploy frontend
echo "🌐 Building and deploying frontend..."
cd frontend
npm install
npm run build

# If using AWS Amplify or S3+CloudFront, deploy here
# For now, just build
echo "✅ Frontend built successfully. Deploy to your hosting platform."
cd ..

echo "🎉 Deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "Backend: $BACKEND_URL"
echo "AI Services: $AI_URL"
echo "Inventory: $INVENTORY_URL"
echo "Delivery: $DELIVERY_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Update your .env files with real AWS service IDs"
echo "2. Configure Cognito User Pool"
echo "3. Set up Razorpay keys"
echo "4. Deploy frontend to your hosting platform"
echo "5. Configure custom domain (optional)"
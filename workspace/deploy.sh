#!/bin/bash

# Cloud Run deployment script for workspace containers

PROJECT_ID=${GCP_PROJECT_ID:-"spatiolabs"}
REGION=${GCP_REGION:-"us-central1"}
IMAGE_NAME="workspace"
SERVICE_NAME="workspace-base"

echo "Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest ./workspace

echo "Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 100 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --concurrency 1000 \
  --port 8080 \
  --set-env-vars="NODE_ENV=production"

echo "Deployment complete!"
echo "Service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'
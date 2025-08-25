#!/bin/bash

# Update CORS settings for agent-runtime Cloud Run service

echo "Updating CORS settings for agent-runtime..."

# Using the caret separator syntax for complex values
gcloud run services update agent-runtime \
  --region=us-east1 \
  --set-env-vars="^@^ALLOWED_ORIGINS=https://app.spatiolabs.org,http://localhost:3000,http://localhost:3001,http://localhost:3002@DATABASE_URL=${DATABASE_URL}@ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}@OPENAI_API_KEY=${OPENAI_API_KEY}@GROQ_API_KEY=${GROQ_API_KEY}" \
  --quiet

echo "CORS settings updated successfully!"
echo "Allowed origins now include: https://app.spatiolabs.org"
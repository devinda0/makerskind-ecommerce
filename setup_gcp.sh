#!/bin/bash

# Configuration
PROJECT_ID="gen-lang-client-0030444543"
REGION="asia-south1"
REPO_NAME="cloud-run-repo"
SA_NAME="github-actions-sa"

echo "Setting up GCP resources for Project: $PROJECT_ID"

# 1. Enable APIs
echo "Enabling APIs..."
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    iam.googleapis.com \
    --project "$PROJECT_ID"

# 2. Create Artifact Registry Repository
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker repository for Cloud Run" \
    --project "$PROJECT_ID" || echo "Repository may already exist"

# 3. Create Service Account
echo "Creating Service Account..."
gcloud iam service-accounts create "$SA_NAME" \
    --display-name="GitHub Actions Service Account" \
    --project "$PROJECT_ID" || echo "Service Account may already exist"

SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# 4. Assign Roles
echo "Assigning IAM roles..."
# Deploy to Cloud Run
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

# Act as Service Account (needed for deploying)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Push to Artifact Registry (Project level or Repo level, doing Repo level is tighter but Project is easier script)
# Using Repo level for best practice
gcloud artifacts repositories add-iam-policy-binding "$REPO_NAME" \
    --location="$REGION" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.writer" \
    --project "$PROJECT_ID"

# 5. Generate Key
echo "Generating Service Account Key..."
gcloud iam service-accounts keys create sa-key.json \
    --iam-account="$SA_EMAIL" \
    --project "$PROJECT_ID"

echo "Setup Complete!"
echo "---------------------------------------------------"
echo "Next Steps:"
echo "1. Go to your GitHub Repository Settings > Secrets and variables > Actions"
echo "2. Create a new Repository Secret named 'GCP_SA_KEY'"
echo "3. Paste the content of 'sa-key.json' into the secret value."
echo "4. Delete 'sa-key.json' from your local machine securely."

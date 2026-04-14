#!/bin/bash

# Azure Infrastructure Deployment Script for EzStem
# Usage: ./deploy.sh <environment>
# Example: ./deploy.sh dev

set -e

ENVIRONMENT=${1:-dev}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: Invalid environment. Must be dev, staging, or prod."
  exit 1
fi

if [ -z "$SQL_ADMIN_PASSWORD" ]; then
  echo "Error: SQL_ADMIN_PASSWORD environment variable is not set."
  echo "Set it with: export SQL_ADMIN_PASSWORD='YourSecurePassword123!'"
  exit 1
fi

RESOURCE_GROUP="ezstem-rg-${ENVIRONMENT}"
LOCATION="eastus"

echo "Deploying EzStem infrastructure to ${ENVIRONMENT} environment..."

# Check Azure login
echo "Checking Azure CLI login..."
az account show > /dev/null 2>&1 || {
  echo "Not logged in to Azure. Run 'az login' first."
  exit 1
}

# Create resource group
echo "Creating resource group: ${RESOURCE_GROUP}..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}"

# Deploy Bicep template
echo "Deploying infrastructure..."
az deployment group create \
  --resource-group "${RESOURCE_GROUP}" \
  --template-file main.bicep \
  --parameters environment="${ENVIRONMENT}" \
  --parameters sqlAdminPassword="${SQL_ADMIN_PASSWORD}" \
  --verbose

echo "Deployment complete!"
echo "Run 'az deployment group show --resource-group ${RESOURCE_GROUP} --name <deployment-name>' for details."

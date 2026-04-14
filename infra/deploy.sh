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

RESOURCE_GROUP="ezstem-rg-${ENVIRONMENT}"
LOCATION="eastus2"
APP_NAME="ezstem-${ENVIRONMENT}"

echo "Deploying EzStem infrastructure to ${ENVIRONMENT} environment..."

# Check Azure login
echo "Checking Azure CLI login..."
az account show > /dev/null 2>&1 || {
  echo "Not logged in to Azure. Run 'az login' first."
  exit 1
}

# Detect identity type (user vs service principal)
ACCOUNT_TYPE=$(az account show --query user.type -o tsv)
if [ "$ACCOUNT_TYPE" = "servicePrincipal" ]; then
  APP_ID=$(az account show --query user.name -o tsv)
  AAD_ADMIN_OID=$(az ad sp show --id "$APP_ID" --query id -o tsv)
  AAD_ADMIN_NAME="EzStem-Deploy-SP"
  PRINCIPAL_TYPE="Application"
else
  AAD_ADMIN_OID=$(az ad signed-in-user show --query id -o tsv)
  AAD_ADMIN_NAME=$(az ad signed-in-user show --query displayName -o tsv)
  PRINCIPAL_TYPE="User"
fi
echo "Using AAD admin: ${AAD_ADMIN_NAME} (${AAD_ADMIN_OID})"

# Create resource group
echo "Creating resource group: ${RESOURCE_GROUP}..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}"

# Deploy Bicep template
echo "Deploying infrastructure..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
  --resource-group "${RESOURCE_GROUP}" \
  --template-file main.bicep \
  --parameters environment="${ENVIRONMENT}" \
  --parameters aadAdminObjectId="${AAD_ADMIN_OID}" \
  --parameters aadAdminName="${AAD_ADMIN_NAME}" \
  --parameters principalType="${PRINCIPAL_TYPE}" \
  --query 'properties.outputs' \
  --output json)

# Extract storage account name from deployment output
STORAGE_ACCOUNT_NAME=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.storageAccountName.value')

if [ -n "$STORAGE_ACCOUNT_NAME" ] && [ "$STORAGE_ACCOUNT_NAME" != "null" ]; then
  echo "Configuring static website on storage account: ${STORAGE_ACCOUNT_NAME}..."
  az storage blob service-properties update \
    --account-name "${STORAGE_ACCOUNT_NAME}" \
    --static-website \
    --index-document index.html \
    --404-document index.html \
    --auth-mode login
  
  echo "Static website configured successfully!"
else
  echo "Warning: Could not extract storage account name. Skipping static website configuration."
fi

echo "Deployment complete!"
echo "Frontend URL: $(echo "$DEPLOYMENT_OUTPUT" | jq -r '.frontendUrl.value')"
echo "Backend URL: $(echo "$DEPLOYMENT_OUTPUT" | jq -r '.webAppUrl.value')"

WEBAPP_NAME="${APP_NAME}-api"
SQL_SERVER_NAME="${APP_NAME}-sql"
DB_NAME="${APP_NAME}-db"
SQL_FQDN=$(az sql server show --name "$SQL_SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query fullyQualifiedDomainName -o tsv 2>/dev/null || echo "unknown")

echo ""
echo "=========================================="
echo "NEXT STEP: Grant App Service MI SQL access"
echo "=========================================="
echo "Run these SQL commands against ${DB_NAME} while connected as the AAD admin:"
echo ""
echo "  CREATE USER [${WEBAPP_NAME}] FROM EXTERNAL PROVIDER;"
echo "  ALTER ROLE db_datareader ADD MEMBER [${WEBAPP_NAME}];"
echo "  ALTER ROLE db_datawriter ADD MEMBER [${WEBAPP_NAME}];"
echo "  ALTER ROLE db_ddladmin ADD MEMBER [${WEBAPP_NAME}];"
echo ""
echo "Options:"
echo "  1. Azure Portal → SQL databases → ${DB_NAME} → Query editor (AAD login)"
echo "  2. sqlcmd -S ${SQL_FQDN} -d ${DB_NAME} --authentication-method=ActiveDirectoryDefault"
echo "=========================================="

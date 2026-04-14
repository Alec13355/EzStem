# EzStem Azure Infrastructure

This directory contains Azure infrastructure-as-code (Bicep) and deployment automation for the EzStem florist application.

## Architecture

- **App Service**: Linux-based .NET 9 Web App with managed identity
- **Azure SQL Database**: SQL Server 12.0 with Basic (dev) / Standard S2 (prod) tiers
- **Key Vault**: Secure storage for connection strings and secrets (RBAC authorization model)
- **Application Insights**: Monitoring and telemetry with Log Analytics workspace
- **Container Registry**: Docker images for API deployment (configured in GitHub Actions)

## Prerequisites

1. **Azure CLI**: Install from https://aka.ms/azure-cli
2. **Azure Subscription**: Active subscription with Contributor role
3. **Bicep CLI**: Included with Azure CLI (or install separately)
4. **Git**: For repository access

## Local Development

Use Docker Compose for local SQL Server:

```bash
cd /Users/alecharrison/code/Me/EzStem
docker-compose up -d db
```

Backend and frontend run on localhost:5000 and localhost:4200 respectively.

## Deploying to Azure

### 1. Login to Azure

```bash
az login
az account set --subscription <your-subscription-id>
```

### 2. Set SQL Admin Password

```bash
export SQL_ADMIN_PASSWORD='YourSecurePassword123!'
```

### 3. Deploy Infrastructure

```bash
cd infra
./deploy.sh dev    # For development environment
./deploy.sh prod   # For production environment
```

This creates:
- Resource group: `ezstem-rg-{environment}`
- All Azure resources defined in `main.bicep`

### 4. Configure GitHub Actions Secrets

After deploying infrastructure, configure GitHub Actions for CI/CD:

#### OIDC Authentication (Recommended)

1. **Create Azure AD App Registration**:
   ```bash
   az ad app create --display-name ezstem-github-actions
   ```

2. **Create Service Principal**:
   ```bash
   az ad sp create --id <app-id>
   ```

3. **Configure Federated Credentials**:
   ```bash
   az ad app federated-credential create \
     --id <app-id> \
     --parameters '{
       "name": "ezstem-github-federation",
       "issuer": "https://token.actions.githubusercontent.com",
       "subject": "repo:Alec13355/EzStem:ref:refs/heads/main",
       "audiences": ["api://AzureADTokenExchange"]
     }'
   ```

4. **Grant Contributor Role**:
   ```bash
   az role assignment create \
     --assignee <app-id> \
     --role Contributor \
     --scope /subscriptions/<subscription-id>
   ```

5. **Set GitHub Secrets**:
   - `AZURE_CLIENT_ID`: Application (client) ID
   - `AZURE_TENANT_ID`: Directory (tenant) ID
   - `AZURE_SUBSCRIPTION_ID`: Subscription ID
   - `ACR_LOGIN_SERVER`: `<your-acr-name>.azurecr.io`
   - `ACR_USERNAME`: ACR admin username
   - `ACR_PASSWORD`: ACR admin password
   - `AZURE_WEBAPP_NAME`: `ezstem-{environment}-api`
   - `AZURE_STORAGE_ACCOUNT`: (optional) Storage account for frontend
   - `AZURE_CDN_ENDPOINT`: (optional) CDN endpoint name

### 5. Grant App Service Access to Key Vault

After deployment, assign the "Key Vault Secrets User" role to the App Service managed identity:

```bash
APP_PRINCIPAL_ID=$(az webapp identity show \
  --name ezstem-dev-api \
  --resource-group ezstem-rg-dev \
  --query principalId -o tsv)

KEY_VAULT_ID=$(az keyvault show \
  --name <key-vault-name> \
  --resource-group ezstem-rg-dev \
  --query id -o tsv)

az role assignment create \
  --assignee $APP_PRINCIPAL_ID \
  --role "Key Vault Secrets User" \
  --scope $KEY_VAULT_ID
```

## Environment Configuration

- **Dev**: Basic tier SQL, B2 App Service Plan, 30-day log retention
- **Prod**: Standard S2 SQL, P2v3 App Service Plan, 90-day log retention, Always On enabled

## Files

- `main.bicep`: Orchestrates all resource modules
- `modules/appservice.bicep`: App Service Plan and Web App
- `modules/database.bicep`: SQL Server and Database
- `modules/keyvault.bicep`: Key Vault and secrets
- `modules/monitoring.bicep`: Application Insights and Log Analytics
- `parameters/dev.bicepparam`: Dev environment parameters (example)
- `deploy.sh`: Deployment automation script

## Security Notes

- SQL admin password is **never** committed to git (use environment variable)
- Key Vault uses **RBAC authorization model** (not legacy access policies)
- App Service uses **managed identity** to access Key Vault (no credentials in config)
- OIDC federation for GitHub Actions (no long-lived secrets)
- Connection strings stored in Key Vault, referenced via `@Microsoft.KeyVault(...)` syntax
- HTTPS enforced on all web apps

## Troubleshooting

**Key Vault access denied**:
- Verify managed identity has "Key Vault Secrets User" role
- Check Key Vault uses RBAC authorization (not access policies)

**Docker build fails in CD pipeline**:
- Verify Dockerfile path: `backend/src/EzStem.API/Dockerfile`
- Check ACR credentials in GitHub secrets

**Health check fails**:
- Verify `/health` endpoint returns 200 OK
- Check App Service logs: `az webapp log tail --name <app-name> --resource-group <rg-name>`

## Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [GitHub Actions OIDC with Azure](https://docs.github.com/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)

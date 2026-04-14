# EzStem Azure Infrastructure

This directory contains Azure infrastructure-as-code (Bicep) and deployment automation for the EzStem florist application.

## Architecture

- **App Service**: Linux-based .NET 9 Web App with managed identity
- **Azure SQL Database**: SQL Server 12.0 with Basic (dev) / Standard S2 (prod) tiers
- **Key Vault**: Secure storage for connection strings and secrets (RBAC authorization model)
- **Application Insights**: Monitoring and telemetry with Log Analytics workspace
- **Blob Storage**: Static website hosting for Angular frontend (StorageV2, LRS)

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

### Quick Start (OIDC Setup)

For complete step-by-step instructions, see **[AZURE_SETUP.md](./AZURE_SETUP.md)**.

### Manual Deployment

#### 1. Login to Azure

```bash
az login
az account set --subscription <your-subscription-id>
```

#### 2. Set SQL Admin Password

```bash
export SQL_ADMIN_PASSWORD='YourSecurePassword123!'
```

#### 3. Deploy Infrastructure

```bash
cd infra
./deploy.sh dev    # For development environment
./deploy.sh prod   # For production environment
```

This creates:
- Resource group: `ezstem-rg-{environment}`
- All Azure resources defined in `main.bicep`

## Environment Configuration

- **Dev**: Basic SQL (5 DTU, 2GB), B1 App Service Plan, LRS Storage (~$18.54/month)
- **Prod**: Standard S2 SQL (50 DTU, 250GB), P2v3 App Service Plan, CDN (~$278/month)

## Cost Breakdown (Dev Tier)

| Resource               | SKU/Tier       | Monthly Cost   |
|------------------------|----------------|----------------|
| App Service Plan       | B1 (Basic)     | ~$13.14        |
| Azure SQL Database     | Basic (2GB)    | ~$4.90         |
| Storage Account (Blob) | Standard LRS   | ~$0.50         |
| Key Vault              | Standard       | ~$0.00 (ops)   |
| Application Insights   | Pay-as-you-go  | ~$0.00 (free)  |
| **TOTAL**              |                | **~$18.54/mo** |

See [AZURE_SETUP.md](./AZURE_SETUP.md) for complete setup instructions.

## GitHub Actions Secrets

After deploying infrastructure, configure GitHub Actions for CI/CD. See **[AZURE_SETUP.md](./AZURE_SETUP.md)** for complete instructions.

Required secrets:
- `AZURE_CLIENT_ID`: Application (client) ID from app registration
- `AZURE_TENANT_ID`: Directory (tenant) ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Resource group name (e.g., `ezstem-rg-dev`)
- `AZURE_WEBAPP_NAME`: Web app name (e.g., `ezstem-dev-api`)
- `AZURE_STORAGE_ACCOUNT`: Storage account name (e.g., `ezstemdevstorage`)

## Deployment Method

**Dev tier:** Uses **zip deploy** (`dotnet publish` → zip → `az webapp deploy --type zip`)
- Simpler, faster, cheaper (no Docker/ACR needed)
- Saves $5/month vs Azure Container Registry

**Prod tier:** Can use Docker/ACR for container-based deployment if needed

## Files

- `main.bicep`: Orchestrates all resource modules
- `modules/appservice.bicep`: App Service Plan and Web App
- `modules/database.bicep`: SQL Server and Database
- `modules/keyvault.bicep`: Key Vault and secrets
- `modules/monitoring.bicep`: Application Insights and Log Analytics
- `modules/storage.bicep`: Blob Storage for frontend static hosting
- `parameters/dev.bicepparam`: Dev environment parameters (example)
- `deploy.sh`: Deployment automation script
- `AZURE_SETUP.md`: Complete OIDC setup guide

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
- Run the role assignment commands from the deploy script output

**Static website not enabled**:
- Manually enable: `az storage blob service-properties update --account-name <storage-name> --static-website --index-document index.html --404-document index.html --auth-mode login`

**Zip deploy fails**:
- Verify App Service Plan is B1 or higher (F1 Free tier not supported)
- Check deployment logs: `az webapp log tail --name <app-name> --resource-group <rg-name>`

**Health check fails**:
- Verify `/health` endpoint returns 200 OK
- Check App Service logs: `az webapp log tail --name <app-name> --resource-group <rg-name>`

## Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [GitHub Actions OIDC with Azure](https://docs.github.com/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)

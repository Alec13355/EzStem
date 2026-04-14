# Azure Setup for EzStem CI/CD

Complete these steps **one time** to connect GitHub Actions to Azure via OIDC (federated credentials).

---

## Prerequisites

- **Azure CLI** installed: `az --version` (v2.50+ recommended)
- **Azure subscription** with Contributor permissions
- **GitHub CLI** installed (optional): `gh --version` — or set secrets manually via GitHub UI
- Logged in: `az login`

---

## Step 1: Set Variables

Copy and run these in your shell. **Replace values** as needed:

```bash
export AZURE_SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
export GITHUB_ORG="Alec13355"
export GITHUB_REPO="EzStem"
export RESOURCE_GROUP="ezstem-rg-dev"
export LOCATION="eastus2"
export APP_NAME="ezstem-dev"
```

**Verify subscription:**
```bash
echo "Using Azure subscription: $AZURE_SUBSCRIPTION_ID"
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
```

---

## Step 2: Create Resource Group

```bash
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION"
```

---

## Step 3: Create App Registration + Service Principal

Create the Azure AD application:

```bash
export APP_ID=$(az ad app create \
  --display-name "github-ezstem-oidc" \
  --query appId \
  --output tsv)

echo "App ID (Client ID): $APP_ID"
```

Create the service principal:

```bash
export OBJECT_ID=$(az ad sp create \
  --id "$APP_ID" \
  --query id \
  --output tsv)

echo "Service Principal Object ID: $OBJECT_ID"
```

Get your tenant ID:

```bash
export AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)
echo "Tenant ID: $AZURE_TENANT_ID"
```

---

## Step 4: Assign Contributor Role

Grant the service principal Contributor access to the resource group:

```bash
az role assignment create \
  --assignee "$APP_ID" \
  --role Contributor \
  --scope "/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
```

---

## Step 5: Create Federated Credentials (OIDC)

### For main branch deploys:

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-ezstem-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG"'/'"$GITHUB_REPO"':ref:refs/heads/main",
    "description": "GitHub Actions OIDC for main branch",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### For pull request testing (optional):

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-ezstem-pr",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'"$GITHUB_ORG"'/'"$GITHUB_REPO"':pull_request",
    "description": "GitHub Actions OIDC for pull requests",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

---

## Step 6: Set GitHub Secrets

### Option A: Using GitHub CLI (`gh`)

```bash
gh secret set AZURE_CLIENT_ID --body "$APP_ID" --repo "$GITHUB_ORG/$GITHUB_REPO"
gh secret set AZURE_TENANT_ID --body "$AZURE_TENANT_ID" --repo "$GITHUB_ORG/$GITHUB_REPO"
gh secret set AZURE_SUBSCRIPTION_ID --body "$AZURE_SUBSCRIPTION_ID" --repo "$GITHUB_ORG/$GITHUB_REPO"
gh secret set AZURE_RESOURCE_GROUP --body "$RESOURCE_GROUP" --repo "$GITHUB_ORG/$GITHUB_REPO"
gh secret set AZURE_WEBAPP_NAME --body "${APP_NAME}-api" --repo "$GITHUB_ORG/$GITHUB_REPO"
gh secret set AZURE_STORAGE_ACCOUNT --body "${APP_NAME//-/}storage" --repo "$GITHUB_ORG/$GITHUB_REPO"
```

### Option B: Manual (GitHub UI)

Navigate to `https://github.com/$GITHUB_ORG/$GITHUB_REPO/settings/secrets/actions` and add:

| Secret Name              | Value                                  |
|--------------------------|----------------------------------------|
| `AZURE_CLIENT_ID`        | (value of `$APP_ID`)                   |
| `AZURE_TENANT_ID`        | (value of `$AZURE_TENANT_ID`)          |
| `AZURE_SUBSCRIPTION_ID`  | (value of `$AZURE_SUBSCRIPTION_ID`)    |
| `AZURE_RESOURCE_GROUP`   | `ezstem-rg-dev`                        |
| `AZURE_WEBAPP_NAME`      | `ezstem-dev-api`                       |
| `AZURE_STORAGE_ACCOUNT`  | `ezstemdevstorage`                     |---

## Step 7: Deploy Infrastructure

Run the deployment script:

```bash
cd infra
./deploy.sh dev
```

The script auto-detects your identity (user or service principal) and configures Entra-only authentication on SQL Server. No SQL password required.

**Expected output:**
- Resource group created
- App Service Plan (B1, ~$13/mo)
- App Service (Linux, .NET 9)
- SQL Server + Database (Basic tier, 2GB, ~$5/mo)
- Key Vault (Standard)
- Application Insights + Log Analytics
- Storage Account (LRS, static website enabled, ~$0.50/mo)

**Total estimated cost: ~$18-20/month**

---

## Step 8: Grant App Service MI Database Access

After deployment, run these SQL commands against the database while connected as the AAD admin (the identity used in Step 7):

```sql
CREATE USER [ezstem-dev-api] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [ezstem-dev-api];
ALTER ROLE db_datawriter ADD MEMBER [ezstem-dev-api];
ALTER ROLE db_ddladmin ADD MEMBER [ezstem-dev-api];
```

**Options for running these commands:**

1. **Azure Portal** → SQL databases → `ezstem-dev-db` → Query editor (sign in with AAD)
2. **sqlcmd:**
   ```bash
   sqlcmd -S ezstem-dev-sql.database.windows.net -d ezstem-dev-db --authentication-method=ActiveDirectoryDefault
   ```

The `deploy.sh` script prints these commands with the exact resource names after deployment completes.

---

## Step 9: Verify Setup

### Test Azure login from GitHub Actions:

Trigger a workflow run on `main` branch (push a commit or manually trigger). Check that the `Azure login (OIDC)` step succeeds.

### Verify static website:

```bash
export STORAGE_ACCOUNT_NAME="${APP_NAME//-/}storage"
az storage blob service-properties show \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --auth-mode login \
  --query staticWebsite
```

Expected: `"enabled": true, "indexDocument": "index.html"`

### Get frontend URL:

```bash
az storage account show \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "primaryEndpoints.web" \
  --output tsv
```

---

## Estimated Monthly Cost (Dev Tier)

| Resource                  | SKU/Tier       | Monthly Cost   |
|---------------------------|----------------|----------------|
| App Service Plan          | B1 (Basic)     | ~$13.14        |
| Azure SQL Database        | Basic (2GB)    | ~$4.90         |
| Storage Account (Blob)    | Standard LRS   | ~$0.50         |
| Key Vault                 | Standard       | ~$0.00 (ops)   |
| Application Insights      | Pay-as-you-go  | ~$0.00 (5GB free) |
| **TOTAL**                 |                | **~$18.54/mo** |

**Production tier** (P2v3 + Standard S2 SQL) would cost ~$250-300/month.

---

## Troubleshooting

### "AADSTS70021: No matching federated identity record found"
- Double-check the `subject` in federated credential matches your repo and branch
- For main branch: `repo:Alec13355/EzStem:ref:refs/heads/main`
- Ensure no typos in GitHub org/repo name

### "Authorization failed" during deployment
- Verify the service principal has Contributor role: `az role assignment list --assignee "$APP_ID"`
- Check subscription is correct: `az account show`

### SQL authentication issues
- Entra-only auth is enabled — no SQL password login is possible
- Ensure you ran the `CREATE USER ... FROM EXTERNAL PROVIDER` grants (Step 8)
- Connect to SQL Query Editor using AAD credentials, not SQL username/password

### Static website not enabled
- Manually enable: `az storage blob service-properties update --account-name ezstemdevstorage --static-website --index-document index.html --404-document index.html --auth-mode login`

---

## Next Steps

1. Push a commit to `main` branch
2. CI workflow runs (build + test)
3. CD workflow triggers automatically on CI success
4. Backend deploys to App Service (zip deploy)
5. Frontend deploys to Blob Storage
6. Smoke test verifies `/health` endpoint

**Your infrastructure is now live and auto-deploying!** 🚀

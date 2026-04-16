# EzStem Azure Deployment Checklist

Use this checklist to ensure a smooth deployment to Azure.

---

## ✅ Storage — Item Images

The `storage.bicep` module provisions a single Azure Storage Account that serves two purposes:
1. **Frontend static website hosting** — Angular build artifacts served via `$web` container
2. **Item image uploads** — `item-images` blob container with public `Blob`-level read access and CORS (GET/HEAD from any origin)

**Connection string provisioned automatically:**
- Key Vault secret: `AzureBlobStorageConnectionString` (stored by `keyvault.bicep`)
- App Service app setting: `AzureBlobStorage__ConnectionString` (double underscore = nested JSON config)
- Both are wired via `storage.outputs.connectionString` in `main.bicep` — no manual secret entry required

**Storage account naming:** `replace('${appName}storage', '-', '')` → e.g. `ezstemdevstorage`

---

## ✅ Pre-Deployment Checklist

- [ ] Azure CLI installed (`az --version`)
- [ ] GitHub CLI installed (`gh --version`) — optional but recommended
- [ ] Logged into Azure (`az login`)
- [ ] Logged into GitHub (`gh auth login`) — if using gh CLI
- [ ] Azure subscription has Contributor permissions

---

## ✅ One-Time Setup (OIDC + Infrastructure)

Follow the complete guide: **[AZURE_SETUP.md](./AZURE_SETUP.md)**

### Quick summary:

1. **Set environment variables** (subscription ID, GitHub org/repo, resource group, location)
2. **Create App Registration** for OIDC
3. **Create Service Principal**
4. **Assign Contributor role**
5. **Create federated credentials** (main branch + optional PR)
6. **Set GitHub secrets** (6 required secrets)
7. **Deploy infrastructure** (`./deploy.sh dev`)
8. **Verify static website** is enabled on storage account

**Estimated time:** 15-20 minutes

---

## ✅ Post-Deployment Verification

### Verify infrastructure:

```bash
# Check resource group exists
az group show --name ezstem-rg-dev

# Check web app is running
az webapp show --name ezstem-dev-api --resource-group ezstem-rg-dev --query state

# Check SQL database exists
az sql db show --name ezstem-dev-db --server ezstem-dev-sql --resource-group ezstem-rg-dev

# Check storage account static website is enabled
az storage blob service-properties show --account-name ezstemdevstorage --query staticWebsite.enabled --auth-mode login
```

### Verify GitHub secrets:

```bash
# List secrets (won't show values, just names)
gh secret list --repo Alec13355/EzStem
```

Expected secrets:
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_SUBSCRIPTION_ID
- AZURE_RESOURCE_GROUP
- AZURE_WEBAPP_NAME
- AZURE_STORAGE_ACCOUNT

---

## ✅ First Deployment

### Trigger CI/CD:

```bash
# Push a commit to main branch
git add .
git commit -m "chore: trigger deployment"
git push origin main
```

### Monitor deployment:

1. **CI workflow** runs first (build + test)
2. **CD workflow** triggers on CI success
3. Check workflow status: https://github.com/Alec13355/EzStem/actions

### Expected CD steps:

- ✅ Azure login (OIDC)
- ✅ Publish .NET application
- ✅ Create deployment package (zip)
- ✅ Deploy to Azure Web App
- ✅ Smoke test (curl /health endpoint)
- ✅ Build Angular frontend
- ✅ Upload to Blob Storage

---

## ✅ Post-Deployment Smoke Tests

### Backend API:

```bash
# Health check
curl https://ezstem-dev-api.azurewebsites.net/health

# Expected: {"status":"healthy","timestamp":"..."}
```

### Frontend:

```bash
# Get frontend URL
az storage account show \
  --name ezstemdevstorage \
  --resource-group ezstem-rg-dev \
  --query "primaryEndpoints.web" \
  --output tsv

# Visit URL in browser (should load Angular app)
```

### Verify App Insights:

```bash
# Check for recent telemetry
az monitor app-insights metrics show \
  --app ezstem-dev-insights \
  --resource-group ezstem-rg-dev \
  --metric requests/count \
  --interval PT1M
```

---

## ✅ Database Migrations

After first deployment, run EF Core migrations:

```bash
# Option 1: From local machine (requires connection string)
cd backend/src/EzStem.Infrastructure
dotnet ef database update --context ApplicationDbContext --startup-project ../EzStem.API

# Option 2: From Azure Cloud Shell (already authenticated)
# SSH into App Service or use Kudu console
# Run: dotnet ef database update
```

---

## 🔧 Troubleshooting

### "AADSTS70021: No matching federated identity record found"

**Cause:** Federated credential `subject` doesn't match repo/branch.  
**Fix:** Double-check the subject in Step 5 of AZURE_SETUP.md:
```bash
# Should be exactly:
repo:Alec13355/EzStem:ref:refs/heads/main
```

### "Authorization failed" during deployment

**Cause:** Service principal lacks permissions.  
**Fix:** Verify role assignment:
```bash
az role assignment list --assignee $APP_ID --scope /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP
```

### Smoke test fails (curl /health returns 404)

**Cause:** App not started or deployed incorrectly.  
**Fix:** Check App Service logs:
```bash
az webapp log tail --name ezstem-dev-api --resource-group ezstem-rg-dev
```

### Static website returns 404

**Cause:** Static website not enabled on storage account.  
**Fix:** Manually enable:
```bash
az storage blob service-properties update \
  --account-name ezstemdevstorage \
  --static-website \
  --index-document index.html \
  --404-document index.html \
  --auth-mode login
```

---

## 💰 Cost Monitoring

### Set budget alerts:

```bash
az consumption budget create \
  --budget-name ezstem-dev-budget \
  --amount 25 \
  --time-grain Monthly
```

**Target:** ~$18.54/month for dev tier

---

## 🚀 Next Steps

After successful deployment:

1. **Test all API endpoints** (Items, Vendors, Recipes, Events, Orders)
2. **Verify frontend** loads and connects to backend API
3. **Run integration tests** against deployed environment
4. **Configure custom domain** (optional)
5. **Enable CDN** for production (optional, adds ~$5/month)
6. **Set up monitoring alerts** in Application Insights

---

## 📚 Resources

- [AZURE_SETUP.md](./AZURE_SETUP.md) - Complete OIDC setup guide
- [README.md](./README.md) - Infrastructure overview
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)
- [GitHub Actions OIDC](https://docs.github.com/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)

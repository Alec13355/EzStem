# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### CI/CD Pipeline Architecture (2026-04-14)

- **GitHub Actions** used for CI/CD with two workflows: `ci.yml` (build/test on every push/PR) and `cd.yml` (deploy on successful CI completion on main branch)
- **CI workflow** runs backend (.NET 9 restore/build/test) and frontend (Node 20, npm ci, Angular production build) in parallel jobs
- **CD workflow** triggered by `workflow_run` event, only deploys when CI passes on main branch
- **OIDC authentication** used for Azure login (federated credentials, no long-lived secrets) — more secure than client secrets
- **Zip deploy** for backend (.NET publish → zip → az webapp deploy) — simpler and cheaper than Docker/ACR for dev tier
- **Smoke test** included post-deployment: curl health endpoint to verify app is running
- **Frontend deployment** to Azure Blob Storage static hosting with optional CDN purge
- **Test results** uploaded as artifacts for visibility in GitHub Actions UI

### Azure Infrastructure Decisions (2026-04-14)

- **App Service** chosen over AKS for simplicity — EzStem is a single-service API, doesn't need Kubernetes orchestration
- **Bicep modules** organized by resource type: appservice, database, keyvault, monitoring — improves reusability and separation of concerns
- **Key Vault RBAC model** (not legacy access policies) — modern Azure pattern, integrates with managed identities
- **Managed Identity** on App Service to access Key Vault secrets — no credentials in app config, reduces attack surface
- **Connection strings** stored in Key Vault, referenced via `@Microsoft.KeyVault(...)` syntax in App Settings
- **Environment-specific tiers**: Basic/B2 for dev (cost-effective), Standard S2/P2v3 for prod (performance + always-on)
- **Application Insights** with Log Analytics workspace for centralized monitoring and telemetry
- **Firewall rule** allows Azure services to access SQL Server (0.0.0.0 range) — needed for App Service connectivity
- **Health endpoint** (`/health`) required for smoke tests and Azure load balancer health probes

### Cost Optimization for Dev Tier (2026-04-14)

- **B1 App Service Plan** chosen over B2 for dev — saves ~$20/month, still supports managed identity (F1 Free tier does NOT)
- **Basic SQL Database** (5 DTU, 2GB) is sufficient for dev florist app — saves ~$50/month vs Standard S0
- **Zip deploy** used instead of Docker/ACR for dev — eliminates $5/month ACR cost, simpler workflow, faster deploys
- **Azure Blob Storage** added for Angular frontend static hosting — ~$0.50/month, vastly cheaper than compute
- **Total dev infrastructure cost: $18.54/month** (App Service $13.14 + SQL $4.90 + Storage $0.50)
- **Production tier estimated at $278/month** (P2v3 App Service + Standard S2 SQL + CDN)
- **OIDC federated credentials** eliminate client secret management — tokens auto-expire, better audit logs
- **Static website hosting** configured automatically via `deploy.sh` script post-provisioning

### P1 Session: Azure Infra Cost-Optimized (2026-04-14)

**Summary:** Cost-optimized Azure infrastructure for dev environment. Switched deployment method to zip deploy, added blob storage for frontend, created onboarding and deployment docs.

**Work completed:**
- Downgraded App Service Plan to B1 Basic (~$13/month) from B2
- Downgraded SQL Database to Basic tier 2GB (~$5/month)
- Switched from Docker/ACR to zip deploy (eliminates $5/month ACR, faster deploys)
- Added `infra/modules/storage.bicep` for Azure Blob Storage static website hosting (~$0.50/month)
- Updated `infra/main.bicep` to include storage module
- Updated `infra/parameters/dev.bicepparam` (removed hardcoded password placeholder)
- Updated `infra/deploy.sh` with static website config step
- Updated `.github/workflows/cd.yml` to use zip deploy instead of Docker
- Created `infra/AZURE_SETUP.md` — complete OIDC federated credential setup guide
- Created `infra/DEPLOYMENT_CHECKLIST.md` — step-by-step deployment checklist

**Total dev cost achieved: $18.54/month** (target: under $25 ✅)

**Key learnings:**
- F1 Free tier is a trap — no managed identity support kills Key Vault integration
- Zip deploy beats Docker for small .NET apps in dev (faster, cheaper, simpler)
- OIDC > client secrets (zero rotation, auto-expiry, better audit logs)
- Static website hosting is criminally cheap ($0.50/month for SPA)

### CD Pipeline Reliability Fixes (2026-04-14)

**Problem:** CD pipeline failing in two ways:
1. "Provision SQL user for App Service MI" step erroring with "Insufficient privileges" when calling `az ad sp show`
2. Smoke tests failing with 503 errors even after successful infra provisioning

**Root causes:**
1. **Azure AD Graph permissions issue:** The OIDC service principal lacked Directory.Read.All permissions needed for `az ad sp show --id "$APP_MI_ID"`. This command was used to get the Managed Identity display name for SQL provisioning.
2. **Async deployment timing:** `az webapp deploy --async true` returns before app startup completes. The 45-second sleep wasn't sufficient for the app to fully start and respond to health checks.

**Solutions implemented:**
1. **Direct MI name derivation:** For Azure App Service, the system-assigned Managed Identity display name is **always** the same as the App Service name. Changed workflow to use `secrets.AZURE_WEBAPP_NAME` directly instead of querying Azure AD — eliminates AAD permission requirement entirely.
2. **Synchronous deployment:** Removed `--async true` flag from `az webapp deploy` command. Azure CLI now waits for the full deployment cycle (upload → restart → startup) to complete before proceeding to smoke test. This ensures the app is ready when curl hits the health endpoint.

**Files changed:** `.github/workflows/cd.yml` (lines 88, 153)

**Key learnings:**
- **Managed Identity naming convention:** System-assigned MI on App Service always uses the App Service name — no AAD lookup needed
- **Async vs sync deploys:** For smoke tests, synchronous deploys are simpler and more reliable than async + retry logic
- **OIDC service principal permissions:** Keep OIDC SP permissions minimal — only infra deployment scope, not directory reads
- **DB naming derivation:** The pattern `DB_NAME="${SQL_SERVER%-sql}-db"` correctly strips `-sql` suffix and adds `-db` (verified against Bicep naming: `${appName}-sql` → `${appName}-db`)

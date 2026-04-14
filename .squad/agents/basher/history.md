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
- **Docker containerization** for backend API deployment to Azure Container Registry → Azure Web App
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

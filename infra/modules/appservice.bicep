@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Application name')
param appName string

@description('SQL connection string (uses Managed Identity auth, no password)')
param sqlConnectionString string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Hostname of the Static Web App for CORS (without https://)')
param swaHostname string = ''

@description('Blob storage connection string for image uploads')
param blobStorageConnectionString string

var appServicePlanName = '${appName}-plan'
var webAppName = '${appName}-api'
var sku = environment == 'prod' ? 'P2v3' : 'B1'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: sku
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|9.0'
      appCommandLine: 'dotnet EzStem.API.dll'
      alwaysOn: environment == 'prod' ? true : false
      httpLoggingEnabled: true
      detailedErrorLoggingEnabled: true
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment == 'prod' ? 'Production' : 'Staging'
        }
        {
          name: 'WEBSITE_ENABLE_APP_SERVICE_STORAGE'
          value: 'true'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'ConnectionStrings__DefaultConnection'
          value: sqlConnectionString
        }
        {
          name: 'AllowedOrigins__0'
          value: 'http://localhost:4200'
        }
        {
          name: 'AllowedOrigins__1'
          value: 'https://${swaHostname}'
        }
        {
          name: 'ASPNETCORE_URLS'
          value: 'http://+:8080'
        }
        {
          name: 'AzureBlobStorage__AccountConnectionString'
          value: blobStorageConnectionString
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'AzureAd__Authority'
          value: 'https://ezstem.ciamlogin.com/fdd626a3-0e01-441d-a864-4415ad287675'
        }
        {
          name: 'AzureAd__ClientId'
          value: '97f156cd-f562-42e1-8de6-6e82c543fa86'
        }
        {
          name: 'AzureAd__Scopes'
          value: 'access_as_user'
        }
      ]
    }
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
output principalId string = webApp.identity.principalId

resource appLogsConfig 'Microsoft.Web/sites/config@2023-01-01' = {
  name: 'logs'
  parent: webApp
  properties: {
    applicationLogs: {
      fileSystem: {
        level: 'Verbose'
        retentionInDays: 1
      }
    }
    httpLogs: {
      fileSystem: {
        enabled: true
        retentionInDays: 1
      }
    }
  }
}

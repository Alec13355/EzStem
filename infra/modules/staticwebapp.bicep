@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Application name')
param appName string

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: '${appName}-swa'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

output swaName string = staticWebApp.name
output swaDefaultHostname string = staticWebApp.properties.defaultHostname
output swaApiKey string = listSecrets(staticWebApp.id, staticWebApp.apiVersion).properties.apiKey

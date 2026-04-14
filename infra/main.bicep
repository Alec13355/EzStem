@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for resources')
param location string = 'eastus'

@description('SQL Server admin password')
@secure()
param sqlAdminPassword string

var resourceGroupName = 'ezstem-rg-${environment}'
var appName = 'ezstem-${environment}'

module appService 'modules/appservice.bicep' = {
  name: 'appservice-deployment'
  params: {
    environment: environment
    location: location
    appName: appName
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
  }
}

module database 'modules/database.bicep' = {
  name: 'database-deployment'
  params: {
    environment: environment
    location: location
    appName: appName
    sqlAdminPassword: sqlAdminPassword
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault-deployment'
  params: {
    environment: environment
    location: location
    appName: appName
    sqlConnectionString: database.outputs.connectionString
  }
}

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  params: {
    environment: environment
    location: location
    appName: appName
  }
}

output webAppUrl string = appService.outputs.webAppUrl
output keyVaultName string = keyVault.outputs.keyVaultName
output sqlServerName string = database.outputs.sqlServerName
output appInsightsName string = monitoring.outputs.appInsightsName

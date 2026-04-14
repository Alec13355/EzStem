@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for resources')
param location string = 'centralus'

@description('Object ID of the AAD admin (deployer user or service principal)')
param aadAdminObjectId string

@description('Display name of the AAD admin (deployer user or service principal)')
param aadAdminName string

@description('Principal type: Application for service principals, User for interactive users')
param principalType string = 'Application'

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
    aadAdminObjectId: aadAdminObjectId
    aadAdminName: aadAdminName
    principalType: principalType
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

module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
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
output storageAccountName string = storage.outputs.storageAccountName
output frontendUrl string = storage.outputs.primaryEndpoint

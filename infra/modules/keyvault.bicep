@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Application name')
param appName string

@description('SQL connection string to store')
@secure()
param sqlConnectionString string

@description('Blob storage connection string to store')
@secure()
param blobStorageConnectionString string

var keyVaultName = 'ez-${environment}-kv-${substring(uniqueString(resourceGroup().id), 0, 8)}'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
  }
}

resource sqlConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SqlConnectionString'
  properties: {
    value: sqlConnectionString
  }
}

resource blobStorageConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AzureBlobStorageConnectionString'
  properties: {
    value: blobStorageConnectionString
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id

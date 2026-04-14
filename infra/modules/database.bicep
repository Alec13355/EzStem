@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Application name')
param appName string

@description('Object ID of the AAD admin (deployer user or service principal)')
param aadAdminObjectId string

@description('Display name of the AAD admin (deployer user or service principal)')
param aadAdminName string

@description('Principal type: Application for service principals, User for interactive users')
param principalType string = 'Application'

var sqlServerName = '${appName}-sql'
var sqlDatabaseName = '${appName}-db'
var databaseTier = environment == 'prod' ? 'Standard' : 'Basic'
var databaseSize = environment == 'prod' ? 'S2' : 'Basic'

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administrators: {
      login: aadAdminName
      sid: aadAdminObjectId
      tenantId: subscription().tenantId
      azureADOnlyAuthentication: true
      principalType: principalType
    }
    version: '12.0'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: databaseSize
    tier: databaseTier
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environment == 'prod' ? 268435456000 : 2147483648
  }
}

resource firewallRule 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output sqlServerName string = sqlServer.name
output sqlDatabaseName string = sqlDatabase.name
output connectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Authentication=Active Directory Default;Encrypt=True;Connection Timeout=30;'

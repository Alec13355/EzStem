@description('Environment name')
param environment string

@description('Azure region')
param location string

@description('Application name')
param appName string

@description('SQL Server admin password')
@secure()
param sqlAdminPassword string

var sqlServerName = '${appName}-sql'
var sqlDatabaseName = '${appName}-db'
var sqlAdminLogin = 'sqladmin'
var databaseTier = environment == 'prod' ? 'Standard' : 'Basic'
var databaseSize = environment == 'prod' ? 'S2' : 'Basic'

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
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
output connectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

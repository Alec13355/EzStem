using './main.bicep'

param environment = 'dev'
param location = 'eastus'
param sqlAdminPassword = readEnvironmentVariable('SQL_ADMIN_PASSWORD')

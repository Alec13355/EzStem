export const environment = {
  production: true,
  apiUrl: 'https://ezstem-dev-api.azurewebsites.net/api',
  msalConfig: {
    auth: {
      clientId: 'YOUR_SPA_CLIENT_ID',
      authority: 'https://YOUR_TENANT_NAME.ciamlogin.com/YOUR_TENANT_ID',
      redirectUri: 'https://thankful-bay-01befc610.7.azurestaticapps.net',
      postLogoutRedirectUri: 'https://thankful-bay-01befc610.7.azurestaticapps.net'
    },
    scopes: ['api://YOUR_API_CLIENT_ID/access_as_user']
  }
};

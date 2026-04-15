export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  msalConfig: {
    auth: {
      clientId: 'YOUR_SPA_CLIENT_ID',
      authority: 'https://YOUR_TENANT_NAME.ciamlogin.com/YOUR_TENANT_ID',
      redirectUri: 'http://localhost:4200',
      postLogoutRedirectUri: 'http://localhost:4200'
    },
    scopes: ['api://YOUR_API_CLIENT_ID/access_as_user']
  }
};

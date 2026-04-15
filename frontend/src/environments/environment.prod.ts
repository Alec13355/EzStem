export const environment = {
  production: true,
  apiUrl: 'https://ezstem-dev-api.azurewebsites.net/api',
  msalConfig: {
    auth: {
      clientId: 'fd7e9b53-7b8f-4cd4-bfea-7c0a00209448',
      authority: 'https://ezstem.ciamlogin.com/fdd626a3-0e01-441d-a864-4415ad287675',
      redirectUri: 'https://thankful-bay-01befc610.7.azurestaticapps.net',
      postLogoutRedirectUri: 'https://thankful-bay-01befc610.7.azurestaticapps.net'
    },
    scopes: ['api://97f156cd-f562-42e1-8de6-6e82c543fa86/access_as_user']
  }
};

import { Injectable, signal, computed } from '@angular/core';
import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private msalInstance: PublicClientApplication;
  private readonly _account = signal<AccountInfo | null>(null);

  readonly isAuthenticated = computed(() => this._account() !== null);
  readonly currentAccount = computed(() => this._account());

  constructor() {
    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId: environment.msalConfig.auth.clientId,
        authority: environment.msalConfig.auth.authority,
        redirectUri: environment.msalConfig.auth.redirectUri,
        postLogoutRedirectUri: environment.msalConfig.auth.postLogoutRedirectUri,
        navigateToLoginRequestUrl: false
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
      }
    });
  }

  async initialize(): Promise<void> {
    await this.msalInstance.initialize();
    const response = await this.msalInstance.handleRedirectPromise();
    if (response?.account) {
      this.msalInstance.setActiveAccount(response.account);
    }
    const account = this.msalInstance.getActiveAccount() ?? this.msalInstance.getAllAccounts()[0] ?? null;
    this._account.set(account);
  }

  async signIn(): Promise<void> {
    await this.msalInstance.loginRedirect({
      scopes: environment.msalConfig.scopes
    });
  }

  async signOut(): Promise<void> {
    await this.msalInstance.logoutRedirect();
  }

  async getToken(): Promise<string | null> {
    const account = this._account();
    if (!account) return null;

    try {
      const result = await this.msalInstance.acquireTokenSilent({
        account,
        scopes: environment.msalConfig.scopes
      });
      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await this.msalInstance.acquireTokenRedirect({
          account,
          scopes: environment.msalConfig.scopes
        });
      }
      return null;
    }
  }
}

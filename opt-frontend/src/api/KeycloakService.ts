import Keycloak from "keycloak-js";
import {
  keycloakConfig,
  LOGIN_URL,
  DASHBOARD_URL,
} from "../config/keycloak.config";

class KeycloakService {
  private static instance: KeycloakService;
  private keycloak: Keycloak;
  private isInitialized: boolean = false;

  private constructor() {
    this.keycloak = new Keycloak(keycloakConfig);
  }

  public static getInstance(): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService();
    }
    return KeycloakService.instance;
  }

  public async init(
    initOptions: Keycloak.KeycloakInitOptions,
  ): Promise<boolean> {
    if (this.isInitialized) {
      return !!this.keycloak.authenticated;
    }

    try {
      const authenticated = await this.keycloak.init(initOptions);
      this.isInitialized = true;

      if (authenticated) {
        this.setupTokenRefresh();
      }

      return authenticated;
    } catch (error) {
      console.error("Keycloak init failed", error);
      this.isInitialized = true;
      return false;
    }
  }

  private setupTokenRefresh(): void {
    setInterval(() => {
      this.keycloak.updateToken(70).catch(() => {
        console.error("Token refresh failed");
        this.logout();
      });
    }, 60000);
  }

  public getToken(): string | undefined {
    return this.keycloak.token;
  }

  public getRoles(): string[] {
    return this.keycloak.tokenParsed?.realm_access?.roles || [];
  }

  public hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  public async getUserInfo(): Promise<any> {
    try {
      return await this.keycloak.loadUserInfo();
    } catch (error) {
      console.error("Failed to load user info", error);
      return null;
    }
  }

  public login(redirectUri?: string): void {
    this.keycloak.login({
      redirectUri: redirectUri || DASHBOARD_URL,
    });
  }

  // ✅ LOGOUT VÀ REDIRECT VỀ LOGIN
  public logout(): void {
    this.keycloak.logout({
      redirectUri: LOGIN_URL,
    });
  }

  public isAuthenticated(): boolean {
    return !!this.keycloak.authenticated;
  }
}

export default KeycloakService;

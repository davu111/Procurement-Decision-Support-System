export const keycloakConfig = {
  url: "http://localhost:8180",
  realm: "optimization",
  clientId: "react-client",
};

export const keycloakInitOptions = {
  onLoad: "check-sso" as const,
  checkLoginIframe: false,
  pkceMethod: "S256" as const,
};

// LOGIN URL - để redirect về khi logout
export const LOGIN_URL = "http://localhost:5173/login";
export const DASHBOARD_URL = "http://localhost:5173/dashboard";

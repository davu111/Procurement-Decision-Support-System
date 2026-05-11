import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import KeycloakService from "../api/KeycloakService";
import { keycloakInitOptions } from "../config/keycloak.config";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: any;
  roles: string[];
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);

  const isInitializing = useRef(false);
  const keycloakService = KeycloakService.getInstance();

  useEffect(() => {
    if (isInitializing.current) return;

    isInitializing.current = true;
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const authenticated = await keycloakService.init(keycloakInitOptions);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const info = await keycloakService.getUserInfo();
        const userRoles = keycloakService.getRoles();

        setUserInfo(info);
        setRoles(userRoles);
        console.log("Token after init:", keycloakService.getToken());
      }
    } catch (error) {
      console.error("Auth init failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    keycloakService.logout();
  };

  const hasRole = (role: string) => {
    return keycloakService.hasRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userInfo,
        roles,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

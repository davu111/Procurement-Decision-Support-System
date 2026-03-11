import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "./keycloak";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

let isInitializing = false;
let isInitialized = false;

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // State mới để track cả user và roles đã load
  const initRef = useRef(false);
  const intervalRef = useRef(null);
  const hasRedirected = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      loadUserData(); // Gọi function mới để load cả user và roles
    }
  }, [authenticated]);

  // Effect để redirect sau khi có đầy đủ thông tin
  useEffect(() => {
    if (
      authenticated &&
      dataLoaded &&
      user &&
      roles.length > 0 &&
      !hasRedirected.current
    ) {
      console.log("User:", user);
      console.log("Roles:", roles);
      handleRoleBasedRedirect();
      hasRedirected.current = true;
    }
  }, [authenticated, dataLoaded, user, roles]);

  // Function mới: Load cả user profile và roles
  const loadUserData = async () => {
    setDataLoaded(false);
    try {
      // Chạy song song cả hai
      await Promise.all([loadUserProfile(), loadUserRoles()]);
      setDataLoaded(true);
    } catch (error) {
      console.error("Failed to load user data:", error);
      setDataLoaded(true); // Vẫn set true để tránh bị stuck
    }
  };

  const handleRoleBasedRedirect = () => {
    const currentPath = window.location.pathname;
    if (
      currentPath === "/" ||
      currentPath === "/home" ||
      currentPath === "/login"
    ) {
      if (roles.includes("CASHIER") || roles.includes("cashier")) {
        navigate("/cash");
      } else if (roles.includes("ADMIN") || roles.includes("admin")) {
        navigate("/admin");
      } else if (roles.includes("WAREHOUSE") || roles.includes("warehouse")) {
        navigate("/warehouse");
      } else if (roles.includes("MARKETING") || roles.includes("marketing")) {
        navigate("/marketing");
      }
    }
  };

  const initKeycloak = async () => {
    if (isInitializing || isInitialized) {
      return;
    }

    isInitializing = true;

    try {
      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
        pkceMethod: "S256",
        checkLoginIframe: false,
      });

      isInitialized = true;
      isInitializing = false;

      setAuthenticated(authenticated);

      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          keycloak.updateToken(70).catch(() => {
            console.error("Failed to refresh token");
            logout();
          });
        }, 60000);
      }
    } catch (error) {
      console.error("Failed to initialize Keycloak:", error);
      isInitializing = false;
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await keycloak.loadUserProfile();
      setUser(profile);
      console.log("User Profile loaded:", profile);
      return profile; // Return để có thể dùng trong Promise.all
    } catch (error) {
      console.error("Failed to load user profile:", error);
      throw error;
    }
  };

  const loadUserRoles = async () => {
    // Thêm async
    try {
      console.log("=== DEBUG ROLES ===");
      console.log("Keycloak authenticated:", keycloak.authenticated);
      console.log("Keycloak tokenParsed:", keycloak.tokenParsed);
      console.log("realmAccess:", keycloak.realmAccess);
      console.log("resourceAccess:", keycloak.resourceAccess);

      const realmRoles = keycloak.realmAccess?.roles || [];
      console.log("Realm Roles:", realmRoles);

      const clientRoles =
        keycloak.resourceAccess?.[keycloak.clientId]?.roles || [];
      console.log("Client Roles:", clientRoles);

      const allRoles = [...realmRoles, ...clientRoles];
      console.log("All Roles loaded:", allRoles);

      setRoles(allRoles);
      return allRoles; // Return để có thể dùng trong Promise.all
    } catch (error) {
      console.error("Failed to load user roles:", error);
      throw error;
    }
  };

  const login = () => {
    hasRedirected.current = false;
    setDataLoaded(false); // Reset data loaded flag
    if (!isInitialized) {
      initKeycloak().then(() => {
        keycloak.login();
      });
    } else {
      keycloak.login();
    }
  };

  const register = () => {
    keycloak.register();
  };

  const logout = async () => {
    setIsLoggingOut(true);
    setUser(null);
    setRoles([]);
    setAuthenticated(false);
    setDataLoaded(false);
    hasRedirected.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    await keycloak.logout({ redirectUri: window.location.origin + "/" });
    setIsLoggingOut(false);
  };

  const getToken = () => {
    return keycloak.token;
  };

  const hasRole = (role) => {
    return roles.includes(role);
  };

  const hasAnyRole = (...rolesToCheck) => {
    return rolesToCheck.some((role) => roles.includes(role));
  };

  const hasAllRoles = (...rolesToCheck) => {
    return rolesToCheck.every((role) => roles.includes(role));
  };

  const isManager = () => {
    return roles.includes("MANAGER") || roles.includes("manager");
  };

  const isCashier = () => {
    return roles.includes("CASHIER") || roles.includes("cashier");
  };

  const isWarehouse = () => {
    return roles.includes("WAREHOUSE") || roles.includes("warehouse");
  };

  const value = {
    authenticated,
    loading,
    user,
    roles,
    login,
    register,
    logout,
    getToken,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isManager,
    isCashier,
    keycloak,
    initKeycloak,
    isInitialized,
    isWarehouse,
    dataLoaded, // Export để có thể check ở component khác nếu cần
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

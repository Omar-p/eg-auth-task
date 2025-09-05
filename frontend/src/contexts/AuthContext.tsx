import React, { useState, useEffect, useRef } from "react";
import type { User, AuthTokens, AuthContextType } from "./auth.types";
import { AuthContext } from "./auth.types";
import { authAPI } from "@/services/auth-api";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  useEffect(() => {
    authAPI.setTokenGetter(() => accessTokenRef.current);
    authAPI.setTokenSetter((token) => setAccessToken(token));
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const userData = localStorage.getItem("user_data");

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Try to refresh access token on app load
          try {
            const { authAPI } = await import("@/services/auth-api");
            const refreshResponse = await authAPI.refreshToken();
            setAccessToken(refreshResponse.accessToken);
          } catch {
            console.error("Token refresh failed on app load");
          }
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          localStorage.removeItem("user_data");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const setTokens = (tokens: AuthTokens) => {
    setAccessToken(tokens.access_token);
    // Get user data from localStorage that was set during login
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data during setTokens:", error);
      }
    }
  };

  const getAccessToken = (): string | null => {
    return accessToken;
  };

  const logout = async () => {
    try {
      const { authAPI } = await import("@/services/auth-api");
      await authAPI.logout();
    } catch {
      console.warn("Logout API call failed, clearing local state anyway");
    } finally {
      setAccessToken(null);
      localStorage.removeItem("user_data");
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    setTokens,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

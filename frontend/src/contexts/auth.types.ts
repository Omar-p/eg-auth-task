import { useContext, createContext } from "react";
import type {
  SignInFormData,
  SignUpFormData,
} from "@/views/containers/auth/auth.types";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: SignInFormData) => Promise<void>;
  register: (data: SignUpFormData) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  getAccessToken: () => string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

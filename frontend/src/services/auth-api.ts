import type {
  SignInFormData,
  SignUpFormData,
} from "@/views/containers/auth/auth.types";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class AuthAPI {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    let response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    });

    // Handle 401 with auto-refresh (but not for auth endpoints)
    if (response.status === 401 && !endpoint.includes("/auth/")) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshPromise = this.attemptRefresh();
      }

      try {
        const newToken = await this.refreshPromise;
        if (newToken) {
          // Retry original request
          response = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              ...options.headers,
            },
            credentials: "include",
            ...options,
          });
        }
      } catch {
        window.location.href = "/";
        throw new Error("Session expired");
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async attemptRefresh(): Promise<string | null> {
    try {
      const refreshResponse = await this.refreshToken();
      return refreshResponse.accessToken;
    } catch {
      return null;
    }
  }

  async login(credentials: SignInFormData): Promise<AuthResponse> {
    const response = await this.request<{ accessToken: string }>(
      "/auth/sign-in",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
    );

    // Decode JWT to extract user info
    const { decodeJWT } = await import("@/utils/jwt");
    const payload = decodeJWT(response.accessToken);

    if (!payload) {
      throw new Error("Invalid access token");
    }

    return {
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
      },
      access_token: response.accessToken,
    };
  }

  async register(
    data: SignUpFormData,
  ): Promise<{ message: string; userId: string }> {
    return this.request<{ message: string; userId: string }>("/auth/sign-up", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>(
      "/auth/refresh",
      {
        method: "POST",
        // No body needed - refresh token comes from HttpOnly cookie
      },
    );

    return {
      accessToken: response.accessToken,
    };
  }

  async logout(): Promise<void> {
    await this.request<{ message: string }>("/auth/logout", {
      method: "POST",
      // Refresh token comes from HttpOnly cookie
    });
  }

  async logoutAll(): Promise<void> {
    await this.request<{ message: string }>("/auth/logout-all", {
      method: "DELETE",
    });
  }
}

export const authAPI = new AuthAPI();

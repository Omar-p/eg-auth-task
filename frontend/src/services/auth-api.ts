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

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

class AuthAPI {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private getAccessToken: () => string | null = () => null;
  private setAccessToken: (token: string | null) => void = () => {};

  setTokenGetter(getter: () => string | null) {
    this.getAccessToken = getter;
  }

  setTokenSetter(setter: (token: string | null) => void) {
    this.setAccessToken = setter;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const fetchWithToken = async (token: string | null) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return fetch(url, { ...options, headers, credentials: "include" });
    };

    let response = await fetchWithToken(this.getAccessToken());

    if (response.status === 401 && !endpoint.includes("/auth/")) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        this.refreshPromise = this.attemptRefresh().finally(() => {
          this.isRefreshing = false;
          this.refreshPromise = null;
        });
      }

      const newToken = await this.refreshPromise;
      if (newToken) {
        response = await fetchWithToken(newToken);
      } else {
        this.setAccessToken(null);
        throw new HttpError("Session expired", 401);
      }
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new HttpError(
        error.message || `HTTP ${response.status}`,
        response.status,
      );
    }

    return response.json();
  }

  private async attemptRefresh(): Promise<string | null> {
    try {
      const { accessToken } = await this.refreshToken();
      this.setAccessToken(accessToken);
      return accessToken;
    } catch {
      this.setAccessToken(null);
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
    return this.request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
    });
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

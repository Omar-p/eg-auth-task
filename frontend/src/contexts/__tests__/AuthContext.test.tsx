import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../auth.types";
import { vi } from "vitest";

// Mock the auth API
vi.mock("@/services/auth-api", () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    setTokenGetter: vi.fn(),
    setTokenSetter: vi.fn(),
  },
  HttpError: class extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "HttpError";
      this.status = status;
    }
  },
}));

// Mock JWT utility
vi.mock("@/utils/jwt", () => ({
  decodeJWT: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it("should throw error when useAuth is used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("should initialize with default unauthenticated state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("should restore user from localStorage on initialization", async () => {
    const { authAPI } = await import("@/services/auth-api");
    const mockAuthAPI = authAPI as unknown as {
      refreshToken: ReturnType<typeof vi.fn>;
      logout: ReturnType<typeof vi.fn>;
    };

    // Mock successful refresh
    mockAuthAPI.refreshToken.mockResolvedValue({
      accessToken: "refreshed_token_123",
    });

    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
    };

    // Only user data persisted, access token will be refreshed via HttpOnly cookie
    mockLocalStorage.setItem("user_data", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockAuthAPI.refreshToken).toHaveBeenCalled();
    expect(result.current.getAccessToken()).toBe("refreshed_token_123");
  });

  it("should handle failed refresh on initialization", async () => {
    const { authAPI } = await import("@/services/auth-api");
    const mockAuthAPI = authAPI as unknown as {
      refreshToken: ReturnType<typeof vi.fn>;
      logout: ReturnType<typeof vi.fn>;
    };

    // Mock failed refresh
    mockAuthAPI.refreshToken.mockRejectedValue(new Error("Refresh failed"));

    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
    };

    mockLocalStorage.setItem("user_data", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockAuthAPI.refreshToken).toHaveBeenCalled();
    // Access token should be null if refresh failed
    expect(result.current.getAccessToken()).toBe(null);
  });

  it("should clear invalid data from localStorage on initialization", async () => {
    mockLocalStorage.setItem("user_data", "invalid_json");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.getItem("user_data")).toBe(null);
    expect(result.current.getAccessToken()).toBe(null);
  });

  it("should logout and clear all data", async () => {
    const { authAPI } = await import("@/services/auth-api");
    const mockAuthAPI = authAPI as unknown as {
      refreshToken: ReturnType<typeof vi.fn>;
      logout: ReturnType<typeof vi.fn>;
    };

    mockAuthAPI.logout.mockResolvedValue(undefined);
    // Mock refresh to fail during initialization so it doesn't interfere
    mockAuthAPI.refreshToken.mockRejectedValue(new Error("No refresh token"));

    // Set up authenticated state
    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
    };

    // Only user data is in localStorage, access token would be in memory
    mockLocalStorage.setItem("user_data", JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initialization to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // User should be loaded from localStorage
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    // Simulate having an access token in memory (after initialization)
    act(() => {
      result.current.setTokens({ access_token: "mock_token" });
    });

    // Verify token is set in memory
    expect(result.current.getAccessToken()).toBe("mock_token");

    // Clear the refresh token mock call count from initialization
    mockAuthAPI.refreshToken.mockClear();

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuthAPI.logout).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);

    // Check memory token is cleared and localStorage is cleared
    expect(result.current.getAccessToken()).toBe(null);
    expect(mockLocalStorage.getItem("user_data")).toBe(null);
  });

  it("should store access token in memory and retrieve correctly", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const tokens = {
      access_token: "test_access_token",
      // refresh_token handled by HttpOnly cookie
    };

    act(() => {
      result.current.setTokens(tokens);
    });

    expect(result.current.getAccessToken()).toBe("test_access_token");
    // No tokens stored in localStorage (in-memory only)
    expect(mockLocalStorage.getItem("access_token")).toBe(null);
    expect(mockLocalStorage.getItem("refresh_token")).toBe(null);
  });

  it("should return null for access token when not set", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.getAccessToken()).toBe(null);
  });
});

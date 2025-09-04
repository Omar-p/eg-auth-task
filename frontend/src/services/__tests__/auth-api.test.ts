import { describe, it, expect, vi, beforeEach } from "vitest";
import { authAPI } from "../auth-api";
import type {
  SignInFormData,
  SignUpFormData,
} from "@/views/containers/auth/auth.types";

// Mock the JWT utility
const mockDecodeJWT = vi.fn();
vi.mock("@/utils/jwt", () => ({
  decodeJWT: mockDecodeJWT,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Note: In test environment, VITE_API_URL is undefined, so API calls go to 'undefined/endpoint'

describe("AuthAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("login", () => {
    it("should login successfully and decode JWT", async () => {
      const mockCredentials: SignInFormData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockJWTPayload = {
        sub: "123",
        email: "test@example.com",
        name: "John Doe",
        iat: 1640995200,
        exp: 1640998800,
      };

      const mockApiResponse = {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      };

      // Mock successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      // Mock JWT decoding
      mockDecodeJWT.mockReturnValue(mockJWTPayload);

      const result = await authAPI.login(mockCredentials);

      expect(mockFetch).toHaveBeenCalledWith("undefined/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(mockCredentials),
      });

      expect(mockDecodeJWT).toHaveBeenCalledWith(mockApiResponse.accessToken);

      expect(result).toEqual({
        user: {
          id: "123",
          name: "John Doe",
          email: "test@example.com",
        },
        access_token: mockApiResponse.accessToken,
      });
    });

    it("should throw error when JWT decoding fails", async () => {
      const mockCredentials: SignInFormData = {
        email: "test@example.com",
        password: "password123",
      };

      const mockApiResponse = {
        accessToken: "invalid-jwt-token",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      // Mock JWT decoding failure
      mockDecodeJWT.mockReturnValue(null);

      await expect(authAPI.login(mockCredentials)).rejects.toThrow(
        "Invalid access token",
      );
    });

    it("should handle API error response", async () => {
      const mockCredentials: SignInFormData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Invalid credentials" }),
      });

      await expect(authAPI.login(mockCredentials)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("register", () => {
    it("should register successfully", async () => {
      const mockRegistrationData: SignUpFormData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123!",
      };

      const mockApiResponse = {
        message: "User created successfully",
        userId: "507f1f77bcf86cd799439011",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await authAPI.register(mockRegistrationData);

      expect(mockFetch).toHaveBeenCalledWith("undefined/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(mockRegistrationData),
      });

      // JWT decoding should not be called for registration
      expect(mockDecodeJWT).not.toHaveBeenCalled();

      expect(result).toEqual({
        message: "User created successfully",
        userId: "507f1f77bcf86cd799439011",
      });
    });

    it("should handle registration API error", async () => {
      const mockRegistrationData: SignUpFormData = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123!",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Email already exists" }),
      });

      await expect(authAPI.register(mockRegistrationData)).rejects.toThrow(
        "Email already exists",
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      const mockApiResponse = {
        accessToken: "new-access-token-123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await authAPI.refreshToken();

      expect(mockFetch).toHaveBeenCalledWith("undefined/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      expect(result).toEqual({
        accessToken: "new-access-token-123",
      });
    });

    it("should handle refresh token error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Invalid refresh token" }),
      });

      await expect(authAPI.refreshToken()).rejects.toThrow(
        "Invalid refresh token",
      );
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const mockApiResponse = {
        message: "Logged out successfully",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await authAPI.logout();

      expect(mockFetch).toHaveBeenCalledWith("undefined/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    });

    it("should handle logout error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Invalid refresh token" }),
      });

      await expect(authAPI.logout()).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logoutAll", () => {
    it("should logout from all devices successfully", async () => {
      const mockApiResponse = {
        message: "Logged out from 3 devices",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await authAPI.logoutAll();

      expect(mockFetch).toHaveBeenCalledWith("undefined/auth/logout-all", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { decodeJWT, isTokenExpired } from "../jwt";

// Mock console.error to avoid noise in tests
vi.spyOn(console, "error").mockImplementation(() => {});

describe("JWT utility functions", () => {
  describe("decodeJWT", () => {
    it("should decode a valid JWT token", () => {
      // This is a sample JWT with payload: {"sub":"123","email":"test@example.com","name":"Test User","iat":1640995200,"exp":1640998800}
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature";

      const payload = decodeJWT(validToken);

      expect(payload).toEqual({
        sub: "123",
        email: "test@example.com",
        name: "Test User",
        iat: 1640995200,
        exp: 1640998800,
      });
    });

    it("should handle tokens with special characters in payload", () => {
      // JWT with payload containing special characters: {"sub":"456","email":"user+test@example.com","name":"John O'Connor","iat":1640995200,"exp":1640998800}
      const tokenWithSpecialChars =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTYiLCJlbWFpbCI6InVzZXIrdGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJKb2huIE8nQ29ubm9yIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature";

      const payload = decodeJWT(tokenWithSpecialChars);

      expect(payload).toEqual({
        sub: "456",
        email: "user+test@example.com",
        name: "John O'Connor",
        iat: 1640995200,
        exp: 1640998800,
      });
    });

    it("should return null for invalid token format", () => {
      const invalidToken = "invalid.token";

      const payload = decodeJWT(invalidToken);

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });

    it("should return null for token with invalid base64", () => {
      const invalidBase64Token = "header.invalid-base64!.signature";

      const payload = decodeJWT(invalidBase64Token);

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });

    it("should return null for empty token", () => {
      const payload = decodeJWT("");

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });

    it("should return null for malformed JSON in payload", () => {
      // Token with invalid JSON payload
      const malformedToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aW52YWxpZC1qc29u.signature"; // payload: "invalid-json"

      const payload = decodeJWT(malformedToken);

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for valid unexpired token", () => {
      // Create a token that expires far in the future
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = {
        sub: "123",
        email: "test@example.com",
        name: "Test User",
        iat: Math.floor(Date.now() / 1000),
        exp: futureExp,
      };

      // Manually create JWT-like token with future expiry
      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      expect(isTokenExpired(validToken)).toBe(false);
    });

    it("should return true for expired token", () => {
      // Create a token that expired in the past
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = {
        sub: "123",
        email: "test@example.com",
        name: "Test User",
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: pastExp,
      };

      // Manually create JWT-like token with past expiry
      const base64Payload = btoa(JSON.stringify(payload));
      const expiredToken = `header.${base64Payload}.signature`;

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it("should return true for invalid token", () => {
      const invalidToken = "invalid.token";

      expect(isTokenExpired(invalidToken)).toBe(true);
    });

    it("should return true for token without exp claim", () => {
      // Create a valid JWT-like token without exp claim
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = {
        sub: "123",
        email: "test@example.com",
        name: "Test User",
        iat: Math.floor(Date.now() / 1000),
        // No exp claim
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const tokenWithoutExp = `${header}.${base64Payload}.signature`;

      expect(isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });
});

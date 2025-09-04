import { decodeJwt } from "jose";

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp?: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    return decodeJwt(token) as JWTPayload;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  return payload.exp * 1000 < Date.now();
};

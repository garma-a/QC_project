/**
 * Decode a JWT token payload without verifying the signature.
 * This is safe for client-side use since the server already verified the token.
 */

export interface JwtPayload {
  userId: number;
  role: 'ADMIN' | 'TECHNICIAN';
  iat: number;
  exp: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Handle base64url encoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

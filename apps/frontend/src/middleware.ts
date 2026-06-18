import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function isTokenExpired(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Handle base64url encoding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    // Check if expiration is within the next 30 seconds to be safe
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // If there's no auth token (or it's expired) BUT there is a refresh token,
  // we intercept the request and silently refresh it via the backend!
  if ((!authToken || isTokenExpired(authToken)) && refreshToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // 1. Clone the incoming request headers
        const requestHeaders = new Headers(request.headers);

        // 2. Update the Authorization/Cookie header for the downstream Server Components
        if (data.accessToken) {
          requestHeaders.set('Authorization', `Bearer ${data.accessToken}`);
          // Reconstruct the cookie string so Server Components using cookies().get() see the new token
          requestHeaders.set('cookie', `auth_token=${data.accessToken}; refresh_token=${data.refreshToken || refreshToken}`);
        }

        // 3. Pass the modified headers INTO NextResponse.next()
        const response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        
        // 4. Set the cookies on the response so the browser saves them
        if (data.accessToken) {
          response.cookies.set('auth_token', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60, // 1 hour
          });
        }

        if (data.refreshToken) {
          response.cookies.set('refresh_token', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }

        // Return the modified response!
        return response;
      }
    } catch (e) {
      // If the refresh fails, just fall through and let the Server Component
      // hit the 401 and redirect to login naturally.
    }
  }

  // Pass through if the token is valid or no refresh token exists
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};

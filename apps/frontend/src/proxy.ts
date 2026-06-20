import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/qc', '/qc-tests', '/alerts', '/errors', '/users', '/machines', '/control-lots'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function isTokenExpired(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Handle base64url encoding
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const payload = JSON.parse(atob(base64));
    
    // Check if expiration is within the next 30 seconds to be safe
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let authToken = request.cookies.get('auth_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // --- TOKEN REFRESH LOGIC ---
  let refreshedResponse: NextResponse | null = null;
  
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
          authToken = data.accessToken; // Update our local variable for the route protection logic below
          requestHeaders.set('Authorization', `Bearer ${data.accessToken}`);
          // Reconstruct the cookie string so Server Components using cookies().get() see the new token
          requestHeaders.set('cookie', `auth_token=${data.accessToken}; refresh_token=${data.refreshToken || refreshToken}`);
        }

        // 3. Pass the modified headers INTO NextResponse.next()
        refreshedResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        
        // 4. Set the cookies on the response so the browser saves them
        if (data.accessToken) {
          refreshedResponse.cookies.set('auth_token', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60, // 1 hour
          });
        }

        if (data.refreshToken) {
          refreshedResponse.cookies.set('refresh_token', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // --- ROUTE PROTECTION LOGIC ---
  
  // If accessing a protected route without a token, redirect to login
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !authToken) {
    const loginUrl = new URL('/login', request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    // If we had refreshed tokens, we would want to keep them, but here there's NO auth token so we just redirect
    return redirectResponse;
  }

  // If accessing login page with a valid token, redirect to dashboard
  if (pathname === '/login' && authToken && request.nextUrl.searchParams.get('force') !== 'true') {
    const dashboardUrl = new URL('/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    
    // Copy the refreshed cookies to the redirect response if we refreshed them
    if (refreshedResponse) {
      redirectResponse.headers.set('Set-Cookie', refreshedResponse.headers.get('Set-Cookie') || '');
    }
    
    return redirectResponse;
  }

  // Continue with the request
  return refreshedResponse || NextResponse.next();
}

export { proxy as middleware };
export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)',
  ],
};

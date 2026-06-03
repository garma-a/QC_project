import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/qc', '/qc-tests', '/alerts', '/errors', '/users', '/machines', '/control-lots'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // If accessing a protected route without a token, redirect to login
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    return Response.redirect(loginUrl);
  }

  // If accessing login page with a valid token, redirect to dashboard
  // unless explicitly forced to stay on login (e.g. after a 401 logout failure)
  if (pathname === '/login' && token && request.nextUrl.searchParams.get('force') !== 'true') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return Response.redirect(dashboardUrl);
  }

  // Continue with the request
  return undefined;
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

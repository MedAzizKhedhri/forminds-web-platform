import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes that require authentication.
 * If a user without a session cookie hits these, they are redirected to /login.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/feed',
  '/network',
  '/directory',
  '/profile',
  '/settings',
  '/projects',
  '/applications',
  '/applicants',
  '/opportunities',
  '/events',
  '/recommendations',
  '/admin',
];

/**
 * Routes that are only for unauthenticated users.
 * If a user WITH a session cookie hits these, they are redirected to /dashboard.
 */
const AUTH_ONLY_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-2fa',
];

const SESSION_COOKIE = 'session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === '1';

  // --- Protected routes: redirect to login if no session ---
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Auth pages: redirect to dashboard if already has session ---
  const isAuthPage = AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};

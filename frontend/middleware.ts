import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/generate',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/auth/callback',
  '/auth/promo',
  '/features',
  '/pricing',
  '/showcase',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Get token from cookies or headers
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Redirect legacy routes to canonical routes
  const legacyRedirect = redirectLegacyRoute(pathname);
  if (legacyRedirect) {
    return NextResponse.redirect(new URL(legacyRedirect, request.url));
  }
  
  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login with valid token, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard/sites', request.url));
  }
  
  return NextResponse.next();
}

// Redirect legacy routes to canonical equivalents
function redirectLegacyRoute(pathname: string): string | null {
  const redirects: Record<string, string> = {
    '/dashboard/dashboard/business': '/dashboard/sites',
    '/dashboard/owner': '/dashboard/sites',
    '/dashboard/owner/create': '/dashboard/sites/new',
  };
  
  // Check exact matches
  if (redirects[pathname]) {
    return redirects[pathname];
  }
  
  // Check pattern matches for /dashboard/owner/editor/[siteId]
  const ownerEditorMatch = pathname.match(/^\/dashboard\/owner\/editor\/(.+)$/);
  if (ownerEditorMatch) {
    return `/dashboard/sites/${ownerEditorMatch[1]}/editor`;
  }
  
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

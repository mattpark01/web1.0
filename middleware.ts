import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/verify-email',
  '/verify-otp',
  '/resend-verification',
  '/link-account',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/verify-code',
  '/api/auth/resend-verification',
  '/api/auth/google',
  '/api/auth/google/callback',
  '/api/auth/link-account',
];

// Static assets and system routes to always allow
const ALWAYS_ALLOW = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow static assets and system routes
  if (ALWAYS_ALLOW.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  
  // Get the session from the cookie
  const sessionId = request.cookies.get('sessionId')?.value;
  
  // If there's no session and the route is not public, redirect to signin
  if (!sessionId && !isPublicRoute) {
    console.log(`[Middleware] No session, redirecting ${pathname} to /signin`);
    
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For page routes, redirect to signin
    const signinUrl = new URL('/signin', request.url);
    // Optionally store the attempted URL to redirect back after login
    signinUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signinUrl);
  }
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (sessionId && isPublicRoute && !pathname.startsWith('/api/')) {
    console.log(`[Middleware] User authenticated, redirecting from ${pathname} to /`);
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // For authenticated requests to protected routes, verify the session is valid
  if (sessionId && !isPublicRoute) {
    // For critical routes, we could add an extra check here to verify the session
    // is still valid in the database, but that would add latency to every request
    // Instead, we'll rely on the API routes to validate the session
    
    // Add security headers for authenticated routes
    const response = NextResponse.next();
    
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Strict referrer policy for privacy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
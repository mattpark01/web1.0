import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      // Check if this is an API request (wants JSON) or browser request (wants redirect)
      const accept = request.headers.get('accept');
      if (accept && accept.includes('application/json')) {
        return NextResponse.json(
          { error: 'Verification token is required' },
          { status: 400 }
        );
      }
      
      return NextResponse.redirect(
        new URL('/verify-email', request.url)
      );
    }

    try {
      const email = await verifyEmailToken(token);
      
      // Check if this is an API request (wants JSON) or browser request (wants redirect)  
      const accept = request.headers.get('accept');
      if (accept && accept.includes('application/json')) {
        return NextResponse.json({
          success: true,
          message: 'Email verified successfully',
          email
        });
      }
      
      // For browser requests, redirect to verification page with success
      return NextResponse.redirect(
        new URL('/verify-email?success=true', request.url)
      );
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      const accept = request.headers.get('accept');
      if (accept && accept.includes('application/json')) {
        if (error.message.includes('expired')) {
          return NextResponse.json(
            { error: 'Verification link has expired. Please request a new one.' },
            { status: 410 }
          );
        }
        
        if (error.message.includes('Invalid')) {
          return NextResponse.json(
            { error: 'Invalid verification token' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to verify email' },
          { status: 500 }
        );
      }
      
      // For browser requests, redirect to verification page with error
      const errorType = error.message.includes('expired') ? 'expired' : 'invalid';
      return NextResponse.redirect(
        new URL(`/verify-email?error=${errorType}`, request.url)
      );
    }
  } catch (error) {
    console.error('Verify email route error:', error);
    
    const accept = request.headers.get('accept');
    if (accept && accept.includes('application/json')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    return NextResponse.redirect(
      new URL('/verify-email?error=server', request.url)
    );
  }
}
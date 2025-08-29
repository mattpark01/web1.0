import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
    fromEmail: process.env.FROM_EMAIL,
    nodeEnv: process.env.NODE_ENV,
  });
}
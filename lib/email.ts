import { Resend } from 'resend';
import crypto from 'crypto';
import { prisma } from './prisma';

const APP_NAME = 'Spatio';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@spatiolabs.org';

export async function sendVerificationCode(email: string, code: string) {
  console.log('sendVerificationCode called with:', { email, code });
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  
  // Initialize Resend inside the function to ensure env vars are loaded
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  console.log('Resend instance created:', !!resend);
  
  if (!resend) {
    console.log('Resend API key not configured, skipping email verification');
    return null;
  }
  
  console.log('About to send email with Resend...');
  const { data, error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: [email],
    subject: 'Your verification code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your verification code</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #000; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: normal;">Welcome to ${APP_NAME}</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="margin-top: 0; color: #000;">Verify your email address</h2>
            <p style="color: #666; margin-bottom: 30px;">Enter this verification code in the app:</p>
            
            <div style="background: #fff; border: 2px solid #000; border-radius: 10px; padding: 20px; margin: 20px 0; display: inline-block;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">This code will expire in 10 minutes. If you didn't sign up for ${APP_NAME}, you can safely ignore this email.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  });

  console.log('Resend API response:', { data, error });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }

  console.log('Email sent successfully:', data);
  return data;
}

export async function createVerificationCode(email: string): Promise<string> {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Generate a 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create new token with 10 minute expiry (shorter for OTP)
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  return code;
}

export async function verifyEmailToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    throw new Error('Invalid verification token');
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });
    throw new Error('Verification token has expired');
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: true },
  });

  // Delete the token after successful verification
  await prisma.verificationToken.delete({
    where: { token },
  });

  return verificationToken.identifier;
}
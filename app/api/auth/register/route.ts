import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { createVerificationCode, sendVerificationCode } from '@/lib/email';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Registration request body:', body);
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const emailError = validation.error.issues.find(issue => issue.path[0] === 'email');
      const passwordError = validation.error.issues.find(issue => issue.path[0] === 'password');
      
      if (emailError) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }
      if (passwordError) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }
    
    const data = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with FREE tier
    console.log('About to create user with data:', {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      name: data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}` 
        : undefined,
    });
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          name: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}` 
            : undefined,
          tier: 'FREE',
          emailVerified: false,
          settings: {},
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          tier: true,
          createdAt: true,
        },
      });
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      throw dbError;
    }
    
    console.log('User created successfully:', user.id);

    // Generate SPATIO API key for the user
    const apiKey = `spatio_${crypto.randomBytes(32).toString('hex')}`;
    
    // Store the API key in the spatio_api_keys table
    await prisma.$executeRawUnsafe(`
      INSERT INTO spatio_api_keys (api_key, user_id, name, created_at, is_active)
      VALUES ($1, $2, $3, NOW(), true)
    `, apiKey, user.id, 'Default API Key');

    // Don't create session immediately - require email verification first
    const response = NextResponse.json({ 
      user,
      verificationRequired: true,
      message: 'Account created! Please check your email to verify your account before signing in.'
    });

    // Send verification code
    try {
      const verificationCode = await createVerificationCode(user.email);
      console.log('Generated verification code for:', user.email);
      await sendVerificationCode(user.email, verificationCode);
      console.log('Verification code sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send verification code:', error);
      console.error('Email error details:', error);
      // Don't fail registration if email fails, user can resend later
    }

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Zod validation error:', error.issues);
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
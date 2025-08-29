// Test script to verify email sending works
const { Resend } = require('resend');

const RESEND_API_KEY = "re_7GaWnFMN_NmRpkAeXLZZJ2MmF6sLmC7WD";
const resend = new Resend(RESEND_API_KEY);

async function testEmail() {
  console.log('Testing email send with Resend...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Spatio <hello@spatiolabs.org>',
      to: ['h.matthew.park@gmail.com'],
      subject: 'Test Verification Code',
      html: '<h1>Test Code: 123456</h1>',
    });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testEmail();
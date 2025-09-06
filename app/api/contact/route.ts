import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Use fallback API key to prevent build errors
const resendApiKey = process.env.RESEND_API_KEY || 'fallback-key-for-build';
const resend = new Resend(resendApiKey);

export async function POST(req: NextRequest) {
  try {
    // Check if Resend API key is properly configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const { name, email, phone, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    const emailHtml = `
      <h2>New Contact Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
      <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
    `;
    const data = await resend.emails.send({
      from: 'no-reply@classbridge.ac.ug',
      to: 'info@classbridge.ac.ug',
      subject: 'New Contact Inquiry',
      html: emailHtml,
      reply_to: email,
    });
    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'Failed to send email.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Message sent successfully.' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unexpected error.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
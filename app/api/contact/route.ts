import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
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
      replyTo: email,
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
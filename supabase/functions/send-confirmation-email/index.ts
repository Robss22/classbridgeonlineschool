// E:\CLASSBRIDGEONLINESCHOOL\classbridgeonlineschool\supabase\functions\send-confirmation-email\index.ts

// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
// @ts-ignore - NPM imports in Deno
import { Resend } from "npm:resend@4.6.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

const SENDER_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "musanjerobert222@gmail.com";
const SENDER_NAME = Deno.env.get("RESEND_FROM_NAME") || "Classbridge School";

console.log(`Edge Function send-confirmation-email starting. Sender: "${SENDER_NAME} <${SENDER_EMAIL}>"`);

serve(async (req: Request) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Define CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    // ADD 'x-client-info' AND 'apikey' HERE!
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request.');
    return new Response(null, { // Respond with empty body
      status: 204, // No Content
      headers: corsHeaders,
    });
  }

  // Ensure it's a POST request for actual logic
  if (req.method !== 'POST') {
    console.warn(`Method Not Allowed: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Include CORS headers in error response
    });
  }

  try {
    const { application } = await req.json(); // Destructure the 'application' object from the payload
    console.log('Received application data:', JSON.stringify(application, null, 2));

    // Basic validation for required fields
    if (!application || !application.email || !application.parentName || !application.firstName || !application.lastName || !application.application_id) {
      console.error('Validation Error: Missing required application fields in payload.');
      return new Response(JSON.stringify({ error: 'Missing required application fields (email, parentName, firstName, lastName, application_id).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fromEmailAddress = `${SENDER_NAME} <${SENDER_EMAIL}>`;
    const toEmailAddress = application.email;
    const subject = `Application Confirmation: ${application.firstName} ${application.lastName}`;

    const htmlContent = `
      <h1>Thank you for your application!</h1>
      <p>Dear ${application.parentName},</p>
      <p>We have received your application for **${application.firstName} ${application.lastName}** at Classbridge Online School!</p>
      <p>Your Application ID is: <strong>${application.application_id}</strong></p>
      <p>Here's a summary of the information we received:</p>
      <ul>
        <li><strong>Student Name:</strong> ${application.firstName} ${application.lastName}</li>
        <li><strong>Gender:</strong> ${application.gender || 'N/A'}</li>
        <li><strong>Date of Birth:</strong> ${application.dob || 'N/A'}</li>
        <li><strong>Nationality:</strong> ${application.nationality || 'N/A'}</li>
        <li><strong>Curriculum Applied For:</strong> ${application.curriculum || 'N/A'}</li>
        <li><strong>Class Applied For:</strong> ${application.className || 'N/A'}</li>
        <li><strong>Parent/Guardian Name:</strong> ${application.parentName}</li>
        <li><strong>Parent Contact:</strong> ${application.parentContact || 'N/A'}</li>
        <li><strong>Parent Email:</strong> ${application.email}</li>
        <li><strong>About Student:</strong> ${application.about || 'N/A'}</li>
        <li><strong>Academic Documents:</strong> ${application.document_url ? `<a href="${application.document_url}">View Document</a>` : 'N/A'}</li>
      </ul>
      <p>We will review your application shortly and get back to you.</p>
      <p>If you have any questions, please feel free to contact us.</p>
      <p>Sincerely,<br/>The Admissions Team<br/>Classbridge Online School</p>
    `;

    console.log(`Attempting to send email from: "${fromEmailAddress}" to: "${toEmailAddress}" with subject: "${subject}"`);

    const emailResponse = await resend.emails.send({
      from: fromEmailAddress,
      to: toEmailAddress,
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully via Resend. Result:', emailResponse);

    return new Response(JSON.stringify({ message: "Confirmation email sent", resendId: emailResponse.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, // Include CORS headers in success response
      status: 200,
    });

  } catch (error) {
    console.error("Error in send-confirmation-email Edge Function:", (error as Error).message);

          if ((error as any).name === 'ResendError' || ((error as any).response && typeof (error as any).response.json === 'function')) {
      try {
                  const errorDetails = await (error as any).response.json();
                  console.error("Resend API Specific Error Details:", (error as any).response.status, errorDetails);
        return new Response(JSON.stringify({
                      error: (error as Error).message || 'Failed to send email via Resend',
                      resendStatus: (error as any).response.status,
          resendDetails: errorDetails,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
                      status: (error as any).response.status || 500,
        });
      } catch (jsonError) {
        console.error("Failed to parse Resend error response:", jsonError);
      }
    }
    
            return new Response(JSON.stringify({ error: (error as Error).message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
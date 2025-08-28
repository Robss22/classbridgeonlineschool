
// ===================================================================
// FIXED APPLICATION APPROVAL FUNCTION
// ===================================================================

/// <reference types="./types.d.ts" />
/// <reference types="./module-resolver.d.ts" />

// NOTE: This file is designed to run in Deno environment (Supabase Edge Functions)
// The import errors below are expected in VS Code but will work correctly when deployed

/** @ts-ignore - Deno imports work in runtime but not in TypeScript compilation */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/** @ts-ignore - Supabase client import */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** @ts-ignore - Resend email service import */
import { Resend } from "https://esm.sh/resend@3.2.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: any;
  let application_id: string;
  let test_mode: boolean;
  
  try {
    console.log("🚀 Starting application approval process");
    console.log("🔧 Environment check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceRoleKey,
      hasResendKey: !!resendApiKey,
      hasFromEmail: !!resendFromEmail
    });
    
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }
    
    body = await req.json();
    console.log("📝 Request body:", body);
    
    const { application_id: appId, test_mode: testMode } = body;
    application_id = appId;
    test_mode = testMode;
    
    if (!application_id && !test_mode) {
      return new Response(JSON.stringify({ error: 'Missing application_id' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // If test mode, just return success
    if (test_mode) {
      console.log("🧪 Test mode - returning success");
      
      // Test database connectivity
      try {
        const { data: testData, error: testError } = await supabase
          .from('applications')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error("❌ Test mode database error:", testError);
          return new Response(JSON.stringify({
            success: false,
            message: "Test mode - Database connectivity failed",
            error: testError.message,
            test: true
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: "Test mode - Edge Function and database are working",
          database_test: "passed",
          test: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (testErr) {
        console.error("❌ Test mode exception:", testErr);
        return new Response(JSON.stringify({
          success: false,
          message: "Test mode - Exception occurred",
          error: testErr instanceof Error ? testErr.message : 'Unknown error',
          test: true
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    console.log("🔍 Fetching application:", application_id);

    // Validate database connectivity first
    try {
      const { data: connectivityTest, error: connectivityError } = await supabase
        .from('applications')
        .select('count')
        .limit(1);
      
      if (connectivityError) {
        console.error("❌ Database connectivity test failed:", connectivityError);
        return new Response(JSON.stringify({
          success: false,
          error: "Database connectivity failed",
          details: connectivityError.message,
          code: "DB_CONNECTIVITY_ERROR"
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      console.log("✅ Database connectivity test passed");
    } catch (connectivityErr: unknown) {
      const errorMessage = connectivityErr instanceof Error ? connectivityErr.message : 'Unknown error';
      console.error("❌ Database connectivity test exception:", connectivityErr);
      return new Response(JSON.stringify({
        success: false,
        error: "Database connectivity test failed",
        details: errorMessage,
        code: "DB_CONNECTIVITY_EXCEPTION"
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Fetch application data
    const application = await fetchApplication(application_id);
    if (!application) {
      console.log("❌ Application not found:", application_id);
      return new Response(JSON.stringify({ error: 'Application not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log("✅ Application found:", application.application_id);

    // Check if already approved
    if (application.status === 'approved') {
      console.log("⚠️ Application already approved");
      return new Response(JSON.stringify({ error: 'Application already approved' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log("🔑 Generating user credentials...");

    // Generate user credentials
    const credentials = await generateUserCredentials(application);
    
    console.log("👤 Creating user account...");
    
    // Create user account (FIXED - handles automatic profile creation)
    const userResult = await createUserAccount(application, credentials);
    
    console.log("📚 Creating enrollment record...");
    
    // Create enrollment record
    try {
      await createEnrollment(userResult.userProfileId, application, credentials);
    } catch (enrollmentError) {
      console.error("❌ Enrollment creation failed:", enrollmentError);
      // Continue with approval process even if enrollment fails
      console.log("⚠️ Continuing approval process without enrollment record");
    }
    
    console.log("📝 Updating application status...");
    
    // Update application status
    await updateApplicationStatus(application_id, credentials, userResult.userProfileId);
    
    console.log("📧 Sending approval email...");
    
    // Send approval email
    await sendApprovalEmail(application, credentials, userResult.success);
    
    console.log("✅ Application approval completed successfully");
    
    return new Response(JSON.stringify({
      success: true,
      message: "Application approved successfully",
      data: {
        student_email: credentials.studentEmail,
        registration_number: credentials.registrationNumber,
        auth_user_id: credentials.authUserId,
        user_profile_id: userResult.userProfileId
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("❌ Application approval failed:", error);
    console.error("❌ Error stack:", errorStack);
    
    // Log additional context for debugging
    console.error("❌ Request body was:", body);
    console.error("❌ Application ID was:", application_id);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Application approval failed",
      details: errorMessage,
      stack: errorStack,
      code: "APPROVAL_PROCESS_ERROR",
      context: {
        application_id,
        request_body: body
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});

// ===================================================================
// HELPER FUNCTIONS - FIXED
// ===================================================================

async function fetchApplication(applicationId: string) {
  try {
    console.log("🔍 Fetching application with ID:", applicationId);
    
    // First, check if the applications table exists and is accessible
    const { data: tableCheck, error: tableError } = await supabase
      .from('applications')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error("❌ Applications table access error:", tableError);
      throw new Error(`Database table access failed: ${tableError.message}`);
    }
    
    console.log("✅ Applications table accessible");
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('application_id', applicationId)
      .single();
      
    if (error) {
      console.error("❌ Error fetching application:", error);
      throw new Error(`Application fetch failed: ${error.message}`);
    }
    
    if (!data) {
      console.error("❌ Application not found:", applicationId);
      throw new Error(`Application with ID ${applicationId} not found`);
    }
    
    console.log("✅ Application found:", {
      id: data.application_id,
      status: data.status,
      firstName: data.first_name,
      lastName: data.last_name
    });
    
    return data;
  } catch (error) {
    console.error("❌ fetchApplication failed:", error);
    throw error;
  }
}

async function generateUserCredentials(application: any) {
  const studentEmail = await generateUniqueStudentEmail(
    application.first_name, 
    application.last_name
  );
  
  const registrationNumber = await generateUniqueRegistrationNumber(
    application.curriculum, 
    application.class
  );
  
  const tempPassword = generateTempPassword();
  
  return {
    studentEmail,
    registrationNumber,
    tempPassword,
    authUserId: '', // Will be populated during user creation
    userProfileId: '' // Will be populated during profile lookup
  };
}

// FIXED: Proper user account creation with auth_user_id
async function createUserAccount(application: any, credentials: any) {
  try {
    // 1. Create Supabase Auth user (this will automatically trigger handle_new_user())
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: credentials.studentEmail,
      password: credentials.tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${application.first_name} ${application.last_name}`,
        first_name: application.first_name,
        last_name: application.last_name,
        role: 'student',
        registration_number: credentials.registrationNumber
      }
    });

    if (authError) {
      throw new Error(`Auth user creation failed: ${authError.message}`);
    }

    credentials.authUserId = authUser.user!.id;
    console.log("✅ Auth user created:", credentials.authUserId);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: userProfile, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', credentials.studentEmail)
      .single();

    if (findError) {
      console.error("❌ Error finding user profile:", findError);
      throw new Error(`User profile lookup failed: ${findError.message}`);
    }

    console.log("✅ Found user profile:", userProfile.id);
    credentials.userProfileId = userProfile.id;

    // --- NEW: Fetch level_id for the class and program_id from application ---
    let levelId = null;
    if (application.class && application.program_id) {
      const { data: levelData, error: levelError } = await supabase
        .from('levels')
        .select('level_id')
        .eq('name', application.class)
        .eq('program_id', application.program_id)
        .single();
      if (!levelError && levelData) {
        levelId = levelData.level_id;
      }
    }

    // 4. Update the user profile with complete application data INCLUDING program_id and level_id
    const { error: updateError } = await supabase
      .from('users')
      .update({
        auth_user_id: credentials.authUserId,
        registration_number: credentials.registrationNumber,
        curriculum: application.curriculum,
        class: application.class,
        program_id: application.program_id || null,
        level_id: levelId || null,
        parent_email: application.parent_email,
        phone: application.parent_contact,
        date_of_birth: application.dob,
        gender: application.gender,
        nationality: application.nationality,
        password_changed: false,
        enrollment_date: new Date().toISOString(),
        academic_year: new Date().getFullYear().toString(),
        address: application.address || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id);

    if (updateError) {
      console.error("❌ Error updating user profile:", updateError);
      throw new Error(`User profile update failed: ${updateError.message}`);
    }

    console.log("✅ User profile updated with application data, program_id, and level_id");

    // --- NEW: Auto-enroll in compulsory subjects ---
    if (application.program_id && levelId) {
      await enrollInCompulsorySubjects(userProfile.id, application.program_id, levelId);
    }

    return { success: true, userProfileId: userProfile.id };
    
  } catch (error) {
    console.error("❌ User account creation failed:", error);
    throw error;
  }
}

// Create enrollment record
async function createEnrollment(userProfileId: string, application: any, credentials: any) {
  const { error } = await supabase
    .from('enrollments')
    .insert([{
      user_id: userProfileId,
      registration_number: credentials.registrationNumber,
      curriculum: application.curriculum,
      class: application.class,
      academic_year: new Date().getFullYear().toString(),
      enrollment_date: new Date().toISOString(),
      status: 'active',
      progress: 0,
      subject_offering_id: null // Set to null for now, will be populated by subject enrollment
    }]);

  if (error) {
    throw new Error(`Enrollment creation failed: ${error.message}`);
  }
  
  console.log("✅ Enrollment record created");
}

// Update application status
async function updateApplicationStatus(applicationId: string, credentials: any, userProfileId: string) {
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'approved',
      user_id: userProfileId,
      registration_number: credentials.registrationNumber,
      student_email: credentials.studentEmail,
      temporary_password: credentials.tempPassword,
      updated_at: new Date().toISOString()
    })
    .eq('application_id', applicationId);

  if (error) {
    throw new Error(`Application update failed: ${error.message}`);
  }
  
  console.log("✅ Application status updated");
}

// Generate unique registration number
async function generateUniqueRegistrationNumber(curriculum: string, studentClass: string): Promise<string> {
  const curriculumCode = getCurriculumCode(curriculum);
  const classCode = getClassCode(studentClass);
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // Get next sequence number using the database function
  const { data, error } = await supabase.rpc('increment_registration_sequence', {
    p_program_code: curriculumCode,
    p_year_month: `${year}${month}`
  });

  if (error) {
    console.error("Error generating sequence number:", error);
    // Fallback to timestamp-based approach
    const timestamp = Date.now().toString().slice(-4);
    return `CB${curriculumCode}${classCode}${year}${month}-${timestamp}`;
  }
  
  const sequenceNumber = data;
  return `CB${curriculumCode}${classCode}${year}${month}-${sequenceNumber.toString().padStart(4, '0')}`;
}

// Generate unique student email
async function generateUniqueStudentEmail(firstName: string, lastName: string): Promise<string> {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  
  // Base email pattern: {lastNameFirstLetter}{firstName}@classbridge.ac.ug
  const baseEmail = `${cleanLastName.charAt(0)}${cleanFirstName}@classbridge.ac.ug`;
  
  // Check if base email exists
  const { data: existingApp } = await supabase
    .from('applications')
    .select('student_email')
    .eq('student_email', baseEmail)
    .maybeSingle();
    
  const { data: existingUser } = await supabase
    .from('users')
    .select('email')
    .eq('email', baseEmail)
    .maybeSingle();
    
  if (!existingApp && !existingUser) {
    return baseEmail;
  }
  
  // If base email exists, try with incremental numbers
  let counter = 1;
  while (counter <= 999) { // Limit to prevent infinite loop
    const emailWithNumber = `${cleanLastName.charAt(0)}${cleanFirstName}${counter}@classbridge.ac.ug`;
    
    const { data: existingAppWithNumber } = await supabase
      .from('applications')
      .select('student_email')
      .eq('student_email', emailWithNumber)
      .maybeSingle();
      
    const { data: existingUserWithNumber } = await supabase
      .from('users')
      .select('email')
      .eq('email', emailWithNumber)
      .maybeSingle();
      
    if (!existingAppWithNumber && !existingUserWithNumber) {
      return emailWithNumber;
    }
    
    counter++;
  }
  
  // Final fallback with timestamp (should never reach here)
  const timestamp = Date.now().toString();
  return `student${timestamp.slice(-8)}@classbridge.ac.ug`;
}

// Send approval email
async function sendApprovalEmail(application: any, credentials: any, userCreated: boolean) {
  const fullName = `${application.first_name} ${application.last_name}`;
  const programName = `${application.curriculum} - ${application.class}`;
  
  const emailBody = generateApprovalEmailHTML(
    fullName,
    programName,
    credentials,
    application.parent_email,
    userCreated
  );

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: application.parent_email,
      subject: "WELCOME TO CLASS BRIDGE ONLINE SCHOOL - Application Approved",
      html: emailBody,
    });
    
    console.log("✅ Approval email sent to:", application.parent_email);
  } catch (error) {
    console.error("⚠️ Email sending failed:", error);
  }
}

function generateApprovalEmailHTML(fullName: string, programName: string, credentials: any, parentEmail: string, userCreated: boolean): string {
  const loginSection = userCreated ? `
    <div style="text-align: center; margin: 20px 0;">
      <a href="https://classbridge-frontend.vercel.app/login" 
         style="background-color: #3498db; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 5px; font-weight: bold;">
        LOGIN TO STUDENT PORTAL
      </a>
    </div>
  ` : `
    <div style="background-color: #fff3cd; border: 1px solid #ffecb5; 
                color: #856404; padding: 12px; border-radius: 5px; margin: 15px 0;">
      <strong>Note:</strong> Your login access is being set up. You will receive another email once ready.
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Class Bridge Online School</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; background-color: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1>🎉 WELCOME TO CLASS BRIDGE ONLINE SCHOOL 🎉</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
        <div style="font-size: 24px; font-weight: bold; color: #27ae60; margin-bottom: 20px;">
          Congratulations, ${fullName}!
        </div>
        
        <p style="font-size: 16px;">Your application has been <strong style="color: #27ae60;">APPROVED</strong> for the <strong>${programName}</strong> program.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
          <h3 style="margin-top: 0; color: #2c3e50;">Your Login Credentials:</h3>
          <p><strong>📧 Login Email:</strong> ${credentials.studentEmail}</p>
          <p><strong>🎓 Registration Number:</strong> ${credentials.registrationNumber}</p>
          <p><strong>🔐 Temporary Password:</strong> <code style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">${credentials.tempPassword}</code></p>
        </div>
        
        ${loginSection}
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; 
                    color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>⚠️ Important:</strong> Please change your password after first login for security.
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p><strong>📞 Need Help?</strong> Contact us if you have any questions about accessing your account.</p>
          <p style="margin-bottom: 0;"><strong>Best regards,<br>The Class Bridge Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getCurriculumCode(curriculum: string): string {
  const curriculumLower = curriculum?.toLowerCase() || '';
  
  if (curriculumLower.includes('uneb')) return 'U';
  if (curriculumLower.includes('cambridge')) return 'C';
  if (curriculumLower.includes('coaching')) return 'CO';
  if (curriculumLower.includes('tech skills')) return 'T';
  
  return 'G';
}

function getClassCode(studentClass: string): string {
  if (!studentClass) return '00';
  
  const classStr = studentClass.toLowerCase();
  
  const unebMatch = classStr.match(/s(\d)/);
  if (unebMatch) return `S${unebMatch[1]}`;
  
  const cambridgeMatch = classStr.match(/year\s*(\d+)/);
  if (cambridgeMatch) return `Y${cambridgeMatch[1]}`;
  
  const numberMatch = classStr.match(/(\d+)/);
  return numberMatch ? `C${numberMatch[1]}` : '00';
}

function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase  
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%'[Math.floor(Math.random() * 5)]; // Special char
  
  // Fill remaining length
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Automatically enroll the student in all compulsory subjects for their program/level
async function enrollInCompulsorySubjects(userId: string, programId: string, levelId: string) {
  // 1. Find all compulsory subject_offerings for this program/level
  const { data: offerings, error } = await supabase
    .from('subject_offerings')
    .select('id')
    .eq('program_id', programId)
    .eq('level_id', levelId)
    .eq('is_compulsory', true);

  if (error) {
    console.error('Error fetching compulsory subject offerings:', error);
    return;
  }

  if (!offerings || offerings.length === 0) {
    console.log('No compulsory subject offerings found for this program/level.');
    return;
  }

  // 2. Insert enrollments (skip if already enrolled)
  const enrollments = offerings.map(o => ({
    user_id: userId,
    subject_offering_id: o.id,
    enrollment_date: new Date().toISOString(),
    status: 'active'
  }));

  // Use upsert to avoid duplicates (if supported), or insert and ignore conflicts
  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert(enrollments, { onConflict: ['user_id', 'subject_offering_id'] });

  if (enrollError) {
    console.error('Error enrolling in compulsory subjects:', enrollError);
  } else {
    console.log('Student auto-enrolled in compulsory subjects.');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase.types';

function getSupabaseWithAuth(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY) as string;
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!supabaseUrl || !anonKey) throw new Error('Supabase env not configured');
  const supabase = createClient<Database>(supabaseUrl, anonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
  return { supabase, token };
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, token } = getSupabaseWithAuth(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData();
    const action = String(form.get('action') || 'upload');
    const assessmentId = String(form.get('assessmentId') || '');

    // Guard: require assessmentId for actions other than cancel
    if (action !== 'cancel' && !assessmentId) {
      return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 });
    }

    // Helper: check if a submission already exists for this student and assessment
    const checkAlreadySubmitted = async () => {
      const { data: existing, error: checkError } = await supabase
        .from('submissions')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('student_id', user.id)
        .limit(1);
      if (checkError) return false;
      return Array.isArray(existing) && existing.length > 0;
    };

    // Helper: check if past deadline
    const isPastDeadline = async () => {
      const { data: assess, error: assessError } = await supabase
        .from('assessments')
        .select('due_date')
        .eq('id', assessmentId)
        .single();
      if (assessError) return false;
      if (!assess?.due_date) return false;
      const now = new Date();
      const due = new Date(assess.due_date as any);
      return now > due;
    };

    if (action === 'confirm') {
      const filePath = String(form.get('filePath') || '');
      if (!assessmentId || !filePath) return NextResponse.json({ error: 'Missing assessmentId or filePath' }, { status: 400 });

      // Block late confirmations; clean up uploaded file
      if (await isPastDeadline()) {
        await supabase.storage.from('students_submissions').remove([filePath]).catch(() => {});
        return NextResponse.json({ error: 'Submission deadline has passed.' }, { status: 403 });
      }

      // Prevent duplicate confirmation; also clean up uploaded file if duplicate
      const alreadySubmitted = await checkAlreadySubmitted();
      if (alreadySubmitted) {
        await supabase.storage.from('students_submissions').remove([filePath]).catch(() => {});
        return NextResponse.json({ error: 'You have already submitted this assignment.' }, { status: 409 });
      }
      // Insert submission record into student_submissions (renamed logical table)
      const { error: insertError } = await supabase.from('submissions').insert({
        assessment_id: assessmentId,
        student_id: user.id,
        submission_url: filePath,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      } as any);
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'cancel') {
      const filePath = String(form.get('filePath') || '');
      if (!filePath) return NextResponse.json({ ok: true });
      await supabase.storage.from('students_submissions').remove([filePath]).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    // action === 'upload'
    const file = form.get('file') as unknown as File | null;
    if (!assessmentId || !file) return NextResponse.json({ error: 'Missing assessmentId or file' }, { status: 400 });

    // Block upload if deadline passed
    if (await isPastDeadline()) {
      return NextResponse.json({ error: 'Submission deadline has passed.' }, { status: 403 });
    }

    // Block upload if already submitted
    const alreadySubmitted = await checkAlreadySubmitted();
    if (alreadySubmitted) {
      return NextResponse.json({ error: 'You have already submitted this assignment.' }, { status: 409 });
    }

    const originalName = (file as File).name || 'answersheet.pdf';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectPath = `${user.id}/${assessmentId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('students_submissions')
      .upload(objectPath, file as File, { contentType: (file as File).type || 'application/octet-stream', upsert: true });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    return NextResponse.json({ ok: true, filePath: objectPath, fileName: originalName });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, token } = getSupabaseWithAuth(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: { user } } = await supabase.auth.getUser();

    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    // Ensure the requester is the owner by checking the prefix
    if (user && !path.startsWith(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase.storage.from('students_submissions').createSignedUrl(path, 60 * 10);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ signedUrl: data?.signedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to sign URL' }, { status: 500 });
  }
}



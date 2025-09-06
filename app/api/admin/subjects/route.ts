import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is properly configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { subject_id, name, description, papers, deletePaperIds } = body as {
      subject_id?: string;
      name: string;
      description?: string | null;
      papers?: Array<{
        paper_code: string;
        paper_name: string;
        paper_type?: string | null;
        max_marks?: number | null;
        description?: string | null;
      }>;
      deletePaperIds?: string[];
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    if (subject_id) {
      const { error: updateError } = await supabase
        .from('subjects')
        .update({ name: name.trim(), description: description ?? null })
        .eq('subject_id', subject_id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      // Handle deletions of existing papers if requested
      if (Array.isArray(deletePaperIds) && deletePaperIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('subject_papers')
          .delete()
          .in('paper_id', deletePaperIds);
        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }
      }

      if (Array.isArray(papers) && papers.length > 0) {
        const papersToInsert = papers
          .filter(p => p.paper_code?.trim() && p.paper_name?.trim())
          .map(p => ({
            subject_id,
            paper_code: p.paper_code.trim(),
            paper_name: p.paper_name.trim(),
            paper_type: p.paper_type?.trim() || null,
            max_marks: p.max_marks ?? null,
            description: (p.description ?? '').trim() || null,
          }));

        if (papersToInsert.length) {
          const { error: papersError } = await supabase
            .from('subject_papers')
            .insert(papersToInsert);
          if (papersError) {
            return NextResponse.json({ error: papersError.message }, { status: 400 });
          }
        }
      }

      return NextResponse.json({ subject_id });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('subjects')
      .insert([{ name: name.trim(), description: description ?? null }])
      .select('subject_id')
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    const newSubjectId = inserted?.subject_id;

    if (newSubjectId && Array.isArray(papers) && papers.length > 0) {
      const papersToInsert = papers
        .filter(p => p.paper_code?.trim() && p.paper_name?.trim())
        .map(p => ({
          subject_id: newSubjectId,
          paper_code: p.paper_code.trim(),
          paper_name: p.paper_name.trim(),
          paper_type: p.paper_type?.trim() || null,
          max_marks: p.max_marks ?? null,
          description: (p.description ?? '').trim() || null,
        }));

      if (papersToInsert.length) {
        const { error: papersError } = await supabase
          .from('subject_papers')
          .insert(papersToInsert);
        if (papersError) {
          return NextResponse.json({ error: papersError.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ subject_id: newSubjectId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

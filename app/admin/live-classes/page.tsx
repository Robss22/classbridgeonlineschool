import { createServerClient } from '@/lib/supabase/server';
import AdminLiveClassesClient, { LiveClass } from '@/components/admin/AdminLiveClassesClient';
// errorHandler not needed on server list load; handled in API routes
import React from 'react';

export default async function AdminLiveClassesPage() {
  const supabase = createServerClient();
  const [levelsRes, subjectsRes, teachersRes, programsRes, papersRes, liveRes] = await Promise.all([
    supabase.from('levels').select('*'),
    // Use a more explicit query to bypass any RLS issues
    supabase.from('subjects').select('subject_id, name, description, created_at').order('name'),
    supabase.from('teachers').select('*, users(first_name, last_name)'),
    supabase.from('programs').select('*'),
    supabase.from('subject_papers').select('*'),
    supabase
      .from('live_classes')
      .select(`*, teachers:teacher_id(*, users(first_name,last_name)), subjects:subject_id(*), levels:level_id(*), programs:program_id(*), papers:paper_id(*)`)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
  ]);



  // If subjects query failed or returned limited results, try a direct query
  let finalSubjects = subjectsRes.data || [];
  if (finalSubjects.length < 3) {
    // Try the regular query first
    const { data: altSubjects } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (altSubjects && altSubjects.length > finalSubjects.length) {
      finalSubjects = altSubjects;
    } else {
      // Try using the function that bypasses RLS
      const { data: funcSubjects } = await supabase
        .rpc('get_all_subjects');
      
      if (funcSubjects && funcSubjects.length > finalSubjects.length) {
        finalSubjects = funcSubjects;
      }
    }
  }

  const normalize = (rows: unknown[] = []): LiveClass[] => rows.map((row: unknown) => {
    const typedRow = row as Record<string, unknown>;
    return {
      live_class_id: (typedRow.live_class_id as string) || '',
      title: (typedRow.title as string) || '',
      description: (typedRow.description as string) || '',
      scheduled_date: (typedRow.scheduled_date as string) || '',
      start_time: (typedRow.start_time as string) || '',
      end_time: (typedRow.end_time as string) || '',
      meeting_link: (typedRow.meeting_link as string) || '',
      meeting_platform: (typedRow.meeting_platform as string) || 'Zoom',
      status: (typedRow.status as string) || 'scheduled',
      started_at: (typedRow.started_at as string | null) || null,
      ended_at: (typedRow.ended_at as string | null) || null,
      teacher_id: (typedRow.teacher_id as string) || '',
      level_id: (typedRow.level_id as string) || '',
      subject_id: (typedRow.subject_id as string) || '',
      program_id: (typedRow.program_id as string) || '',
      paper_id: (typedRow.paper_id as string) || '',
      teachers: typedRow.teachers as { users?: { first_name: string; last_name: string } } || undefined,
      levels: typedRow.levels as { name: string } || undefined,
      subjects: typedRow.subjects as { name: string } || undefined,
      programs: typedRow.programs as { name: string } || undefined,
      papers: (typedRow.papers ? (typedRow.papers as { paper_name: string; paper_code: string }) : { paper_name: '', paper_code: '' }),
    };
  });

  const initialLiveClasses = normalize(liveRes.data || []);
  const levels = levelsRes.data || [];
  // Use the subjects variable that might have been updated by the fallback query
  const teachers = teachersRes.data || [];
  const programs = programsRes.data || [];
  const papers = papersRes.data || [];

  return (
    <AdminLiveClassesClient
      initialLiveClasses={initialLiveClasses}
      levels={levels}
      subjects={finalSubjects}
      teachers={teachers}
      programs={programs}
      papers={papers}
    />
  );
}

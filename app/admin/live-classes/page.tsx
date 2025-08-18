import { createServerClient } from '@/lib/supabase/server';
import AdminLiveClassesClient, { LiveClass } from '@/components/admin/AdminLiveClassesClient';
// errorHandler not needed on server list load; handled in API routes
import React from 'react';

export default async function AdminLiveClassesPage() {
  const supabase = createServerClient();
  const [levelsRes, subjectsRes, teachersRes, programsRes, papersRes, liveRes] = await Promise.all([
    supabase.from('levels').select('*'),
    supabase.from('subjects').select('*'),
    supabase.from('teachers').select('*, users(first_name, last_name)'),
    supabase.from('programs').select('*'),
    supabase.from('subject_papers').select('*'),
    supabase
      .from('live_classes')
      .select(`*, teachers:teacher_id(*, users(first_name,last_name)), subjects:subject_id(*), levels:level_id(*), programs:program_id(*), papers:paper_id(*)`)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
  ]);

  const normalize = (rows: any[] = []): LiveClass[] => rows.map((row: any) => ({
    live_class_id: row.live_class_id ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    scheduled_date: row.scheduled_date ?? '',
    start_time: row.start_time ?? '',
    end_time: row.end_time ?? '',
    meeting_link: row.meeting_link ?? '',
    meeting_platform: row.meeting_platform ?? 'Zoom',
    status: row.status ?? 'scheduled',
    started_at: row.started_at ?? null,
    ended_at: row.ended_at ?? null,
    teacher_id: row.teacher_id ?? '',
    level_id: row.level_id ?? '',
    subject_id: row.subject_id ?? '',
    program_id: row.program_id ?? '',
    paper_id: row.paper_id ?? '',
    teachers: row.teachers ?? undefined,
    levels: row.levels ?? undefined,
    subjects: row.subjects ?? undefined,
    programs: row.programs ?? undefined,
    papers: row.papers ?? undefined,
  }));

  const initialLiveClasses = normalize(liveRes.data || []);
  const levels = levelsRes.data || [];
  const subjects = subjectsRes.data || [];
  const teachers = teachersRes.data || [];
  const programs = programsRes.data || [];
  const papers = papersRes.data || [];

  return (
    <AdminLiveClassesClient
      initialLiveClasses={initialLiveClasses}
      levels={levels}
      subjects={subjects}
      teachers={teachers}
      programs={programs}
      papers={papers}
    />
  );
}

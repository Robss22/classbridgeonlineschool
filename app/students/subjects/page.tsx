// app/students/subjects/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Subject = {
  subject_id: string;
  name: string;
};

type Program = {
  program_id: string;
  name: string;
};

type SubjectOffering = {
  id: string;
  is_compulsory: boolean;
  subjects: Subject;
  programs?: Program;
  teacher?: string;
};

type EnrolledOptional = {
  subject_offering_id: string;
  subject_offerings: SubjectOffering;
};

export default function MySubjectsPage() {

  const [compulsorySubjects, setCompulsorySubjects] = useState<SubjectOffering[]>([]);
  const [optionalSubjects, setOptionalSubjects] = useState<EnrolledOptional[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user?.id) return;
      const userId = authUser.user.id;

      // Get student's program from users table
      const { data: userRow } = await supabase
        .from('users')
        .select('curriculum')
        .eq('id', userId)
        .single();
      const programId = (userRow as any)?.curriculum as string | undefined;

      // 3. Get compulsory subjects
      const { data: compulsory } = await supabase
        .from('subject_offerings')
        .select(`
          id,
          is_compulsory,
          teacher,
          subjects (
            subject_id,
            name
          ),
          programs (
            program_id,
            name
          )
        `)
        .eq('program_id', programId || '')
        .eq('is_compulsory', true);

      // Only keep valid SubjectOffering objects, skip error objects
      const validCompulsory: SubjectOffering[] = (compulsory || [])
        .filter((s: any) =>
          !s?.error &&
          typeof s?.id === 'string' &&
          typeof s?.is_compulsory === 'boolean' &&
          s?.subjects && typeof s.subjects.name === 'string'
        )
        .map((s: any) => ({
          id: s.id,
          is_compulsory: s.is_compulsory,
          subjects: s.subjects,
          programs: s.programs,
          teacher: s.teacher
        }));
      setCompulsorySubjects(validCompulsory);

      // 4. Get optional subjects the student enrolled in
      const { data: optional } = await supabase
        .from('enrollments')
        .select(`
          subject_offering_id,
          subject_offerings:subject_offering_id (
            id,
            is_compulsory,
            teacher,
            subjects:subject_id (
              subject_id,
              name
            ),
            programs:program_id (
              program_id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Only keep valid EnrolledOptional objects, skip error objects and null ids
      const validOptional: EnrolledOptional[] = (optional || [])
        .filter((entry: any) =>
          typeof entry?.subject_offering_id === 'string' &&
          entry.subject_offering_id &&
          entry.subject_offerings &&
          !entry.subject_offerings.error &&
          typeof entry.subject_offerings.id === 'string' &&
          entry.subject_offerings.subjects && typeof entry.subject_offerings.subjects.name === 'string'
        )
        .map((entry: any) => ({
          subject_offering_id: entry.subject_offering_id,
          subject_offerings: entry.subject_offerings
        }));
      setOptionalSubjects(validOptional);
    };

    fetchSubjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">My Subjects</h1>

        <div>
          <h2 className="text-xl font-semibold mb-2">Compulsory Subjects</h2>
          <ul className="space-y-2">
            {compulsorySubjects.map((subject) => (
              <li
                key={subject.id}
                className="p-4 bg-white rounded shadow-sm border border-gray-200"
              >
                <div className="font-medium text-lg">{subject.subjects.name}</div>
                <div className="text-sm text-gray-600">
                  Program: {subject.programs?.name}
                </div>
                <div className="text-sm text-gray-600">
                  Teacher: {subject.teacher ?? 'TBA'}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Optional Subjects</h2>
          <ul className="space-y-2">
            {optionalSubjects.map((entry) => (
              <li
                key={entry.subject_offering_id}
                className="p-4 bg-white rounded shadow-sm border border-gray-200"
              >
                <div className="font-medium text-lg">{entry.subject_offerings.subjects.name}</div>
                <div className="text-sm text-gray-600">
                  Program: {entry.subject_offerings.programs?.name}
                </div>
                <div className="text-sm text-gray-600">
                  Teacher: {entry.subject_offerings.teacher ?? 'TBA'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

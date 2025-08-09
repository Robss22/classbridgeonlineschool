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
      const {
        data: user,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user.user) return;

      const userId = user.user.id;

      // 1. Get student's class_id from extended_users table
      const { data: userDetails, error: userDetailsError } = await supabase
        .from('users_extended')
        .select('class_id')
        .eq('user_id', userId)
        .single();

      if (userDetailsError || !userDetails) return;

      const classId = userDetails.class_id;

      // 2. Get the program_id from the classes table
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('program_id')
        .eq('id', classId)
        .single();

      if (classError || !classInfo) return;

      const programId = classInfo.program_id;

      // 3. Get compulsory subjects
      const { data: compulsory, error: compulsoryError } = await supabase
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
        .eq('program_id', programId)
        .eq('is_compulsory', true);

      if (!compulsoryError && compulsory) {
        setCompulsorySubjects(compulsory as SubjectOffering[]);
      }

      // 4. Get optional subjects the student enrolled in
      const { data: optional, error: optionalError } = await supabase
        .from('enrolled_optionals')
        .select(`
          subject_offering_id,
          subject_offerings (
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
          )
        `)
        .eq('user_id', userId);

      if (!optionalError && optional) {
        setOptionalSubjects(optional as EnrolledOptional[]);
      }
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

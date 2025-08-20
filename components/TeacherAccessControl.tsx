'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface TeacherAssignment {
  subject_id: string;
  level_id: string;
  program_id: string;
  subject_name: string;
  level_name: string;
  program_name: string;
}

interface TeacherAccessControlProps {
  children: (data: {
    teacherAssignments: TeacherAssignment[];
    availablePrograms: Array<{ program_id: string; name: string }>;
    availableLevels: Array<{ level_id: string; name: string; program_id?: string }>;
    availableSubjects: Array<{ subject_id: string; name: string }>;
    isLoading: boolean;
    error: string | null;
  }) => React.ReactNode;
}

export default function TeacherAccessControl({ children }: TeacherAccessControlProps) {
  const { user } = useAuth();
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Array<{ program_id: string; name: string }>>([]);
  const [availableLevels, setAvailableLevels] = useState<Array<{ level_id: string; name: string; program_id?: string }>>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Array<{ subject_id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeacherAccess() {
      if (!user || (user.role !== 'teacher' && user.role !== 'class_tutor')) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get teacher_id from teachers table
        const { data: teacherRecord, error: teacherError } = await supabase
          .from('teachers')
          .select('teacher_id')
          .eq('user_id', user?.id ?? '')
          .single();

        if (teacherError) {
          console.error('Error fetching teacher record:', teacherError);
          setError('Failed to load teacher assignments');
          setIsLoading(false);
          return;
        }

        // Fetch teacher assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('teacher_assignments')
          .select(`
            subject_id,
            level_id,
            program_id,
            subjects:subject_id (name),
            levels:level_id (name),
            programs:program_id (name)
          `)
          .eq('teacher_id', teacherRecord.teacher_id);

        if (assignmentsError) {
          console.error('Error fetching teacher assignments:', assignmentsError);
          setError('Failed to load teacher assignments');
          setIsLoading(false);
          return;
        }

        // Process assignments
        const processedAssignments: TeacherAssignment[] = [];
        const uniquePrograms = new Set<string>();
        const uniqueLevels = new Set<string>();
        const uniqueSubjects = new Set<string>();

        (assignments || []).forEach((assignment: Record<string, unknown>) => {
          const subjectsRel = assignment.subjects as { name?: string } | Array<{ name?: string }> | undefined;
          const levelsRel = assignment.levels as { name?: string } | Array<{ name?: string }> | undefined;
          const programsRel = assignment.programs as { name?: string } | Array<{ name?: string }> | undefined;
          const subjectName = Array.isArray(subjectsRel) ? subjectsRel[0]?.name : subjectsRel?.name;
          const levelName = Array.isArray(levelsRel) ? levelsRel[0]?.name : levelsRel?.name;
          const programName = Array.isArray(programsRel) ? programsRel[0]?.name : programsRel?.name;

          if (subjectName && levelName) {
            processedAssignments.push({
              subject_id: String(assignment.subject_id || ''),
              level_id: String(assignment.level_id || ''),
              program_id: String(assignment.program_id || ''),
              subject_name: subjectName,
              level_name: levelName,
              program_name: programName || '',
            });

            if (assignment.program_id) uniquePrograms.add(String(assignment.program_id));
            if (assignment.level_id) uniqueLevels.add(String(assignment.level_id));
            if (assignment.subject_id) uniqueSubjects.add(String(assignment.subject_id));
          }
        });

        setTeacherAssignments(processedAssignments);

        // Fetch available programs, levels, and subjects based on assignments
        // Defensive: filter out null/undefined program_ids
        const validProgramIds = Array.from(uniquePrograms).filter(Boolean);
        if (validProgramIds.length > 0) {
          const { data: programsData } = await supabase
            .from('programs')
            .select('program_id, name')
            .in('program_id', validProgramIds);
          setAvailablePrograms(programsData || []);
        } else {
          setAvailablePrograms([]);
        }

        if (uniqueLevels.size > 0) {
          const { data: levelsData } = await supabase
            .from('levels')
            .select('level_id, name, program_id')
            .in('level_id', Array.from(uniqueLevels));
          setAvailableLevels((levelsData || []).map(level => ({
            level_id: level.level_id,
            name: level.name,
            program_id: level.program_id || ''
          })));
        }

        if (uniqueSubjects.size > 0) {
          const { data: subjectsData } = await supabase
            .from('subjects')
            .select('subject_id, name')
            .in('subject_id', Array.from(uniqueSubjects));
          setAvailableSubjects(subjectsData || []);
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load access control data';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTeacherAccess();
  }, [user]);

  return (
    <>
      {children({
        teacherAssignments,
        availablePrograms,
        availableLevels,
        availableSubjects,
        isLoading,
        error,
      })}
    </>
  );
} 
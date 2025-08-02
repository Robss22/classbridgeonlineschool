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
    availablePrograms: any[];
    availableLevels: any[];
    availableSubjects: any[];
    isLoading: boolean;
    error: string | null;
  }) => React.ReactNode;
}

export default function TeacherAccessControl({ children }: TeacherAccessControlProps) {
  const { user } = useAuth();
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [availableLevels, setAvailableLevels] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
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
          .eq('user_id', user.id)
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

        (assignments || []).forEach((assignment: any) => {
          const subjectName = Array.isArray(assignment.subjects) 
            ? assignment.subjects[0]?.name 
            : assignment.subjects?.name;
          const levelName = Array.isArray(assignment.levels) 
            ? assignment.levels[0]?.name 
            : assignment.levels?.name;
          const programName = Array.isArray(assignment.programs) 
            ? assignment.programs[0]?.name 
            : assignment.programs?.name;

          if (subjectName && levelName) {
            processedAssignments.push({
              subject_id: assignment.subject_id,
              level_id: assignment.level_id,
              program_id: assignment.program_id,
              subject_name: subjectName,
              level_name: levelName,
              program_name: programName || '',
            });

            uniquePrograms.add(assignment.program_id);
            uniqueLevels.add(assignment.level_id);
            uniqueSubjects.add(assignment.subject_id);
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
          setAvailableLevels(levelsData || []);
        }

        if (uniqueSubjects.size > 0) {
          const { data: subjectsData } = await supabase
            .from('subjects')
            .select('subject_id, name')
            .in('subject_id', Array.from(uniqueSubjects));
          setAvailableSubjects(subjectsData || []);
        }

      } catch (err: any) {
        console.error('Error in TeacherAccessControl:', err);
        setError(err.message || 'Failed to load access control data');
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
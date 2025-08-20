'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

interface TeacherAssignment {
  subject_id: string;
  level_id: string;
  subject_name: string;
  level_name: string;
  program_name: string;
}

interface TeacherContextType {
  assignments: TeacherAssignment[];
  subjects: string[];
  levels: string[];
  programs: string[];
  loading: boolean;
  error: string | null;
  refreshAssignments: () => Promise<void>;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get teacher record to find their assigned programs
      const { data: teacherRecord, error: teacherError } = await supabase
        .from('teachers')
        .select(`
          teacher_id,
          programs:program_id (name)
        `)
        .eq('user_id', user.id)
        .single();

      if (teacherError) {
        console.error('Error fetching teacher record:', teacherError);
        setError('Failed to fetch teacher information');
        return;
      }

      if (!teacherRecord) {
        console.log('No teacher record found for user:', user.id);
        setAssignments([]);
        setSubjects([]);
        setLevels([]);
        setPrograms([]);
        return;
      }

      console.log('🔍 [TeacherContext] Teacher record:', teacherRecord);

      // Fetch assignments for this teacher
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('teacher_assignments')
        .select(`
          subject_id,
          level_id,
          subjects:subject_id (name),
          levels:level_id (name),
          programs:program_id (name)
        `)
        .eq('teacher_id', teacherRecord.teacher_id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        setError('Failed to fetch assignments');
        return;
      }

      console.log('🔍 [TeacherContext] Raw assignments data:', assignmentsData);

      // Helper functions to extract names from joined data
      const getSubjectName = (subjects: Record<string, unknown>): string | undefined => {
        if (Array.isArray(subjects) && subjects.length > 0) {
          return (subjects[0] as Record<string, unknown>)?.name as string;
        }
        return (subjects as Record<string, unknown>)?.name as string;
      };
      
      const getLevelName = (levels: Record<string, unknown>): string | undefined => {
        if (Array.isArray(levels) && levels.length > 0) {
          return (levels[0] as Record<string, unknown>)?.name as string;
        }
        return (levels as Record<string, unknown>)?.name as string;
      };
      
      const getProgramName = (programs: Record<string, unknown>): string | undefined => {
        if (Array.isArray(programs) && programs.length > 0) {
          return (programs[0] as Record<string, unknown>)?.name as string;
        }
        return (programs as Record<string, unknown>)?.name as string;
      };

      // Process assignments to extract unique subjects, levels, and programs
      const processedAssignments: Array<Record<string, unknown>> = [];
      const uniqueSubjects = new Set<string>();
      const uniqueLevels = new Set<string>();
      const uniquePrograms = new Set<string>();

      (assignmentsData || []).forEach((assignment: Record<string, unknown>, index: number) => {
        const subjectName = getSubjectName(assignment.subjects as Record<string, unknown>);
        const levelName = getLevelName(assignment.levels as Record<string, unknown>);
        const programName = getProgramName(assignment.programs as Record<string, unknown>);

        console.log(`🔍 [TeacherContext] Extracted names - Subject: ${subjectName}, Level: ${levelName}, Program: ${programName}`);

        if (subjectName && levelName) {
          processedAssignments.push({
            subject_id: assignment.subject_id,
            level_id: assignment.level_id,
            subject_name: subjectName,
            level_name: levelName,
            program_name: programName || ((teacherRecord?.programs as Record<string, unknown>)?.name as string) || '',
          });

          uniqueSubjects.add(subjectName);
          uniqueLevels.add(levelName);
          if (programName) {
            uniquePrograms.add(programName);
            console.log(`🔍 [TeacherContext] Added program from assignment: ${programName}`);
          }
          console.log(`🔍 [TeacherContext] Added to sets - Subject: ${subjectName}, Level: ${levelName}`);
        } else {
          console.log(`🔍 [TeacherContext] Skipping assignment ${index} - missing names`);
        }
      });

      console.log('🔍 [TeacherContext] Final results:', {
        processedAssignments: processedAssignments.length,
        uniqueSubjects: Array.from(uniqueSubjects),
        uniqueLevels: Array.from(uniqueLevels),
        uniquePrograms: Array.from(uniquePrograms)
      });

      setAssignments(processedAssignments as unknown as TeacherAssignment[]);
      setSubjects(Array.from(uniqueSubjects));
      setLevels(Array.from(uniqueLevels));
      setPrograms(Array.from(uniquePrograms));

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage || 'Failed to fetch assignments');
      console.error('Error fetching teacher assignments:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshAssignments = useCallback(async () => {
    await fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'class_tutor')) {
      fetchAssignments();
    } else if (user) {
      // For non-teacher users (like admins), set empty arrays and skip API calls
      setAssignments([]);
      setSubjects([]);
      setLevels([]);
      setPrograms([]);
      setLoading(false);
      setError(null);
    }
  }, [user, fetchAssignments]);

  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => ({
    assignments,
    subjects,
    levels,
    programs,
    loading,
    error,
    refreshAssignments,
  }), [
    assignments,
    subjects,
    levels,
    programs,
    loading,
    error,
    refreshAssignments,
  ]);

  return (
    <TeacherContext.Provider value={memoizedValue}>
      {children}
    </TeacherContext.Provider>
  );
}

export function useTeacher() {
  const context = useContext(TeacherContext);
  if (context === undefined) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
} 
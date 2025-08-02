'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function TeacherProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!user || user.role !== 'teacher' && user.role !== 'class_tutor') {
      console.log('🔍 [TeacherContext] User is not a teacher:', user?.role);
      setAssignments([]);
      setSubjects([]);
      setLevels([]);
      setPrograms([]);
      return;
    }

    console.log('🔍 [TeacherContext] Fetching assignments for teacher:', user.id);
    setLoading(true);
    setError(null);

    try {
      // First, get the teacher_id from the teachers table
      console.log('🔍 [TeacherContext] Getting teacher_id for user:', user.id);
      const { data: teacherRecord, error: teacherRecordError } = await supabase
        .from('teachers')
        .select(`
          teacher_id,
          program_id,
          programs:program_id (name)
        `)
        .eq('user_id', user.id)
        .single();

      console.log('🔍 [TeacherContext] Teacher record:', teacherRecord, 'Error:', teacherRecordError);

      if (teacherRecordError) {
        console.warn('Error fetching teacher record:', teacherRecordError);
        setAssignments([]);
        setSubjects([]);
        setLevels([]);
        setPrograms([]);
        setLoading(false);
        return;
      }

      // Fetch teacher assignments using teacher_id
      console.log('🔍 [TeacherContext] Fetching teacher assignments for teacher_id:', teacherRecord.teacher_id);
      const { data: teacherAssignments, error: assignmentError } = await supabase
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

      console.log('🔍 [TeacherContext] Teacher assignments:', teacherAssignments, 'Error:', assignmentError);

      if (assignmentError) {
        console.warn('Error fetching teacher assignments:', assignmentError);
      }

      // Process assignments
      const processedAssignments: TeacherAssignment[] = [];
      const uniqueSubjects = new Set<string>();
      const uniqueLevels = new Set<string>();
      const uniquePrograms = new Set<string>();

      // Add teacher's program
      if ((teacherRecord?.programs as any)?.name) {
        uniquePrograms.add((teacherRecord.programs as any).name);
        console.log('🔍 [TeacherContext] Added program:', (teacherRecord.programs as any).name);
      }

      // Process teacher assignments
      console.log('🔍 [TeacherContext] Processing', teacherAssignments?.length || 0, 'teacher assignments');
      (teacherAssignments || []).forEach((assignment: any, index: number) => {
        console.log(`🔍 [TeacherContext] Processing assignment ${index}:`, assignment);
        
        // Handle joined data with explicit type checking
        const getSubjectName = (subjects: any): string | undefined => {
          if (Array.isArray(subjects) && subjects.length > 0) {
            return subjects[0]?.name;
          }
          return subjects?.name;
        };
        
        const getLevelName = (levels: any): string | undefined => {
          if (Array.isArray(levels) && levels.length > 0) {
            return levels[0]?.name;
          }
          return levels?.name;
        };
        
        const getProgramName = (programs: any): string | undefined => {
          if (Array.isArray(programs) && programs.length > 0) {
            return programs[0]?.name;
          }
          return programs?.name;
        };
        
        const subjectName = getSubjectName(assignment.subjects);
        const levelName = getLevelName(assignment.levels);
        const programName = getProgramName(assignment.programs);

        console.log(`🔍 [TeacherContext] Extracted names - Subject: ${subjectName}, Level: ${levelName}, Program: ${programName}`);

        if (subjectName && levelName) {
          processedAssignments.push({
            subject_id: assignment.subject_id,
            level_id: assignment.level_id,
            subject_name: subjectName,
            level_name: levelName,
            program_name: programName || (teacherRecord?.programs as any)?.name || '',
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

      setAssignments(processedAssignments);
      setSubjects(Array.from(uniqueSubjects));
      setLevels(Array.from(uniqueLevels));
      setPrograms(Array.from(uniquePrograms));

    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
      console.error('Error fetching teacher assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAssignments = async () => {
    await fetchAssignments();
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const value: TeacherContextType = {
    assignments,
    subjects,
    levels,
    programs,
    loading,
    error,
    refreshAssignments,
  };

  return (
    <TeacherContext.Provider value={value}>
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
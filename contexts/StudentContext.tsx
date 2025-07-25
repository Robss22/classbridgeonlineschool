'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assuming this is correctly configured
import { BookOpen } from 'lucide-react';

// Define a type for the student information coming from StudentContext
// This interface MUST match the 'Student' interface defined in your StudentContext.tsx
interface StudentInfo {
  id: string;
  class: string;
  registration_number: string;
  program: string; // This will be the program NAME (e.g., "General Studies")
  program_id: string;
  level_id: string;
  name: string; // This will be the student's full display name
  email: string;
  photoUrl: string;
}

const StudentContext = createContext<any>(null);

export function useStudent() {
  return useContext(StudentContext);
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  console.log("StudentProvider mounted");
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    id: '',
    class: '',
    registration_number: '',
    program: '',
    program_id: '',
    level_id: '',
    name: '',
    email: '',
    photoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [studentError, setStudentError] = useState('');

  useEffect(() => {
    async function fetchStudentInfo() {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setStudentError('No user found or error: ' + (userError?.message || userError));
        console.log("No user found or error:", userError);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      if (error || !data) {
        setStudentError('Error fetching user profile: ' + (error?.message || error));
        console.log("Error fetching user profile:", error);
        setLoading(false);
        return;
      }
      setStudentInfo({
        id: data.id,
        class: data.class || '',
        registration_number: data.registration_number || '',
        program: data.curriculum || '',
        program_id: data.program_id || '',
        level_id: data.level_id || '',
        name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email || '',
        photoUrl: data.photoUrl || '',
      });
      setLoading(false);
      console.log("Fetched user info:", data);
    }
    fetchStudentInfo();
  }, []);

  if (studentError) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">{studentError}</div>;
  }

  return (
    <StudentContext.Provider value={{ studentInfo, loadingStudent: loading }}>
      {children}
    </StudentContext.Provider>
  );
}

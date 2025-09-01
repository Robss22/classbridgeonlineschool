'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assuming this is correctly configured
import { getUserFriendlyErrorMessage, logTechnicalError } from '../utils/errorHandler';

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

type StudentContextValue = {
  studentInfo: StudentInfo;
  loadingStudent: boolean;
  setStudentPhotoUrl: (url: string) => void;
};

const StudentContext = createContext<StudentContextValue | null>(null);

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used within StudentProvider');
  return ctx;
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
        logTechnicalError(userError, 'StudentContext User Fetch');
        const userFriendlyMessage = getUserFriendlyErrorMessage(userError);
        setStudentError(userFriendlyMessage);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('id, class, registration_number, curriculum, email, full_name, first_name, last_name, program_id, level_id')
        .eq('email', user.email as string)
        .single();
      if (error || !data) {
        logTechnicalError(error, 'StudentContext Profile Fetch');
        const userFriendlyMessage = getUserFriendlyErrorMessage(error);
        setStudentError(userFriendlyMessage);
        setLoading(false);
        return;
      }
      // Try to resolve avatar from storage (list folder and use first profile.* file)
      let photoUrl = '';
      try {
        const { data: fileList } = await supabase.storage.from('avatars').list(user.id, { limit: 25 });
        const profileFile = (fileList || []).find(f => /^profile\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name));
        if (profileFile) {
          const attemptPath = `${user.id}/${profileFile.name}`;
          const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(attemptPath);
          if (publicData?.publicUrl) photoUrl = `${publicData.publicUrl}?v=${Date.now()}`;
        }
      } catch { /* ignore */ }

      setStudentInfo({
        id: data.id,
        class: data.class || '',
        registration_number: data.registration_number || '',
        program: data.curriculum || '',
        program_id: data.program_id || '',
        level_id: data.level_id || '',
        name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email || '',
        photoUrl,
      });
      setLoading(false);
      console.log("Fetched user info:", data);
    }
    fetchStudentInfo();
  }, []);

  if (studentError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-600 text-lg mb-4">{studentError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const setStudentPhotoUrl = (url: string) => {
    setStudentInfo((prev) => ({ ...prev, photoUrl: url }));
  };

  return (
    <StudentContext.Provider value={{ studentInfo, loadingStudent: loading, setStudentPhotoUrl }}>
      {children}
    </StudentContext.Provider>
  );
}

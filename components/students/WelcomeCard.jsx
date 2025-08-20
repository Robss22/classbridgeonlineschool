import React from 'react';
import Image from 'next/image';
import { useStudent } from '@/contexts/StudentContext';

export default function WelcomeCard() {
  const { studentInfo, loadingStudent } = useStudent();
  
  // WelcomeCard render - studentInfo
  // WelcomeCard render - loadingStudent
  
  if (loadingStudent) {
    return (
      <div className="mb-4 sm:mb-6 flex items-center justify-center bg-white border border-blue-200 rounded-xl shadow px-3 sm:px-6 py-3 sm:py-4">
        <div className="animate-pulse text-gray-500">Loading student information...</div>
      </div>
    );
  }
  
  // Use the name directly from studentInfo (as defined in the interface)
  const displayName = studentInfo.name && 
                      studentInfo.name.trim() && 
                      studentInfo.name.trim() !== 'Student' 
     ? studentInfo.name.trim() 
     : 'Student';
  
  // WelcomeCard - Final displayName
  
  const { program, class: className, registration_number, email, photoUrl } = studentInfo;
  
  return (
    <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-blue-200 rounded-xl shadow px-3 sm:px-6 py-3 sm:py-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 break-words">
          Welcome back, <span className="text-green-800 font-extrabold">{displayName}</span> 👋
        </h1>
        <div className="text-gray-600 text-xs sm:text-sm">
          You are enrolled in: <span className="font-semibold text-blue-700">{program || '-'}</span> – <span className="font-semibold text-green-700">{className || '-'}</span>
        </div>
      </div>
      <div className="flex flex-col md:items-end text-xs sm:text-sm text-gray-700">
        <div className="mb-2 flex justify-end">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 border-2 border-blue-200 flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <Image src={photoUrl} alt="Profile" className="w-full h-full object-cover" width={64} height={64} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="mt-2"><span className="font-semibold">Reg. No:</span> {registration_number || '-'}</div>
        <div className="mt-1"><span className="font-semibold">Email:</span> {email || '-'}</div>
      </div>
    </div>
  );
}

// Alternative: Create a simpler header version if you need one in navigation
export function WelcomeHeader() {
  const { studentInfo, loadingStudent } = useStudent();
  
  if (loadingStudent) {
    return <div className="text-gray-500">Loading...</div>;
  }
  
  const displayName = studentInfo.name && 
                      studentInfo.name.trim() && 
                      studentInfo.name.trim() !== 'Student' 
     ? studentInfo.name.trim() 
     : 'Student';
  
  return (
    <span className="text-green-800 font-semibold">
      Welcome back, {displayName} 👋
    </span>
  );
}
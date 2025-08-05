'use client';
import React, { useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { User, Mail, Hash, BookOpen, Settings, Sun, Moon, Camera, Lock } from 'lucide-react';
import Image from 'next/image';

function Avatar({ name, photoUrl }) {
  if (photoUrl) {
    return <Image src={photoUrl} alt="Profile" width={80} height={80} className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 shadow" />;
  }
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  return <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-700 border-4 border-blue-200 shadow">{initials}</div>;
}

export default function ProfilePage() {
  const { studentInfo } = useStudent();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // Profile picture upload state (placeholder)
  const [profilePic, setProfilePic] = useState(studentInfo.photoUrl);
  // TODO: Add real upload logic

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-8">

      {/* Sidebar/Profile Card */}
      <div className="md:w-1/3 w-full bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4">
        <Avatar name={studentInfo.name} photoUrl={profilePic} />
        <div className="text-xl font-bold text-blue-900 flex items-center gap-2"><User className="w-5 h-5" /> {studentInfo.name}</div>
        <div className="text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4" /> {studentInfo.email}</div>
        <div className="text-gray-600 flex items-center gap-2"><Hash className="w-4 h-4" /> Reg. No: {studentInfo.registration_number}</div>
        <div className="text-gray-600 flex items-center gap-2"><BookOpen className="w-4 h-4" /> {studentInfo.class} – {studentInfo.program}</div>
        <div className="flex gap-2 mt-4">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors" onClick={() => setShowPasswordModal(true)}><Lock className="w-4 h-4" /> Change Password</button>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-900 font-semibold hover:bg-gray-300 transition-colors"><Sun className="w-4 h-4" /> Theme</button>
        </div>
      </div>
      {/* Main Panel: Profile Picture Upload Only */}
      <div className="md:w-2/3 w-full bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-blue-700" /><span className="text-xl font-bold">Profile Settings</span></div>
        <form className="space-y-4 max-w-lg">
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" value={studentInfo.name} disabled readOnly />
          </div>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" value={studentInfo.email} disabled readOnly />
          </div>
          {/* Profile picture upload */}
          <div>
            <label className="block font-medium mb-1">Profile Picture</label>
            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" id="profile-pic-upload" onChange={e => {
                // TODO: Add real upload logic
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setProfilePic(url);
                }
              }} />
              <label htmlFor="profile-pic-upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Camera className="w-5 h-5" /> Upload
              </label>
              {profilePic && <Image src={profilePic} alt="Preview" width={48} height={48} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" />}
            </div>
          </div>
        </form>
      </div>
      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowPasswordModal(false)}>&times;</button>
            <div className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-700" /> Change Password</div>
            {/* TODO: Add real password change logic and validation */}
            <form className="space-y-4">
              <div>
                <label className="block font-medium mb-1">New Password</label>
                <input type="password" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block font-medium mb-1">Confirm Password</label>
                <input type="password" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <button type="submit" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors w-full">Update Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

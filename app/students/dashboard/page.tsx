'use client';
import { useStudent } from '@/contexts/StudentContext';
import WelcomeCard from '@/components/students/WelcomeCard';
import { Calendar, Users, BookOpen, Megaphone } from 'lucide-react';

function TodaySchedule() {
  // Placeholder: Replace with real data fetch
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center mb-2"><Calendar className="w-5 h-5 mr-2 text-blue-600" /><span className="font-semibold">Today&apos;s Schedule</span></div>
      <div className="text-gray-600 text-sm">No classes scheduled for today.</div>
    </div>
  );
}

function TeachersAssigned() {
  // Placeholder: Replace with real data fetch
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center mb-2"><Users className="w-5 h-5 mr-2 text-green-600" /><span className="font-semibold">Teachers Assigned</span></div>
      <div className="text-gray-600 text-sm">Your subject teachers will appear here.</div>
    </div>
  );
}

function LatestResources() {
  // Placeholder: Replace with real data fetch
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center mb-2"><BookOpen className="w-5 h-5 mr-2 text-purple-600" /><span className="font-semibold">Latest Resources</span></div>
      <div className="text-gray-600 text-sm">Recent materials for your subjects will appear here.</div>
    </div>
  );
}

function Announcements() {
  // Placeholder: Replace with real data fetch
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center mb-2"><Megaphone className="w-5 h-5 mr-2 text-orange-600" /><span className="font-semibold">Announcements</span></div>
      <div className="text-gray-600 text-sm">No announcements at this time.</div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        {/* WelcomeCard removed, now in header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <TodaySchedule />
          <TeachersAssigned />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LatestResources />
          <Announcements />
        </div>
      </div>
    </div>
  );
}

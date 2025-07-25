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
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* WelcomeCard removed, now in header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TodaySchedule />
        <TeachersAssigned />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LatestResources />
        <Announcements />
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useStudent } from '@/contexts/StudentContext';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const timeSlots = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
];

const subjectColors = {
  Chemistry: 'bg-green-200 text-green-900',
  Math: 'bg-blue-200 text-blue-900',
  Physics: 'bg-purple-200 text-purple-900',
  English: 'bg-yellow-200 text-yellow-900',
  Geography: 'bg-teal-200 text-teal-900',
  Art: 'bg-pink-200 text-pink-900',
  Default: 'bg-gray-200 text-gray-900',
};

function getCurrentDayIndex() {
  const jsDay = new Date().getDay();
  // JS: 0=Sun, 1=Mon, ..., 6=Sat; Our table: 0=Mon, ..., 4=Fri
  return jsDay === 0 ? -1 : jsDay - 1;
}

function getWeekRangeLabel() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Calculate Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  // Calculate Sunday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const options = { month: 'short' as const, day: 'numeric' as const };
  const year = today.getFullYear();
  return `Mon ${monday.toLocaleDateString(undefined, options)} – Sun ${sunday.toLocaleDateString(undefined, options)}, ${year}`;
}

export default function TimetablePage() {
  const { studentInfo } = useStudent();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimetable() {
      setLoading(true);
      // Example: fetch all timetable entries for this student
      const { data, error } = await supabase
        .from('timetables')
        .select('*');
      setTimetable(data || []);
      setLoading(false);
    }
    fetchTimetable();
  }, [studentInfo.class, studentInfo.program]);

  // Build a lookup: { [time][day]: { subject, teacher } }
  const tableData = {};
  timetable.forEach(entry => {
    if (!tableData[entry.start_time + '-' + entry.end_time]) tableData[entry.start_time + '-' + entry.end_time] = {};
    tableData[entry.start_time + '-' + entry.end_time][entry.day_of_week] = entry;
  });

  const currentDayIdx = getCurrentDayIndex();
  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
      <h1 className="text-2xl font-bold mb-2">Weekly Timetable</h1>
      <div className="text-gray-600 mb-6 font-medium">{getWeekRangeLabel()}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow-md">
          <thead className="sticky top-0 z-10">
            <tr className="bg-blue-50">
              <th className="p-3 text-left font-semibold">Time</th>
              {days.map((day, idx) => (
                <th key={day} className={`p-3 text-center font-semibold ${idx === currentDayIdx ? 'bg-blue-200' : ''}`}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, rowIdx) => (
              <tr key={slot} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="p-3 font-medium text-gray-700">{slot}</td>
                {days.map((day, colIdx) => {
                  const entry = tableData[slot]?.[day];
                  const isCurrent = colIdx === currentDayIdx &&
                    currentHour >= parseInt(slot.split(':')[0]) &&
                    currentHour < parseInt(slot.split('-')[1].split(':')[0]);
                  const color = subjectColors[entry?.subject || 'Default'] || subjectColors.Default;
                  return (
                    <td key={day} className={`p-3 text-center align-middle ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                      {entry ? (
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${color}`}>{entry.subject}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                      {entry?.teacher && (
                        <div className="text-xs text-gray-600 mt-1">{entry.teacher}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
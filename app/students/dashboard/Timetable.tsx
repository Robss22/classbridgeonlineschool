"use client";
import { useEffect, useState } from "react";
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/lib/supabase.types';

type TimetableEntry = Database['public']['Tables']['timetables']['Row'];

export default function Timetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('timetables')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setTimetable(data || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading timetable...</div>;
  if (!timetable.length) return <div>No timetable found.</div>;

  return (
    <div className="my-6">
      <h2 className="text-xl font-semibold mb-2">Your Timetable</h2>
      <table className="min-w-full border border-gray-300 rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Day</th>
            <th className="p-2">Start</th>
            <th className="p-2">End</th>
            <th className="p-2">Subject</th>
            <th className="p-2">Live Link</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map((t) => (
            <tr key={t.timetable_id} className="border-t">
              <td className="p-2">{t.day_of_week}</td>
              <td className="p-2">{t.start_time}</td>
              <td className="p-2">{t.end_time}</td>
              <td className="p-2">{t.subject_id}</td>
              <td className="p-2">
                {t.meeting_link ? (
                  <a href={t.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Join</a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
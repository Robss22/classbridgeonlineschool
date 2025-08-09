"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export default function SubjectPage() {
  const params = useParams();
  const subjectId = (params as any)?.subjectId as string | undefined;
  const { user, loading: authLoading } = useAuth();
  type SubjectRow = { subject_id: string; name?: string | null; description?: string | null } | null;
  const [subject, setSubject] = useState<SubjectRow>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !subjectId) return;
    setLoading(true);
    setError("");
    const fetchData = async () => {
      // Fetch subject info
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('subject_id', subjectId as string)
        .single();
      if (subjectError) {
        setError('Subject not found.');
        setLoading(false);
        return;
      }
      setSubject(subjectData);
      // Fetch timetable for this subject and user
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('timetable_id, day_of_week, start_time, end_time, meeting_link')
        .eq('subject_id', subjectId as string);
      setTimetable(timetableData || []);
      // Fetch live classes for this subject
      const { data: liveClassData } = await supabase
        .from('live_classes')
        .select('live_class_id, title, scheduled_date, start_time, end_time, meeting_link')
        .eq('subject_id', subjectId as string)
        .order('scheduled_date', { ascending: true });
      setLiveClasses(liveClassData || []);
      setLoading(false);
    };
    fetchData();
  }, [user, subjectId]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view this subject.</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!subject) return <div>Subject not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{subject.name}</h1>
      <p className="mb-4 text-gray-700">{subject.description}</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Your Timetable for this Subject</h2>
      {timetable.length === 0 ? (
        <p>No scheduled classes for this subject.</p>
      ) : (
        <ul className="mb-4">
          {timetable.map((t) => (
            <li key={t.timetable_id} className="mb-2">
              {t.day_of_week}, {t.start_time} - {t.end_time} {t.meeting_link && (
                <a href={t.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Join Live</a>
              )}
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-xl font-semibold mt-6 mb-2">Upcoming Live Classes</h2>
      {liveClasses.length === 0 ? (
        <p>No upcoming live classes.</p>
      ) : (
        <ul>
          {liveClasses.map((lc) => (
            <li key={lc.live_class_id} className="mb-2">
              {lc.title} - {lc.scheduled_date} {lc.start_time} - {lc.end_time}
              {lc.meeting_link && (
                <a href={lc.meeting_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Join Live</a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
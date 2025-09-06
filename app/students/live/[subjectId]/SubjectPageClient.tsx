"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface Subject {
  subject_id: string;
  name: string;
  description: string | null;
}

interface TimetableEntry {
  timetable_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
}

interface LiveClass {
  live_class_id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
}

export default function SubjectPageClient() {
  const params = useParams();
  const subjectId = (params as Record<string, unknown>)?.subjectId as string | undefined;
  const { user, loading: authLoading } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
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
      setSubject({
        subject_id: String((subjectData as Record<string, unknown>)?.subject_id),
        name: String((subjectData as Record<string, unknown>)?.name || ''),
        description: ((subjectData as Record<string, unknown>)?.description as string | null) ?? null
      });
      // Fetch timetable for this subject and user
      const { data: timetableData } = await supabase
        .from('timetables')
        .select('timetable_id, day_of_week, start_time, end_time, meeting_link')
        .eq('subject_id', subjectId as string);
      setTimetable(((timetableData || []) as Array<Record<string, unknown>>).map(t => ({
        timetable_id: String(t.timetable_id),
        day_of_week: String(t.day_of_week || ''),
        start_time: String(t.start_time || ''),
        end_time: String(t.end_time || ''),
        meeting_link: (t.meeting_link as string | null) ?? null
      })));
      // Fetch live classes for this subject
      const { data: liveClassData } = await supabase
        .from('live_classes')
        .select('live_class_id, title, scheduled_date, start_time, end_time, meeting_link')
        .eq('subject_id', subjectId as string)
        .order('scheduled_date', { ascending: true });
      setLiveClasses(((liveClassData || []) as Array<Record<string, unknown>>).map(lc => ({
        live_class_id: String(lc.live_class_id),
        title: String(lc.title || ''),
        scheduled_date: String(lc.scheduled_date || ''),
        start_time: String(lc.start_time || ''),
        end_time: String(lc.end_time || ''),
        meeting_link: (lc.meeting_link as string | null) ?? null
      })));
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
                <a href={`/students/live/join/${t.timetable_id}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Join Live</a>
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
                <a href={`/students/live/join/${lc.live_class_id}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">Join Live</a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

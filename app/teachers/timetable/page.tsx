'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { Calendar } from 'lucide-react';

interface LiveClass {
  live_class_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  meeting_platform: string | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | string;
  teacher_id: string;
  program_id: string | null;
  level_id: string | null;
  subject_id: string | null;
  teachers?: {
    teacher_id: string;
    users?: { first_name: string; last_name: string };
  };
  levels?: { name: string } | null;
  subjects?: { name: string } | null;
  programs?: { name: string } | null;
}

const timeSlots: string[] = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00'
];

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [error, setError] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [autoStartStatus, setAutoStartStatus] = useState<'idle' | 'checking' | 'updated' | 'error'>('idle');

  const getDayColumns = useCallback(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  }, [currentWeekStart]);

  const parseTimeToMinutes = (time: string): number => {
    if (!time) return 0;
    const trimmed = time.trim();
    // Accept HH:MM or HH:MM:SS
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return 0;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  };

  const getClassesForTimeSlot = useCallback(
    (date: Date, timeSlot: string) => {
      const slotTime = parseTimeToMinutes(timeSlot);
      const slotEnd = slotTime + 60;

      return liveClasses.filter((liveClass) => {
        const classDate = parseISO(liveClass.scheduled_date);
        if (!isSameDay(classDate, date)) return false;
        const start = parseTimeToMinutes(liveClass.start_time);
        const end = parseTimeToMinutes(liveClass.end_time);
        return start < slotEnd && end > slotTime;
      });
    },
    [liveClasses]
  );

  const currentDayIndex = useMemo(() => {
    const today = new Date();
    return getDayColumns().findIndex((d) => isSameDay(d, today));
  }, [getDayColumns]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return;
    const { data, error: teacherError } = await supabase
      .from('teachers')
      .select('teacher_id')
      .eq('user_id', user.id)
      .single();
    if (teacherError || !data) {
      setError('Teacher profile not found');
      return;
    }
    setTeacherId(data.teacher_id);
  }, [user?.id]);

  const fetchLiveClasses = useCallback(async () => {
    try {
      if (!teacherId) return;
      const weekEnd = addDays(currentWeekStart, 6);

      const { data, error: lcError } = await supabase
        .from('live_classes')
        .select(`
          *,
          teachers:teacher_id (teacher_id, users:user_id(first_name,last_name)),
          levels:level_id(name),
          subjects:subject_id(name),
          programs:program_id(name)
        `)
        .eq('teacher_id', teacherId)
        .gte('scheduled_date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (lcError) throw lcError;
      setLiveClasses((data || []) as unknown as LiveClass[]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage || 'Failed to load timetable');
    }
  }, [teacherId, currentWeekStart]);

  const checkClassesStatus = useCallback(async () => {
    try {
      setAutoStartStatus('checking');
      // Use the same auto-status endpoint used across the app
      const response = await fetch('/api/live-classes/auto-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        if (result?.success) {
          setAutoStartStatus('updated');
          fetchLiveClasses();
          setTimeout(() => setAutoStartStatus('idle'), 3000);
          return;
        }
      }
      setAutoStartStatus('idle');
    } catch {
      setAutoStartStatus('error');
      setTimeout(() => setAutoStartStatus('idle'), 3000);
    }
  }, [fetchLiveClasses]);

  useEffect(() => {
    fetchTeacherId();
  }, [fetchTeacherId]);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  useEffect(() => {
    // Live updates
    const channel = supabase
      .channel('teacher_live_classes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes' }, () => {
        fetchLiveClasses();
      })
      .subscribe();

    // Periodic status checks
    const interval = setInterval(() => {
      checkClassesStatus();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchLiveClasses, checkClassesStatus]);

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      autoStartStatus === 'idle'
                        ? 'bg-gray-400'
                        : autoStartStatus === 'checking'
                        ? 'bg-yellow-400'
                        : autoStartStatus === 'updated'
                        ? 'bg-green-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span>
                    {autoStartStatus === 'idle'
                      ? 'Auto-start: Active'
                      : autoStartStatus === 'checking'
                      ? 'Checking classes...'
                      : autoStartStatus === 'updated'
                      ? 'Classes updated'
                      : 'Auto-start error'}
                  </span>
                </div>
                <button onClick={checkClassesStatus} className="text-blue-600 hover:text-blue-800 underline">
                  Check Now
                </button>
              </div>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentWeekStart((prev) => addDays(prev, -7))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Previous Week
            </button>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-semibold">
                {`${format(currentWeekStart, 'MMM d, yyyy')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`}
              </span>
            </div>
            <button
              onClick={() => setCurrentWeekStart((prev) => addDays(prev, 7))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Next Week
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {/* Timetable Grid */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Time
                </th>
                {getDayColumns().map((date, index) => (
                  <th
                    key={date.toISOString()}
                    className={`px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      index === currentDayIndex ? 'bg-blue-100 rounded-lg' : ''
                    }`}
                  >
                    <div className="text-xs text-gray-400">{format(date, 'EEE').toUpperCase()}</div>
                    <div className="text-lg font-semibold">{format(date, 'dd')}</div>
                    <div className="text-xs text-gray-400">{format(date, 'MMM').toUpperCase()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{timeSlot}</td>
                  {getDayColumns().map((date) => {
                    const classes = getClassesForTimeSlot(date, timeSlot);
                    return (
                      <td key={date.toISOString()} className="px-2 py-2">
                        {classes.map((liveClass) => (
                          <div
                            key={liveClass.live_class_id}
                            className={`rounded-lg p-3 mb-2 shadow-sm border ${
                              liveClass.status === 'ongoing'
                                ? 'bg-green-100 border-green-300'
                                : liveClass.status === 'completed'
                                ? 'bg-gray-100 border-gray-300'
                                : liveClass.status === 'cancelled'
                                ? 'bg-red-100 border-red-300'
                                : 'bg-blue-100 border-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div
                                className={`text-sm font-semibold ${
                                  liveClass.status === 'ongoing'
                                    ? 'text-green-800'
                                    : liveClass.status === 'completed'
                                    ? 'text-gray-800'
                                    : liveClass.status === 'cancelled'
                                    ? 'text-red-800'
                                    : 'text-blue-800'
                                }`}
                              >
                                {liveClass.subjects?.name || liveClass.title || 'Lesson'}
                              </div>
                              <div
                                className={`px-2 py-1 text-xs rounded-full ${
                                  liveClass.status === 'ongoing'
                                    ? 'bg-green-200 text-green-800'
                                    : liveClass.status === 'completed'
                                    ? 'bg-gray-200 text-gray-800'
                                    : liveClass.status === 'cancelled'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-blue-200 text-blue-800'
                                }`}
                              >
                                {liveClass.status}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              {liveClass.start_time} - {liveClass.end_time}
                            </div>
                            <div className="text-xs text-gray-700 font-medium">
                              {liveClass.levels?.name} {liveClass.programs?.name}
                            </div>
                            {liveClass.status === 'ongoing' && liveClass.meeting_link && (
                              <div className="mt-2">
                                <a
                                  href={liveClass.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                                >
                                  Join Class
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



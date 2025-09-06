'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { Calendar, Video, Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LiveClass {
  live_class_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  meeting_platform: string;
  status: string;
  subject_id: string;
  subjects?: { name: string };
  teachers?: { 
    teacher_id: string; 
    users?: { 
      first_name: string; 
      last_name: string 
    } 
  };
  levels?: { name: string };
  programs?: { name: string };
}

const timeSlots = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

export default function StudentTimetablePage() {
  const { user, loading: authLoading } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  // Removed unused loading state
  const [error, setError] = useState('');

  const fetchLiveClasses = useCallback(async () => {
    if (!user) return;

    try {
      // no-op: removed loading state
      
      // Get student's program
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user?.id) return;
      
      const userId = authUser.user.id;
      
      const { data: userData } = await supabase
        .from('users')
        .select('curriculum')
        .eq('id', userId)
        .single();
      
      const curriculumValue = userData?.curriculum as string | null | undefined;
      
      if (!curriculumValue) {
        setError('No program assigned. Please contact your administrator.');
        return;
      }

      // If curriculum is not a UUID (e.g., "UNEB O-Level"), look up the corresponding program_id
      let programId: string | null = null;
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (uuidRegex.test(curriculumValue)) {
        programId = curriculumValue;
      } else {
        const { data: programRow, error: programLookupError } = await supabase
          .from('programs')
          .select('program_id')
          .eq('name', curriculumValue)
          .single();
        if (programLookupError || !programRow?.program_id) {
          setError('Your program could not be resolved. Please contact your administrator.');
          return;
        }
        programId = programRow.program_id as string;
      }

      const weekEnd = addDays(currentWeekStart, 6);

      // Fetch live classes for the current week
      const { data, error: fetchError } = await supabase
        .from('live_classes')
        .select(`
          *,
          subjects:subject_id (name),
          teachers:teacher_id (
            teacher_id,
            users:user_id (first_name, last_name)
          ),
          levels:level_id (name),
          programs:program_id (name)
        `)
        .eq('program_id', programId)
        .gte('scheduled_date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      const processedClasses: LiveClass[] = ((data || []) as Array<Record<string, unknown>>).map((item) => {
        const teacherObj = item.teachers as Record<string, unknown> | undefined;
        const usersObj = (teacherObj?.users as Record<string, unknown> | undefined) || undefined;
        return {
          live_class_id: String(item.live_class_id || ''),
          title: String(item.title || 'Live Class'),
          description: String(item.description || ''),
          scheduled_date: String(item.scheduled_date || ''),
          start_time: String(item.start_time || ''),
          end_time: String(item.end_time || ''),
          meeting_link: String(item.meeting_link || ''),
          meeting_platform: String(item.meeting_platform || 'Google Meet'),
          status: String(item.status || 'scheduled'),
          subject_id: String(item.subject_id || ''),
          subjects: (item.subjects ? (item.subjects as { name: string }) : { name: '' }),
          teachers: teacherObj ? { teacher_id: String((teacherObj as Record<string, unknown>).teacher_id || ''), users: { first_name: String((usersObj as Record<string, unknown>)?.first_name || ''), last_name: String((usersObj as Record<string, unknown>)?.last_name || '') } } : { teacher_id: '', users: { first_name: '', last_name: '' } },
          levels: (item.levels ? (item.levels as { name: string }) : { name: '' }),
          programs: (item.programs ? (item.programs as { name: string }) : { name: '' }),
        };
      });

      setLiveClasses(processedClasses);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching live classes:', err);
      setError(errorMessage || 'Failed to fetch live classes');
    } finally {
      // no-op: removed loading state
    }
  }, [user, currentWeekStart]);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const getDayColumns = () => {
    return Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  };

  const parseTimeToMinutes = (time: string): number => {
    if (!time) return 0;
    
    const trimmed = time.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2}):?(\d{2})?/);
    if (!match || !match[1] || !match[2]) return 0;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
    
    return 0;
  };

  const getClassesForTimeSlot = (date: Date, timeSlot: string) => {
    const slotTime = parseTimeToMinutes(timeSlot);
    const slotEnd = slotTime + 60;

    return liveClasses.filter(liveClass => {
      const classDate = parseISO(liveClass.scheduled_date);
      if (!isSameDay(classDate, date)) return false;
      
      const start = parseTimeToMinutes(liveClass.start_time);
      const end = parseTimeToMinutes(liveClass.end_time);
      
      return start < slotEnd && end > slotTime;
    });
  };

  const getCurrentDayIndex = () => {
    const today = new Date();
    return getDayColumns().findIndex(date => isSameDay(date, today));
  };

  const getClassStatus = (liveClass: LiveClass) => {
    const now = new Date();
    const startTime = new Date(`${liveClass.scheduled_date}T${liveClass.start_time}`);
    const endTime = new Date(`${liveClass.scheduled_date}T${liveClass.end_time}`);
    
    if (liveClass.status === 'cancelled') return 'cancelled';
    if (liveClass.status === 'completed') return 'completed';
    if (liveClass.status === 'ongoing') return 'ongoing';
    
    if (now > endTime) return 'completed';
    if (now > startTime && now < endTime) return 'ongoing';
    if (now > startTime) return 'upcoming';
    
    return 'scheduled';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-300';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const canJoinClass = (liveClass: LiveClass) => {
    const status = getClassStatus(liveClass);
    return (status === 'ongoing' || status === 'upcoming') && liveClass.meeting_link;
  };

  const currentDayIndex = getCurrentDayIndex();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your timetable.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/students/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
                <p className="text-gray-600">View your weekly schedule and live classes</p>
              </div>
            </div>
            <Link
              href="/students/live-classes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-4 h-4" />
              View All Live Classes
            </Link>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Previous Week
            </button>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="font-semibold">
                {format(currentWeekStart, 'MMM d, yyyy')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </span>
            </div>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Next Week
            </button>
          </div>

          {/* Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {liveClasses.length} live class{liveClasses.length !== 1 ? 'es' : ''} for this week
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Main Timetable Grid */}
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
                    <div className="text-xs text-gray-400">
                      {format(date, 'EEE').toUpperCase()}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(date, 'dd')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(date, 'MMM').toUpperCase()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {timeSlot}
                  </td>
                  {getDayColumns().map(date => {
                    const classes = getClassesForTimeSlot(date, timeSlot);
                    return (
                      <td key={date.toISOString()} className="px-2 py-2 relative">
                        {classes.map(liveClass => {
                          const status = getClassStatus(liveClass);
                          const isLive = status === 'ongoing';
                          const canJoin = canJoinClass(liveClass);
                          
                          return (
                            <div
                              key={liveClass.live_class_id}
                              className={`rounded-lg p-3 mb-2 shadow-sm border ${
                                isLive ? 'bg-green-100 border-green-300' :
                                status === 'completed' ? 'bg-gray-100 border-gray-300' :
                                status === 'cancelled' ? 'bg-red-100 border-red-300' :
                                'bg-blue-100 border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className={`text-sm font-semibold ${
                                  isLive ? 'text-green-800' :
                                  status === 'completed' ? 'text-gray-800' :
                                  status === 'cancelled' ? 'text-red-800' :
                                  'text-blue-800'
                                }`}>
                                  {liveClass.subjects?.name || 'Lecture'}
                                </div>
                                <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                                  {status}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {liveClass.start_time} - {liveClass.end_time}
                              </div>
                              <div className="text-xs text-gray-700 font-medium">
                                {liveClass.teachers?.users?.first_name} {liveClass.teachers?.users?.last_name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {liveClass.levels?.name} {liveClass.programs?.name}
                              </div>
                              {canJoin && (
                                <div className="mt-2">
                                  <a
                                    href={`/students/live/join/${liveClass.live_class_id}`}
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded text-white transition-colors ${
                                      isLive ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                  >
                                    <Play className="w-3 h-3" />
                                    {isLive ? 'Join Now' : 'Join'}
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Live Now</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

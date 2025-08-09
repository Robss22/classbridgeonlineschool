"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Video, BookOpen, Bell, Play } from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';

interface TimetableEntry {
  timetable_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  level_name: string;
  program_name: string;
  teacher_name: string;
  meeting_link: string;
  meeting_platform: string;
  room_name: string;
  is_active: boolean;
}

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
  subject_name: string;
  level_name: string;
}

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00'
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // Fetch student's timetable
      // Build timetable by joining student's enrollments to timetables
      // 1) get student's level (class)
      const { data: userRow } = await supabase
        .from('users')
        .select('class')
        .eq('id', user.id)
        .single();

      const classLevelId = (userRow as any)?.class as string | undefined;

      // 2) fetch timetables for that level
      const { data: rawTimetables, error: timetableError } = await supabase
        .from('timetables')
        .select(`
          timetable_id, day_of_week, start_time, end_time, meeting_link, meeting_platform, room_name, is_active,
          subjects:subject_id(name),
          levels:level_id(name),
          teachers:teacher_id(teacher_id)
        `)
        .eq('level_id', classLevelId || '')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (timetableError) throw timetableError;

      // Fetch live classes for student's subjects
      const subjectIds = (rawTimetables || []).map((t: any) => t.subjects?.subject_id).filter(Boolean);
      const { data: liveClassData, error: liveClassError } = await supabase
        .from('live_classes')
        .select(`
          live_class_id, title, description, scheduled_date, start_time, end_time, meeting_link, meeting_platform, status,
          subjects:subject_id(name),
          levels:level_id(name)
        `)
        .in('subject_id', subjectIds.length ? subjectIds : [''])
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (liveClassError) throw liveClassError;

      const normalizedTimetable: TimetableEntry[] = (rawTimetables || []).map((t: any) => ({
        timetable_id: t.timetable_id,
        day_of_week: t.day_of_week,
        start_time: t.start_time,
        end_time: t.end_time,
        subject_name: t.subjects?.name ?? '-',
        level_name: t.levels?.name ?? '-',
        program_name: '',
        teacher_name: t.teachers?.teacher_id ?? '',
        meeting_link: t.meeting_link ?? '',
        meeting_platform: t.meeting_platform ?? 'Zoom',
        room_name: t.room_name ?? '',
        is_active: t.is_active ?? true,
      }));
      setTimetable(normalizedTimetable);
      const normalizedLive: LiveClass[] = (liveClassData || []).map((lc: any) => ({
        live_class_id: lc.live_class_id,
        title: lc.title ?? '',
        description: lc.description ?? '',
        scheduled_date: lc.scheduled_date ?? '',
        start_time: lc.start_time ?? '',
        end_time: lc.end_time ?? '',
        meeting_link: lc.meeting_link ?? '',
        meeting_platform: lc.meeting_platform ?? 'Zoom',
        status: lc.status ?? 'scheduled',
        subject_name: lc.subjects?.name ?? '-',
        level_name: lc.levels?.name ?? '-',
      }));
      setLiveClasses(normalizedLive);
      

    } catch (error) {
      const appError = errorHandler.handleSupabaseError(error, 'fetch_student_timetable', user?.id || '');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCurrentDayIndex = () => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? -1 : jsDay - 1;
  };

  const getWeekRangeLabel = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7));
    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  };



  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathematics': 'bg-blue-200 text-blue-900',
      'Physics': 'bg-purple-200 text-purple-900',
      'Chemistry': 'bg-green-200 text-green-900',
      'Biology': 'bg-teal-200 text-teal-900',
      'English': 'bg-yellow-200 text-yellow-900',
      'History': 'bg-orange-200 text-orange-900',
      'Geography': 'bg-pink-200 text-pink-900',
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-200 text-gray-900';
  };

  const isClassStartingSoon = (day: string, startTime: string) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (day !== today) return false;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);
    
    const timeDiff = classTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 15 * 60 * 1000; // 15 minutes
  };

  const isClassOngoing = (day: string, startTime: string, endTime: string) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (day !== today) return false;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const classStart = new Date();
    classStart.setHours(startHours, startMinutes, 0, 0);
    
    const classEnd = new Date();
    classEnd.setHours(endHours, endMinutes, 0, 0);
    
    return now >= classStart && now <= classEnd;
  };

  const getUpcomingLiveClasses = () => {
    const today = new Date();
    return liveClasses.filter(lc => {
      const classDate = new Date(lc.scheduled_date);
      return classDate >= today && lc.status === 'scheduled';
    }).slice(0, 3);
  };

  const getOngoingLiveClasses = () => {
    return liveClasses.filter(lc => lc.status === 'ongoing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your timetable...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Timetable</h1>
          <p className="text-gray-600">{getWeekRangeLabel()}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Live Classes Notifications */}
        <div className="mb-6 space-y-4">
          {/* Ongoing Live Classes */}
          {getOngoingLiveClasses().length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Play className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-800">Live Classes Happening Now</h3>
              </div>
              <div className="space-y-2">
                {getOngoingLiveClasses().map((liveClass) => (
                  <div key={liveClass.live_class_id} className="flex items-center justify-between bg-white rounded p-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{liveClass.title}</h4>
                      <p className="text-sm text-gray-600">{liveClass.subject_name} - {liveClass.start_time}</p>
                    </div>
                    {liveClass.meeting_link && (
                      <a
                        href={liveClass.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Video className="w-4 h-4" />
                        Join Now
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Live Classes */}
          {getUpcomingLiveClasses().length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Bell className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Upcoming Live Classes</h3>
              </div>
              <div className="space-y-2">
                {getUpcomingLiveClasses().map((liveClass) => (
                  <div key={liveClass.live_class_id} className="flex items-center justify-between bg-white rounded p-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{liveClass.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(liveClass.scheduled_date).toLocaleDateString()} at {liveClass.start_time}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {liveClass.meeting_platform}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-700">Time</th>
                  {daysOfWeek.map((day, idx) => (
                    <th key={day} className={`p-4 text-center font-semibold text-gray-700 ${idx === getCurrentDayIndex() ? 'bg-blue-100' : ''}`}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, rowIdx) => (
                  <tr key={slot} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-medium text-gray-700 text-sm">{slot}</td>
                    {daysOfWeek.map((day, colIdx) => {
                      const entry = timetable.find(t => 
                        t.day_of_week === day && 
                        `${t.start_time}-${t.end_time}` === slot
                      );
                      
                      const isCurrent = colIdx === getCurrentDayIndex() &&
                        isClassOngoing(day, slot.split('-')[0], slot.split('-')[1]);
                      
                      const isStartingSoon = entry && isClassStartingSoon(day, entry.start_time);
                      
                      return (
                        <td key={day} className={`p-4 text-center align-middle ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                          {entry ? (
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSubjectColor(entry.subject_name)}`}>
                                {entry.subject_name}
                              </span>
                              <div className="text-xs text-gray-600">{entry.teacher_name}</div>
                              {entry.meeting_link && (
                                <a
                                  href={entry.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                    isStartingSoon 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  } transition-colors`}
                                >
                                  <Video className="w-3 h-3" />
                                  {isStartingSoon ? 'Join Now' : 'Join'}
                                </a>
                              )}
                              {isStartingSoon && (
                                <div className="flex items-center justify-center">
                                  <Bell className="w-3 h-3 text-green-600 animate-pulse" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
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

        {/* Today's Classes Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Classes</h3>
          {(() => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todaysClasses = timetable.filter(t => t.day_of_week === today);
            
            if (todaysClasses.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No classes scheduled for today</p>
                </div>
              );
            }
            
            return (
              <div className="space-y-3">
                {todaysClasses.map((entry) => (
                  <div key={entry.timetable_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.start_time} - {entry.end_time}
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{entry.subject_name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        with {entry.teacher_name}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {entry.meeting_link && (
                        <a
                          href={entry.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Video className="w-4 h-4" />
                          Join Class
                        </a>
                      )}
                      {isClassStartingSoon(entry.day_of_week, entry.start_time) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Bell className="w-3 h-3 mr-1" />
                          Starting Soon
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
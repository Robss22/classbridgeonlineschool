'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';
import AdminLiveClassModal from '@/components/AdminLiveClassModal';

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
  teacher_id: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  teachers?: { 
    teacher_id: string; 
    users: { 
      first_name: string; 
      last_name: string 
    } 
  };
  levels?: { name: string };
  subjects?: { name: string };
  programs?: { name: string };
}

const timeSlots = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00",
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

export default function AdminTimetablePage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [error, setError] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [autoStartStatus, setAutoStartStatus] = useState<string>('idle');
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [filters, setFilters] = useState({
    program_id: '',
    level_id: '',
    subject_id: ''
  });
  const [programs, setPrograms] = useState<Array<{ program_id: string; name: string }>>([]);
  const [levels, setLevels] = useState<Array<{ level_id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ subject_id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ teacher_id: string; users?: { first_name: string; last_name: string } | undefined }>>([]);
  const [papers, setPapers] = useState<Array<{ paper_id: string; paper_name: string; paper_code: string; subject_id: string }>>([]);
  const [generatingLinks, setGeneratingLinks] = useState<Set<string>>(new Set());

  const generateMeetingLink = async (liveClassId: string, platform: string = 'Jitsi Meet') => {
    try {
      setGeneratingLinks(prev => new Set(prev).add(liveClassId));
      
      const response = await fetch('/api/live-classes/generate-meeting-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          live_class_id: liveClassId,
          platform: platform
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh the timetable to show the new meeting link
          fetchLiveClasses();
        }
      }
    } catch {
      // Handle error silently
    } finally {
      setGeneratingLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(liveClassId);
        return newSet;
      });
    }
  };

  const fetchLiveClasses = useCallback(async () => {
    try {
      const weekEnd = addDays(currentWeekStart, 6);

      let query = supabase
        .from('live_classes')
        .select(`
          *,
          teachers:teacher_id (
            teacher_id,
            users:user_id (
              first_name,
              last_name
            )
          ),
          levels:level_id (name),
          subjects:subject_id (name),
          programs:program_id (name)
        `);

      if (filters.program_id) query = query.eq('program_id', filters.program_id);
      if (filters.level_id) query = query.eq('level_id', filters.level_id);
      if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);

      // Only apply date filtering if not showing all classes
      if (!showAllClasses) {
        query = query
          .gte('scheduled_date', format(currentWeekStart, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));
      }

      const { data, error } = await query
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const liveClasses: LiveClass[] = ((data || []) as Array<Record<string, unknown>>).map((item) => ({
        live_class_id: (item.live_class_id as string) || '',
        title: (item.title as string) || '',
        description: (item.description as string) || '',
        scheduled_date: (item.scheduled_date as string) || '',
        start_time: (item.start_time as string) || '',
        end_time: (item.end_time as string) || '',
        meeting_link: (item.meeting_link as string) || '',
        meeting_platform: (item.meeting_platform as string) || '',
        status: (item.status as string) || '',
        teacher_id: (item.teacher_id as string) || '',
        program_id: (item.program_id as string) || '',
        level_id: (item.level_id as string) || '',
        subject_id: (item.subject_id as string) || '',
        teachers: { teacher_id: String((item.teachers as Record<string, unknown>)?.teacher_id || ''), users: { first_name: String((item.teachers as { users?: { first_name?: string } })?.users?.first_name || ''), last_name: String((item.teachers as { users?: { last_name?: string } })?.users?.last_name || '') } },
        levels: item.levels as { name: string } || undefined,
        subjects: item.subjects as { name: string } || undefined,
        programs: item.programs as { name: string } || undefined
      }));
      
      setLiveClasses(liveClasses);
    } catch (error: unknown) {
      const appError = errorHandler.handleSupabaseError(error, 'fetch_live_classes', '');
      setError(appError.message);
    }
  }, [currentWeekStart, filters, showAllClasses]);

  // Fetch filters data
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch reference data first using the same logic as live-classes page
        const [levelsRes, subjectsRes, teachersRes, programsRes, papersRes] = await Promise.all([
          supabase.from('levels').select('*'),
          supabase.from('subjects').select('*'),
          supabase.from('teachers').select('*, users(first_name, last_name)'),
          supabase.from('programs').select('*'),
          supabase.from('subject_papers').select('*')
        ]);

        // Check for errors in reference data
        if (levelsRes.error) {
          throw new Error('Error fetching levels: ' + levelsRes.error.message);
        }
        if (subjectsRes.error) {
          throw new Error('Error fetching subjects: ' + subjectsRes.error.message);
        }
        if (teachersRes.error) {
          throw new Error('Error fetching teachers: ' + teachersRes.error.message);
        }
        if (programsRes.error) {
          throw new Error('Error fetching programs: ' + programsRes.error.message);
        }
        if (papersRes.error) {
          throw new Error('Error fetching papers: ' + papersRes.error.message);
        }

        // Set reference data
        setLevels(levelsRes.data || []);
        setSubjects(subjectsRes.data || []);
        setTeachers(((teachersRes.data || []) as Array<Record<string, unknown>>).map((teacher) => ({
          teacher_id: (teacher.teacher_id as string) || '',
          users: teacher.users ? {
            first_name: String((teacher.users as Record<string, unknown>).first_name || ''),
            last_name: String((teacher.users as Record<string, unknown>).last_name || '')
          } : undefined
        })));
        setPrograms(programsRes.data || []);
        setPapers(papersRes.data || []);
        
      } catch (error: unknown) {
        const appError = errorHandler.handleSupabaseError(error, 'fetch_filters_data', '');
        setError(appError.message);
      }
    };

    fetchFiltersData();
  }, []);

  // Keep this callback above the effect so it can be safely referenced in deps
  const checkClassesStatus = useCallback(async () => {
    try {
      setAutoStartStatus('checking');
      // Use the in-app auto-status endpoint (no Edge Function required)
      const response = await fetch('/api/live-classes/auto-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        if (result?.success) {
          setAutoStartStatus('updated');
          // Refresh the timetable to show new status
          fetchLiveClasses();
          // Reset status after 3 seconds
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
    fetchLiveClasses();
    
    // Set up real-time updates for live classes
    const channel = supabase
      .channel('live_classes_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_classes' },
        () => {
          fetchLiveClasses();
        }
      )
      .subscribe();

    // Set up interval to check for classes that should start/end
    const interval = setInterval(() => {
      checkClassesStatus();
    }, 30000); // Check every 30 seconds

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchLiveClasses, checkClassesStatus]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  // (moved above)

  const fetchAllClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('live_classes')
        .select(`
          *,
          teachers:teacher_id (
            teacher_id,
            users:user_id (
              first_name,
              last_name
            )
          ),
          levels:level_id (name),
          subjects:subject_id (name),
          programs:program_id (name)
        `)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      const allLiveClasses: LiveClass[] = ((data || []) as Array<Record<string, unknown>>).map((item) => ({
        live_class_id: (item.live_class_id as string) || '',
        title: (item.title as string) || '',
        description: (item.description as string) || '',
        scheduled_date: (item.scheduled_date as string) || '',
        start_time: (item.start_time as string) || '',
        end_time: (item.end_time as string) || '',
        meeting_link: (item.meeting_link as string) || '',
        meeting_platform: (item.meeting_platform as string) || '',
        status: (item.status as string) || '',
        teacher_id: (item.teacher_id as string) || '',
        program_id: (item.program_id as string) || '',
        level_id: (item.level_id as string) || '',
        subject_id: (item.subject_id as string) || '',
        teachers: { teacher_id: String((item.teachers as Record<string, unknown>)?.teacher_id || ''), users: { first_name: String((item.teachers as { users?: { first_name?: string } })?.users?.first_name || ''), last_name: String((item.teachers as { users?: { last_name?: string } })?.users?.last_name || '') } },
        levels: item.levels as { name: string } || undefined,
        subjects: item.subjects as { name: string } || undefined,
        programs: item.programs as { name: string } || undefined
      }));
      
      setLiveClasses(allLiveClasses);
      setShowAllClasses(true);
    } catch (error: unknown) {
      const appError = errorHandler.handleSupabaseError(error, 'fetch_all_classes', '');
      setError(appError.message);
    }
  };

  const getDayColumns = () => {
    return Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  };

  const parseTimeToMinutes = (time: string): number => {
    if (!time) return 0;
    
    const trimmed = time.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2}):?(\d{2})?/);
    if (!match) {
      return 0;
    }
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    // Handle 24-hour format
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
      
      // Check if the class overlaps with this time slot
      // A class overlaps if it starts before the slot ends AND ends after the slot starts
      return start < slotEnd && end > slotTime;
    });
  };

  const getCurrentDayIndex = () => {
    const today = new Date();
    return getDayColumns().findIndex(date => isSameDay(date, today));
  };

  const currentDayIndex = getCurrentDayIndex();

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto overflow-visible">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Class Timetable</h1>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    autoStartStatus === 'idle' ? 'bg-gray-400' :
                    autoStartStatus === 'checking' ? 'bg-yellow-400' :
                    autoStartStatus === 'updated' ? 'bg-green-400' :
                    'bg-red-400'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {autoStartStatus === 'idle' ? 'Auto-start: Active' :
                     autoStartStatus === 'checking' ? 'Checking classes...' :
                     autoStartStatus === 'updated' ? 'Classes updated!' :
                     'Auto-start error'}
                  </span>
                </div>
                <button
                  onClick={checkClassesStatus}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Check Now
                </button>
                <button
                  onClick={fetchAllClasses}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Show All Classes
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Class
            </button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <select
              className="border p-2 rounded"
              value={filters.program_id}
              onChange={(e) => setFilters(prev => ({ ...prev, program_id: e.target.value }))}
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program.program_id} value={program.program_id}>
                  {program.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={filters.level_id}
              onChange={(e) => setFilters(prev => ({ ...prev, level_id: e.target.value }))}
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level.level_id} value={level.level_id}>
                  {level.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={filters.subject_id}
              onChange={(e) => setFilters(prev => ({ ...prev, subject_id: e.target.value }))}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Previous Week
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  {showAllClasses ? 'All Classes' : `${format(currentWeekStart, 'MMM d, yyyy')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`}
                </span>
              </div>
              <button
                onClick={() => setShowAllClasses(!showAllClasses)}
                className={`px-3 py-1 text-sm rounded ${
                  showAllClasses 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                {showAllClasses ? 'Show Current Week' : 'Show All Classes'}
              </button>
            </div>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={showAllClasses}
            >
              Next Week
            </button>
          </div>
          
          {/* Classes Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {liveClasses.length} live class{liveClasses.length !== 1 ? 'es' : ''}
            {!showAllClasses && ` for the week of ${format(currentWeekStart, 'MMM d, yyyy')}`}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Main Timetable Grid */}
        <div className="bg-white rounded-lg shadow overflow-x-auto overflow-y-visible">
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
                        {classes.map(liveClass => (
                                                       <div
                               key={liveClass.live_class_id}
                               className={`rounded-lg p-3 mb-2 shadow-sm border ${
                                 liveClass.status === 'ongoing' ? 'bg-green-100 border-green-300' :
                                 liveClass.status === 'completed' ? 'bg-gray-100 border-gray-300' :
                                 liveClass.status === 'cancelled' ? 'bg-red-100 border-red-300' :
                                 'bg-blue-100 border-blue-200'
                               }`}
                             >
                               <div className="flex items-center justify-between mb-1">
                                 <div className={`text-sm font-semibold ${
                                   liveClass.status === 'ongoing' ? 'text-green-800' :
                                   liveClass.status === 'completed' ? 'text-gray-800' :
                                   liveClass.status === 'cancelled' ? 'text-red-800' :
                                   'text-blue-800'
                                 }`}>
                                   {liveClass.subjects?.name || 'Lecture'}
                                 </div>
                                 <div className={`px-2 py-1 text-xs rounded-full ${
                                   liveClass.status === 'ongoing' ? 'bg-green-200 text-green-800' :
                                   liveClass.status === 'completed' ? 'bg-gray-200 text-gray-800' :
                                   liveClass.status === 'cancelled' ? 'bg-red-200 text-red-800' :
                                   'bg-blue-200 text-blue-800'
                                 }`}>
                                   {liveClass.status}
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
                               {liveClass.status === 'ongoing' && !liveClass.meeting_link && (
                                 <div className="mt-2">
                                   <div className="flex items-center gap-2">
                                      <select
                                        className="text-xs border rounded px-1 py-1"
                                        onChange={(e) => {
                                          const platform = e.target.value;
                                          generateMeetingLink(liveClass.live_class_id, platform);
                                        }}
                                        disabled={generatingLinks.has(liveClass.live_class_id)}
                                      >
                                        <option value="Jitsi Meet">Jitsi Meet</option>
                                      </select>
                                     <button
                                       onClick={() => generateMeetingLink(liveClass.live_class_id)}
                                       className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                                       disabled={generatingLinks.has(liveClass.live_class_id)}
                                     >
                                       {generatingLinks.has(liveClass.live_class_id) ? 'Generating...' : 'Generate'}
                                     </button>
                                   </div>
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

        {/* Create Live Class Modals */}
        {showCreateForm && (
          <AdminLiveClassModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchLiveClasses();
            }}
            programs={programs}
            levels={levels}
            subjects={subjects}
            teachers={teachers}
            papers={papers}
          />
        )}
      </div>
    </div>
  );
}



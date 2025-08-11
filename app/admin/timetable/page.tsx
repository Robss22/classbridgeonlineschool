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
    users?: { 
      first_name: string; 
      last_name: string 
    } 
  };
  levels?: { name: string };
  subjects?: { name: string };
  programs?: { name: string };
}

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

export default function AdminTimetablePage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [error, setError] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showCreateForm, setShowCreateForm] = useState(false);
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

      const { data, error } = await query
        .gte('scheduled_date', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      const liveClasses: LiveClass[] = data.map((item: any) => ({
        ...item,
        meeting_platform: item.meeting_platform || '',
        status: item.status || '',
        teacher_id: item.teacher_id || '',
        program_id: item.program_id || '',
        level_id: item.level_id || '',
        title: item.title || '',
        description: item.description || ''
      }));
      setLiveClasses(liveClasses);
    } catch (error: any) {
      const appError = errorHandler.handleSupabaseError(error, 'fetch_live_classes', '');
      setError(appError.message);
    }
  }, [currentWeekStart, filters]);

  // Fetch filters data
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select('program_id, name')
          .order('name');
        if (programsError) throw programsError;
        setPrograms(programsData || []);

        // Fetch levels
        const { data: levelsData, error: levelsError } = await supabase
          .from('levels')
          .select('level_id, name')
          .order('name');
        if (levelsError) throw levelsError;
        setLevels(levelsData || []);

        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('subject_id, name')
          .order('name');
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);

        // Fetch teachers
        const { data: teachersData, error: teachersError } = await supabase
          .from('teachers')
          .select('*, users(first_name, last_name)')
          .order('teacher_id');
        if (teachersError) throw teachersError;
        const teachers = (teachersData || []).map((teacher: any) => ({
          teacher_id: teacher.teacher_id,
          users: teacher.users ? {
            first_name: teacher.users.first_name || '',
            last_name: teacher.users.last_name || ''
          } : undefined
        }));
        setTeachers(teachers);

        // Fetch papers
        const { data: papersData, error: papersError } = await supabase
          .from('subject_papers')
          .select('paper_id, paper_name, paper_code, subject_id');
        if (papersError) throw papersError;
        setPapers(papersData || []);
      } catch (error: any) {
        const appError = errorHandler.handleSupabaseError(error, 'fetch_filters_data', '');
        setError(appError.message);
      }
    };

    fetchFiltersData();
  }, []);

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
    const trimmed = time.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    return hours * 60 + minutes;
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

  const currentDayIndex = getCurrentDayIndex();

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Live Class Timetable</h1>
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
                        {classes.map(liveClass => (
                          <div
                            key={liveClass.live_class_id}
                            className="bg-blue-100 border border-blue-200 rounded-lg p-3 mb-2 shadow-sm"
                          >
                            <div className="text-sm font-semibold text-blue-800 mb-1">
                              {liveClass.subjects?.name || 'Lecture'}
                            </div>
                            <div className="text-xs text-blue-600 mb-1">
                              {liveClass.start_time} - {liveClass.end_time}
                            </div>
                            <div className="text-xs text-blue-700 font-medium">
                              {liveClass.teachers?.users?.first_name} {liveClass.teachers?.users?.last_name}
                            </div>
                            <div className="text-xs text-blue-600">
                              {liveClass.subjects?.name}
                            </div>
                            <div className="text-xs text-blue-700">
                              {liveClass.levels?.name} {liveClass.programs?.name}
                            </div>
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

        {showCreateForm && (
          <AdminLiveClassModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchLiveClasses();
            }}
            programs={programs as any[]}
            levels={levels as any[]}
            subjects={subjects as any[]}
            teachers={teachers as any[]}
            papers={papers as any[]}
          />
        )}
      </div>
    </div>
  );
}



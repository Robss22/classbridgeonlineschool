'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Users, Video, AlertCircle, CheckCircle, Play, Bell } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

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
  started_at?: string | null;
  ended_at?: string | null;
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

export default function StudentLiveClassesPage() {
  const { user, loading: authLoading } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [autoJoinEnabled, setAutoJoinEnabled] = useState(false);
  const [nextClassCountdown, setNextClassCountdown] = useState<number | null>(null);

  const fetchLiveClasses = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get student's enrolled subjects
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user?.id) return;
      
      const userId = authUser.user.id;
      
      // Get student's program and level
      const { data: userData } = await supabase
        .from('users')
        .select('program_id, level_id')
        .eq('id', userId)
        .single();
      
      let programId = (userData as any)?.program_id as string | undefined;
      const levelId = (userData as any)?.level_id as string | undefined;
      
      // Handle case where program_id might be a string name instead of UUID
      if (programId && !programId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('Program ID is not a UUID, looking up by name:', programId);
        // program_id is not a UUID, so it's likely a program name
        // Look up the actual program UUID by name
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('program_id')
          .eq('name', programId)
          .single();
        
        if (programError || !programData) {
          console.warn('Could not find program UUID for name:', programId);
          setError('Program configuration error. Please contact your administrator.');
          return;
        }
        
        console.log('Found program UUID:', programData.program_id, 'for name:', programId);
        programId = programData.program_id;
      }
      
      console.log('Using program ID for query:', programId);
      
      if (!programId) {
        setError('No program assigned. Please contact your administrator.');
        return;
      }
      
      // Fetch live classes for the student's program (and level if available)
      let query = supabase
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
        .eq('program_id', programId);

      if (levelId) {
        query = query.eq('level_id', levelId);
      }

      const { data, error: fetchError } = await query
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (fetchError) throw fetchError;
      
      const processedClasses: LiveClass[] = (data || []).map((item: any) => ({
        ...item,
        meeting_platform: item.meeting_platform || 'Google Meet',
        status: item.status || 'scheduled',
        title: item.title || 'Live Class',
        description: item.description || '',
        started_at: item.started_at || null,
        ended_at: item.ended_at || null
      }));

      setLiveClasses(processedClasses);
      
      // Note: Attendance tracking is disabled until live_class_participants table is properly migrated
      // For now, we'll set empty attendance map
      setAttendanceMap({});
      
    } catch (error: any) {
      console.error('Error fetching live classes:', error);
      
      // Handle specific Supabase errors
      if (error.code === 'PGRST116') {
        setError('Database query error. Please contact your administrator.');
      } else if (error.message && error.message.includes('400')) {
        setError('Invalid query parameters. Please contact your administrator.');
      } else {
        setError(error.message || 'Failed to fetch live classes');
      }
    } finally {
      // setLoading(false); // This line was removed as per the edit hint
    }
  }, [user]);



  // Auto-join functionality
  const handleAutoJoin = useCallback(async (liveClass: LiveClass) => {
    if (!liveClass.meeting_link) {
      setError('No meeting link available for this class. Please contact your teacher.');
      return;
    }

    // Open meeting in new tab
    window.open(liveClass.meeting_link, '_blank');
    
    // Note: Attendance tracking is disabled until live_class_participants table is properly migrated
    // For now, we'll just open the meeting without tracking attendance
    
  }, []);

  const handleAutoStatusUpdate = useCallback(async () => {
    try {
      const response = await fetch('/api/live-classes/auto-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update statuses');
      }
      
      await fetchLiveClasses(); // Refresh data
    } catch (error) {
      console.error('Error updating statuses:', error);
    }
  }, [fetchLiveClasses]);

  // Memoized countdown calculation function
  const calculateNextClassCountdown = useCallback(() => {
    if (liveClasses.length === 0) return;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];
    
    const nextClass = liveClasses.find(lc => {
      if (lc.status !== 'scheduled') return false;
      if (lc.scheduled_date !== today) return false;
      return lc.start_time > currentTime;
    });
    
    if (nextClass) {
      const [hours, minutes] = nextClass.start_time.split(':');
      const classTime = new Date();
      classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const diffMs = classTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes > 0) {
        setNextClassCountdown(diffMinutes);
      } else {
        setNextClassCountdown(null);
      }
    } else {
      setNextClassCountdown(null);
    }
  }, [liveClasses]);

  // Initial data fetch - only run once on mount
  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]); // Include fetchLiveClasses to satisfy ESLint

  // Set up automatic status checking every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoStatusUpdate();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [handleAutoStatusUpdate]);

  // Set up countdown timer every minute
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      if (liveClasses.length > 0) {
        calculateNextClassCountdown();
      }
    }, 60000); // Update every minute

    return () => clearInterval(countdownInterval);
  }, [liveClasses.length, calculateNextClassCountdown]);

  // Update countdown when liveClasses change
  useEffect(() => {
    calculateNextClassCountdown();
  }, [calculateNextClassCountdown]);

  const getClassStatus = (liveClass: LiveClass) => {
    const now = new Date();
    const classDate = parseISO(liveClass.scheduled_date);
    const [startHour, startMinute] = liveClass.start_time.split(':').map(Number);
    const [endHour, endMinute] = liveClass.end_time.split(':').map(Number);
    
    const startTime = new Date(classDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(classDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    if (liveClass.status === 'completed') return 'completed';
    if (liveClass.status === 'cancelled') return 'cancelled';
    if (liveClass.status === 'ongoing') return 'ongoing';
    
    if (isAfter(now, endTime)) return 'missed';
    if (isAfter(now, startTime)) return 'live';
    return 'scheduled';
  };

  const getTimeUntilClass = (scheduledDate: string, startTime: string) => {
    const now = new Date();
    const classDate = new Date(scheduledDate);
    const [hours, minutes] = startTime.split(':');
    classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diffMs = classDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'Starting now';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `in ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    return `in ${diffHours}h ${remainingMinutes}m`;
  };

  const getFilteredClasses = () => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    return liveClasses.filter(liveClass => {
      const status = getClassStatus(liveClass);
      
      switch (filter) {
        case 'today':
          return liveClass.scheduled_date === today;
        case 'upcoming':
          return status === 'scheduled' && liveClass.scheduled_date >= today;
        case 'ongoing':
          return status === 'live' || status === 'ongoing';
        case 'completed':
          return status === 'completed' || status === 'missed';
        default:
          return true;
      }
    });
  };

  const filteredClasses = getFilteredClasses();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading authentication...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we verify your credentials</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Please log in to view live classes.
      </div>
    );
  }

  // Show loading state while fetching data
  if (liveClasses.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading live classes...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your class schedule</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes</h1>
          <p className="text-gray-600">Join your scheduled live class sessions</p>
          
          {/* Next Class Countdown */}
          {nextClassCountdown !== null && nextClassCountdown > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">
                  Your next class starts in {nextClassCountdown} minutes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setError('');
                    fetchLiveClasses();
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => setError('')}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={handleAutoStatusUpdate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Update Statuses
          </button>
          
          <button
            onClick={() => setAutoJoinEnabled(!autoJoinEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoJoinEnabled 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            {autoJoinEnabled ? 'Auto-Join Enabled' : 'Enable Auto-Join'}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['all', 'today', 'upcoming', 'ongoing', 'completed'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>

        {/* Live Classes Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5" />
            Available Classes
          </h2>
          
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No classes available for the selected filter.</p>
              <p className="text-sm">Try changing the filter or check back later.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((liveClass) => {
                const status = getClassStatus(liveClass);
                const isLive = status === 'live' || status === 'ongoing';
                const canJoin = isLive && liveClass.meeting_link;
                const isMissed = status === 'missed';
                const timeUntilClass = getTimeUntilClass(liveClass.scheduled_date, liveClass.start_time);
                const isStartingSoon = status === 'scheduled' && timeUntilClass.includes('Starting now');

                return (
                  <div key={liveClass.live_class_id} className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                    isStartingSoon ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{liveClass.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{liveClass.description}</p>
                        
                        {isStartingSoon && (
                          <div className="text-xs text-yellow-600 font-medium mb-2">
                            ⚡ Starting now!
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {status === 'live' || status === 'ongoing' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium">LIVE</span>
                          </div>
                        ) : status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-gray-500" />
                        ) : status === 'missed' ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(liveClass.scheduled_date), 'MMM dd, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{liveClass.start_time} - {liveClass.end_time}</span>
                        {status === 'scheduled' && (
                          <span className="text-xs text-blue-600 font-medium ml-2">
                            {timeUntilClass}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{liveClass.subjects?.name || 'Unknown Subject'}</span>
                        <span className="text-gray-400">•</span>
                        <span>{liveClass.levels?.name || 'Unknown Level'}</span>
                      </div>
                      
                      {liveClass.teachers?.users && (
                        <div className="text-sm text-gray-600">
                          Teacher: {liveClass.teachers.users.first_name} {liveClass.teachers.users.last_name}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4">
                      {canJoin ? (
                        <div className="flex gap-2">
                          <a
                            href={liveClass.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-white transition-colors ${
                              isLive 
                                ? 'bg-green-600 hover:bg-green-700 shadow-lg' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            {isLive ? 'Attend Class' : 'Join Class'}
                          </a>
                          
                          {autoJoinEnabled && isStartingSoon && (
                            <button
                              onClick={() => handleAutoJoin(liveClass)}
                              className="inline-flex items-center gap-1 px-3 py-2.5 text-xs rounded bg-purple-600 text-white hover:bg-purple-700"
                              title="Auto-Join Class"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`w-full text-sm text-center px-5 py-2.5 border rounded-md ${
                            isMissed ? 'text-red-600 border-red-300 bg-red-50' : 'text-gray-500'
                          }`}
                        >
                          {status === 'completed'
                            ? (isMissed ? 'Missed' : 'Class ended')
                            : status === 'cancelled'
                              ? 'Class cancelled'
                              : 'Not yet started'}
                        </div>
                      )}
                      
                      {/* Attendance indicator */}
                      {attendanceMap[liveClass.live_class_id] && (
                        <div className="mt-2 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Attended
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

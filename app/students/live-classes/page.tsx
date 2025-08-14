'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Users, Video, AlertCircle, CheckCircle, Play } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';

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

export default function StudentLiveClassesPage() {
  const { user, loading: authLoading } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    
    const fetchLiveClasses = async () => {
      try {
        setLoading(true);
        
        // Get student's enrolled subjects
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser?.user?.id) return;
        
        const userId = authUser.user.id;
        
        // Get student's program (UUID) and level
        const { data: userData } = await supabase
          .from('users')
          .select('program_id, level_id')
          .eq('id', userId)
          .single();
        
        const programId = (userData as any)?.program_id as string | undefined;
        const levelId = (userData as any)?.level_id as string | undefined;
        
        if (!programId) {
          setError('No program assigned. Please contact your administrator.');
          setLoading(false);
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
          description: item.description || ''
        }));
        
        setLiveClasses(processedClasses);

        // Fetch attendance for this student for these classes
        const classIds = processedClasses.map(c => c.live_class_id);
        // Fetch attendance via RPC or skip if table not typed in client types
        if (classIds.length > 0) {
          let attendanceRows: any[] | null = null;
          try {
            const { data } = await (supabase as any)
              .from('live_class_participants' as any)
              .select('live_class_id, attendance_status, join_time')
              .eq('student_id', userId)
              .in('live_class_id', classIds);
            attendanceRows = data as any[] | null;
          } catch (_) {
            attendanceRows = null;
          }

          const map: Record<string, boolean> = {};
          classIds.forEach(id => { map[id] = false; });
          (attendanceRows || []).forEach((row: any) => {
            if (!row?.live_class_id) return;
            const attended = row.attendance_status === 'present' || !!row.join_time;
            if (attended) map[row.live_class_id] = true;
          });
          setAttendanceMap(map);
        } else {
          setAttendanceMap({});
        }
      } catch (err: any) {
        console.error('Error fetching live classes:', err);
        setError(err.message || 'Failed to fetch live classes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLiveClasses();
  }, [user]);

  const getClassStatus = (liveClass: LiveClass) => {
    const now = new Date();
    // Removed unused classDate
    const startTime = new Date(`${liveClass.scheduled_date}T${liveClass.start_time}`);
    const endTime = new Date(`${liveClass.scheduled_date}T${liveClass.end_time}`);
    
    if (liveClass.status === 'cancelled') return 'cancelled';
    if (liveClass.status === 'completed') return 'completed';
    if (liveClass.status === 'ongoing') return 'ongoing';
    
    if (isAfter(now, endTime)) return 'completed';
    if (isAfter(now, startTime) && isBefore(now, endTime)) return 'ongoing';
    if (isAfter(now, startTime)) return 'upcoming';
    
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing': return <Play className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredClasses = liveClasses.filter(liveClass => {
    const status = getClassStatus(liveClass);
    switch (filter) {
      case 'today':
        return format(parseISO(liveClass.scheduled_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      case 'upcoming':
        return ['scheduled', 'upcoming'].includes(status);
      case 'ongoing':
        return status === 'ongoing';
      case 'completed':
        return status === 'completed';
      default:
        return true;
    }
  });

  const canJoinClass = (liveClass: LiveClass) => {
    const status = getClassStatus(liveClass);
    return (status === 'ongoing' || status === 'upcoming') && liveClass.meeting_link;
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view live classes.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Classes</h1>
          <p className="text-gray-600">Join your scheduled live classes and never miss a session</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All Classes', count: liveClasses.length },
            { key: 'today', label: 'Today', count: liveClasses.filter(c => format(parseISO(c.scheduled_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length },
            { key: 'upcoming', label: 'Upcoming', count: liveClasses.filter(c => ['scheduled', 'upcoming'].includes(getClassStatus(c))).length },
            { key: 'ongoing', label: 'Live Now', count: liveClasses.filter(c => getClassStatus(c) === 'ongoing').length },
            { key: 'completed', label: 'Completed', count: liveClasses.filter(c => getClassStatus(c) === 'completed').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading live classes...</div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No live classes found</h3>
            <p className="text-gray-600">
              {filter === 'today' ? 'No classes scheduled for today.' :
               filter === 'upcoming' ? 'No upcoming classes scheduled.' :
               filter === 'ongoing' ? 'No classes are currently live.' :
               filter === 'completed' ? 'No completed classes found.' :
               'No live classes have been scheduled yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredClasses.map((liveClass) => {
              const status = getClassStatus(liveClass);
              const isLive = status === 'ongoing';
              const canJoin = canJoinClass(liveClass);
              const isMissed = status === 'completed' && !attendanceMap[liveClass.live_class_id];
              
              return (
                <div
                  key={liveClass.live_class_id}
                  className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all hover:shadow-md h-full flex flex-col ${
                    isLive ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="pr-2">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {liveClass.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {liveClass.description || 'No description available'}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {format(parseISO(liveClass.scheduled_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {liveClass.start_time} - {liveClass.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {liveClass.teachers?.users?.first_name} {liveClass.teachers?.users?.last_name || 'TBA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {liveClass.subjects?.name || 'Unknown Subject'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    {canJoin ? (
                      <a
                        href={liveClass.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold text-white transition-colors ${
                          isLive 
                            ? 'bg-green-600 hover:bg-green-700 shadow-lg' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        {isLive ? 'Attend Class' : 'Join Class'}
                      </a>
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
                      {/* Platform label removed as requested */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

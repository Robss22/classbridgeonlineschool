'use client';

import { useEffect, useState } from 'react';
import { Calendar, Users, BookOpen, Megaphone, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
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
}

interface ScheduledClass {
  timetable_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_id: string;
  subjects?: { name: string };
  meeting_link?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

function TodaySchedule({ liveClasses, scheduledClasses }: { liveClasses: LiveClass[]; scheduledClasses: ScheduledClass[] }) {
  // Use the same date logic as the main query - check both local and UTC dates
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayUTC = format(new Date().toISOString().split('T')[0], 'yyyy-MM-dd');
  
  const todayClasses = liveClasses.filter(liveClass => {
    const classDate = format(parseISO(liveClass.scheduled_date), 'yyyy-MM-dd');
    return classDate === today || classDate === todayUTC;
  });
  


  // Get today's day of week
  const todayDate = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[todayDate.getDay()];
  
  // Filter scheduled classes for today
  const todaysScheduledClasses = scheduledClasses.filter(cls => cls.day_of_week === todayDayName);

  const getClassStatus = (liveClass: LiveClass) => {
    const now = new Date();
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
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canJoinClass = (liveClass: LiveClass) => {
    const status = getClassStatus(liveClass);
    return (status === 'ongoing' || status === 'upcoming') && liveClass.meeting_link;
  };

  if (todayClasses.length === 0 && todaysScheduledClasses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex items-center mb-2">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          <span className="font-semibold">Today&apos;s Schedule</span>
        </div>
        <div className="text-gray-600 text-sm">No classes scheduled for today.</div>
      </div>
    );
  }

  return (
    <Link href="/timetable">
      <div className="bg-white rounded-xl shadow p-4 mb-4 cursor-pointer">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          <span className="font-semibold">Today&apos;s Schedule</span>
          <span className="ml-2 text-sm text-gray-500">({todayClasses.length + todaysScheduledClasses.length})</span>
        </div>
        <div className="space-y-3">
          {/* Live Classes */}
          {todayClasses.map((liveClass) => {
            const status = getClassStatus(liveClass);
            const isLive = status === 'ongoing';
            const canJoin = canJoinClass(liveClass);
            
            return (
              <div
                key={liveClass.live_class_id}
                className={`p-3 rounded-lg border-l-4 ${
                  isLive ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{liveClass.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {liveClass.subjects?.name} • {liveClass.start_time} - {liveClass.end_time}
                    </div>
                    <div className="text-xs text-gray-500">
                      Teacher: {liveClass.teachers?.users?.first_name} {liveClass.teachers?.users?.last_name || 'TBA'}
                    </div>
                  </div>
                  {canJoin && (
                    <a
                      href={liveClass.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                        isLive ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                       {isLive ? 'Join Now' : 'Join'}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Regular Scheduled Classes */}
          {todaysScheduledClasses.map((scheduledClass) => (
            <div
              key={scheduledClass.timetable_id}
              className="p-3 rounded-lg border-l-4 border-purple-400 bg-purple-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">Regular Class</h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Scheduled
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {scheduledClass.subjects?.name || 'Subject'} • {scheduledClass.start_time} - {scheduledClass.end_time}
                  </div>
                  <div className="text-xs text-gray-500">
                    Regular scheduled class
                  </div>
                </div>
                {scheduledClass.meeting_link && (
                  <a
                    href={scheduledClass.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Join
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function TeachersAssigned({ teachers }: { teachers: Array<{ name?: string; subject?: string }> }) {
  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          <span className="font-semibold">Your Teachers</span>
        </div>
        <div className="text-gray-600 text-sm">No teachers assigned yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center mb-4">
        <Users className="w-5 h-5 mr-2 text-blue-600" />
        <span className="font-semibold">Your Teachers</span>
      </div>
      <div className="space-y-2">
        {teachers.slice(0, 3).map((teacher, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{String(teacher.name || '')}</div>
              <div className="text-sm text-gray-600">{String(teacher.subject || '')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatestResources({ resources }: { resources: Array<{ title?: string; subject?: string }> }) {
  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex items-center mb-2">
          <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
          <span className="font-semibold">Latest Resources</span>
        </div>
        <div className="text-gray-600 text-sm">Recent materials for your subjects will appear here.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center mb-2">
        <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
        <span className="font-semibold">Latest Resources</span>
      </div>
      <div className="space-y-2">
        {resources.slice(0, 3).map((resource, index) => (
          <div key={index} className="text-sm">
            <div className="font-medium text-gray-900">{String(resource.title || '')}</div>
            <div className="text-gray-600">{String(resource.subject || '')}</div>
          </div>
        ))}
        
        {/* View All Resources Link */}
        {resources.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <Link 
              href="/resources" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Resources →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [teachers, setTeachers] = useState<Array<Record<string, unknown>>>([]);
  const [resources, setResources] = useState<Array<Record<string, unknown>>>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]); // Added state for announcements
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get student's program
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser?.user?.id) return;
        
        const userId = authUser.user.id;
        
        const { data: userData } = await supabase
          .from('users')
          .select('curriculum')
          .eq('id', userId)
          .single();
        
        const programId = userData?.curriculum;
        
        if (!programId) {
          setLoading(false);
          return;
        }

        // Fetch today's live classes - use UTC to avoid timezone issues
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayUTC = format(new Date().toISOString().split('T')[0], 'yyyy-MM-dd');
        

        
        // Get student's actual program_id and level_id from the database
        const { data: studentData } = await supabase
          .from('users')
          .select('program_id, level_id')
          .eq('id', userId)
          .single();
        
        const actualProgramId = studentData?.program_id;
        const actualLevelId = studentData?.level_id;
        

        
        // Build the query with proper Supabase syntax
        let liveClassQuery = supabase
          .from('live_classes')
          .select(`
            *,
            subjects:subject_id (name),
            teachers:teacher_id (
              teacher_id,
              users:user_id (first_name, last_name)
            )
          `)
          .or(`scheduled_date.eq.${today},scheduled_date.eq.${todayUTC}`)
          .order('start_time', { ascending: true });
        
        // Add filters for program_id OR level_id
        if (actualProgramId && actualLevelId) {
          // Use or() for different columns with proper syntax
          liveClassQuery = liveClassQuery.or(`program_id.eq.${actualProgramId},level_id.eq.${actualLevelId}`);
        } else if (actualProgramId) {
          liveClassQuery = liveClassQuery.eq('program_id', actualProgramId);
        } else if (actualLevelId) {
          liveClassQuery = liveClassQuery.eq('level_id', actualLevelId);
        }
        
        const { data: liveClassData } = await liveClassQuery;


        
        if (liveClassData) {
          const processedClasses: LiveClass[] = liveClassData.map((item: Record<string, unknown>) => ({
            ...item,
            meeting_platform: (item.meeting_platform as string) || 'Google Meet',
            status: (item.status as string) || 'scheduled',
            title: (item.title as string) || 'Live Class',
            description: (item.description as string) || ''
          })) as unknown as LiveClass[];
          setLiveClasses(processedClasses);
        }

        // Fetch student's timetable
        const { data: timetableData } = await supabase
          .from('timetables')
          .select(`
            timetable_id,
            day_of_week,
            start_time,
            end_time,
            subject_id,
            subjects:subject_id (name),
            meeting_link
          `)
          .eq('user_id', userId);

        if (timetableData) {
          const processedTimetable: ScheduledClass[] = timetableData.map((item: Record<string, unknown>) => ({
            timetable_id: item.timetable_id as string,
            day_of_week: item.day_of_week as string,
            start_time: item.start_time as string,
            end_time: item.end_time as string,
            subject_id: item.subject_id as string,
            subjects: item.subjects as { name: string },
            meeting_link: item.meeting_link as string
          }));
          setScheduledClasses(processedTimetable);
        }

        // Fetch real teachers data using actual program_id
        const { data: teachersData } = await supabase
          .from('teachers')
          .select(`
            teacher_id,
            users:user_id (first_name, last_name),
            program_id
          `)
          .eq('program_id', actualProgramId || '');

        if (teachersData) {
          const uniqueTeachers = teachersData
            .filter(t => t.users && t.program_id === actualProgramId)
            .map(t => ({
              name: `${t.users?.first_name || ''} ${t.users?.last_name || ''}`.trim() || 'Unknown Teacher',
              subject: 'Assigned Teacher' // We'll get subjects from teacher_assignments if needed
            }))
            .filter((teacher, index, self) => 
              index === self.findIndex(t => t.name === teacher.name)
            );
          setTeachers(uniqueTeachers);
          

        }

                // Fetch real resources data using actual program_id
        const { data: resourcesData } = await supabase
          .from('resources')
          .select(`
            title,
            subjects:subject_id (name),
            created_at
          `)
          .eq('program_id', actualProgramId || '')
          .order('created_at', { ascending: false })
          .limit(5);

        if (resourcesData) {
          const processedResources = resourcesData.map((resource: Record<string, unknown>) => ({
            title: (resource.title as string) || 'Untitled Resource',
            subject: (resource.subjects as Record<string, unknown>)?.name || 'Unknown Subject',
            created_at: resource.created_at as string
          }));
          setResources(processedResources);
          

        }

        // Fetch announcements from messages table
        const { data: announcementsData } = await supabase
          .from('messages')
          .select(`
            id,
            subject,
            body,
            created_at
          `)
          .eq('message_type', 'announcement')
          .order('created_at', { ascending: false })
          .limit(3);

        if (announcementsData) {
          const processedAnnouncements = announcementsData.map((announcement: Record<string, unknown>) => ({
            id: announcement.id as string,
            title: (announcement.subject as string) || 'Announcement',
            message: (announcement.body as string) || 'No message content',
            created_at: announcement.created_at as string
          }));
          setAnnouncements(processedAnnouncements);
        }

      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.user_metadata?.full_name || user?.email || 'Student'}</p>
        </div>
        
        {/* Main Body Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <TodaySchedule liveClasses={liveClasses} scheduledClasses={scheduledClasses} />
          <TeachersAssigned teachers={teachers} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LatestResources resources={resources} />
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center mb-4">
              <Megaphone className="w-5 h-5 mr-2 text-orange-600" />
              <span className="font-semibold">Announcements</span>
            </div>
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-3 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                    <p className="text-gray-600">{announcement.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{format(parseISO(announcement.created_at), 'MMM dd, HH:mm')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 text-sm">No announcements at this time.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

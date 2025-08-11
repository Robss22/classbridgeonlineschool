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

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

function TodaySchedule({ liveClasses }: { liveClasses: LiveClass[] }) {
  const todayClasses = liveClasses.filter(liveClass => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return format(parseISO(liveClass.scheduled_date), 'yyyy-MM-dd') === today;
  });

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

  if (todayClasses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex items-center mb-2">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          <span className="font-semibold">Today's Schedule</span>
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
          <span className="font-semibold">Today's Live Classes</span>
          <span className="ml-2 text-sm text-gray-500">({todayClasses.length})</span>
        </div>
        <div className="space-y-3">
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
        </div>
      </div>
    </Link>
  );
}

function TeachersAssigned({ teachers }: { teachers: any[] }) {
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
              <div className="font-medium text-gray-900">{teacher.name}</div>
              <div className="text-sm text-gray-600">{teacher.subject}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LatestResources({ resources }: { resources: any[] }) {
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
            <div className="font-medium text-gray-900">{resource.title}</div>
            <div className="text-gray-600">{resource.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
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
          console.warn('No program assigned to student');
          setLoading(false);
          return;
        }

        // Fetch today's live classes
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: liveClassData } = await supabase
          .from('live_classes')
          .select(`
            *,
            subjects:subject_id (name),
            teachers:teacher_id (
              teacher_id,
              users:user_id (first_name, last_name)
            )
          `)
          .eq('program_id', programId)
          .gte('scheduled_date', today)
          .lte('scheduled_date', today)
          .order('start_time', { ascending: true });

        if (liveClassData) {
          const processedClasses: LiveClass[] = liveClassData.map((item: any) => ({
            ...item,
            meeting_platform: item.meeting_platform || 'Google Meet',
            status: item.status || 'scheduled',
            title: item.title || 'Live Class',
            description: item.description || ''
          }));
          setLiveClasses(processedClasses);
        }

        // Fetch real teachers data
        const { data: teachersData } = await supabase
          .from('teachers')
          .select(`
            teacher_id,
            users:user_id (first_name, last_name),
            program_id
          `)
          .eq('program_id', programId);

        if (teachersData) {
          const uniqueTeachers = teachersData
            .filter(t => t.users && t.program_id === programId)
            .map(t => ({
              name: `${t.users?.first_name || ''} ${t.users?.last_name || ''}`.trim() || 'Unknown Teacher',
              subject: 'Assigned Teacher' // We'll get subjects from teacher_assignments if needed
            }))
            .filter((teacher, index, self) => 
              index === self.findIndex(t => t.name === teacher.name)
            );
          setTeachers(uniqueTeachers);
        }

        // Fetch real resources data
        const { data: resourcesData } = await supabase
          .from('resources')
          .select(`
            title,
            subjects:subject_id (name),
            created_at
          `)
          .eq('program_id', programId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (resourcesData) {
          const processedResources = resourcesData.map((resource: any) => ({
            title: resource.title || 'Untitled Resource',
            subject: resource.subjects?.name || 'Unknown Subject',
            created_at: resource.created_at
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
          const processedAnnouncements = announcementsData.map((announcement: any) => ({
            id: announcement.id,
            title: announcement.subject || 'Announcement',
            message: announcement.body || 'No message content',
            created_at: announcement.created_at
          }));
          setAnnouncements(processedAnnouncements);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
        {/* Dashboard Content Section */}
        <hr className="my-4 border-t-2 border-gray-200" />
        <hr className="my-4 border-t-2 border-gray-200" />
        {/* Main Body Content starts below the line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 mt-12">
          <TodaySchedule liveClasses={liveClasses} />
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

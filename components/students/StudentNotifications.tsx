import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Video, Clock, X, CheckCircle } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface LiveClassNotification {
  live_class_id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  subjects?: { name: string };
  teachers?: { 
    users?: { 
      first_name: string; 
      last_name: string 
    } 
  };
}

interface Notification {
  id: string;
  type: 'live_class' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  live_class?: LiveClassNotification;
}

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
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
        
        if (!programId) return;

        // Fetch upcoming live classes for notifications
        const now = new Date();
        const thirtyMinutesFromNow = addMinutes(now, 30);
        
        const { data: liveClassData } = await supabase
          .from('live_classes')
          .select(`
            live_class_id,
            title,
            scheduled_date,
            start_time,
            end_time,
            meeting_link,
            subjects:subject_id (name),
            teachers:teacher_id (
              users:user_id (first_name, last_name)
            )
          `)
          .eq('program_id', programId)
          .gte('scheduled_date', format(now, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(now, 'yyyy-MM-dd'))
          .gte('start_time', format(now, 'HH:mm:ss'))
          .lte('start_time', format(thirtyMinutesFromNow, 'HH:mm:ss'))
          .eq('status', 'scheduled')
          .order('start_time', { ascending: true });

        // Create live class notifications
        const liveClassNotifications: Notification[] = (liveClassData as any[] || []).map((liveClass: any) => {
          const startTime = new Date(`${liveClass.scheduled_date}T${liveClass.start_time}`);
          const timeUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
          
          return {
            id: `live_${liveClass.live_class_id}`,
            type: 'live_class',
            title: 'Live Class Starting Soon',
            message: `${(liveClass.title || 'Live Class')} starts in ${timeUntilStart} minutes`,
            timestamp: new Date().toISOString(),
            read: false,
            action_url: liveClass.meeting_link,
            live_class: liveClass as LiveClassNotification
          };
        });

        // Combine with any existing notifications
        const allNotifications = [...liveClassNotifications];
        setNotifications(allNotifications);
        setUnreadCount(allNotifications.filter(n => !n.read).length);

      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'live_class') {
      return <Video className="w-5 h-5 text-blue-600" />;
    }
    return <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getTimeUntilClass = (liveClass: LiveClassNotification) => {
    const now = new Date();
    const startTime = new Date(`${liveClass.scheduled_date}T${liveClass.start_time}`);
    const timeUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (timeUntilStart <= 0) return 'Starting now';
    if (timeUntilStart < 60) return `${timeUntilStart} minutes`;
    const hours = Math.floor(timeUntilStart / 60);
    const minutes = timeUntilStart % 60;
    return `${hours}h ${minutes}m`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            {/* Live Class Specific Info */}
                            {notification.type === 'live_class' && notification.live_class && (
                              <div className="bg-white rounded p-2 mb-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{getTimeUntilClass(notification.live_class)}</span>
                                </div>
                                <div className="text-xs text-gray-700">
                                  <div>Subject: {notification.live_class.subjects?.name}</div>
                                  <div>Teacher: {notification.live_class.teachers?.users?.first_name} {notification.live_class.teachers?.users?.last_name}</div>
                                  <div>Time: {notification.live_class.start_time} - {notification.live_class.end_time}</div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              {notification.action_url && (
                                <a
                                  href={notification.action_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  <Video className="w-3 h-3" />
                                  Join Class
                                </a>
                              )}
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}

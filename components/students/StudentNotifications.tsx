'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Bell, X, Check } from 'lucide-react';

interface Message {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  message_type?: string;
  sender_type?: string;
  recipient_type?: string;
}

export default function StudentNotifications() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'student')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const messageList = (data || []).map((msg: Record<string, unknown>) => ({
        id: String(msg.id || ''),
        title: (() => {
          const title = msg.subject || msg.body || 'Message';
          const titleStr = typeof title === 'string' ? title : String(title);
          return titleStr.length > 50 ? titleStr.substring(0, 50) : titleStr;
        })(),
        body: String(msg.body || ''),
        created_at: String(msg.created_at || ''),
        read: Boolean(msg.read || false),
        message_type: String(msg.message_type || 'general'),
        sender_type: String(msg.sender_type || 'system'),
        recipient_type: String(msg.recipient_type || 'student')
      })) as Message[];

      setMessages(messageList);
      setUnreadCount(messageList.filter((msg) => !msg.read).length);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    
    // Set up real-time updates for messages
    const channel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMessages]);

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, read: true }
            : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('recipient_id', user?.id || '')
        .eq('read', false);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => ({ ...msg, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      message.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${
                          message.read ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {message.title}
                        </h4>
                        <p className={`text-xs mt-1 ${
                          message.read ? 'text-gray-600' : 'text-blue-700'
                        }`}>
                          {message.body.length > 100 
                            ? `${message.body.substring(0, 100)}...` 
                            : message.body
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(message.created_at)}
                        </p>
                      </div>
                      {!message.read && (
                        <button
                          onClick={() => markAsRead(message.id)}
                          className="ml-2 p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

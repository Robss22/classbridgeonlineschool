'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Megaphone, MailOpen, Archive, CheckCircle } from 'lucide-react';
import { useStudent } from '@/contexts/StudentContext';

const senderStyles = {
  Admin: 'bg-blue-200 text-blue-900',
  Teacher: 'bg-green-200 text-green-900',
  Default: 'bg-gray-200 text-gray-900',
};

const iconForType = type => type === 'announcement' ? <Megaphone className="w-5 h-5 text-blue-700" /> : <MailOpen className="w-5 h-5 text-green-700" />;

export default function MessagesPage() {
  const { studentInfo } = useStudent();
  const [messages, setMessages] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real fetch based on studentInfo.class/program
      async function fetchMessages() {
    setLoading(true);
    // Example: fetch all messages for now
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    setLoading(false);
  }
    fetchMessages();
  }, [studentInfo.class, studentInfo.program]);

  const markAsRead = async (id) => {
    await supabase.from('messages').update({ read: true }).eq('message_id', id);
    setMessages(msgs => msgs.map(m => m.message_id === id ? { ...m, read: true } : m));
  };
  const archive = async (id) => {
    await supabase.from('messages').update({ archived: true }).eq('message_id', id);
    setMessages(msgs => msgs.filter(m => m.message_id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Megaphone className="w-6 h-6 text-blue-700" /> Messages & Announcements</h1>
      <div className="max-h-[70vh] overflow-y-auto space-y-4">
        {loading ? (
          <div className="p-6 text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No messages found.</div>
        ) : (
          messages.map(msg => {
            const senderType = msg.sender_type || 'Default';
            return (
              <div key={msg.message_id} className={`rounded-2xl border shadow-md hover:shadow-lg transition-shadow bg-white p-4 flex flex-col gap-2 ${msg.read ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-2">
                  {iconForType(msg.type)}
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${senderStyles[senderType] || senderStyles.Default}`}>{msg.sender_type || 'Unknown'}</span>
                  <span className="font-semibold text-base flex-1">{msg.title}</span>
                  <span className="text-xs text-gray-500">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${msg.read ? 'bg-green-200 text-green-900' : 'bg-blue-700 text-white hover:bg-blue-900'}`}
                    onClick={() => markAsRead(msg.message_id)}
                    disabled={msg.read}
                  >
                    <CheckCircle className="w-4 h-4" /> {msg.read ? 'Read' : 'Mark as Read'}
                  </button>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-900 font-semibold hover:bg-gray-300 transition-colors"
                    onClick={() => archive(msg.message_id)}
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                </div>
                <button
                  className="text-blue-700 underline text-sm text-left"
                  onClick={() => setExpanded(expanded === msg.message_id ? null : msg.message_id)}
                >
                  {expanded === msg.message_id ? 'Hide Details' : 'Show Details'}
                </button>
                {expanded === msg.message_id && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-xl text-gray-800 whitespace-pre-line">{msg.body}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 
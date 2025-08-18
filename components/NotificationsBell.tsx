'use client';
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface NotificationItem { id: string; title: string; message: string; read: boolean; action_url?: string }

export default function NotificationsBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const fetchFeed = async () => {
    try {
      const token = (await (await import('@/lib/supabaseClient')).supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;
      const res = await fetch('/api/notifications/feed', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setItems(json.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchFeed();
    const id = setInterval(fetchFeed, 60000);
    return () => clearInterval(id);
  }, []);

  const unread = items.filter(i => !i.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
        <Bell className="w-6 h-6" />
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 font-semibold border-b">Notifications</div>
          <div className="p-2 space-y-2">
            {items.length === 0 ? <div className="text-center text-gray-500 py-6">No notifications</div> : items.map(i => (
              <div key={i.id} className={`p-3 rounded border ${i.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                <div className="font-medium text-sm">{i.title}</div>
                <div className="text-sm text-gray-600">{i.message}</div>
                {i.action_url && <a className="text-xs text-blue-700 underline" href={i.action_url} target="_blank" rel="noreferrer">Open</a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



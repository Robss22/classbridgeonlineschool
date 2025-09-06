"use client";
import React, { useState, useEffect } from "react";
import { Megaphone, Inbox, Send } from "lucide-react";
import FileUpload from "@/components/FileUpload";
// import FileDownload from "@/components/FileDownload";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from '@/contexts/AuthContext';

type UserMini = { full_name?: string; email?: string };
type MessageItem = {
  id: string;
  subject?: string;
  body?: string;
  created_at?: string;
  sender_id?: string;
  recipient_id?: string;
  parent_id?: string | null;
  sender?: UserMini | null;
  recipient?: UserMini | null;
};

const TABS = [
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
];

export default function TeacherMessagesPage() {
  const [tab, setTab] = useState("announcements");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    recipient: "all",
    fileUrl: "",
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [announcements, setAnnouncements] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const [inbox, setInbox] = useState<MessageItem[]>([]);
  const [sent, setSent] = useState<MessageItem[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [inboxError, setInboxError] = useState("");
  const [sentError, setSentError] = useState("");
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [thread, setThread] = useState<MessageItem[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  // Fetch announcements
  useEffect(() => {
    if (tab !== "announcements") return;
    setLoading(true);
    setFetchError("");
    supabase
      .from("messages")
      .select("*, sender:sender_id (full_name, email)")
      .eq("message_type", "announcement")
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }) => {
        if (error) setFetchError(error.message);
        setAnnouncements((data || []).map(d => ({
          id: d.id as string,
          subject: (d.subject as string) ?? '',
          body: (d.body as string) ?? '',
          created_at: (d.created_at as string) ?? undefined,
          sender: (d.sender as UserMini) ?? null,
        })) || []);
        setLoading(false);
      });
  }, [tab, showModal]);

  // Fetch Inbox
  useEffect(() => {
    if (tab !== "inbox" || !user) return;
    setLoadingInbox(true);
    setInboxError("");
    supabase
      .from("messages")
      .select("*, sender:sender_id (full_name, email)")
      .eq("recipient_id", user.id)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }) => {
        if (error) setInboxError(error.message);
        setInbox((data || []).map(d => ({
          id: d.id as string,
          subject: (d.subject as string) ?? '',
          body: (d.body as string) ?? '',
          created_at: (d.created_at as string) ?? undefined,
          sender: (d.sender as UserMini) ?? null,
          sender_id: d.sender_id as string,
          recipient_id: d.recipient_id as string,
          parent_id: d.parent_id as string | null,
        })) || []);
        setLoadingInbox(false);
      });
  }, [tab, user]);

  // Fetch Sent
  useEffect(() => {
    if (tab !== "sent" || !user) return;
    setLoadingSent(true);
    setSentError("");
    supabase
      .from("messages")
      .select("*, recipient:recipient_id (full_name, email)")
      .eq("sender_id", user.id)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }) => {
        if (error) setSentError(error.message);
        setSent((data || []).map(d => ({
          id: d.id as string,
          subject: (d.subject as string) ?? '',
          body: (d.body as string) ?? '',
          created_at: (d.created_at as string) ?? undefined,
          recipient: (d.recipient as UserMini) ?? null,
          sender_id: d.sender_id as string,
          recipient_id: d.recipient_id as string,
          parent_id: d.parent_id as string | null,
        })) || []);
        setLoadingSent(false);
      });
  }, [tab, user]);

  // Fetch thread when a message is expanded
  useEffect(() => {
    if (!expandedMsg) {
      setThread([]);
      setThreadError("");
      return;
    }
    setLoadingThread(true);
    setThreadError("");
    // Find the root id (parent_id or self)
    const rootId = (() => {
      const msg = [...inbox, ...sent].find(m => m.id === expandedMsg);
      return msg?.parent_id || msg?.id;
    })();
    supabase
      .from("messages")
      .select("*, sender:sender_id (full_name, email)")
      .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
      .order("created_at", { ascending: true })
      .then(({ data, error }: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }) => {
        if (error) setThreadError(error.message);
        setThread(((data || [])).map(d => ({
          id: d.id as string,
          subject: (d.subject as string) ?? '',
          body: (d.body as string) ?? '',
          created_at: (d.created_at as string) ?? undefined,
          sender: (d.sender as UserMini) ?? null,
          sender_id: d.sender_id as string,
          recipient_id: d.recipient_id as string,
          parent_id: (d.parent_id as string | null),
        })));
        setLoadingThread(false);
      });
  }, [expandedMsg, inbox, sent]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your messages.</div>;
  }

  // Handle reply
  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplying(true);
    setThreadError("");
    try {
      if (!reply.trim()) throw new Error("Reply cannot be empty");
      // Find the root id
      const rootId = thread[0]?.parent_id || thread[0]?.id;
      // Determine recipient: if user is sender, reply to the other party
      const lastMsg = thread[thread.length - 1];
      if (!lastMsg) {
        setThreadError("No message found in thread");
        setReplying(false);
        return;
      }
      const recipientId = lastMsg.sender_id === user.id ? lastMsg.recipient_id : lastMsg.sender_id;
      if (!recipientId) {
        setThreadError("Invalid recipient");
        setReplying(false);
        return;
      }
      if (!rootId) {
        setThreadError("Invalid thread context");
        setReplying(false);
        return;
      }
      const { error } = await supabase.from("messages").insert({
        subject: lastMsg.subject ?? "(No Subject)",
        body: reply,
        sender_id: user.id,
        recipient_id: recipientId,
        message_type: "message",
        sender_type: "Teacher",
        recipient_type: "teacher",
        parent_id: rootId ?? null,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setReply("");
      // Refresh thread
      setLoadingThread(true);
      supabase
        .from("messages")
        .select("*, sender:sender_id (full_name, email)")
        .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
        .order("created_at", { ascending: true })
        .then(({ data, error }: { data: Array<Record<string, unknown>> | null; error: { message: string } | null }) => {
          if (error) setThreadError(error.message);
          setThread(((data || [])).map(d => ({
            id: d.id as string,
            subject: (d.subject as string) ?? '',
            body: (d.body as string) ?? '',
            created_at: (d.created_at as string) ?? undefined,
            sender: (d.sender as UserMini) ?? null,
            sender_id: d.sender_id as string,
            recipient_id: d.recipient_id as string,
            parent_id: (d.parent_id as string | null),
          })));
          setLoadingThread(false);
        });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setThreadError(errorMessage || "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      if (!form.title || !form.message) throw new Error("Title and message are required");
      const { error } = await supabase.from("messages").insert({
        subject: form.title,
        body: form.message,
        sender_id: user.id,
        recipient_id: user.id, // Use teacher's own ID for announcements
        message_type: "announcement",
        sender_type: "Teacher", // Capitalized to match constraint - valid values are "Admin", "Teacher", "Default"
        recipient_type: "teacher", // This will be used to identify announcements
        created_at: new Date().toISOString(),
        // Note: file_url would need to be handled separately if needed
      });
      if (error) throw error;
      setSuccess("Announcement sent!");
      setForm({ title: "", message: "", recipient: "all", fileUrl: "" });
      setShowModal(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage || "Failed to send announcement");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-blue-700" /> Messages & Announcements
      </h1>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              tab === key
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
            }`}
          >
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {tab === "announcements" && (
        <div className="bg-white rounded-xl shadow p-6 min-h-[200px] flex flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Announcements</h2>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors"
              onClick={() => setShowModal(true)}
            >
              <Megaphone className="w-5 h-5" /> Send Announcement
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : fetchError ? (
            <div className="text-red-600 text-center py-8">{fetchError}</div>
          ) : announcements.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No announcements yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {announcements.map(a => (
                <li key={a.id} className="py-4">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                    <div>
                      <div className="font-semibold text-blue-900">{a.subject}</div>
                      <div className="text-xs text-gray-500">{new Date(a.created_at ?? '').toLocaleString()} &bull; Announcement</div>
                    </div>
                    <button className="text-blue-600 text-xs underline">{expanded === a.id ? "Hide" : "View"}</button>
                  </div>
                  {expanded === a.id && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-4">
                      <div className="mb-2 text-gray-800 whitespace-pre-line">{a.body}</div>
                      {/* Note: file_url handling would need to be implemented if needed */}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === "inbox" && (
        <div className="bg-white rounded-xl shadow p-6 min-h-[200px] flex flex-col gap-4">
          <h2 className="text-lg font-semibold mb-4">Inbox</h2>
          {loadingInbox ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : inboxError ? (
            <div className="text-red-600 text-center py-8">{inboxError}</div>
          ) : inbox.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No messages in your inbox.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {inbox.map(m => (
                <li key={m.id} className="py-4">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedMsg(expandedMsg === m.id ? null : (m.id ?? null))}>
                    <div>
                      <div className="font-semibold text-blue-900">{m.subject || "(No Subject)"}</div>
                      <div className="text-xs text-gray-500">From: {m.sender?.full_name || m.sender_id} &bull; {new Date(m.created_at ?? '').toLocaleString()}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{m.body?.slice(0, 60) || "(No message)"}</div>
                    </div>
                    <button className="text-blue-600 text-xs underline">{expandedMsg === m.id ? "Hide" : "View"}</button>
                  </div>
                  {expandedMsg === m.id && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-4">
                      {loadingThread ? (
                        <div className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                      ) : threadError ? (
                        <div className="text-red-600 text-center py-4">{threadError}</div>
                      ) : (
                        <>
                          <div className="mb-4 space-y-3">
                           {thread.map(msg => (
                              <div key={msg.id ?? Math.random().toString(36)} className="bg-white rounded shadow p-3">
                                <div className="text-xs text-gray-500 mb-1">{msg.sender?.full_name || msg.sender_id} &bull; {new Date(msg.created_at ?? '').toLocaleString()}</div>
                                <div className="text-gray-800 whitespace-pre-line">{msg.body}</div>
                              </div>
                            ))}
                          </div>
                          <form className="flex gap-2 mt-2" onSubmit={handleReply}>
                            <input
                              type="text"
                              value={reply}
                              onChange={e => setReply(e.target.value)}
                              placeholder="Type your reply..."
                              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              disabled={!!replying}
                            />
                            <button
                              type="submit"
                              disabled={replying || !reply.trim()}
                              className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
                            >
                              {replying ? "Sending..." : "Reply"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === "sent" && (
        <div className="bg-white rounded-xl shadow p-6 min-h-[200px] flex flex-col gap-4">
          <h2 className="text-lg font-semibold mb-4">Sent Messages</h2>
          {loadingSent ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : sentError ? (
            <div className="text-red-600 text-center py-8">{sentError}</div>
          ) : sent.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No sent messages yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sent.map(m => (
                <li key={m.id} className="py-4">
                   <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedMsg(expandedMsg === m.id ? null : (m.id ?? null))}>
                    <div>
                      <div className="font-semibold text-blue-900">{m.subject || "(No Subject)"}</div>
                      <div className="text-xs text-gray-500">To: {m.recipient?.full_name || m.recipient_id} &bull; {new Date(m.created_at ?? '').toLocaleString()}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{m.body?.slice(0, 60) || "(No message)"}</div>
                    </div>
                    <button className="text-blue-600 text-xs underline">{expandedMsg === m.id ? "Hide" : "View"}</button>
                  </div>
                  {expandedMsg === m.id && (
                    <div className="mt-3 bg-blue-50 rounded-lg p-4">
                      {loadingThread ? (
                        <div className="animate-pulse h-16 bg-gray-100 rounded-lg" />
                      ) : threadError ? (
                        <div className="text-red-600 text-center py-4">{threadError}</div>
                      ) : (
                        <>
                          <div className="mb-4 space-y-3">
                          {thread.map(msg => (
                              <div key={msg.id ?? Math.random().toString(36)} className="bg-white rounded shadow p-3">
                                <div className="text-xs text-gray-500 mb-1">{msg.sender?.full_name || msg.sender_id} &bull; {new Date(msg.created_at ?? '').toLocaleString()}</div>
                                <div className="text-gray-800 whitespace-pre-line">{msg.body}</div>
                              </div>
                            ))}
                          </div>
                          <form className="flex gap-2 mt-2" onSubmit={handleReply}>
                            <input
                              type="text"
                              value={reply}
                              onChange={e => setReply(e.target.value)}
                              placeholder="Type your reply..."
                              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              disabled={!!replying}
                            />
                            <button
                              type="submit"
                              disabled={replying || !reply.trim()}
                              className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
                            >
                              {replying ? "Sending..." : "Reply"}
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Send Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-blue-700" /> Send Announcement</h2>
            <form className="space-y-4" onSubmit={handleSend}>
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Type your announcement..."
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Recipient</label>
                <select
                  name="recipient"
                  value={form.recipient}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">All Students</option>
                  <option value="class">My Class</option>
                </select>
              </div>
              <div>
                <FileUpload
                  bucket="announcements"
                  folder={""}
                  onUpload={url => setForm(f => ({ ...f, fileUrl: url }))}
                  label="Attach File (optional)"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt"
                />
                {form.fileUrl && (
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">File attached</a>
                )}
              </div>
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              <button
                type="submit"
                disabled={!!sending}
                className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:bg-blue-300 mt-2"
              >
                {sending ? "Sending..." : "Send Announcement"}
              </button>
              {success && <div className="text-green-600 text-sm text-center mt-2">{success}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 

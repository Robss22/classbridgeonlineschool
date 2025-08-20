"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/lib/supabaseClient";
import { Users, UploadCloud } from "lucide-react";
import Image from 'next/image';

export default function TeacherProfilePage() {
  const { user, loading: authLoading } = useAuth();
  type Profile = { id: string; email: string; full_name?: string | null; first_name?: string | null; last_name?: string | null } | null;
  const [profile, setProfile] = useState<Profile>(null);

  const [classes, setClasses] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      // Fetch user profile
      const { data: userData } = await supabase
        .from("users")
        .select("id, email, full_name, first_name, last_name")
  .eq("auth_user_id", user?.id ?? "")
        .single();
      setProfile((userData as { id: string; email: string; full_name?: string | null; first_name?: string | null; last_name?: string | null }) ?? null);
      setAvatarUrl("");
      
      // First, get the teacher_id from the teachers table
      const { data: teacherRecord, error: teacherRecordError } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('user_id', user?.id ?? '')
        .single();

      if (teacherRecordError) {
        console.error('Error fetching teacher record:', teacherRecordError);
        setClasses([]);
        setSubjects([]);
        return;
      }

      // Fetch assignments using teacher_id
      const { data: assignData } = await supabase
        .from("teacher_assignments")
        .select("subject_id, level_id, subjects:subject_id (name), levels:level_id (name)")
        .eq("teacher_id", teacherRecord.teacher_id);
      setClasses([
        ...new Set(
          (assignData || [])
            .map((a: Record<string, unknown>) => (a?.levels as { name?: string } | undefined)?.name)
            .filter(Boolean)
        ),
      ] as string[]);
      setSubjects([
        ...new Set(
          (assignData || [])
            .map((a: Record<string, unknown>) => (a?.subjects as { name?: string } | undefined)?.name)
            .filter(Boolean)
        ),
      ] as string[]);
    }
    fetchProfile();
  }, [user]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">Please log in to view your profile.</div>;
  }

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('Upload timed out')), ms);
      promise
        .then((res) => { clearTimeout(id); resolve(res); })
        .catch((err) => { clearTimeout(id); reject(err); });
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/profile.${ext}`;
      const { error: uploadError } = await withTimeout(
        supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true }),
        20000
      );
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const url = publicUrlData?.publicUrl;
      setAvatarUrl(url);
      // Update user profile
      // No avatar_url column in users schema; storing only in storage/public URL state
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorDescription = (err as Record<string, unknown>)?.error_description;
      alert("Avatar upload failed: " + (errorMessage || errorDescription || "Unknown error"));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg("");
    try {
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
      
      // Step 1: Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      
      // Step 2: Update password_changed flag in users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ password_changed: true })
        .eq('auth_user_id', user.id);
      
      if (dbError) {
        console.error('Failed to update password_changed flag:', dbError);
        // Don't throw here as the password was already updated in Auth
      }
      
      setPasswordMsg("Password updated successfully.");
      setPassword("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorDescription = (err as Record<string, unknown>)?.error_description;
      setPasswordMsg("Error: " + (errorMessage || errorDescription || "Unknown error"));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-700" /> Profile & Settings
      </h1>
      {/* Profile + Change Password Row */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch mb-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow p-6 flex-1 flex flex-col md:max-w-[60%]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" width={112} height={112} className="w-full h-full object-cover" />
              ) : (
                <span className="w-16 h-16 flex items-center justify-center text-gray-400">No Image</span>
              )}
            </div>
            <label className="mt-2 inline-block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                ref={fileInputRef}
                disabled={!!avatarUploading}
              />
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors cursor-pointer text-sm">
                <UploadCloud className="w-4 h-4" /> {avatarUploading ? "Uploading..." : "Change Photo"}
              </span>
            </label>
          </div>
          <div className="flex-1 flex flex-col gap-3 mt-4">
            <div className="font-semibold text-lg text-center md:text-left">{profile?.full_name || profile?.first_name + " " + profile?.last_name || "-"}</div>
            <div className="text-gray-600 text-sm text-center md:text-left">{profile?.email || "-"}</div>
            <div className="mt-4">
              <div className="font-semibold mb-1">Assigned Classes</div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(classes) && classes.length ? classes.join(', ') : '-'}
              </div>
            </div>
            <div className="mt-2">
              <div className="font-semibold mb-1">Assigned Subjects</div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(subjects) && subjects.length ? subjects.join(', ') : '-'}
              </div>
            </div>
          </div>
        </div>
        {/* Change Password Card */}
        <div className="bg-white rounded-xl shadow p-6 flex-1 flex flex-col max-w-md mx-auto md:mx-0 md:max-w-[40%] justify-center">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div className="font-semibold text-lg mb-2 text-center md:text-left">Change Password</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New Password"
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              minLength={6}
              required
              disabled={!!passwordLoading}
            />
            <button
              type="submit"
              disabled={!!passwordLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
            {passwordMsg && <div className={passwordMsg.startsWith("Error") ? "text-red-600" : "text-green-700"}>{passwordMsg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
} 
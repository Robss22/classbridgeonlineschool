'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Calendar
} from 'lucide-react';

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
  teacher_id: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  paper_id: string;
  live_class_participants?: LiveClassParticipant[];
}

interface LiveClassParticipant {
  participant_id: string;
  user_id: string;
  live_class_id: string;
  duration_minutes?: number;
  connection_quality?: 'good' | 'fair' | 'poor';
  participation_score?: number;
  audio_enabled?: boolean;
  video_enabled?: boolean;
}

interface AnalyticsData {
  totalClasses: number;
  totalParticipants: number;
  averageAttendance: number;
  averageDuration: number;
  connectionQuality: {
    good: number;
    fair: number;
    poor: number;
  };
  platformUsage: {
    'Jitsi Meet': number;
    'Google Meet': number;
    'Zoom': number;
  };
  attendanceTrend: Array<{
    date: string;
    attendance: number;
    classes: number;
  }>;
  participationScores: Array<{
    range: string;
    count: number;
  }>;
  technicalIssues: Array<{
    issue: string;
    count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function LiveClassAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days

  const getParticipationRange = useCallback((score: number): string => {
    if (score >= 90) return '90-100%';
    if (score >= 80) return '80-89%';
    if (score >= 70) return '70-79%';
    if (score >= 60) return '60-69%';
    return 'Below 60%';
  }, []);

  const calculateAttendanceTrend = useCallback((liveClasses: LiveClass[]): Array<{ date: string; attendance: number; classes: number }> => {
    const trend: { [key: string]: { attendance: number; classes: number } } = {};
    
    liveClasses.forEach(liveClass => {
      const date = liveClass.scheduled_date;
      if (!trend[date]) {
        trend[date] = { attendance: 0, classes: 0 };
      }
      trend[date].classes++;
      if (liveClass.live_class_participants) {
        trend[date].attendance += liveClass.live_class_participants.length;
      }
    });

    return Object.entries(trend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const processAnalyticsData = useCallback((liveClasses: LiveClass[]): AnalyticsData => {
    let totalParticipants = 0;
    let totalDuration = 0;
    const connectionQuality = { good: 0, fair: 0, poor: 0 };
    const platformUsage = { 'Jitsi Meet': 0, 'Google Meet': 0, 'Zoom': 0 };
    const participationScores: { [key: string]: number } = {};
    const technicalIssues: { [key: string]: number } = {};

    // Process each class
    liveClasses.forEach(liveClass => {
      platformUsage[liveClass.meeting_platform as keyof typeof platformUsage]++;
      
      if (liveClass.live_class_participants) {
        liveClass.live_class_participants.forEach((participant: LiveClassParticipant) => {
          totalParticipants++;
          
          if (participant.duration_minutes) {
            totalDuration += participant.duration_minutes;
          }

          if (participant.connection_quality) {
            connectionQuality[participant.connection_quality as keyof typeof connectionQuality]++;
          }

          if (participant.participation_score) {
            const range = getParticipationRange(participant.participation_score);
            participationScores[range] = (participationScores[range] || 0) + 1;
          }

          // Track technical issues
          if (!participant.audio_enabled) {
            technicalIssues['No Audio'] = (technicalIssues['No Audio'] || 0) + 1;
          }
          if (!participant.video_enabled) {
            technicalIssues['No Video'] = (technicalIssues['No Video'] || 0) + 1;
          }
          if (participant.connection_quality === 'poor') {
            technicalIssues['Poor Connection'] = (technicalIssues['Poor Connection'] || 0) + 1;
          }
        });
      }
    });

    // Calculate attendance trend
    const attendanceTrend = calculateAttendanceTrend(liveClasses);

    return {
      totalClasses: liveClasses.length,
      totalParticipants,
      averageAttendance: liveClasses.length > 0 ? totalParticipants / liveClasses.length : 0,
      averageDuration: totalParticipants > 0 ? totalDuration / totalParticipants : 0,
      connectionQuality,
      platformUsage,
      attendanceTrend,
      participationScores: Object.entries(participationScores).map(([range, count]) => ({ range, count })),
      technicalIssues: Object.entries(technicalIssues).map(([issue, count]) => ({ issue, count }))
    };
  }, [getParticipationRange, calculateAttendanceTrend]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch live classes data
      const { data: liveClasses, error: classesError } = await supabase
        .from('live_classes')
        .select('*')
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0]);

      if (classesError) throw classesError;

      // Transform database data to match LiveClass interface
      const liveClassesWithParticipants: LiveClass[] = ((liveClasses || []) as Array<Record<string, unknown>>).map((liveClass) => ({
        live_class_id: String(liveClass.live_class_id || ''),
        title: String(liveClass.title || ''),
        description: String(liveClass.description || ''),
        scheduled_date: String(liveClass.scheduled_date || ''),
        start_time: String(liveClass.start_time || ''),
        end_time: String(liveClass.end_time || ''),
        meeting_link: String(liveClass.meeting_link || ''),
        meeting_platform: String(liveClass.meeting_platform || ''),
        status: String(liveClass.status || ''),
        started_at: (liveClass.started_at as string | null) ?? null,
        ended_at: (liveClass.ended_at as string | null) ?? null,
        teacher_id: String(liveClass.teacher_id || ''),
        program_id: String(liveClass.program_id || ''),
        level_id: String(liveClass.level_id || ''),
        subject_id: String(liveClass.subject_id || ''),
        paper_id: String(liveClass.paper_id || ''),
        live_class_participants: []
      }));

      // Process analytics data
      const processedData = processAnalyticsData(liveClassesWithParticipants);
      setAnalyticsData(processedData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [dateRange, processAnalyticsData]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Class Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into live class performance and engagement</p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalParticipants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.averageAttendance.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.averageDuration.toFixed(0)} min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Trend */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="attendance" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="classes" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Usage */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Platform Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analyticsData.platformUsage).map(([platform, count]) => ({ name: platform, value: count }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(analyticsData.platformUsage).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Quality */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Connection Quality</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(analyticsData.connectionQuality).map(([quality, count]) => ({ quality, count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quality" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Participation Scores */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Participation Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.participationScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Technical Issues */}
        {analyticsData.technicalIssues.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Technical Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.technicalIssues.map((issue, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-3" />
                  <div>
                    <p className="font-medium">{issue.issue}</p>
                    <p className="text-sm text-gray-600">{issue.count} occurrences</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

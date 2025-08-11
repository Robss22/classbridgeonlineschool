// app/students/subjects/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, Users, Video, Play, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

type Subject = {
  subject_id: string;
  name: string;
};

type Program = {
  program_id: string;
  name: string;
};

type SubjectOffering = {
  id: string;
  is_compulsory: boolean;
  subjects: Subject;
  programs?: Program;
  teacher?: string;
};

type EnrolledOptional = {
  subject_offering_id: string;
  subject_offerings: SubjectOffering;
};

type LiveClass = {
  live_class_id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: string;
  meeting_link: string;
  subject_id: string;
};

export default function MySubjectsPage() {
  const { user } = useAuth();
  const [compulsorySubjects, setCompulsorySubjects] = useState<SubjectOffering[]>([]);
  const [optionalSubjects, setOptionalSubjects] = useState<EnrolledOptional[]>([]);
  const [availableOptionalSubjects, setAvailableOptionalSubjects] = useState<SubjectOffering[]>([]);
  const [subjectLiveClasses, setSubjectLiveClasses] = useState<Record<string, LiveClass[]>>({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [showAvailableSubjects, setShowAvailableSubjects] = useState(false);

  const fetchSubjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user?.id) return;
      const userId = authUser.user.id;

      // Get student's program from users table
      const { data: userRow } = await supabase
        .from('users')
        .select('curriculum')
        .eq('id', userId)
        .single();
      const programId = (userRow as any)?.curriculum as string | undefined;

      if (!programId) {
        console.warn('No program assigned to student');
        setLoading(false);
        return;
      }

      // 3. Get compulsory subjects
      const { data: compulsory } = await supabase
        .from('subject_offerings')
        .select(`
          id,
          is_compulsory,
          teacher,
          subjects (
            subject_id,
            name
          ),
          programs (
            program_id,
            name
          )
        `)
        .eq('program_id', programId)
        .eq('is_compulsory', true);

      // Only keep valid SubjectOffering objects, skip error objects
      const validCompulsory: SubjectOffering[] = (compulsory || [])
        .filter((s: any) =>
          !s?.error &&
          typeof s?.id === 'string' &&
          typeof s?.is_compulsory === 'boolean' &&
          s?.subjects && typeof s.subjects.name === 'string'
        )
        .map((s: any) => ({
          id: s.id,
          is_compulsory: s.is_compulsory,
          subjects: s.subjects,
          programs: s.programs,
          teacher: s.teacher
        }));
      setCompulsorySubjects(validCompulsory);

      // 4. Get optional subjects the student enrolled in
      const { data: optional } = await supabase
        .from('enrollments')
        .select(`
          subject_offering_id,
          subject_offerings:subject_offering_id (
            id,
            is_compulsory,
            teacher,
            subjects:subject_id (
              subject_id,
              name
            ),
            programs:program_id (
              program_id,
              name
            )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Only keep valid EnrolledOptional objects, skip error objects and null ids
      const validOptional: EnrolledOptional[] = (optional || [])
        .filter((entry: any) =>
          typeof entry?.subject_offering_id === 'string' &&
          entry.subject_offering_id &&
          entry.subject_offerings &&
          !entry.subject_offerings.error &&
          typeof entry.subject_offerings.id === 'string' &&
          entry.subject_offerings.subjects && typeof entry.subject_offerings.subjects.name === 'string'
        )
        .map((entry: any) => ({
          subject_offering_id: entry.subject_offering_id,
          subject_offerings: entry.subject_offerings
        }));
      setOptionalSubjects(validOptional);

      // Fetch live classes for all subjects
      const allSubjectIds = [
        ...validCompulsory.map(s => s.subjects.subject_id),
        ...validOptional.map(s => s.subject_offerings.subjects.subject_id)
      ];

      if (allSubjectIds.length > 0) {
        const { data: liveClassData } = await supabase
          .from('live_classes')
          .select(`
            live_class_id,
            title,
            scheduled_date,
            start_time,
            end_time,
            meeting_link,
            subject_id
          `)
          .in('subject_id', allSubjectIds)
          .gte('scheduled_date', format(new Date(), 'yyyy-MM-dd'))
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (liveClassData) {
          const classesBySubject: Record<string, LiveClass[]> = {};
          liveClassData.forEach((liveClass: any) => {
            // Add default status if not present
            const processedClass: LiveClass = {
              ...liveClass,
              status: liveClass.status || 'scheduled'
            };
            
            if (!classesBySubject[processedClass.subject_id]) {
              classesBySubject[processedClass.subject_id] = [];
            }
            classesBySubject[processedClass.subject_id].push(processedClass);
          });
          setSubjectLiveClasses(classesBySubject);
        }
      }

      // Fetch available optional subjects for enrollment
      const { data: availableOptional } = await supabase
        .from('subject_offerings')
        .select(`
          id,
          is_compulsory,
          teacher,
          subjects (
            subject_id,
            name
          ),
          programs (
            program_id,
            name
          )
        `)
        .eq('program_id', programId)
        .eq('is_compulsory', false);

      if (availableOptional) {
        const validAvailable: SubjectOffering[] = (availableOptional || [])
          .filter((s: any) =>
            !s?.error &&
            typeof s?.id === 'string' &&
            typeof s?.is_compulsory === 'boolean' &&
            s?.subjects && typeof s.subjects.name === 'string'
          )
          .map((s: any) => ({
            id: s.id,
            is_compulsory: s.is_compulsory,
            subjects: s.subjects,
            programs: s.programs,
            teacher: s.teacher
          }));

        // Filter out subjects the student is already enrolled in
        const enrolledSubjectIds = validOptional.map(s => s.subject_offerings.subjects.subject_id);
        const availableForEnrollment = validAvailable.filter(
          s => !enrolledSubjectIds.includes(s.subjects.subject_id)
        );
        
        setAvailableOptionalSubjects(availableForEnrollment);
      }

    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const handleEnrollInSubject = async (subjectOfferingId: string) => {
    if (!user) return;
    
    try {
      setEnrolling(subjectOfferingId);
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user?.id) return;
      const userId = authUser.user.id;

      // Create enrollment record
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([{
          user_id: userId,
          subject_offering_id: subjectOfferingId,
          enrollment_date: new Date().toISOString(),
          status: 'active'
        }]);

      if (enrollError) {
        console.error('Error enrolling in subject:', enrollError);
        alert('Failed to enroll in subject. Please try again.');
        return;
      }

      // Refresh the subjects data
      fetchSubjects();
      alert('Successfully enrolled in subject!');
      
    } catch (error) {
      console.error('Error enrolling in subject:', error);
      alert('Failed to enroll in subject. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const handleWithdrawFromSubject = async (enrollmentId: string) => {
    if (!user) return;
    
    try {
      // Update enrollment status to 'withdrawn'
      const { error: withdrawError } = await supabase
        .from('enrollments')
        .update({ status: 'withdrawn' })
        .eq('id', enrollmentId);

      if (withdrawError) {
        console.error('Error withdrawing from subject:', withdrawError);
        alert('Failed to withdraw from subject. Please try again.');
        return;
      }

      // Refresh the subjects data
      fetchSubjects();
      alert('Successfully withdrew from subject!');
      
    } catch (error) {
      console.error('Error withdrawing from subject:', error);
      alert('Failed to withdraw from subject. Please try again.');
    }
  };

  const getSubjectCard = (subject: SubjectOffering, isCompulsory: boolean = true) => {
    const subjectId = subject.subjects.subject_id;
    const liveClasses = subjectLiveClasses[subjectId] || [];
    const upcomingClasses = liveClasses.filter(lc => 
      lc.status === 'scheduled' || lc.status === 'ongoing'
    );
    const nextClass = upcomingClasses[0];

    return (
      <li
        key={subject.id}
        className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{subject.subjects.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isCompulsory 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isCompulsory ? 'Compulsory' : 'Optional'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Program: {subject.programs?.name || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Teacher: {subject.teacher || 'TBA'}</span>
              </div>
            </div>

            {/* Live Classes Info */}
            {liveClasses.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Live Classes</span>
                  <span className="text-xs text-gray-500">({liveClasses.length} total)</span>
                </div>
                
                {nextClass && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Next: {format(parseISO(nextClass.scheduled_date), 'MMM dd')} at {nextClass.start_time}</span>
                    {nextClass.status === 'ongoing' && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Live Now</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 min-w-fit">
            {/* View Subject Details */}
            <Link
              href={`/students/subjects/${subject.subjects.subject_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <BookOpen className="w-4 h-4" />
              View Details
            </Link>

            {/* Live Classes Button */}
            <Link
              href={`/students/live/${subject.subjects.subject_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Video className="w-4 h-4" />
              Live Classes
            </Link>

            {/* Join Next Class if available */}
            {nextClass && nextClass.status === 'ongoing' && nextClass.meeting_link && (
              <a
                href={nextClass.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Join Now
              </a>
            )}

            {/* Withdraw Button for Optional Subjects */}
            {!isCompulsory && (
              <button
                onClick={() => handleWithdrawFromSubject(subject.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                Withdraw
              </button>
            )}
          </div>
        </div>
      </li>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
        <div className="w-full max-w-5xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-gray-600">Loading your subjects...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subjects</h1>
          <p className="text-gray-600">Manage your enrolled subjects and access live classes</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/students/live-classes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Video className="w-4 h-4" />
            View All Live Classes
          </Link>
          <Link
            href="/students/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Compulsory Subjects</h2>
          {compulsorySubjects.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No compulsory subjects assigned yet.</p>
            </div>
          ) : (
            <ul className="space-y-4 mb-8">
              {compulsorySubjects.map((subject) => getSubjectCard(subject, true))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Optional Subjects</h2>
          {optionalSubjects.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No optional subjects enrolled yet.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {optionalSubjects.map((entry) => getSubjectCard(entry.subject_offerings, false))}
            </ul>
          )}
        </div>

        {/* Available Optional Subjects Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Optional Subjects</h2>
            <button
              onClick={() => setShowAvailableSubjects(!showAvailableSubjects)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showAvailableSubjects ? 'Hide' : 'Show'} Available Subjects
            </button>
          </div>
          
          {showAvailableSubjects && (
            <div>
              {availableOptionalSubjects.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No additional optional subjects available for enrollment.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableOptionalSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{subject.subjects.name}</h3>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-4 h-4" />
                            <span>Program: {subject.programs?.name || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Teacher: {subject.teacher || 'TBA'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEnrollInSubject(subject.id)}
                          disabled={enrolling === subject.id}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            enrolling === subject.id
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {enrolling === subject.id ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

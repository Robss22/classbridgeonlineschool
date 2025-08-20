// app/students/subjects/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Video, Play, BookOpen } from 'lucide-react';
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
  programs?: Program | undefined;
};

type EnrolledOptional = {
  id: string;
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
  const [isS1OrS2, setIsS1OrS2] = useState(false);

  const fetchSubjects = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user?.id) return;
      const userId = authUser.user.id;

      // Get student's program and level from users table
      const { data: userRow } = await supabase
        .from('users')
        .select('program_id, level_id')
        .eq('id', userId)
        .single();
      const programId = (userRow as Record<string, unknown>)?.program_id as string | undefined;
      const levelId = (userRow as Record<string, unknown>)?.level_id as string | undefined;

      if (!programId || !levelId) {
        console.warn('No program/level assigned to student');
        setLoading(false);
        return;
      }

      // Determine if level is S1 or S2
      try {
        const { data: levelRow } = await supabase
          .from('levels')
          .select('name')
          .eq('level_id', levelId)
          .single();
        const levelName = (levelRow as Record<string, unknown>)?.name as string | undefined;
        setIsS1OrS2(levelName === 'S1' || levelName === 'S2');
      } catch {
        setIsS1OrS2(false);
      }

      // 3. Get compulsory subjects (program + level)
      const { data: compulsory } = await supabase
        .from('subject_offerings')
        .select(`
          id,
          is_compulsory,
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
        .eq('level_id', levelId)
        .eq('is_compulsory', true);

      // Only keep valid SubjectOffering objects, skip error objects
      const validCompulsory: SubjectOffering[] = (compulsory || [])
        .filter((s: Record<string, unknown>) =>
          !s?.error &&
          typeof s?.id === 'string' &&
          typeof s?.is_compulsory === 'boolean' &&
          s?.subjects && typeof (s.subjects as Record<string, unknown>).name === 'string' &&
          typeof (s.subjects as Record<string, unknown>).subject_id === 'string'
        )
        .map((s: Record<string, unknown>) => ({
          id: s.id as string,
          is_compulsory: s.is_compulsory as boolean,
          subjects: {
            subject_id: String((s.subjects as Record<string, unknown>).subject_id),
            name: String((s.subjects as Record<string, unknown>).name)
          },
          programs: { program_id: String((s.programs as Record<string, unknown>)?.program_id || ''), name: String((s.programs as Record<string, unknown>)?.name || '') },
        }));
      setCompulsorySubjects(validCompulsory);

      // 4. Get optional subjects the student enrolled in
      const { data: optional } = await supabase
        .from('enrollments')
        .select(`
          id,
          subject_offering_id,
          subject_offerings:subject_offering_id (
            id,
            is_compulsory,
            subjects:subject_id (
              subject_id,
              name
            ),
            programs:program_id (
              program_id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Only keep valid EnrolledOptional objects (non-compulsory), skip error objects and null ids
      const validOptional: EnrolledOptional[] = (optional || [])
        .filter((entry: Record<string, unknown>) =>
          typeof entry?.subject_offering_id === 'string' &&
          entry.subject_offering_id &&
          entry.subject_offerings &&
          !(entry.subject_offerings as Record<string, unknown>)?.error &&
          typeof (entry.subject_offerings as Record<string, unknown>).id === 'string' &&
          (entry.subject_offerings as Record<string, unknown>).subjects && typeof ((entry.subject_offerings as Record<string, unknown>).subjects as Record<string, unknown>).name === 'string' &&
          (entry.subject_offerings as Record<string, unknown>).is_compulsory === false
        )
        .map((entry: Record<string, unknown>) => ({
          id: String(entry.id as string),
          subject_offering_id: String(entry.subject_offering_id as string),
          subject_offerings: (entry.subject_offerings as SubjectOffering)
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
          (liveClassData as Array<Record<string, unknown>>).forEach((liveClass) => {
            // Add default status if not present
            const processedClass: LiveClass = {
              live_class_id: String(liveClass.live_class_id),
              title: String(liveClass.title || ''),
              scheduled_date: String(liveClass.scheduled_date || ''),
              start_time: String(liveClass.start_time || ''),
              end_time: String(liveClass.end_time || ''),
              meeting_link: (liveClass.meeting_link as string) || '',
              subject_id: String(liveClass.subject_id || ''),
              status: (liveClass.status as string) || 'scheduled'
            };
            
            if (!classesBySubject[processedClass.subject_id]) {
              classesBySubject[processedClass.subject_id] = [];
            }
            classesBySubject[processedClass.subject_id].push(processedClass);
          });
          setSubjectLiveClasses(classesBySubject);
        }
      }

      // Fetch available optional subjects for enrollment (program + level, non-compulsory)
      const { data: availableOptional } = await supabase
        .from('subject_offerings')
        .select(`
          id,
          is_compulsory,
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
        .eq('level_id', levelId)
        .eq('is_compulsory', false);

      if (availableOptional) {
        const validAvailable: SubjectOffering[] = (availableOptional || [])
          .filter((s: Record<string, unknown>) =>
            !(s as Record<string, unknown>)?.error &&
            typeof s?.id === 'string' &&
            typeof s?.is_compulsory === 'boolean' &&
            s?.subjects && typeof (s.subjects as Record<string, unknown>).name === 'string'
          )
          .map((s: Record<string, unknown>) => ({
            id: String(s.id),
            is_compulsory: Boolean(s.is_compulsory),
            subjects: s.subjects as Subject,
            programs: s.programs as Program | undefined
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
  }, [user]);

  useEffect(() => {
    fetchSubjects();
  }, [user, fetchSubjects]);

  const handleEnrollInSubject = async (subjectOfferingId: string) => {
    if (!user) return;
    
    try {
      // Enforce max 3 optional subjects for S1/S2
      if (isS1OrS2 && optionalSubjects.length >= 3) {
        alert('You have already selected the maximum of 3 optional subjects.');
        return;
      }
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

  const getSubjectCard = (subject: SubjectOffering, isCompulsory: boolean = true, enrollmentId?: string) => {
    const subjectId = subject.subjects.subject_id;
    const liveClasses = subjectLiveClasses[subjectId] || [];
    const upcomingClasses = liveClasses.filter(lc => 
      lc.status === 'scheduled' || lc.status === 'ongoing'
    );
    const nextClass = upcomingClasses[0];

    return (
      <div
        key={subject.id}
        className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
      >
        <div className="mb-4">
          <div className="mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{subject.subjects.name}</h3>
          </div>

          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2 mb-1 justify-center">
              <BookOpen className="w-4 h-4" />
              <span>Program: {subject.programs?.name || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Users className="w-4 h-4" />
              <span>Teacher: TBA</span>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <Link
              href={`/students/resources?subjectId=${subject.subjects.subject_id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <BookOpen className="w-4 h-4" />
              View Details
            </Link>
            <Link
              href={`/students/live/${subject.subjects.subject_id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Video className="w-4 h-4" />
              Live Classes
            </Link>
            {nextClass && nextClass.status === 'ongoing' && nextClass.meeting_link && (
              <a
                href={`/students/live/join/${nextClass.live_class_id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Join Now
              </a>
            )}
            {!isCompulsory && enrollmentId && !isS1OrS2 && (
              <button
                onClick={() => handleWithdrawFromSubject(enrollmentId)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                Withdraw
              </button>
            )}
          </div>
        </div>

        {/* Live Classes Info */}
        {liveClasses.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Video className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Live Classes</span>
              <span className="text-xs text-gray-500">({liveClasses.length} total)</span>
            </div>
            {nextClass && (
              <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subjects</h1>
          <p className="text-gray-600">Manage your enrolled subjects and access live classes</p>
        </div>

        {/* Quick Actions removed as requested */}

        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Compulsory Subjects</h2>
          {compulsorySubjects.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No compulsory subjects assigned yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {compulsorySubjects.map((subject) => getSubjectCard(subject, true))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Optional Subjects</h2>
          {optionalSubjects.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No optional subjects enrolled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {optionalSubjects.map((entry) => getSubjectCard(entry.subject_offerings, false, entry.id))}
            </div>
          )}
        </div>

        {/* Available Optional Subjects Section */}
        {(() => {
          const canChooseOptionals = isS1OrS2 ? optionalSubjects.length < 3 : showAvailableSubjects;
          if (!canChooseOptionals && isS1OrS2) return null; // Hide entirely for S1/S2 once 3 chosen
          return (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Available Optional Subjects</h2>
                {!isS1OrS2 && (
                  <button
                    onClick={() => setShowAvailableSubjects(!showAvailableSubjects)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {showAvailableSubjects ? 'Hide' : 'Show'} Available Subjects
                  </button>
                )}
                {isS1OrS2 && (
                  <div className="text-sm text-gray-600">Select up to 3 optional subjects</div>
                )}
              </div>

              {(isS1OrS2 || showAvailableSubjects) && (
                <div>
                  {availableOptionalSubjects.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No additional optional subjects available for enrollment.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                <span>Teacher: TBA</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEnrollInSubject(subject.id)}
                              disabled={enrolling === subject.id || (isS1OrS2 && optionalSubjects.length >= 3)}
                              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                enrolling === subject.id || (isS1OrS2 && optionalSubjects.length >= 3)
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {enrolling === subject.id
                                ? 'Enrolling...'
                                : isS1OrS2 && optionalSubjects.length >= 3
                                  ? 'Limit Reached'
                                  : 'Enroll Now'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

import TeacherJoinLiveClassPageClient from './TeacherJoinLiveClassPageClient';

// Server component wrapper to prevent static generation issues
export default function TeacherJoinLiveClassPage() {
  return <TeacherJoinLiveClassPageClient />;
}

// Prevent static generation by returning empty array
export async function generateStaticParams() {
  return [];
}



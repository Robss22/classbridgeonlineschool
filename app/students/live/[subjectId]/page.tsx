// Import the client component
import SubjectPageClient from './SubjectPageClient';

// Server component wrapper to prevent static generation issues
export default function SubjectPage() {
  return <SubjectPageClient />;
}

// Prevent static generation by returning empty array
export async function generateStaticParams() {
  return [];
} 
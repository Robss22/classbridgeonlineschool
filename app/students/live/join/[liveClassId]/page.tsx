import JoinLiveClassPageClient from './JoinLiveClassPageClient';

// Server component wrapper to prevent static generation issues
export default function JoinLiveClassPage() {
  return <JoinLiveClassPageClient />;
}

// Prevent static generation by returning empty array
export async function generateStaticParams() {
  return [];
}



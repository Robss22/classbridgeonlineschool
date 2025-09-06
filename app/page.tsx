import { redirect } from 'next/navigation';

export default function RootPage() {
  // Server-side redirect to home page
  redirect('/home');
} 
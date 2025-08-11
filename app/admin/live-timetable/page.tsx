import { redirect } from 'next/navigation';

export default function AdminLiveTimetablePage() {
  // Redirect directly to the unified timetable to avoid redirect chains
  redirect('/timetable');
}



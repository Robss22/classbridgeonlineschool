'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.push('/students/dashboard');
  }, [router]);
  return null;
}

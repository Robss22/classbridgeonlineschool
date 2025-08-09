"use client";
import Header from "./Header";
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({ children }) {
  const { user } = useAuth();
  return (
    <>
      {user ? null : <Header />}
      {children}
    </>
  );
} 
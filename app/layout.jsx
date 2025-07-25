import Link from 'next/link'; 
import Image from 'next/image';
import './globals.css';
import ClientLayout from '../components/layout/ClientLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import AppLayoutWrapper from '../components/layout/AppLayoutWrapper';

export const metadata = {
  title: 'CLASSBRIDGE Online School',
  description: 'Learn, Apply, and Grow with CLASSBRIDGE Online School',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 flex flex-col min-h-screen">
        <AuthProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

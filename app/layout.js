// Optional Sentry init for client-side
// import { initSentry } from '@/lib/sentry';
// if (typeof window !== 'undefined') initSentry();
import './globals.css';
import { Inter } from 'next/font/google';
import GlobalAutoLogout from '@/components/GlobalAutoLogout';
import { ToastProvider } from '@/components/ui/ToastProvider';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ClassBridge Online School',
  description: 'Online learning platform for students and teachers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalAutoLogout 
          timeoutMinutes={150} // 2 hours 30 minutes
          warningMinutes={5}   // Show warning 5 minutes before
          excludedPaths={[
            '/login', 
            '/register', 
            '/apply', 
            '/home', 
            '/our-programs', 
            '/contact',
            '/timetable'
          ]}
        />
        <ReactQueryProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}

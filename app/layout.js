import './globals.css';
import { Inter } from 'next/font/google';
import GlobalAutoLogout from '@/components/GlobalAutoLogout';

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
        {children}
      </body>
    </html>
  );
}

import './globals.css';
import AppLayoutWrapper from '../components/layout/AppLayoutWrapper';
import ErrorBoundary from '../components/ErrorBoundary';
import FallbackRenderer from '../components/FallbackRenderer';

export const metadata = {
  title: 'CLASSBRIDGE Online School',
  description: 'Learn, Apply, and Grow with CLASSBRIDGE Online School',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 text-gray-900 flex flex-col min-h-screen">
        <ErrorBoundary>
          <FallbackRenderer>
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
          </FallbackRenderer>
        </ErrorBoundary>
      </body>
    </html>
  );
}

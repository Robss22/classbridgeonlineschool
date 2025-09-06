"use client";

import React from 'react';

interface FallbackRendererProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function FallbackRenderer({ children, fallback }: FallbackRendererProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => {
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Loading Application</h2>
          <p className="text-gray-600 mb-4">
            Please wait while we load the application...
          </p>
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { useState, useEffect } from 'react';

interface AutoLogoutModalProps {
  isOpen: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  remainingMinutes: number;
}

export default function AutoLogoutModal({
  isOpen,
  onStayLoggedIn,
  onLogout,
  remainingMinutes
}: AutoLogoutModalProps) {
  const [countdown, setCountdown] = useState(remainingMinutes * 60); // Convert to seconds

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Session Timeout Warning
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          You will be automatically logged out in{' '}
          <span className="font-bold text-red-600">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>{' '}
          due to inactivity.
        </p>
        
        <p className="text-sm text-gray-600 mb-6">
          Click &quot;Stay Logged In&quot; to continue your session.
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onStayLoggedIn}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Stay Logged In
          </button>
          
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}

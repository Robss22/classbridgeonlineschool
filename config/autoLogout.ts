export const AUTO_LOGOUT_CONFIG = {
  // Timeout settings
  TIMEOUT_MINUTES: 150, // 2 hours 30 minutes
  WARNING_MINUTES: 5,   // Show warning 5 minutes before logout
  
  // Paths where auto-logout should not be active
  EXCLUDED_PATHS: [
    '/login',
    '/register', 
    '/apply',
    '/home',
    '/our-programs',
    '/contact',
    '/timetable'
  ],
  
  // Activity detection settings
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus'
  ],
  
  // Session check interval (in minutes)
  SESSION_CHECK_INTERVAL_MINUTES: 5,
  
  // Warning message
  WARNING_MESSAGE: 'You will be logged out in 5 minutes due to inactivity. Click OK to stay logged in.',
  
  // Logout redirect path
  LOGOUT_REDIRECT_PATH: '/login'
} as const;

// Role-specific configurations
export const ROLE_CONFIGS = {
  admin: {
    timeoutMinutes: 180, // 3 hours for admins
    warningMinutes: 10,  // 10 minutes warning
  },
  teacher: {
    timeoutMinutes: 150, // 2 hours 30 minutes for teachers
    warningMinutes: 5,   // 5 minutes warning
  },
  student: {
    timeoutMinutes: 120, // 2 hours for students
    warningMinutes: 5,   // 5 minutes warning
  }
} as const;

// Helper function to get config for a specific role
export function getAutoLogoutConfig(role?: keyof typeof ROLE_CONFIGS) {
  if (role && ROLE_CONFIGS[role]) {
    return {
      ...AUTO_LOGOUT_CONFIG,
      ...ROLE_CONFIGS[role]
    };
  }
  
  return AUTO_LOGOUT_CONFIG;
}

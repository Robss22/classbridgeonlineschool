# Auto-Logout Implementation Guide

## Overview

This implementation provides automatic logout functionality for inactive users across the ClassBridge Online School application. Users are automatically logged out after 2 hours and 30 minutes of inactivity, with a 5-minute warning beforehand.

## Features

✅ **2 hours 30 minutes timeout** (configurable)
✅ **5-minute warning** before logout (configurable)
✅ **Activity detection** (mouse, keyboard, scroll, touch)
✅ **Role-based configurations** (different timeouts for different user types)
✅ **Path exclusions** (public pages don't trigger auto-logout)
✅ **Supabase integration** for proper logout
✅ **Automatic cleanup** of timers
✅ **Session validation** every 5 minutes

## Implementation

### 1. Global Auto-Logout (Recommended)

The `GlobalAutoLogout` component is added to the root layout and automatically handles all protected routes:

```tsx
// app/layout.js
import GlobalAutoLogout from '@/components/GlobalAutoLogout';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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
```

### 2. Role-Specific Auto-Logout

Individual layouts can also have their own auto-logout with role-specific settings:

```tsx
// app/admin/layout.tsx
import AutoLogout from '@/components/AutoLogout';

export default function AdminLayout({ children }) {
  return (
    <AdminAuthGuard>
      <AutoLogout 
        timeoutMinutes={180} // 3 hours for admins
        warningMinutes={10}  // 10 minutes warning
      />
      {children}
    </AdminAuthGuard>
  );
}
```

## Configuration

### Centralized Configuration

All settings are centralized in `config/autoLogout.ts`:

```ts
export const AUTO_LOGOUT_CONFIG = {
  TIMEOUT_MINUTES: 150,        // 2 hours 30 minutes
  WARNING_MINUTES: 5,          // 5 minutes warning
  SESSION_CHECK_INTERVAL_MINUTES: 5,
  WARNING_MESSAGE: 'You will be logged out in 5 minutes due to inactivity. Click OK to stay logged in.',
  LOGOUT_REDIRECT_PATH: '/login'
};

export const ROLE_CONFIGS = {
  admin: {
    timeoutMinutes: 180,       // 3 hours
    warningMinutes: 10,        // 10 minutes warning
  },
  teacher: {
    timeoutMinutes: 150,       // 2 hours 30 minutes
    warningMinutes: 5,         // 5 minutes warning
  },
  student: {
    timeoutMinutes: 120,       // 2 hours
    warningMinutes: 5,         // 5 minutes warning
  }
};
```

### Customizing Timeouts

You can customize timeouts for different user roles:

```tsx
// For teachers
<AutoLogout 
  timeoutMinutes={180} // 3 hours
  warningMinutes={10}  // 10 minutes warning
/>

// For students
<AutoLogout 
  timeoutMinutes={120} // 2 hours
  warningMinutes={5}   // 5 minutes warning
/>
```

## How It Works

### 1. Activity Detection

The system monitors these user activities:
- Mouse movements and clicks
- Keyboard input
- Scrolling
- Touch events
- Focus changes

### 2. Timer Management

- **Warning Timer**: Shows warning 5 minutes before logout
- **Logout Timer**: Automatically logs out after 2 hours 30 minutes
- **Reset**: Any user activity resets both timers

### 3. Warning System

When the warning timer triggers:
- User sees a confirmation dialog
- Clicking "OK" resets the timers
- Clicking "Cancel" allows logout to proceed

### 4. Automatic Logout

When the logout timer triggers:
- User is automatically signed out from Supabase
- Redirected to login page
- All session data is cleared

## Excluded Paths

The following paths are excluded from auto-logout (public pages):
- `/login` - Login page
- `/register` - Registration page
- `/apply` - Application form
- `/home` - Home page
- `/our-programs` - Programs information
- `/contact` - Contact page
- `/timetable` - Public timetable

## Security Features

### Session Validation
- Checks authentication status every 5 minutes
- Automatically redirects unauthenticated users
- Prevents access to protected routes

### Proper Cleanup
- Clears all timers on component unmount
- Removes event listeners to prevent memory leaks
- Handles errors gracefully

### Supabase Integration
- Uses official Supabase auth methods
- Properly invalidates sessions
- Follows security best practices

## Testing

### Test Scenarios

1. **Normal Activity**: User actively using the app
   - Timers should reset on any activity
   - No warnings should appear

2. **Inactivity Warning**: User inactive for 2 hours 25 minutes
   - Warning dialog should appear
   - 5-minute countdown should start

3. **Warning Response**: User clicks "OK" on warning
   - Timers should reset
   - User should remain logged in

4. **Automatic Logout**: User inactive for 2 hours 30 minutes
   - User should be automatically logged out
   - Redirected to login page

5. **Path Exclusion**: User on public pages
   - No timers should be active
   - No warnings should appear

### Browser Console

Check for these log messages:
- `Auto-logout timers reset`
- `Warning timer triggered`
- `Logout timer triggered`
- `User logged out due to inactivity`

## Troubleshooting

### Common Issues

1. **Timers not resetting**
   - Check if event listeners are properly attached
   - Verify user activity is being detected

2. **Warning not showing**
   - Check browser console for errors
   - Verify timer calculations

3. **Logout not working**
   - Check Supabase connection
   - Verify auth state

4. **Performance issues**
   - Check for memory leaks
   - Verify cleanup functions are working

### Debug Mode

Enable debug logging by adding console logs:

```tsx
const resetTimers = useCallback(() => {
  console.log('Timers reset due to user activity');
  // ... rest of the function
}, []);
```

## Best Practices

### 1. User Experience
- Provide clear warning messages
- Allow users to extend their session
- Don't interrupt active work

### 2. Security
- Use appropriate timeout values
- Validate sessions regularly
- Handle errors gracefully

### 3. Performance
- Clean up timers properly
- Remove event listeners
- Avoid memory leaks

### 4. Configuration
- Centralize settings
- Use role-based configurations
- Make timeouts configurable

## Future Enhancements

### 1. Advanced Warning System
- Custom modal instead of confirm dialog
- Visual countdown timer
- Sound notifications

### 2. Role-Based Timeouts
- Different timeouts for different user types
- Configurable per user
- Admin override capabilities

### 3. Session Persistence
- Remember user preferences
- Save work progress
- Resume sessions

### 4. Analytics
- Track session durations
- Monitor user activity patterns
- Identify optimal timeout values

## Support

For issues or questions about the auto-logout implementation:

1. Check the browser console for error messages
2. Verify Supabase configuration
3. Test with different user roles
4. Review the configuration settings

The auto-logout system is designed to be robust and user-friendly while maintaining security standards for educational environments.

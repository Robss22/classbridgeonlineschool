# Single Device Login Implementation Guide

## Overview

This implementation provides single-device login functionality for ClassBridge Online School, ensuring that each user account can only be logged in on one device at a time. When a user logs in on a new device, all previous sessions are automatically terminated.

## Features

✅ **Single Device Login** - Only one active session per user
✅ **Automatic Session Management** - Old sessions terminated on new login
✅ **Device Tracking** - Complete device information and session history
✅ **Session Expiration** - Automatic logout after 24 hours of inactivity
✅ **Force Logout** - Users can logout from all other devices
✅ **Real-time Monitoring** - Session activity tracking and validation
✅ **Security Features** - IP tracking, device fingerprinting, activity monitoring

## How It Works

### 1. **Login Process**
When a user logs in:
1. **Device Detection** - System identifies device type, browser, OS
2. **Session Creation** - New session record created in database
3. **Old Session Termination** - All previous active sessions are deactivated
4. **Device Tracking** - Unique device ID stored for future reference

### 2. **Session Management**
During active use:
1. **Activity Monitoring** - User activity extends session validity
2. **Periodic Validation** - Session checked every 5 minutes
3. **Automatic Cleanup** - Expired sessions automatically deactivated
4. **Real-time Updates** - Session status updated in real-time

### 3. **Security Enforcement**
When security is compromised:
1. **Force Logout** - Users can logout from all other devices
2. **Session Invalidation** - Compromised sessions immediately terminated
3. **Access Control** - Only current device can access protected resources
4. **Audit Trail** - Complete session history maintained

## Database Schema

### User Sessions Table

```sql
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL, -- Unique device identifier
    device_name VARCHAR(255), -- Human-readable device name
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100), -- Browser name and version
    os VARCHAR(100), -- Operating system
    ip_address INET, -- IP address of the device
    user_agent TEXT, -- Full user agent string
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Constraints

- **Unique Active Session**: Only one active session per user
- **Automatic Cleanup**: Sessions expire after 24 hours
- **Cascade Deletion**: Sessions removed when user account deleted

## Implementation Components

### 1. **SessionManager Service**

Core service handling all session operations:

```typescript
export class SessionManager {
  // Create new session
  static async createSession(userId: string): Promise<SessionInfo | null>
  
  // Get current session
  static async getCurrentSession(): Promise<SessionInfo | null>
  
  // Update session activity
  static async updateSessionActivity(): Promise<boolean>
  
  // End session
  static async endSession(): Promise<boolean>
  
  // Force logout from other devices
  static async forceLogoutOtherDevices(): Promise<boolean>
  
  // Check session validity
  static async isSessionValid(): Promise<boolean>
}
```

### 2. **useSessionManagement Hook**

React hook for session management:

```typescript
export function useSessionManagement({
  checkInterval = 5, // Check every 5 minutes
  autoLogout = true,
  redirectOnInvalid = '/login'
}: UseSessionManagementOptions = {})
```

**Features:**
- Automatic session validation
- Activity monitoring
- Session extension
- Force logout capabilities

### 3. **SessionManager Component**

UI component for session management:

```tsx
<SessionManager 
  showDeviceInfo={true}
  allowForceLogout={true}
  className="mb-6"
/>
```

**Features:**
- Display all active sessions
- Show current device information
- Force logout from other devices
- Session extension options

## Usage Examples

### 1. **Basic Integration in Layout**

```tsx
// In your layout component
import { useSessionManagement } from '@/hooks/useSessionManagement';

export default function AdminLayout({ children }) {
  // Initialize session management
  useSessionManagement({
    checkInterval: 5, // Check every 5 minutes
    autoLogout: true,
    redirectOnInvalid: '/login'
  });

  return (
    <div>
      {children}
    </div>
  );
}
```

### 2. **Session Management UI**

```tsx
// In your profile or settings page
import SessionManager from '@/components/SessionManager';

export default function ProfilePage() {
  return (
    <div>
      <h1>Profile Settings</h1>
      <SessionManager 
        showDeviceInfo={true}
        allowForceLogout={true}
      />
    </div>
  );
}
```

### 3. **Custom Session Operations**

```tsx
import { useSessionManagement } from '@/hooks/useSessionManagement';

export default function SecurityPage() {
  const { 
    forceLogoutOtherDevices, 
    getActiveSessions,
    extendSession 
  } = useSessionManagement();

  const handleForceLogout = async () => {
    const success = await forceLogoutOtherDevices();
    if (success) {
      alert('Successfully logged out from all other devices!');
    }
  };

  return (
    <div>
      <button onClick={handleForceLogout}>
        Logout from All Other Devices
      </button>
    </div>
  );
}
```

## Configuration Options

### Session Management Settings

```typescript
interface UseSessionManagementOptions {
  checkInterval?: number;        // Session check frequency (minutes)
  autoLogout?: boolean;          // Auto-logout on session expiry
  redirectOnInvalid?: string;    // Redirect path for invalid sessions
}
```

### Device Detection Settings

```typescript
interface DeviceInfo {
  deviceId: string;              // Unique device identifier
  deviceName: string;            // Human-readable device name
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;               // Browser name and version
  os: string;                    // Operating system
  ipAddress?: string;            // IP address (if available)
  userAgent: string;             // Full user agent string
}
```

## Security Features

### 1. **Session Validation**

- **Real-time Checking**: Sessions validated every 5 minutes
- **Expiration Handling**: Automatic logout after 24 hours
- **Activity Monitoring**: Inactive sessions automatically terminated

### 2. **Device Fingerprinting**

- **Unique Device IDs**: Each device gets a persistent identifier
- **Browser Detection**: Accurate browser and OS identification
- **IP Tracking**: IP address monitoring for security

### 3. **Access Control**

- **Single Active Session**: Only one device can access at a time
- **Automatic Termination**: Old sessions terminated on new login
- **Force Logout**: Users can logout from compromised devices

### 4. **Audit Trail**

- **Complete History**: All login attempts and sessions tracked
- **Device Information**: Detailed device and browser information
- **Activity Logging**: Session activity and duration tracking

## User Experience

### 1. **Login Flow**

1. **User logs in** on any device
2. **System detects** device information automatically
3. **Session created** and old sessions terminated
4. **User notified** of other device logouts
5. **Access granted** only to current device

### 2. **Session Management**

1. **View active sessions** in profile settings
2. **See device details** (browser, OS, IP)
3. **Force logout** from other devices if needed
4. **Extend session** if more time is needed
5. **Monitor activity** and session status

### 3. **Security Notifications**

1. **New device login** notifications
2. **Session expiry** warnings
3. **Force logout** confirmations
4. **Security alerts** for suspicious activity

## Testing Scenarios

### 1. **Single Device Login**

1. **Login on Device A** → Session created
2. **Login on Device B** → Device A session terminated
3. **Try to access on Device A** → Access denied, redirected to login
4. **Verify only Device B** has active session

### 2. **Session Expiration**

1. **Create session** with 24-hour expiry
2. **Wait for expiry** or manually expire
3. **Try to access** protected resources
4. **Verify automatic logout** and redirect

### 3. **Force Logout**

1. **Login on multiple devices**
2. **Use force logout** from current device
3. **Verify all other devices** are logged out
4. **Check session status** in database

### 4. **Activity Monitoring**

1. **Create active session**
2. **Monitor activity** updates
3. **Check session extension** on activity
4. **Verify inactivity** handling

## Troubleshooting

### Common Issues

#### 1. **Sessions Not Terminating**

- Check database triggers are working
- Verify RLS policies are correct
- Check for database permission issues

#### 2. **Device Detection Failing**

- Verify browser compatibility
- Check JavaScript console for errors
- Ensure localStorage is available

#### 3. **Session Validation Issues**

- Check session check interval
- Verify database connection
- Review error logs

### Debug Mode

Enable detailed logging:

```typescript
// In SessionManager
console.log('Session details:', {
  userId,
  deviceInfo,
  sessionData
});
```

## Performance Considerations

### 1. **Database Optimization**

- **Indexes**: Proper indexing on user_id and is_active
- **Cleanup**: Regular cleanup of expired sessions
- **Partitioning**: Consider partitioning for large user bases

### 2. **Client-Side Optimization**

- **Throttling**: Activity updates throttled to 30 seconds
- **Caching**: Session data cached locally
- **Lazy Loading**: Session information loaded on demand

### 3. **Scalability**

- **Session Limits**: Configurable maximum sessions per user
- **Cleanup Jobs**: Automated cleanup of old sessions
- **Monitoring**: Session statistics and analytics

## Future Enhancements

### 1. **Advanced Security**

- **Two-Factor Authentication**: Additional security layer
- **Geolocation Tracking**: Location-based session validation
- **Behavioral Analysis**: Suspicious activity detection

### 2. **User Experience**

- **Session Transfer**: Move session between devices
- **Remember Me**: Extended session options
- **Device Trust**: Trusted device management

### 3. **Administration**

- **Admin Override**: Force logout any user session
- **Session Analytics**: Detailed usage statistics
- **Security Reports**: Security incident reporting

## Support

For issues or questions about single-device login:

1. **Check Logs**: Review browser console and server logs
2. **Verify Database**: Ensure sessions table exists and has correct structure
3. **Test Scenarios**: Use the testing scenarios above
4. **Review Configuration**: Check session management options

The single-device login system is designed to provide maximum security while maintaining excellent user experience for educational environments.

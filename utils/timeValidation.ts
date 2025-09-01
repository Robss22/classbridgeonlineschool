/**
 * Time validation utilities for live classes
 */

/**
 * Check if a live class can be started based on its scheduled time
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @param allowEarlyStart - Whether to allow starting 5 minutes early (default: false)
 * @returns Object with canStart boolean and reason string
 */
export function canStartLiveClass(
  scheduledDate: string, 
  startTime: string, 
  allowEarlyStart: boolean = false
): { canStart: boolean; reason: string } {
  const now = new Date();
  const scheduledDateTime = new Date(`${scheduledDate}T${startTime}`);
  
  // Add timezone offset to match local time
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localScheduledDateTime = new Date(scheduledDateTime.getTime() - timezoneOffset);
  
  // Calculate time difference in minutes
  const timeDiffMinutes = (localScheduledDateTime.getTime() - now.getTime()) / (1000 * 60);
  
  // Allow starting 5 minutes early if specified
  const earlyStartBuffer = allowEarlyStart ? 5 : 0;
  
  if (timeDiffMinutes > earlyStartBuffer) {
    const hours = Math.floor(timeDiffMinutes / 60);
    const minutes = Math.floor(timeDiffMinutes % 60);
    
    let timeString = '';
    if (hours > 0) {
      timeString = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    return {
      canStart: false,
      reason: `Class cannot be started yet. It's scheduled to start in ${timeString}.`
    };
  }
  
  return {
    canStart: true,
    reason: 'Class can be started now.'
  };
}

/**
 * Get a user-friendly message about when a class can be started
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @returns Formatted message string
 */
export function getStartTimeMessage(scheduledDate: string, startTime: string): string {
  const validation = canStartLiveClass(scheduledDate, startTime, false);
  
  if (validation.canStart) {
    return '✅ Class can be started now';
  }
  
  return `⏰ ${validation.reason}`;
}

/**
 * Check if a class is currently in its scheduled time window
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @param endTime - The scheduled end time (HH:MM:SS)
 * @returns boolean indicating if class is in progress
 */
export function isClassInProgress(
  scheduledDate: string, 
  startTime: string, 
  endTime: string
): boolean {
  const now = new Date();
  const startDateTime = new Date(`${scheduledDate}T${startTime}`);
  const endDateTime = new Date(`${scheduledDate}T${endTime}`);
  
  // Add timezone offset to match local time
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localStartDateTime = new Date(startDateTime.getTime() - timezoneOffset);
  const localEndDateTime = new Date(endDateTime.getTime() - timezoneOffset);
  
  return now >= localStartDateTime && now <= localEndDateTime;
}

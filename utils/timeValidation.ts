/**
 * Time validation utilities for live classes
 */

/**
 * Calculate time difference between now and a scheduled class time
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @returns Time difference in minutes
 */
function calculateTimeToClass(scheduledDate: string, startTime: string): number {
  const now = new Date();
  const classDate = new Date(scheduledDate);
  const [hours, minutes, seconds = '00'] = startTime.split(':');
  
  if (!hours || !minutes) return 0;
  
  // Set the class time using local timezone
  classDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);
  
  // Calculate difference in minutes
  return (classDate.getTime() - now.getTime()) / (1000 * 60);
}

/**
 * Check if a live class can be started based on its scheduled time
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @param endTime - The scheduled end time (HH:MM:SS)
 * @param allowEarlyStart - Whether to allow starting 5 minutes early (default: false)
 * @returns Object with canStart boolean, reason string, and status
 */
export function canStartLiveClass(
  scheduledDate: string, 
  startTime: string, 
  endTime: string,
  allowEarlyStart: boolean = false
): { canStart: boolean; reason: string; status: 'scheduled' | 'can_start' | 'missed' | 'ended' } {
  const timeToStartMinutes = calculateTimeToClass(scheduledDate, startTime);
  const timeToEndMinutes = calculateTimeToClass(scheduledDate, endTime);
  
  // Allow starting 5 minutes early if specified
  const earlyStartBuffer = allowEarlyStart ? 5 : 0;
  
  // Class has ended
  if (timeToEndMinutes < 0) {
    return {
      canStart: false,
      reason: 'Class has ended. Cannot be started.',
      status: 'ended'
    };
  }
  
  // Class time has passed but not ended yet (missed)
  if (timeToStartMinutes < 0 && timeToEndMinutes > 0) {
    return {
      canStart: false,
      reason: 'Class time has passed. Status will be marked as missed.',
      status: 'missed'
    };
  }
  
  // Class cannot be started yet (too early)
  if (timeToStartMinutes > earlyStartBuffer) {
    const hours = Math.floor(timeToStartMinutes / 60);
    const minutes = Math.floor(timeToStartMinutes % 60);
    
    let timeString = '';
    if (hours > 0) {
      timeString = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    return {
      canStart: false,
      reason: `Class cannot be started yet. It's scheduled to start in ${timeString}.`,
      status: 'scheduled'
    };
  }
  
  // Class can be started
  return {
    canStart: true,
    reason: 'Class can be started now.',
    status: 'can_start'
  };
}

/**
 * Get a user-friendly message about when a class can be started
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @param endTime - The scheduled end time (HH:MM:SS)
 * @returns Formatted message string
 */
export function getStartTimeMessage(scheduledDate: string, startTime: string, endTime: string): string {
  const validation = canStartLiveClass(scheduledDate, startTime, endTime, false);
  
  switch (validation.status) {
    case 'can_start':
      return '✅ Class can be started now';
    case 'missed':
      return '❌ Class time has passed - marked as missed';
    case 'ended':
      return '⏹️ Class has ended';
    case 'scheduled':
    default:
      return `⏰ ${validation.reason}`;
  }
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

/**
 * Get the appropriate status for a live class based on current time
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @param endTime - The scheduled end time (HH:MM:SS)
 * @param currentStatus - The current status of the class
 * @returns The status the class should have
 */
export function getClassStatus(
  scheduledDate: string,
  startTime: string,
  endTime: string,
  currentStatus: string
): string {
  // Don't change status if class is already ongoing or completed
  if (currentStatus === 'ongoing' || currentStatus === 'completed' || currentStatus === 'cancelled') {
    return currentStatus;
  }

  const validation = canStartLiveClass(scheduledDate, startTime, endTime, false);
  
  switch (validation.status) {
    case 'missed':
      // For now, mark as cancelled if missed status is not supported
      return 'cancelled';
    case 'ended':
      return currentStatus === 'ongoing' ? 'completed' : 'cancelled';
    default:
      return currentStatus;
  }
}

/**
 * Get a user-friendly countdown string for a class
 * @param scheduledDate - The scheduled date (YYYY-MM-DD)
 * @param startTime - The scheduled start time (HH:MM:SS)
 * @returns Formatted countdown string
 */
export function getTimeUntilClass(scheduledDate: string, startTime: string): string {
  const timeToStartMinutes = calculateTimeToClass(scheduledDate, startTime);
  
  if (timeToStartMinutes <= 0) {
    return 'Starting now';
  }
  
  if (timeToStartMinutes < 60) {
    return `in ${Math.floor(timeToStartMinutes)} min`;
  }
  
  const hours = Math.floor(timeToStartMinutes / 60);
  const minutes = Math.floor(timeToStartMinutes % 60);
  
  if (minutes === 0) {
    return `in ${hours}h`;
  }
  
  return `in ${hours}h ${minutes}m`;
}

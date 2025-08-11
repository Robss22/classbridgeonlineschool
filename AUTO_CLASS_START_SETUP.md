# Automatic Class Starting System Setup Guide

This guide explains how to set up the automatic class starting system for ClassBridge Online School.

## Overview

The automatic class starting system:
- Automatically starts live classes when their scheduled time arrives
- Automatically ends classes when their scheduled end time arrives
- Sends notifications to enrolled students when classes start
- Generates meeting links automatically if none exist
- Works without admin/teacher intervention

## System Components

### 1. Supabase Edge Function
- **Location**: `supabase/functions/auto-start-classes/index.ts`
- **Purpose**: Checks for classes to start/end and updates their status
- **Trigger**: Called every minute via scheduled task

### 2. Database Schema
- **Table**: `live_classes` with fields:
  - `status`: 'scheduled', 'ongoing', 'completed', 'cancelled'
  - `started_at`: Timestamp when class started
  - `ended_at`: Timestamp when class ended
  - `meeting_link`: Auto-generated if not provided

### 3. Scheduled Task
- **Frequency**: Every minute
- **Action**: Calls the Edge Function
- **Platform**: Windows Task Scheduler (PowerShell script provided)

## Features

### Automatic Features

- **Auto-start classes** at scheduled times
- **Auto-end classes** at scheduled end times
- **Auto-generate meeting links** when classes start
- **Auto-send notifications** to enrolled students
- **Real-time status updates** in admin dashboard

### Manual Override Features

- **Generate meeting links on-demand** for any class
- **Choose platform** (Google Meet, Zoom, Teams)
- **Regenerate links** if needed
- **Manual class control** (start/stop/end)

### Admin Interface

The admin timetable page includes:

- **Real-time class status** monitoring
- **Meeting link generation** buttons for classes without links
- **Platform selection** dropdown (Google Meet, Zoom, Teams)
- **Auto-start status** indicator
- **Manual trigger** for immediate class checks

## Setup Instructions

### Step 1: Deploy the Edge Function

```bash
# Navigate to your project directory
cd classbridgeonlineschool

# Deploy the Edge Function to Supabase
supabase functions deploy auto-start-classes
```

### Step 2: Run Database Migrations

```bash
# Push the latest database schema
supabase db push
```

### Step 3: Set Up Scheduled Task (Windows)

1. **Run PowerShell as Administrator**
2. **Navigate to your project directory**
3. **Execute the setup script**:

```powershell
# Run the PowerShell setup script
.\scripts\setup-auto-class-cron.ps1
```

**Note**: The script will:
- Check for required environment variables
- Create a PowerShell script for the task
- Set up a Windows Task Scheduler task
- Run every minute as SYSTEM user

### Step 4: Verify Setup

1. **Check Task Scheduler**:
   - Open Task Scheduler (taskschd.msc)
   - Look for task named "ClassBridge-AutoStartClasses"
   - Verify it's enabled and running

2. **Test the System**:
   - Schedule a live class for the current time
   - Wait for the next minute check
   - Verify the class status changes to "ongoing"

## How It Works

### Class Starting Process

1. **Every minute**, the scheduled task calls the Edge Function
2. **Edge Function checks** for classes where:
   - `scheduled_date` = today
   - `start_time` = current time
   - `status` = 'scheduled'
3. **For each class found**:
   - Updates status to 'ongoing'
   - Sets `started_at` timestamp
   - **Automatically generates meeting link** if none exists
   - Sends notifications to enrolled students
4. **Notifications include**:
   - Class subject name
   - Teacher name
   - Meeting link
   - Start time

### Automatic Meeting Link Generation

The system automatically generates meeting links for multiple platforms:

- **Google Meet**: `https://meet.google.com/xxx-xxxx` (e.g., `abc-defg`)
- **Zoom**: `https://zoom.us/j/1234567890` (10-digit meeting ID)
- **Microsoft Teams**: `https://teams.microsoft.com/l/meetup-join/unique-id`

**How it works**:
1. When a class starts automatically, the system checks if a meeting link exists
2. If no link exists, it generates a new link based on the platform preference
3. The link is automatically saved to the database
4. Students receive the link in their notifications

**Platform Selection**:
- **Default**: Google Meet (most reliable for automatic generation)
- **Configurable**: Admins can specify platform when creating classes
- **On-demand**: Generate new links anytime via admin interface

### Class Ending Process

1. **Edge Function also checks** for classes where:
   - `scheduled_date` = today
   - `end_time` = current time
   - `status` = 'ongoing'
2. **For each class found**:
   - Updates status to 'completed'
   - Sets `ended_at` timestamp

### Student Notifications

- **Table**: `notifications`
- **Recipients**: Students enrolled in the program/level
- **Content**: Class details and meeting link
- **Type**: 'class_started'

## Troubleshooting

### Common Issues

1. **Classes not starting automatically**:
   - Check if the scheduled task is running
   - Verify Edge Function is deployed
   - Check Supabase logs for errors

2. **Task Scheduler errors**:
   - Ensure PowerShell execution policy allows scripts
   - Run as Administrator
   - Check Windows Event Viewer for task errors

3. **Edge Function errors**:
   - Check Supabase dashboard > Functions > Logs
   - Verify environment variables are set
   - Check database permissions

### Manual Testing

```bash
# Test the Edge Function manually
curl -X POST "YOUR_SUPABASE_URL/functions/v1/auto-start-classes" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Logs and Monitoring

- **Edge Function logs**: Supabase Dashboard > Functions > auto-start-classes > Logs
- **Task Scheduler logs**: Windows Event Viewer > Windows Logs > Application
- **Database changes**: Monitor `live_classes` table for status updates

## Configuration Options

### Customizing Check Frequency

To change from every minute to a different interval:

1. **Edit the PowerShell script** in Task Scheduler
2. **Modify the trigger**:
   ```powershell
   # For every 5 minutes
   $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
   ```

### Adding Custom Logic

The Edge Function can be extended to:
- Send email notifications
- Update external systems
- Log to external services
- Add custom business rules

## Security Considerations

- **Service Role Key**: Used by the Edge Function (keep secure)
- **Row Level Security**: Applied to all tables
- **Authentication**: Edge Function runs with service role permissions
- **Rate Limiting**: Consider adding if needed

## Maintenance

### Regular Tasks

1. **Monitor logs** for errors or issues
2. **Verify scheduled task** is still running
3. **Check Edge Function** performance
4. **Update environment variables** if Supabase credentials change

### Updates

1. **Deploy new Edge Function versions**:
   ```bash
   supabase functions deploy auto-start-classes
   ```

2. **Update scheduled task** if needed:
   ```powershell
   # Remove old task
   Unregister-ScheduledTask -TaskName "ClassBridge-AutoStartClasses" -Confirm:$false
   
   # Run setup script again
   .\scripts\setup-auto-class-cron.ps1
   ```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in Supabase Dashboard
3. Check Windows Event Viewer for task errors
4. Verify database permissions and RLS policies
5. Test the Edge Function manually

## Files and Locations

- **Edge Function**: `supabase/functions/auto-start-classes/`
- **Setup Script**: `scripts/setup-auto-class-cron.ps1`
- **Database Schema**: `supabase/migrations/`
- **Configuration**: `supabase/config.toml`
- **Documentation**: `AUTO_CLASS_START_SETUP.md`

# Automatic Live Classes System Setup Guide

## 🎯 **Overview**

The automatic live classes system provides:
- **Automatic class start/end** based on scheduled times
- **Join buttons for teachers and admins** to access classes
- **Real-time status updates** across all interfaces
- **Automatic meeting link generation** when classes start

## 🚀 **Features Implemented**

### ✅ **Automatic Status Management**
- Classes automatically start when scheduled time arrives
- Classes automatically end when end time is reached
- Real-time status updates every 30 seconds
- Manual override capabilities for admins

### ✅ **Join Button System**
- **Teachers**: Can join their own classes via `/teachers/live/join/[liveClassId]`
- **Admins**: Can join any class as teacher or student
- **Students**: Can join classes via `/students/live/join/[liveClassId]`

### ✅ **Enhanced Admin Interface**
- Dual join buttons (Teacher/Student view)
- Automatic status checking every 30 seconds
- Manual status update button
- Real-time status indicators

### ✅ **Enhanced Teacher Interface**
- Automatic status checking every 30 seconds
- Join buttons for ongoing classes
- Meeting link generation for classes without links

## 🔧 **Setup Instructions**

### Step 1: Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add timestamp fields to live_classes table for automatic start/end tracking
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_live_classes_started_at ON live_classes(started_at);
CREATE INDEX IF NOT EXISTS idx_live_classes_ended_at ON live_classes(ended_at);
CREATE INDEX IF NOT EXISTS idx_live_classes_status_date ON live_classes(status, scheduled_date);

-- Create a function to automatically update class statuses
CREATE OR REPLACE FUNCTION auto_update_live_class_statuses() RETURNS VOID AS $$
BEGIN
  -- Update classes that should be ongoing
  UPDATE live_classes 
  SET 
    status = 'ongoing',
    started_at = NOW()
  WHERE 
    status = 'scheduled' 
    AND scheduled_date <= CURRENT_DATE
    AND start_time <= CURRENT_TIME
    AND end_time > CURRENT_TIME;
  
  -- Update classes that should be completed
  UPDATE live_classes 
  SET 
    status = 'completed',
    ended_at = NOW()
  WHERE 
    status = 'ongoing' 
    AND (
      scheduled_date < CURRENT_DATE 
      OR (scheduled_date = CURRENT_DATE AND end_time < CURRENT_TIME)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auto_update_live_class_statuses() TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### Step 2: Verify the Migration

Check that the fields were added successfully:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'live_classes' 
AND column_name IN ('started_at', 'ended_at')
ORDER BY ordinal_position;
```

### Step 3: Test the System

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Create a test live class:**
   - Go to `/admin/live-classes`
   - Create a live class scheduled for the current time
   - Set start time to current time + 1 minute
   - Set end time to current time + 2 minutes

3. **Test automatic start:**
   - Wait for the scheduled start time
   - The class should automatically change to "ongoing" status
   - Join buttons should appear

4. **Test automatic end:**
   - Wait for the scheduled end time
   - The class should automatically change to "completed" status

## 🎮 **How to Use**

### **For Admins:**

1. **View Live Classes:**
   - Go to `/admin/live-classes`
   - See all live classes with real-time status

2. **Join Classes:**
   - For ongoing classes, click "Join" (teacher view) or "Student" (student view)
   - Generate meeting links if needed

3. **Manual Control:**
   - Click "Update Statuses" to manually trigger status checks
   - Use start/end buttons for manual control

### **For Teachers:**

1. **View Your Classes:**
   - Go to `/teachers/live-classes`
   - See only your assigned classes

2. **Join Your Classes:**
   - For ongoing classes, click "Join"
   - Generate meeting links if needed

3. **Automatic Updates:**
   - Status updates automatically every 30 seconds
   - No manual intervention needed

### **For Students:**

1. **View Available Classes:**
   - Go to `/students/live-classes`
   - See classes they can join

2. **Join Classes:**
   - Click "Join" on ongoing classes
   - Automatic attendance tracking

## 🔄 **Automatic Workflow**

### **Class Starting Process:**
1. **Scheduled Time Arrives** → Class status changes to "ongoing"
2. **Meeting Link Generated** → If no link exists, one is created automatically
3. **Join Buttons Appear** → Teachers and admins can join
4. **Notifications Sent** → Students are notified (if notification system is enabled)

### **Class Ending Process:**
1. **End Time Arrives** → Class status changes to "completed"
2. **End Time Recorded** → `ended_at` timestamp is set
3. **Join Buttons Disabled** → No more joins allowed
4. **Attendance Finalized** → Participation data is finalized

## 🛠️ **Technical Details**

### **API Endpoints:**
- `POST /api/live-classes/auto-status` - Updates class statuses based on time
- `PUT /api/live-classes?id=[id]` - Manual status updates
- `POST /api/live-classes/generate-meeting-link` - Generate meeting links

### **Database Fields:**
- `status`: 'scheduled', 'ongoing', 'completed', 'cancelled'
- `started_at`: Timestamp when class started
- `ended_at`: Timestamp when class ended
- `meeting_link`: Auto-generated meeting URL

### **Automatic Checks:**
- **Frequency**: Every 30 seconds
- **Trigger**: Frontend JavaScript intervals
- **Scope**: All live classes in the system

## 🔍 **Troubleshooting**

### **Classes Not Starting Automatically:**
1. Check that the database migration ran successfully
2. Verify the `started_at` and `ended_at` fields exist
3. Check browser console for JavaScript errors
4. Verify the auto-status API is working

### **Join Buttons Not Appearing:**
1. Ensure class status is "ongoing"
2. Check that meeting link exists
3. Verify user permissions (teacher/admin)
4. Check browser console for errors

### **Status Not Updating:**
1. Check the 30-second interval is running
2. Verify the auto-status API endpoint
3. Check Supabase logs for database errors
4. Ensure RLS policies allow updates

## 📊 **Monitoring**

### **Real-time Status:**
- Admin dashboard shows live status updates
- Teacher dashboard shows their classes
- Status changes are reflected immediately

### **Logs:**
- Browser console shows automatic check logs
- Supabase logs show database operations
- API logs show status update requests

## 🎯 **Next Steps**

1. **Run the database migration** (Step 1 above)
2. **Test with a sample class** (Step 3 above)
3. **Monitor the system** for a few days
4. **Adjust timing** if needed (currently 30 seconds)

The system is now fully automated and will handle live class start/end times without manual intervention! 🚀

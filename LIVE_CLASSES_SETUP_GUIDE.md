# Live Classes System Setup Guide

## 🚨 Current Issue: Missing Database Table

The error `relation "live_class_participants" does not exist` occurs because the attendance tracking table hasn't been created yet. Here's how to fix it:

## 🔧 Quick Fix Steps

### Step 1: Create the Missing Table

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `create_live_class_participants_table.sql`**
4. **Run the migration**

This will create the `live_class_participants` table with proper indexes and security policies.

### Step 2: Verify the Table Creation

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'live_class_participants'
ORDER BY ordinal_position;
```

### Step 3: Test the System

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the features:**
   - Go to `/admin/live-classes` and create a live class
   - Click "Update Statuses" to test the auto-status feature
   - Visit `/admin/live-classes/analytics` to see the dashboard
   - Join a live class as a student to test attendance tracking

## 📊 What's Currently Working

✅ **Admin Interface** - Create and manage live classes  
✅ **Analytics Dashboard** - View class statistics and trends  
✅ **Auto Status Updates** - Manual status management  
✅ **Health Check API** - System monitoring  
✅ **Enhanced Live Classes API** - Improved meeting link generation  
✅ **Student Join Experience** - Enhanced Jitsi integration  
✅ **Error Handling** - Graceful fallbacks for missing tables  

## 🔄 What Will Work After Table Creation

✅ **Attendance Tracking** - Record join/leave events  
✅ **Technical Data Collection** - Device and connection info  
✅ **Participation Analytics** - Detailed engagement metrics  
✅ **Teacher Notifications** - Student join alerts  
✅ **Duration Tracking** - Class participation time  
✅ **Connection Quality Monitoring** - Network performance data  

## 🛠️ Current System Status

The system is **fully functional** with the current database schema. The attendance tracking features are gracefully disabled until the `live_class_participants` table is created.

### Features Working Now:
- Live class creation and management
- Analytics dashboard (basic metrics)
- Auto status updates (manual trigger)
- Enhanced student join experience
- Health monitoring
- Error handling and fallbacks

### Features Ready to Enable:
- Attendance tracking
- Technical data collection
- Participation analytics
- Teacher notifications
- Duration calculations

## 📋 Database Schema Overview

### Current Tables (Working):
- `live_classes` - Main live class data
- `users` - User accounts
- `teachers` - Teacher profiles
- `students` - Student profiles
- `programs` - Educational programs
- `levels` - Academic levels
- `subjects` - Course subjects

### Missing Table (Needs Creation):
- `live_class_participants` - Attendance tracking

## 🎯 Next Steps

1. **Run the database migration** (see Step 1 above)
2. **Test the attendance tracking** by joining a live class
3. **Check the analytics dashboard** for participant data
4. **Enable enhanced features** as needed

## 🔍 Troubleshooting

### If you still get table errors:
1. Check that the migration ran successfully
2. Verify the table exists in Supabase Table Editor
3. Check RLS policies are properly set
4. Refresh your application

### If analytics show no data:
1. Create some test live classes
2. Join classes as a student to generate attendance data
3. Check the date range filter in analytics

### If attendance tracking doesn't work:
1. Verify the `live_class_participants` table exists
2. Check RLS policies allow student inserts
3. Test with a simple join/leave event

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database migrations completed successfully
3. Test with a fresh live class creation
4. Check Supabase logs for any database errors

The system is designed to be resilient and will work even if some features are temporarily unavailable.

# 🚀 Automatic Class Starting System Setup Guide

This guide will help you set up the complete automatic class starting system for ClassBridge Online School.

## ✨ **What This System Does**

- **Automatically starts classes** when their scheduled time arrives
- **Automatically ends classes** when their scheduled time ends
- **Sends real-time notifications** to enrolled students
- **Generates meeting links** automatically if not provided
- **Updates class status** in real-time
- **Works 24/7** without manual intervention

## 🛠️ **Prerequisites**

- Supabase project set up
- Supabase CLI installed
- Access to your server/computer for cron jobs
- Environment variables configured

## 📋 **Step-by-Step Setup**

### **1. Deploy the Edge Function**

```bash
# Navigate to your project directory
cd classbridgeonlineschool

# Deploy the auto-start-classes function
supabase functions deploy auto-start-classes

# Verify deployment
supabase functions list
```

### **2. Run Database Migration**

```bash
# Apply the database changes
supabase db push

# Verify the new tables and fields
supabase db diff
```

### **3. Set Up Environment Variables**

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auto-start system configuration
AUTO_START_ENABLED=true
```

### **4. Set Up the Cron Job**

#### **Option A: Using the Setup Script (Recommended)**

```bash
# Make the script executable
chmod +x scripts/setup-auto-class-cron.sh

# Run the setup script
./scripts/setup-auto-class-cron.sh
```

#### **Option B: Manual Cron Setup**

```bash
# Open crontab editor
crontab -e

# Add this line (replace with your actual Supabase URL and service key)
* * * * * curl -X POST "YOUR_SUPABASE_URL/functions/v1/auto-start-classes" -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" -H "Content-Type: application/json" > /dev/null 2>&1
```

#### **Option C: Using Vercel Cron (If hosting on Vercel)**

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-start-classes",
      "schedule": "* * * * *"
    }
  ]
}
```

### **5. Test the System**

1. **Schedule a test class** for the current time
2. **Wait for the scheduled time** to arrive
3. **Check the admin timetable** for status updates
4. **Verify student notifications** are sent
5. **Test joining the class** via the generated meeting link

## 🔧 **Configuration Options**

### **Cron Schedule Customization**

- **Every minute**: `* * * * *` (default)
- **Every 5 minutes**: `*/5 * * * *`
- **Every 15 minutes**: `*/15 * * * *`

### **Time Zone Configuration**

The system uses your server's local time zone. To change:

```bash
# Set timezone (example for UTC)
sudo timedatectl set-timezone UTC

# Verify timezone
timedatectl
```

## 📊 **Monitoring and Logs**

### **View Cron Job Logs**

```bash
# Check cron logs
grep CRON /var/log/syslog

# View your cron jobs
crontab -l

# Test the cron job manually
curl -X POST "YOUR_SUPABASE_URL/functions/v1/auto-start-classes" -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### **Supabase Function Logs**

```bash
# View function logs
supabase functions logs auto-start-classes

# Follow logs in real-time
supabase functions logs auto-start-classes --follow
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Classes not starting automatically**
   - Check cron job is running: `crontab -l`
   - Verify Edge Function is deployed
   - Check function logs for errors

2. **Students not receiving notifications**
   - Verify `student_enrollments` table has data
   - Check RLS policies are correct
   - Verify user authentication

3. **Meeting links not generating**
   - Check Edge Function has proper permissions
   - Verify `meeting_link` field exists in database

### **Debug Mode**

Enable debug logging in the Edge Function by adding:

```typescript
console.log('Debug info:', { currentTime, currentDate, classesToStart });
```

## 🔒 **Security Considerations**

- **Service Role Key**: Keep your service role key secure
- **RLS Policies**: Verify Row Level Security is properly configured
- **Cron Access**: Ensure only authorized users can access cron setup
- **API Rate Limits**: Monitor for potential abuse

## 📈 **Performance Optimization**

- **Database Indexes**: Already included in migration
- **Real-time Updates**: Uses Supabase real-time subscriptions
- **Efficient Queries**: Optimized database queries
- **Minimal API Calls**: Only calls when necessary

## 🔄 **Maintenance**

### **Regular Tasks**

- **Monitor logs** for errors
- **Check cron job** is still running
- **Verify database** performance
- **Update Edge Function** when needed

### **Backup and Recovery**

```bash
# Backup cron configuration
crontab -l > cron_backup.txt

# Restore cron configuration
crontab cron_backup.txt
```

## 🎯 **Next Steps**

After setup:

1. **Train teachers** on the new system
2. **Inform students** about automatic notifications
3. **Monitor system** performance
4. **Gather feedback** for improvements

## 📞 **Support**

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase function logs
3. Verify cron job configuration
4. Check database migration status

## ✨ **Success Indicators**

Your system is working correctly when:

- ✅ Classes automatically start at scheduled times
- ✅ Students receive instant notifications
- ✅ Meeting links are generated automatically
- ✅ Class status updates in real-time
- ✅ No manual intervention required

---

**🎉 Congratulations!** You now have a fully automated class starting system that will make your online school much more professional and user-friendly.

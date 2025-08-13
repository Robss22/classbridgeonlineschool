# Live Classes System Setup Guide

## 🚀 Quick Start Guide

Follow these steps to set up the enhanced live classes system:

### Step 1: Database Setup

1. **Open your Supabase dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `database-migrations.sql`**
4. **Run the migration script**

This will:
- Add new columns to existing tables
- Create the notifications table
- Set up indexes for performance
- Create database functions
- Set up Row Level Security policies

### Step 2: Environment Variables

Add these to your `.env.local` file:

```env
# Existing variables (keep these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# New variables for enhanced features
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Install Dependencies

```bash
npm install recharts
```

### Step 4: Test the System

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the new features:**
   - Go to `/admin/live-classes` and click "Update Statuses"
   - Create a new live class and check for notifications
   - Join a live class as a student to test attendance tracking
   - Visit `/admin/live-classes/analytics` to see the dashboard

## 🔧 Configuration Options

### Auto-Status Updates

The system can automatically update class statuses in two ways:

1. **Manual Updates:** Click "Update Statuses" button in admin panel
2. **Scheduled Updates:** Enable pg_cron in Supabase (optional)

To enable scheduled updates:
1. Go to Supabase Dashboard → Extensions
2. Enable `pg_cron` extension
3. Uncomment the cron job in `database-migrations.sql`

### Notification Settings

Configure notification timing in `/app/api/live-classes/route.ts`:

```typescript
// Current settings (modify as needed)
const pre_class_buffer = 15; // minutes before class starts
const reminder_30min = 30 * 60 * 1000; // 30 minutes before
const reminder_5min = 5 * 60 * 1000; // 5 minutes before
```

### Analytics Dashboard

The analytics dashboard shows data for the last 30 days by default. You can modify the date range in `/app/admin/live-classes/analytics/page.tsx`.

## 🧪 Testing Checklist

### Admin Features
- [ ] Create new live class
- [ ] Auto-status updates work
- [ ] Analytics dashboard loads
- [ ] Meeting link generation
- [ ] Class status management

### Teacher Features
- [ ] View assigned classes
- [ ] Join live class
- [ ] Receive student join notifications
- [ ] Access meeting controls

### Student Features
- [ ] View available classes
- [ ] Join live class
- [ ] Connection quality testing
- [ ] Attendance tracking
- [ ] Technical data collection

### System Features
- [ ] Notifications are sent
- [ ] Attendance records are created
- [ ] Analytics data is collected
- [ ] Error handling works

## 🐛 Troubleshooting

### Common Issues

1. **Database Migration Errors**
   - Check if columns already exist
   - Run migrations one by one
   - Verify Supabase permissions

2. **Analytics Dashboard Not Loading**
   - Check if Recharts is installed
   - Verify database permissions
   - Check browser console for errors

3. **Notifications Not Working**
   - Verify notifications table exists
   - Check RLS policies
   - Ensure user roles are set correctly

4. **Attendance Tracking Issues**
   - Check JWT token configuration
   - Verify API endpoints are accessible
   - Check browser permissions for audio/video

### Debug Mode

Enable debug logging by adding to your environment:

```env
NEXT_PUBLIC_DEBUG=true
```

This will show additional console logs for troubleshooting.

## 📊 Performance Monitoring

### Key Metrics to Watch

1. **Database Performance**
   - Query execution time
   - Index usage
   - Connection pool usage

2. **Application Performance**
   - Page load times
   - API response times
   - Memory usage

3. **User Experience**
   - Attendance rates
   - Connection quality
   - Technical issues frequency

### Monitoring Tools

- **Supabase Dashboard:** Database performance
- **Browser DevTools:** Frontend performance
- **Analytics Dashboard:** User engagement metrics

## 🔒 Security Considerations

### Data Protection

1. **Row Level Security (RLS)** is enabled on all tables
2. **JWT tokens** are required for API access
3. **User authentication** is enforced
4. **Input validation** is implemented

### Meeting Security

1. **Unique passwords** for each class
2. **Waiting room** functionality
3. **Access control** based on enrollment
4. **Session limits** and timeouts

## 📈 Scaling Considerations

### For High Traffic

1. **Database Optimization**
   - Add more indexes as needed
   - Consider read replicas
   - Monitor query performance

2. **Application Optimization**
   - Implement caching
   - Use CDN for static assets
   - Consider server-side rendering

3. **Infrastructure**
   - Monitor server resources
   - Set up auto-scaling
   - Implement load balancing

## 🆘 Support

If you encounter issues:

1. **Check the documentation** in `LIVE_CLASSES_ENHANCEMENTS.md`
2. **Review the troubleshooting section** above
3. **Check browser console** for error messages
4. **Verify database migrations** were successful
5. **Test with minimal data** to isolate issues

## 🎯 Next Steps

After successful setup:

1. **Train users** on new features
2. **Monitor performance** and usage
3. **Gather feedback** from teachers and students
4. **Plan Phase 2 enhancements** based on usage data

---

**Need help?** Check the main documentation in `LIVE_CLASSES_ENHANCEMENTS.md` for detailed technical information.

#!/bin/bash

# Setup script for automatic class starting cron job
# This script sets up a cron job to call the Supabase Edge Function every minute

echo "🚀 Setting up automatic class starting system..."

# Check if cron is available
if ! command -v crontab &> /dev/null; then
    echo "❌ Error: crontab is not available on this system"
    echo "Please install cron or use an alternative scheduling method"
    exit 1
fi

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if .env file exists
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create a .env.local file with your Supabase credentials"
    exit 1
fi

# Load environment variables
source "$PROJECT_DIR/.env.local"

# Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    exit 1
fi

# Create the cron job entry
CRON_JOB="* * * * * curl -X POST \"$NEXT_PUBLIC_SUPABASE_URL/functions/v1/auto-start-classes\" -H \"Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY\" -H \"Content-Type: application/json\" > /dev/null 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "auto-start-classes"; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove existing cron job
    crontab -l 2>/dev/null | grep -v "auto-start-classes" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron job successfully added!"
    echo "📅 The system will now check for classes to start every minute"
    echo ""
    echo "🔍 To view your cron jobs, run: crontab -l"
    echo "❌ To remove the cron job, run: crontab -r"
    echo ""
    echo "📝 Cron job details:"
    echo "   - Runs every minute (* * * * *)"
    echo "   - Calls: $NEXT_PUBLIC_SUPABASE_URL/functions/v1/auto-start-classes"
    echo "   - Logs: Check your system logs for curl output"
else
    echo "❌ Error: Failed to add cron job"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Deploy the Edge Function to Supabase:"
echo "   supabase functions deploy auto-start-classes"
echo ""
echo "2. Run the database migration:"
echo "   supabase db push"
echo ""
echo "3. Test the system by scheduling a class for the current time"
echo ""
echo "✨ Automatic class starting system is now configured!"

# PowerShell script to setup automatic class starting on Windows
# This script creates a scheduled task to call the Supabase Edge Function every minute

Write-Host "🚀 Setting up automatic class starting system on Windows..." -ForegroundColor Green

# 1. Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
    ).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Error: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# 2. Get script and project directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR

# 3. Check if .env.local exists
$envFile = Join-Path $PROJECT_DIR ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    Write-Host "Please create a .env.local file with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# 4. Load environment variables
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

# 5. Check required env vars
if (-not $NEXT_PUBLIC_SUPABASE_URL -or -not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Error: Missing required environment variables" -ForegroundColor Red
    Write-Host "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local" -ForegroundColor Yellow
    exit 1
}

# 6. Script that will be run every minute
$taskScript = @'
# Auto-start classes script
$supabaseUrl = "__SUPABASE_URL__"
$serviceKey = "__SERVICE_KEY__"

try {
    $headers = @{
        Authorization = "Bearer $serviceKey"
        'Content-Type' = 'application/json'
    }
    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/auto-start-classes" -Method POST -Headers $headers
    Write-Host "Auto-start triggered successfully at $(Get-Date): $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "Error triggering auto-start at $(Get-Date): $($_.Exception.Message)" -ForegroundColor Red
}
'@

# Inject env values
$taskScript = $taskScript.Replace('__SUPABASE_URL__', $NEXT_PUBLIC_SUPABASE_URL).Replace('__SERVICE_KEY__', $SUPABASE_SERVICE_ROLE_KEY)

# Save it to file
$taskScriptPath = Join-Path $PROJECT_DIR "scripts\auto-start-classes.ps1"
$taskScript | Out-File -FilePath $taskScriptPath -Encoding UTF8

# 7. Create the scheduled task
$taskName = "ClassBridge-AutoStartClasses"
$taskDescription = "Automatically start and end live classes based on schedule"

try {
    # Remove existing task if it exists
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Write-Host "⚠️  Task already exists. Removing..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Create action
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$taskScriptPath`""

    # Create trigger (every minute)
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes 1) `
        -RepetitionDuration (New-TimeSpan -Days 365)

    # Settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries -StartWhenAvailable

    # Build and register
    $task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Description $taskDescription
    Register-ScheduledTask -TaskName $taskName -InputObject $task -User "SYSTEM" -RunLevel Highest

    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    Write-Host "📅 The system will now check for classes to start every minute" -ForegroundColor Green

} catch {
    Write-Host "❌ Error creating scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 8. Info
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy the Edge Function to Supabase:" -ForegroundColor White
Write-Host "   supabase functions deploy auto-start-classes" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run the database migration:" -ForegroundColor White
Write-Host "   supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the system by scheduling a class for the current time" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To view your scheduled tasks, run: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "❌ To remove the task, run: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Automatic class starting system is now configured!" -ForegroundColor Green

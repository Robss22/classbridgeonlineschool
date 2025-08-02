# PowerShell script to run the teacher assignments migration
# This script will execute the SQL migration and provide feedback

Write-Host "Starting Teacher Assignments Migration..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "scripts/automated-teacher-assignments-migration.sql")) {
    Write-Host "Error: automated-teacher-assignments-migration.sql not found in scripts folder" -ForegroundColor Red
    Write-Host "Please run this script from the classbridgeonlineschool directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Migration script found. Ready to execute..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: This will modify your database. Make sure you have a backup!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Do you want to proceed with the migration? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executing migration..." -ForegroundColor Green
Write-Host "Copy the SQL from scripts/automated-teacher-assignments-migration.sql and run it in your Supabase SQL editor" -ForegroundColor Cyan
Write-Host ""

# Display the SQL content
Write-Host "SQL Migration Content:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Get-Content "scripts/automated-teacher-assignments-migration.sql" | Write-Host

Write-Host ""
Write-Host "Migration script ready. Please:" -ForegroundColor Green
Write-Host "1. Go to your Supabase dashboard" -ForegroundColor White
Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "3. Copy and paste the SQL above" -ForegroundColor White
Write-Host "4. Execute the script" -ForegroundColor White
Write-Host "5. Check the results in the output" -ForegroundColor White
Write-Host ""
Write-Host "After running the migration, test the teacher resources page to verify the Program dropdown works." -ForegroundColor Green 
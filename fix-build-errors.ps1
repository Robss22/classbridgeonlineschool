# Fix Build Errors Script for ClassBridge Online School
# This script automatically cleans up file system issues and restarts the development server

Write-Host "🔧 Fixing build errors and cleaning up file system issues..." -ForegroundColor Yellow

# Kill any running Node.js processes
Write-Host "🛑 Stopping Node.js processes..." -ForegroundColor Red
taskkill /f /im node.exe 2>$null
Start-Sleep -Seconds 2

# Clean up build cache
Write-Host "🧹 Cleaning build cache..." -ForegroundColor Blue
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ .next directory removed" -ForegroundColor Green
}

# Clean up node_modules cache
Write-Host "🧹 Cleaning node_modules cache..." -ForegroundColor Blue
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ node_modules cache removed" -ForegroundColor Green
}

# Clean up npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Blue
npm cache clean --force 2>$null
Write-Host "✅ npm cache cleaned" -ForegroundColor Green

# Remove any locked files
Write-Host "🔓 Removing locked files..." -ForegroundColor Blue
Get-ChildItem -Path "." -Recurse -Force | Where-Object { 
    $_.Name -like "*.lock" -or $_.Name -like "*cache*" -or $_.Name -like "*.tmp" 
} | Remove-Item -Force -ErrorAction SilentlyContinue

# Wait a moment for file system to settle
Start-Sleep -Seconds 3

Write-Host "🚀 Starting development server..." -ForegroundColor Green
npm run dev

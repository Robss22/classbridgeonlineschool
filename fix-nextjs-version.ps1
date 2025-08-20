# Fix Next.js Version Conflicts for ClassBridge Online School
# Run this script in PowerShell from your project directory

Write-Host "🔧 Fixing Next.js Version Conflicts..." -ForegroundColor Yellow

# Step 1: Stop any running development servers
Write-Host "📱 Stopping development servers..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Step 2: Remove existing dependencies
Write-Host "🗑️ Removing existing dependencies..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

# Step 3: Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Blue
npm cache clean --force
Write-Host "✅ NPM cache cleared" -ForegroundColor Green

# Step 4: Install latest dependencies
Write-Host "📦 Installing latest dependencies..." -ForegroundColor Blue
npm install

# Step 5: Update Next.js and React to latest stable versions
Write-Host "🚀 Updating Next.js and React..." -ForegroundColor Blue
npm install next@latest react@latest react-dom@latest

# Step 6: Verify installation
Write-Host "✅ Verifying installation..." -ForegroundColor Blue
$nextVersion = npm list next
$reactVersion = npm list react
$reactDomVersion = npm list react-dom

Write-Host "📋 Installed versions:" -ForegroundColor Green
Write-Host "Next.js: $nextVersion" -ForegroundColor White
Write-Host "React: $reactVersion" -ForegroundColor White
Write-Host "React-DOM: $reactDomVersion" -ForegroundColor White

# Step 7: Run type check
Write-Host "🔍 Running TypeScript type check..." -ForegroundColor Blue
npm run typecheck

# Step 8: Start development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "Your application should now work without version conflicts!" -ForegroundColor Green
npm run dev

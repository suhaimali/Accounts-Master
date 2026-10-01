Write-Host "🚀 Starting Accounts Master..." -ForegroundColor Cyan

# Check MongoDB
Write-Host "📦 Checking MongoDB..." -ForegroundColor Yellow
$mongod = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongod) {
    Write-Host "⚠️  MongoDB is not running! Please start MongoDB first." -ForegroundColor Red
    Write-Host "   Run: mongod --dbpath C:\data\db" -ForegroundColor Gray
}

# Start the development server
Write-Host "✅ Starting dev servers..." -ForegroundColor Green
npm run dev

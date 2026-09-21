# PowerShell Script to Uninstall Stavya Discount System Service / Startup Task
# Run as Administrator in PowerShell

param (
    [string]$TaskName = "StavyaDiscountSystem_AutoStart",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

# Ensure script is running with elevated privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Error: Please run PowerShell as Administrator." -ForegroundColor Red
    Exit 1
}

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "🏥 UNINSTALLING STAVYA DISCOUNT SYSTEM WINDOWS SERVICE" -ForegroundColor Yellow
Write-Host "================================================================"

try {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Removed background Scheduled Task '$TaskName'." -ForegroundColor Green

    $FirewallRuleName = "Stavya Hospital Discount System (Port $Port)"
    Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
    Write-Host "✅ Removed Windows Firewall rule for Port $Port." -ForegroundColor Green
    
    Write-Host "🎉 Uninstallation complete." -ForegroundColor Green
} catch {
    Write-Host "❌ Error during uninstall: $_" -ForegroundColor Red
}

# PowerShell Script to Install Stavya Discount System as an Auto-Boot Windows Service / Startup Task
# Run as Administrator in PowerShell

param (
    [string]$ServiceName = "StavyaDiscountSystem",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

# Ensure script is running with elevated privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Error: Please run PowerShell as Administrator." -ForegroundColor Red
    Exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ServerScript = Join-Path $ScriptDir "server.js"
$NodePath = (Get-Command node.exe -ErrorAction SilentlyContinue).Path

if (-not $NodePath) {
    Write-Host "❌ Node.js is not found in System PATH. Please install Node.js first." -ForegroundColor Red
    Exit 1
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🏥 STAVYA SPINE HOSPITAL - WINDOWS AUTO-BOOT SERVICE SETUP" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Working Directory: $ScriptDir"
Write-Host "Node Executable:   $NodePath"
Write-Host "Target Script:     $ServerScript"
Write-Host "Port Number:       $Port"
Write-Host "================================================================"

# Register Windows Scheduled Task for System Startup (Runs silently in background on boot)
$TaskName = "StavyaDiscountSystem_AutoStart"
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ServerScript`"" -WorkingDirectory $ScriptDir
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit 0
$Principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -User "NT AUTHORITY\SYSTEM" -RunLevel Highest | Out-Null
    
    Write-Host "✅ Successfully installed auto-start Scheduled Task '$TaskName'!" -ForegroundColor Green
    Write-Host "   The discount server will now start automatically whenever Windows Server boots." -ForegroundColor Yellow
    
    # Configure Windows Firewall Rule for Inbound Traffic on target Port
    $FirewallRuleName = "Stavya Hospital Discount System (Port $Port)"
    Remove-NetFirewallRule -DisplayName $FirewallRuleName -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName $FirewallRuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
    Write-Host "✅ Configured Windows Firewall rule to allow incoming LAN traffic on TCP Port $Port!" -ForegroundColor Green

    # Start the task now
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "🚀 Server service started in background!" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed: $_" -ForegroundColor Red
}

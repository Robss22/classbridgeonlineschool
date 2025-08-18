Param(
  [Parameter(Mandatory=$true)][string]$AppBaseUrl
)

$TaskName = "ClassBridge_SessionCleanup"
$Script = "powershell -NoProfile -WindowStyle Hidden -Command `"try { Invoke-WebRequest -UseBasicParsing -Method POST -Uri '$AppBaseUrl/api/sessions/cleanup' | Out-Null } catch {}`""

$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -Command $Script"
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
$Trigger.Repetition = (New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration ([TimeSpan]::MaxValue)).Repetition

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Description "Calls /api/sessions/cleanup every 15 minutes" -RunLevel Highest -Force | Out-Null
Write-Output "Scheduled task '$TaskName' created to call $AppBaseUrl/api/sessions/cleanup every 15 minutes."



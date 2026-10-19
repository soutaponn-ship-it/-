@echo off
cd /d "%~dp0"
set NODE_ENV=production
set PORT=3000
start "Study Manager Server" /min node.exe dist\index.js
powershell -NoProfile -Command "Start-Sleep -Seconds 3; $ips=Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' }; Write-Host 'Study Manager: http://127.0.0.1:3000'; $ips | ForEach-Object { Write-Host ('スマホ: http://' + $_.IPAddress + ':3000') }"
rundll32.exe url.dll,FileProtocolHandler "http://127.0.0.1:3000"
echo Study Manager started.

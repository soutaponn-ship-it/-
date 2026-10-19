@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command New-NetFirewallRule -DisplayName ''Study Manager LAN 3000'' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private -ErrorAction SilentlyContinue'"
echo Windowsの確認画面が表示されたら「はい」を選択してください。
pause

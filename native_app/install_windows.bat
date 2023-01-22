@echo off

if not exist "%LocalAppData%\YoutubeAutoShutdown\" mkdir "%LocalAppData%\YoutubeAutoShutdown\"
xcopy native_app\windows\ "%LocalAppData%\YoutubeAutoShutdown\" /y

rem The native extensions on Windows require these registry entries to contain the path to the native manifest
reg add "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\youtube.auto.shutdown" /f /t REG_SZ /d "%LocalAppData%\YoutubeAutoShutdown\native_manifest.json"

@echo off

del "%LocalAppData%\YoutubeAutoShutdown\native_manifest.json"
del "%LocalAppData%\YoutubeAutoShutdown\youtube_auto_shutdown_native.exe"

reg delete "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\youtube.auto.shutdown" /f

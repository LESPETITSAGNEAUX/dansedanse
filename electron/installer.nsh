!macro customHeader
  !system "echo 'GTO Poker Bot Installer'"
!macroend

!macro preInit
  SetRegView 64
!macroend

!macro customInstall
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\App Paths\GTO Poker Bot.exe" "" "$INSTDIR\GTO Poker Bot.exe"
  
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\config"
  CreateDirectory "$INSTDIR\replays"
  
  ; Copier .env s'il existe à côté du setup.exe
  IfFileExists "$EXEDIR\.env" 0 +2
    CopyFiles /SILENT "$EXEDIR\.env" "$INSTDIR\.env"
  
  ; Aussi copier vers AppData pour persistance
  CreateDirectory "$APPDATA\GTO Poker Bot"
  IfFileExists "$EXEDIR\.env" 0 +2
    CopyFiles /SILENT "$EXEDIR\.env" "$APPDATA\GTO Poker Bot\.env"
!macroend

!macro customUnInstall
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\App Paths\GTO Poker Bot.exe"
  
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\config"
!macroend

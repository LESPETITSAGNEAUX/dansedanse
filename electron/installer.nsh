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
!macroend

!macro customUnInstall
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\App Paths\GTO Poker Bot.exe"
  
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\config"
!macroend

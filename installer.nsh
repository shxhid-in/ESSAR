; Custom NSIS installer script for Essar Travel Billing
; This script creates the database directory during installation

!macro customInstall
  ; Create database directory in user's AppData
  ; This ensures the database folder exists before the app runs
  ; The app will also create it if it doesn't exist, but creating it here is cleaner
  SetShellVarContext current
  CreateDirectory "$APPDATA\Essar Travel Billing\database"
!macroend

!macro customUnInstall
  ; Keep database folder during uninstall to preserve user data
  ; Users can manually delete it if they want to remove all data
  ; If you want to remove database on uninstall, uncomment below:
  ; SetShellVarContext current
  ; RMDir /r "$APPDATA\Essar Travel Billing\database"
!macroend


; Vidora NSIS installer chrome.
; Included by Tauri at the top of the generated installer.nsi
; (`bundle.windows.nsis.installerHooks`). Keep this file ASCII-safe.
;
; These MUI defines must exist before the Welcome / Finish page macros.
; Product name is hardcoded because this include runs before ${PRODUCTNAME}.

!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT "Are you sure you want to quit Vidora Setup?"
!define MUI_UNABORTWARNING

!define MUI_WELCOMEPAGE_TITLE "Welcome to Vidora"
!define MUI_WELCOMEPAGE_TEXT "Vidora is a local-first YouTube downloader for Windows.$\r$\n$\r$\nThis setup installs Vidora for your user account and does not need Administrator permission. You can choose the folder on the next screen.$\r$\n$\r$\nClick Next to continue."

!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose the folder where Vidora should be installed. The default location does not require Administrator permission."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Install folder"

!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Installation complete"
!define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "Vidora was installed on this computer."

!define MUI_FINISHPAGE_TITLE "Vidora is ready"
!define MUI_FINISHPAGE_TEXT "Setup has finished installing Vidora.$\r$\n$\r$\nLaunch it now to paste a link and start downloading, or open Vidora from the Start menu.$\r$\n$\r$\nClick Finish to close Setup."
!define MUI_FINISHPAGE_RUN_TEXT "Launch Vidora"

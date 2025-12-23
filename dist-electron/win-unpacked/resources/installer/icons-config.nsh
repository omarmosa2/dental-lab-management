; تكوين الأيقونات والصور للمثبت
; Icons and Images Configuration for Installer

; مسارات الأيقونات
!define ICON_MAIN "icon.ico"
!define ICON_UNINSTALL "icon.ico"
!define ICON_INSTALLER "icon.ico"

; صور المثبت
!define IMAGE_HEADER "assets\header.bmp"
!define IMAGE_WIZARD "assets\wizard.bmp"
!define IMAGE_BANNER "assets\banner.bmp"

; إعدادات الأيقونات
; إذا لم تتوفر أيقونة صالحة، استخدم أيقونة افتراضية من NSIS
!undef ICON_MAIN
!undef ICON_UNINSTALL
!undef ICON_INSTALLER
!define ICON_MAIN "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define ICON_UNINSTALL "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define ICON_INSTALLER "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"

Icon "${ICON_INSTALLER}"
UninstallIcon "${ICON_UNINSTALL}"

; إعدادات صور الواجهة
!define MUI_ICON "${ICON_MAIN}"
!define MUI_UNICON "${ICON_UNINSTALL}"

; صورة الرأس
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${IMAGE_HEADER}"
!define MUI_HEADERIMAGE_UNBITMAP "${IMAGE_HEADER}"
!define MUI_HEADERIMAGE_RIGHT

; صور صفحات الترحيب والانتهاء
!define MUI_WELCOMEFINISHPAGE_BITMAP "${IMAGE_WIZARD}"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${IMAGE_WIZARD}"

; إعدادات إضافية للصور
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH

; Function to create icons and shortcuts
Function CreateIcons
  ; Create Start Menu folder
  CreateDirectory "$SMPROGRAMS\AgorraLab"

  ; Main program shortcut
  CreateShortCut "$SMPROGRAMS\AgorraLab\AgorraLab.lnk" \
                 "$INSTDIR\AgorraLab.exe" \
                 "" \
                 "$INSTDIR\AgorraLab.exe" \
                 0 \
                 SW_SHOWNORMAL \
                 "" \
                 "AgorraLab"

  ; Uninstall shortcut
  CreateShortCut "$SMPROGRAMS\AgorraLab\Uninstall AgorraLab.lnk" \
                 "$INSTDIR\uninstall.exe" \
                 "" \
                 "$INSTDIR\uninstall.exe" \
                 0 \
                 SW_SHOWNORMAL \
                 "" \
                 "Uninstall AgorraLab"

  ; Help file shortcut
  CreateShortCut "$SMPROGRAMS\AgorraLab\User Guide.lnk" \
                 "$INSTDIR\README.txt" \
                 "" \
                 "$INSTDIR\README.txt" \
                 0 \
                 SW_SHOWNORMAL \
                 "" \
                 "User Guide and Help"

  ; Website shortcut
  WriteINIStr "$SMPROGRAMS\AgorraLab\Website.url" \
              "InternetShortcut" \
              "URL" \
              "https://agorralab.com"

  ; Desktop shortcut
  CreateShortCut "$DESKTOP\AgorraLab.lnk" \
                 "$INSTDIR\AgorraLab.exe" \
                 "" \
                 "$INSTDIR\AgorraLab.exe" \
                 0 \
                 SW_SHOWNORMAL \
                 "" \
                 "AgorraLab"

  ; Quick Launch shortcut (if available)
  CreateShortCut "$QUICKLAUNCH\AgorraLab.lnk" \
                 "$INSTDIR\AgorraLab.exe" \
                 "" \
                 "$INSTDIR\AgorraLab.exe" \
                 0 \
                 SW_SHOWNORMAL \
                 "" \
                 "AgorraLab"
FunctionEnd

; Function to remove icons and shortcuts
Function un.RemoveIcons
  ; Delete Start Menu shortcuts
  Delete "$SMPROGRAMS\AgorraLab\AgorraLab.lnk"
  Delete "$SMPROGRAMS\AgorraLab\Uninstall AgorraLab.lnk"
  Delete "$SMPROGRAMS\AgorraLab\User Guide.lnk"
  Delete "$SMPROGRAMS\AgorraLab\Website.url"
  RMDir "$SMPROGRAMS\AgorraLab"

  ; Delete desktop shortcut
  Delete "$DESKTOP\AgorraLab.lnk"

  ; Delete Quick Launch shortcut
  Delete "$QUICKLAUNCH\AgorraLab.lnk"
FunctionEnd

; دالة تسجيل أنواع الملفات
Function RegisterFileTypes
  ; تسجيل امتداد .dcm (Dental Clinic Management)
  WriteRegStr HKCR ".dcm" "" "AgorraLab.DataFile"
  WriteRegStr HKCR "AgorraLab.DataFile" "" "ملف بيانات AgorraLab"
  WriteRegStr HKCR "AgorraLab.DataFile\DefaultIcon" "" "$INSTDIR\AgorraLab.exe,0"
  WriteRegStr HKCR "AgorraLab.DataFile\shell\open\command" "" '"$INSTDIR\AgorraLab.exe" "%1"'
  
  ; تسجيل امتداد .dcb (AgorraLab Backup)
  WriteRegStr HKCR ".dcb" "" "AgorraLab.BackupFile"
  WriteRegStr HKCR "AgorraLab.BackupFile" "" "ملف نسخة احتياطية AgorraLab"
  WriteRegStr HKCR "AgorraLab.BackupFile\DefaultIcon" "" "$INSTDIR\AgorraLab.exe,1"
  WriteRegStr HKCR "AgorraLab.BackupFile\shell\open\command" "" '"$INSTDIR\AgorraLab.exe" --restore "%1"'
  
  ; تحديث قاعدة بيانات الأيقونات
  System::Call 'shell32.dll::SHChangeNotify(l, l, p, p) v (0x08000000, 0, 0, 0)'
FunctionEnd

; دالة إلغاء تسجيل أنواع الملفات
Function un.UnregisterFileTypes
  ; إلغاء تسجيل امتدادات الملفات
  DeleteRegKey HKCR ".dcm"
  DeleteRegKey HKCR "AgorraLab.DataFile"
  DeleteRegKey HKCR ".dcb"
  DeleteRegKey HKCR "AgorraLab.BackupFile"
  
  ; تحديث قاعدة بيانات الأيقونات
  System::Call 'shell32.dll::SHChangeNotify(l, l, p, p) v (0x08000000, 0, 0, 0)'
FunctionEnd

; Function to create application info file
Function CreateAppInfo
  ; Create application info file
  FileOpen $0 "$INSTDIR\app-info.txt" w
  FileWrite $0 "AgorraLab$\r$\n"
  FileWrite $0 "Version: v2.1$\r$\n"
  FileWrite $0 "Installation Date: $\r$\n"
  FileWrite $0 "Installation Folder: $INSTDIR$\r$\n"
  FileWrite $0 "Application ID: com.AgorraLab.AgorraLab$\r$\n"
  FileWrite $0 "Publisher: AgorraLab Team$\r$\n"
  FileWrite $0 "Website: https://agorralab.com$\r$\n"
  FileWrite $0 "Technical Support: support@agorralab.com$\r$\n"
  FileClose $0
FunctionEnd

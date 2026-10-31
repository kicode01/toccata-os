Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
previewUrl = "file:///" & Replace(strPath, "\", "/") & "/desktop/preview/index.html"

Set fso = CreateObject("Scripting.FileSystemObject")
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

If fso.FileExists(chromePath) Then
    WshShell.Run """" & chromePath & """ --app=""" & previewUrl & """ --start-maximized --disable-features=Translate", 1, False
ElseIf fso.FileExists(edgePath) Then
    WshShell.Run """" & edgePath & """ --app=""" & previewUrl & """ --start-maximized --disable-features=Translate", 1, False
Else
    WshShell.Run """" & previewUrl & """", 1, False
End If

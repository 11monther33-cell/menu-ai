Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\User\Downloads\AR"
WshShell.Run "npm run dev", 0, False

# Required System Permissions

This document outlines the required system permissions and settings you need to configure in order to run the activity simulator on your operating system.

---

## macOS

The simulator relies on `osascript` (AppleScript) and native `swift` to automate keystrokes, activate windows, and manipulate the mouse cursor.

### Accessibility Permissions (Required)

To allow the tool to simulate user activity, you must grant **Accessibility** permissions to the Terminal application or IDE you are using to launch the simulator.

**How to grant Accessibility permissions:**

1. Open **System Settings**.
2. Navigate to **Privacy & Security** > **Accessibility**.
3. Toggle the switch to **ON** for your terminal emulator (e.g., `Terminal`, `iTerm2`, `Warp`) or your IDE (e.g., `Visual Studio Code`, `WebStorm`).
4. If your application is not listed, click the `+` button at the bottom of the list, authenticate, and add your application from the `Applications` folder.

> **Note**: If you run into an error like `osascript is not allowed to send keystrokes (error 1002)`, it means Accessibility permissions have not been properly granted. Sometimes, toggling the switch off and back on again resolves this issue.

---

## Windows

The simulator relies on `powershell.exe` along with `user32.dll` and `System.Windows.Forms` to manage windows and simulate keyboard/mouse input natively without installing third-party binaries.

### PowerShell Execution Policy

The tool automatically attempts to run its inline PowerShell scripts using the `-ExecutionPolicy Bypass` flag. In the vast majority of cases, this circumvents local execution policies without requiring any permanent changes to your system settings.

**Troubleshooting Group Policy:**
If your organization employs strict Group Policies that block all PowerShell execution globally (even with the `Bypass` flag), the simulator may fail to execute. In this case, you may need to:
1. Open PowerShell as Administrator.
2. Run `Set-ExecutionPolicy RemoteSigned` (or consult your IT administrator to allow the application's scripts to run).

### Antivirus / EDR Restrictions

Because the tool leverages inline C# code (`Add-Type`) to interact with raw Win32 APIs, certain aggressive Antivirus or Endpoint Detection and Response (EDR) solutions might flag the inline generation or execution of temporary assemblies as suspicious.

If the simulator is silently killed or blocked on Windows:
- Consider adding your Node.js executable to your antivirus whitelist.
- Consider adding the project directory to your antivirus exclusion list.

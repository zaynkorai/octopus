import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Executes a PowerShell command.
 */
export async function runPowerShell(script: string): Promise<string> {
    try {
        // The script might contain special characters, so we encode it in Base64 
        // to pass it safely to powershell.exe -EncodedCommand
        const buffer = Buffer.from(script, "utf16le");
        const encodedCommand = buffer.toString("base64");

        // We use powershell.exe instead of pwsh to ensure maximum compatibility out-of-the-box on Windows
        const { stdout } = await execAsync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedCommand}`);
        return stdout.trim();
    } catch (error) {
        console.error("PowerShell execution failed.");
        throw error;
    }
}

/**
 * Focuses an application by its process name using user32.dll
 */
export async function activateApp(processName: string) {
    // A robust C# script executed via Add-Type to bring window to front
    const script = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class Window {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
Add-Type -TypeDefinition $code -Name Window -Namespace Win32

$processes = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue
if ($processes -and $processes.Count -gt 0) {
    $hwnd = $processes[0].MainWindowHandle
    if ($hwnd -ne 0) {
        [Win32.Window]::ShowWindow($hwnd, 9) | Out-Null # Restore if minimized
        [Win32.Window]::SetForegroundWindow($hwnd) | Out-Null
    }
}
  `;
    await runPowerShell(script);
}

/**
 * Translates our standard key names into SendKeys codes.
 */
function translateKeyToSendKeys(keyName: string): string {
    switch (keyName) {
        case "space": return " ";
        case "tab": return "{TAB}";
        case "down": return "{DOWN}";
        case "up": return "{UP}";
        case "right": return "{RIGHT}";
        case "left": return "{LEFT}";
        case "escape": return "{ESC}";
        case "]": return "{]}";
        case "[": return "{[}";
        default: return keyName;
    }
}

/**
 * Uses System.Windows.Forms.SendKeys to simulate keystrokes.
 */
export async function pressKey(keyName: string) {
    const sendKey = translateKeyToSendKeys(keyName);
    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${sendKey}')
  `;
    await runPowerShell(script);
}

/**
 * Uses SendKeys with modifier symbols.
 * Modifier strings: "ctrl", "alt", "shift"
 * SendKeys syntax: ^ for Ctrl, % for Alt, + for Shift
 */
export async function pressKeyWithModifiers(keyName: string, modifiers: string[]) {
    const modString = modifiers.map(m => {
        switch (m) {
            case "ctrl": return "^";
            case "alt": return "%";
            case "shift": return "+";
            default: return "";
        }
    }).join("");

    const sendKey = translateKeyToSendKeys(keyName);

    // For special keys, SendKeys wraps them, like {TAB}. If there are modifiers, 
    // they precede the key, e.g. ^{TAB} for Ctrl+Tab
    const keySyntax = sendKey.length === 1 ? sendKey : sendKey; // already wrapped if it came from translate
    const fullCommand = `${modString}${keySyntax}`;

    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${fullCommand}')
`;
    await runPowerShell(script);
}

/**
 * Send keystrokes directly (typing text).
 */
export async function typeText(text: string) {
    // SendKeys requires escaping special characters like +, ^, %, ~, (, ), {, }, [, ]
    // But for basic bash scripting, simple SendWait is usually fine.
    // We will do a basic replace for {}, () and ~ 
    let escapedText = text.replace(/([+^%~()[\]{}])/g, '{$1}');
    // Escape single quotes for PowerShell string
    escapedText = escapedText.replace(/'/g, "''");

    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${escapedText}')
`;
    await runPowerShell(script);
}

/**
 * Moves the mouse cursor to a specific absolute screen location.
 */
export async function moveMouse(x: number, y: number) {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
`;
    await runPowerShell(script);
}

/**
 * Opens a URL in the default browser natively.
 */
export async function openUrl(url: string) {
    // Escaping quotes for PowerShell
    const escapedUrl = url.replace(/'/g, "''");
    await runPowerShell(`Start-Process '${escapedUrl}'`);
}

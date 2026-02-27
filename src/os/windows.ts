import { exec, spawn } from "child_process";
import { promisify } from "util";
import { randomSleep, randomChance, randomInt } from "../utils/random";

const execAsync = promisify(exec);

/**
 * Executes a PowerShell command with zero visibility.
 */
export async function runPowerShell(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // -WindowStyle Hidden is used as a fallback, but windowsHide: true in spawn is the primary mechanism
        const child = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-Command", script], {
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"]
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("close", (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                console.error(`PowerShell failed with code ${code}: ${stderr}`);
                reject(new Error(stderr || `PowerShell exited with code ${code}`));
            }
        });

        child.on("error", (err) => {
            reject(err);
        });
    });
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
        case "backspace": return "{BACKSPACE}";
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
 * Send keystrokes realistically with variable delays and occasional typos.
 */
export async function typeText(text: string) {
    for (const char of text) {
        if (/[a-zA-Z]/.test(char) && randomChance(0.02)) {
            const wrongChar = String.fromCharCode(97 + randomInt(0, 25));
            let escapedWrongChar = wrongChar.replace(/([+^%~()[\]{}])/g, '{$1}');
            escapedWrongChar = escapedWrongChar.replace(/'/g, "''");
            await runPowerShell(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedWrongChar}')`);
            await randomSleep(100, 300);

            await pressKey("backspace"); // Ensure this works, might need {BACKSPACE} mapped in translation
            await randomSleep(100, 300);
        }

        let escapedChar = char.replace(/([+^%~()[\]{}])/g, '{$1}');
        escapedChar = escapedChar.replace(/'/g, "''");
        await runPowerShell(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escapedChar}')`);
        await randomSleep(30, 150);
    }
}

/**
 * Moves the mouse cursor smoothly to a specific location using a Bezier/easing curve.
 * Optionally clicks at the destination.
 */
export async function moveMouse(x: number, y: number, click: boolean = true) {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
$start = [System.Windows.Forms.Cursor]::Position
$targetX = ${x}
$targetY = ${y}
$steps = 50
$sleepTime = 10

for ($i = 1; $i -le $steps; $i++) {
    $t = $i / $steps
    $easeT = if ($t -lt 0.5) { 2 * $t * $t } else { -1 + (4 - 2 * $t) * $t }
    $currentX = [Math]::Round($start.X + ($targetX - $start.X) * $easeT)
    $currentY = [Math]::Round($start.Y + ($targetY - $start.Y) * $easeT)
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($currentX, $currentY)
    Sleep -Milliseconds $sleepTime
}
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($targetX, $targetY)
`;
    await runPowerShell(script);

    if (click) {
        await clickMouse();
    }
}

/**
 * Opens a URL in the default browser natively.
 */
export async function openUrl(url: string) {
    // Escaping quotes for PowerShell
    const escapedUrl = url.replace(/'/g, "''");
    // Using Start-Process is the standard PowerShell way to open a URL in the default browser.
    // Adding -ErrorAction SilentlyContinue to prevent issues if association is messy.
    await runPowerShell(`Start-Process '${escapedUrl}' -ErrorAction SilentlyContinue`);
}

/**
 * Clicks the left mouse button at the current location.
 */
export async function clickMouse() {
    const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Mouse {
    [DllImport("user32.dll", CharSet = CharSet.Auto, CallingConvention = CallingConvention.StdCall)]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
    
    public const int MOUSEEVENTF_LEFTDOWN = 0x02;
    public const int MOUSEEVENTF_LEFTUP = 0x04;
}
"@
[Mouse]::mouse_event([Mouse]::MOUSEEVENTF_LEFTDOWN -bor [Mouse]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
`;
    await runPowerShell(script);
}

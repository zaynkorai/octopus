import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const IS_MAC = process.platform === "darwin";
const IS_WIN = process.platform === "win32";

/**
 * Returns the system idle time in seconds.
 * On macOS, it uses ioreg. On Windows, it uses PowerShell to query GetLastInputInfo.
 */
export async function getIdleTime(): Promise<number> {
    if (IS_MAC) {
        try {
            const { stdout } = await execAsync("ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF/1000000000; exit}'");
            const time = parseFloat(stdout.trim());
            return isNaN(time) ? 999999 : time;
        } catch (error) {
            console.error("Failed to get idle time on macOS.", error);
            return 99999;
        }
    }

    if (IS_WIN) {
        try {
            // PowerShell command to get idle time by subtracting LastInputTime from current TickCount
            // We use -WindowStyle Hidden and windowsHide: true to ensure zero visibility.
            const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$lastInput = Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii); [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }' -Name 'Win32GetLastInputInfo' -Namespace 'Win32' -PassThru; $lii = New-Object Win32.Win32GetLastInputInfo+LASTINPUTINFO; $lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii); if ($lastInput::GetLastInputInfo([ref]$lii)) { ([Environment]::TickCount - $lii.dwTime) / 1000 } else { 99999 }"`;
            const { stdout } = await execAsync(psCommand, { windowsHide: true });
            const time = parseFloat(stdout.trim());
            return isNaN(time) ? 99999 : time;
        } catch (error) {
            console.error("Failed to get idle time on Windows.", error);
            return 99999;
        }
    }

    // Default for unsupported OS
    return 99999;
}

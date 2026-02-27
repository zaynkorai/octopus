import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Executes an AppleScript command.
 */
export async function runAppleScript(script: string): Promise<string> {
    try {
        // Escape single quotes carefully for bash
        const escapedScript = script.replace(/'/g, "'\\''");
        const { stdout } = await execAsync(`osascript -e '${escapedScript}'`);
        return stdout.trim();
    } catch (error: any) {
        if (error.message && error.message.includes("1002") && error.message.includes("osascript is not allowed to send keystrokes")) {
            console.error("\n❌ macOS Permission Error:");
            console.error("Your Terminal or IDE needs Accessibility permissions to simulate keystrokes.");
            console.error("Go to: System Settings > Privacy & Security > Accessibility");
            console.error("And grant permission to your Terminal or IDE, then restart the tool.\n");
        } else {
            console.error("AppleScript execution failed.");
            console.error("Script:", script);
        }
        throw error;
    }
}

/**
 * Brings the specified application to the foreground.
 * @param appName E.g., "Google Chrome", "Visual Studio Code"
 */
export async function activateApp(appName: string) {
    await runAppleScript(`tell application "${appName}" to activate`);
}

/**
 * Simulates a key press using macOS key codes.
 * Common key codes:
 * 49: Space
 * 48: Tab
 * 125: Down Arrow
 * 126: Up Arrow
 * 123: Left Arrow
 * 124: Right Arrow
 */
export async function pressKey(keyCode: number) {
    await runAppleScript(`tell application "System Events" to key code ${keyCode}`);
}

/**
 * Simulates pressing a key with modifier keys (e.g., cmd+tab, cmd+shift+]).
 * Modifiers can be: "command down", "shift down", "option down", "control down".
 */
export async function pressKeyWithModifiers(keyCode: number, modifiers: string[]) {
    const modString = modifiers.join(", ");
    await runAppleScript(`tell application "System Events" to key code ${keyCode} using {${modString}}`);
}

/**
 * Send keystrokes directly (typing text).
 */
export async function typeText(text: string) {
    // escaping double quotes inside the text
    const escapedText = text.replace(/"/g, '\\"');
    await runAppleScript(`tell application "System Events" to keystroke "${escapedText}"`);
}

/**
 * Moves the mouse cursor to a specific absolute screen location using swift natively.
 */
export async function moveMouse(x: number, y: number) {
    // Use swift to directly interface with CoreGraphics for silent/background cursor movement
    try {
        await execAsync(`swift -e 'import CoreGraphics; CGDisplayMoveCursorToPoint(CGMainDisplayID(), CGPoint(x: ${x}, y: ${y}))'`);
    } catch (e) {
        console.error("Failed to move mouse natively on macOS via swift.", e);
    }
}

/**
 * Opens a URL in the default browser natively.
 */
export async function openUrl(url: string) {
    try {
        // Simple 'open' command in bash
        await execAsync(`open '${url}'`);
    } catch (e) {
        console.error("Failed to open URL on macOS via bash.", e);
    }
}

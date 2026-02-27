import { exec } from "child_process";
import { promisify } from "util";
import { randomSleep, randomChance, randomInt } from "../utils/random";

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
 * Send keystrokes realistically with variable delays and occasional typos.
 */
export async function typeText(text: string) {
    for (const char of text) {
        // Occasional typo simulation (e.g., 2% chance for alphabet letters)
        if (/[a-zA-Z]/.test(char) && randomChance(0.02)) {
            // Pick a random lowercase letter for the typo
            const wrongChar = String.fromCharCode(97 + randomInt(0, 25));
            const escapedWrongChar = wrongChar.replace(/"/g, '\\"');
            await runAppleScript(`tell application "System Events" to keystroke "${escapedWrongChar}"`);
            await randomSleep(100, 300); // Wait, realize the typo

            // Backspace to delete the typo (key code 51 is backspace)
            await pressKey(51);
            await randomSleep(100, 300);
        }

        // Type the correct character
        const escapedChar = char.replace(/"/g, '\\"');
        await runAppleScript(`tell application "System Events" to keystroke "${escapedChar}"`);

        // Natural delay between keystrokes
        await randomSleep(30, 150);
    }
}

/**
 * Moves the mouse cursor smoothly to a specific location using a Bezier/easing curve natively via swift.
 * Optionally clicks at the destination.
 */
export async function moveMouse(x: number, y: number, click: boolean = true) {
    const swiftScript = `
        import CoreGraphics
        import Foundation
        let targetX = Double(${x})
        let targetY = Double(${y})
        let event = CGEvent(source: nil)
        let startPos = event?.location ?? CGPoint(x: 0, y: 0)
        let steps = 50
        let sleepTime: UInt32 = 10000
        for i in 1...steps {
            let t = Double(i) / Double(steps)
            let easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
            let currentX = startPos.x + CGFloat((targetX - Double(startPos.x)) * easeT)
            let currentY = startPos.y + CGFloat((targetY - Double(startPos.y)) * easeT)
            CGDisplayMoveCursorToPoint(CGMainDisplayID(), CGPoint(x: currentX, y: currentY))
            usleep(sleepTime)
        }
        CGDisplayMoveCursorToPoint(CGMainDisplayID(), CGPoint(x: targetX, y: targetY))
    `;

    try {
        await execAsync(`echo '${swiftScript}' | swift -`);

        if (click) {
            // After moving, do a quick left click
            await runAppleScript('tell application "System Events" to click');
        }
    } catch (e) {
        console.error("Failed to move mouse smoothly.", e);
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

/**
 * Clicks the left mouse button at the current absolute screen location natively.
 */
export async function clickMouse() {
    try {
        const swiftScript = `import CoreGraphics; let point = CGEvent(source: nil)!.location; let mouseDown = CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left); mouseDown?.post(tap: .cghidEventTap); let mouseUp = CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left); mouseUp?.post(tap: .cghidEventTap)`;
        await execAsync(`swift -e '${swiftScript}'`);
    } catch (e) {
        console.error("Failed to click mouse natively on macOS via swift.", e);
    }
}

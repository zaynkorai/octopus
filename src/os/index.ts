import * as mac from "./applescript";
import * as win from "./windows";
export { getIdleTime } from "./idle";

const IS_MAC = process.platform === "darwin";
const IS_WIN = process.platform === "win32";

// Supported logical keys in our CLI profiles
export type OSKey = "space" | "tab" | "down" | "up" | "right" | "left" | "escape" | "]" | "[" | "backspace" | "w";
export type OSModifier = "ctrl" | "alt" | "shift" | "cmd";

/**
 * Brings an app to the foreground based on OS
 */
export async function activateApp(macAppName: string, winProcessName: string) {
    if (IS_MAC) {
        await mac.activateApp(macAppName);
    } else if (IS_WIN) {
        await win.activateApp(winProcessName);
    } else {
        throw new Error("Unsupported OS");
    }
}

/**
 * Presses a single key
 */
export async function pressKey(key: OSKey) {
    if (IS_MAC) {
        const code = getMacKeyCode(key);
        await mac.pressKey(code);
    } else if (IS_WIN) {
        await win.pressKey(key);
    }
}

/**
 * Presses a key with modifiers
 */
export async function pressKeyWithModifiers(key: OSKey, modifiers: OSModifier[]) {
    if (IS_MAC) {
        const code = getMacKeyCode(key);
        const macMods = modifiers.map(m => {
            if (m === "ctrl") return "control down";
            if (m === "cmd") return "command down";
            if (m === "alt") return "option down";
            if (m === "shift") return "shift down";
            return "";
        });
        await mac.pressKeyWithModifiers(code, macMods);
    } else if (IS_WIN) {
        // Windows doesn't map 'cmd' directly, we usually map it to 'ctrl' for generic intents
        const winMods = modifiers.map(m => m === "cmd" ? "ctrl" : m);
        await win.pressKeyWithModifiers(key, winMods);
    }
}

/**
 * Types text using native OS keystrokes
 */
export async function typeText(text: string) {
    if (IS_MAC) {
        await mac.typeText(text);
    } else if (IS_WIN) {
        await win.typeText(text);
    }
}

/**
 * Moves mouse to absolute screen coordinates smoothly and optionally clicks.
 */
export async function moveMouse(x: number, y: number, click: boolean = true) {
    if (IS_MAC) {
        await mac.moveMouse(x, y, click);
    } else if (IS_WIN) {
        await win.moveMouse(x, y, click);
    }
}

/**
 * Clicks the left mouse button at the current mouse position
 */
export async function clickMouse() {
    if (IS_MAC) {
        await mac.clickMouse();
    } else if (IS_WIN) {
        await win.clickMouse();
    }
}

/**
 * Opens a URL in the native default browser
 */
export async function openUrl(url: string) {
    if (IS_MAC) {
        await mac.openUrl(url);
    } else if (IS_WIN) {
        await win.openUrl(url);
    }
}

function getMacKeyCode(key: OSKey): number {
    switch (key) {
        case "space": return 49;
        case "tab": return 48;
        case "down": return 125;
        case "up": return 126;
        case "right": return 124;
        case "left": return 123;
        case "escape": return 53;
        case "]": return 30;
        case "[": return 33;
        case "backspace": return 51;
        case "w": return 13;
    }
}

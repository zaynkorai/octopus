import { pressKey, pressKeyWithModifiers, OSKey, typeText, moveMouse, clickMouse, getIdleTime } from "../os/index";
import { randomSleep, randomInt, randomChance } from "../utils/random";

const BASH_SNIPPETS = [
    "echo \"Checking system logs...\"",
    "grep -r \"ERROR\" /var/log/",
    "find . -name \"*.ts\" -type f",
    "chmod +x deploy.sh",
    "tar -czvf backup.tar.gz /var/www/",
    "docker compose up -d",
    "git status",
    "git diff"
];

export async function runCodingProfile(minIntervalSeconds: number = 60, maxIntervalSeconds: number = 120, clicks: boolean = false, idleThreshold: number = 60) {
    console.log(`🚀 Starting 'coding' profile silently. Writing bash scripts.`);

    let lastActionTime = 0;

    while (true) {
        try {
            const currentIdleTime = await getIdleTime();
            const timeSinceLastAction = (Date.now() - lastActionTime) / 1000;

            if (currentIdleTime < idleThreshold && currentIdleTime < (timeSinceLastAction - 2.0)) {
                console.log(`=> User is currently active (Idle time: ${currentIdleTime.toFixed(1)}s). Pausing simulation...`);
                await randomSleep(5000, 10000); // Check again after 5-10 seconds
                continue;
            }

            // 1. Move the mouse a bit
            console.log(`=> Moving the mouse...`);
            // we removed the manual clickMouse call since moveMouse defaults to true
            await moveMouse(randomInt(100, 1000), randomInt(100, 800), clicks && randomChance(0.4));

            // Random chance for a micro-break
            if (randomChance(0.15)) {
                console.log(`=> Taking a micro-break from coding...`);
                await randomSleep(2000, 8000);
            } else {
                await randomSleep(500, 1500);
            }

            // 2. Cycle to previous window organically occasionally (macOS only for now to avoid Windows focus issues)
            if (process.platform === "darwin" && Math.random() > 0.6) {
                console.log(`=> Cycling active window...`);
                await pressKeyWithModifiers("tab", ["cmd"]);
                await randomSleep(1000, 3000);
            }

            // 3. Switch files or Editor Tabs
            if (Math.random() > 0.5) {
                console.log(`=> Switching editor tab`);
                if (process.platform === "darwin") {
                    // Cmd+Shift+] to switch tabs in many Mac Apps (VS Code, Chrome, etc)
                    await pressKeyWithModifiers("]", ["cmd", "shift"]);
                } else {
                    // Windows: Ctrl + Tab
                    await pressKeyWithModifiers("tab", ["ctrl"]);
                }
            } else {
                console.log(`=> Occasional safe interaction (Escape)`);
                await pressKey("escape");
            }

            await randomSleep(2000, 5000);

            // 4. Move cursor up and down to simulate reading code
            const movements = randomInt(2, 6);
            console.log(`=> Moving cursor ${movements} times`);
            for (let i = 0; i < movements; i++) {
                const key: OSKey = randomChance(0.5) ? "down" : "up";
                await pressKey(key);
                await randomSleep(300, 800);
            }

            // 5. Type bash script strings realistically
            if (randomChance(0.4)) {
                const snippet = BASH_SNIPPETS[Math.floor(Math.random() * BASH_SNIPPETS.length)];
                console.log(`=> Typing bash snippet: ${snippet}`);
                // Make a new line safely
                await typeText(snippet);
                await randomSleep(500, 1000);
            }

            // 6. Idle time to "think"
            lastActionTime = Date.now();
            const idleTime = randomInt(minIntervalSeconds * 1000, maxIntervalSeconds * 1000);
            console.log(`💤 Thinking about code for ${Math.round(idleTime / 1000)} seconds...`);
            await randomSleep(idleTime, idleTime);

        } catch (error: any) {
            console.error("Error during coding cycle:", error.message);
            await randomSleep(5000, 10000); // Back off
        }
    }
}

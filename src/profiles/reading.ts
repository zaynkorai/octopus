import { pressKey, pressKeyWithModifiers, openUrl, moveMouse, clickMouse, getIdleTime } from "../os/index";
import { randomSleep, randomInt, randomChance } from "../utils/random";

const DEFAULT_READING_URLS = [
    "https://docs.aws.amazon.com/",
    "https://kubernetes.io/docs/home/",
    "https://docs.docker.com/",
    "https://www.terraform.io/docs",
    "https://docs.ansible.com/",
    "https://docs.github.com/en/actions",
    "https://prometheus.io/docs/introduction/overview/",
    "https://grafana.com/docs/"
];

export async function runReadingProfile(customUrls?: string[], minIntervalSeconds: number = 60, maxIntervalSeconds: number = 180, clicks: boolean = false, idleThreshold: number = 60) {
    console.log(`🚀 Starting 'reading' profile silently, reading AWS / GitHub docs.`);

    let lastActionTime = 0;
    let openedTabs = 0;

    while (true) {
        try {
            const currentIdleTime = await getIdleTime();
            const timeSinceLastAction = (Date.now() - lastActionTime) / 1000;

            if (currentIdleTime < idleThreshold && currentIdleTime < (timeSinceLastAction - 2.0)) {
                console.log(`=> User is currently active (Idle time: ${currentIdleTime.toFixed(1)}s). Pausing simulation...`);
                await randomSleep(5000, 10000); // Check again after 5-10 seconds
                continue;
            }

            // 1. Move the mouse naturally as someone reading might do
            console.log(`=> Wagging the mouse cursor...`);
            await moveMouse(randomInt(100, 1000), randomInt(100, 800), randomChance(0.5)); // 50% chance to click when wagging
            await randomSleep(500, 1500);

            // 2. Open a documentation page or cycle current windows
            if (Math.random() > 0.4) {
                if (openedTabs >= 2) {
                    console.log(`=> Closing a tab to prevent clutter...`);
                    await pressKeyWithModifiers("w", process.platform === "darwin" ? ["cmd"] : ["ctrl"]);
                    openedTabs--;
                    await randomSleep(1000, 2000);
                } else {
                    const urlsToUse = customUrls && customUrls.length > 0 ? customUrls : DEFAULT_READING_URLS;
                    const url = urlsToUse[Math.floor(Math.random() * urlsToUse.length)];
                    console.log(`=> Opening documentation: ${url} `);
                    await openUrl(url);
                    openedTabs++;
                    await randomSleep(4000, 8000); // give time to load the browser
                }
            } else if (process.platform === "darwin") {
                console.log(`=> Cycling active window...`);
                await pressKeyWithModifiers("tab", ["cmd"]);
                await randomSleep(1000, 2000);
            }

            // 3. Scroll organically using Spacebar or Arrow keys
            // Sometimes humans scroll a lot, sometimes a little
            const scrolls = randomInt(2, 10);
            console.log(`=> Scrolling organically ${scrolls} times`);

            for (let i = 0; i < scrolls; i++) {
                // Occasional micro-break while reading
                if (randomChance(0.2)) {
                    console.log(`=> Taking a micro -break to read...`);
                    await randomSleep(3000, 10000);
                }

                if (randomChance(0.15)) {
                    // Oops, scrolled too far, scroll back up briefly
                    console.log(`=> Scrolling back up slightly`);
                    const correctiveScrolls = randomInt(1, 3);
                    for (let j = 0; j < correctiveScrolls; j++) {
                        await pressKey("up");
                        await randomSleep(200, 600);
                    }
                } else {
                    // Mix between spacebar (large jump) and down arrow (small scroll)
                    const key = Math.random() > 0.3 ? "down" : "space";
                    await pressKey(key);

                    if (randomChance(0.4)) {
                        await moveMouse(randomInt(100, 1000), randomInt(100, 800), false); // idle wiggle without clicking
                    }

                    // Delay between scrolls
                    await randomSleep(1000, 4000);
                }
            }

            // 4. Wait a longer period before the next major action
            lastActionTime = Date.now();
            const idleTime = randomInt(minIntervalSeconds * 1000, maxIntervalSeconds * 1000);
            console.log(`💤 Brainstorming / Reading idly for ${Math.round(idleTime / 1000)} seconds...`);
            await randomSleep(idleTime, idleTime);

        } catch (error: any) {
            console.error("Error during reading cycle:", error.message);
            await randomSleep(5000, 10000); // Back off
        }
    }
}

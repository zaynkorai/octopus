import { pressKey, pressKeyWithModifiers, openUrl, moveMouse } from "../os/index";
import { randomSleep, randomInt } from "../utils/random";

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

export async function runReadingProfile(customUrls?: string[], minIntervalSeconds: number = 60, maxIntervalSeconds: number = 180) {
    console.log(`🚀 Starting 'reading' profile silently, reading AWS/GitHub docs.`);

    while (true) {
        try {
            // 1. Move the mouse naturally as someone reading might do
            console.log(`=> Wagging the mouse cursor...`);
            await moveMouse(randomInt(100, 1000), randomInt(100, 800));
            await randomSleep(500, 1500);

            // 2. Open a documentation page or cycle current windows
            if (Math.random() > 0.4) {
                const urlsToUse = customUrls && customUrls.length > 0 ? customUrls : DEFAULT_READING_URLS;
                const url = urlsToUse[Math.floor(Math.random() * urlsToUse.length)];
                console.log(`=> Opening documentation: ${url}`);
                await openUrl(url);
                await randomSleep(4000, 8000); // give time to load the browser
            } else {
                console.log(`=> Cycling active window...`);
                await pressKeyWithModifiers("tab", process.platform === "darwin" ? ["cmd"] : ["alt"]);
                await randomSleep(1000, 2000);
            }

            // 3. Scroll down a random number of times using Spacebar or Arrow keys
            const scrolls = randomInt(2, 6);
            console.log(`=> Scrolling down ${scrolls} times`);
            for (let i = 0; i < scrolls; i++) {
                // Mix between spacebar and down arrow
                const key = Math.random() > 0.5 ? "space" : "down";
                await pressKey(key);
                await moveMouse(randomInt(100, 1000), randomInt(100, 800)); // idle wiggle
                await randomSleep(1500, 5000);
            }

            // Sometimes scroll back up
            if (Math.random() > 0.6) {
                console.log(`=> Scrolling back up`);
                for (let i = 0; i < scrolls; i++) {
                    await pressKey("up");
                    await randomSleep(500, 1500);
                }
            }

            // 4. Wait a longer period before the next major action
            const idleTime = randomInt(minIntervalSeconds * 1000, maxIntervalSeconds * 1000);
            console.log(`💤 Brainstorming/Reading idly for ${Math.round(idleTime / 1000)} seconds...`);
            await randomSleep(idleTime, idleTime);

        } catch (error: any) {
            console.error("Error during reading cycle:", error.message);
            await randomSleep(5000, 10000); // Back off
        }
    }
}

#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { runReadingProfile } from "./profiles/reading";
import { runCodingProfile } from "./profiles/coding";
import * as util from "util";

const logFile = path.join(process.cwd(), "activity.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

console.log = (...args: any[]) => logStream.write(util.format(...args) + "\\n");
console.error = (...args: any[]) => logStream.write(util.format(...args) + "\\n");
console.warn = (...args: any[]) => logStream.write(util.format(...args) + "\\n");
console.info = (...args: any[]) => logStream.write(util.format(...args) + "\\n");

const program = new Command();

program
    .name("simulate")
    .description("Simulate macOS user activity to prevent idle tracking.")
    .version("1.0.0");

program
    .command("start")
    .description("Start simulating activity")
    .option("-p, --profile <type>", "Activity profile to run: 'reading' or 'coding'")
    .option("-b, --background", "Run silently in the background")
    .option("-c, --clicks", "Simulate mouse clicks as well as movements")
    .option("-u, --urls <urls>", "Comma-separated list of custom URLs to read (for 'reading' profile)")
    .option("--min-interval <seconds>", "Minimum idle time in seconds")
    .option("--max-interval <seconds>", "Maximum idle time in seconds")
    .option("--idle-threshold <seconds>", "Pause simulating if user has been active within this many seconds")
    .action(async (options) => {
        try {
            // 1. Read configuration file if it exists
            const configPath = path.resolve(process.cwd(), "activity.config.json");
            let configData: any = {};
            if (fs.existsSync(configPath)) {
                try {
                    const configRaw = fs.readFileSync(configPath, "utf-8");
                    configData = JSON.parse(configRaw);
                    console.log(`=> Found configuration file at ${configPath}`);
                } catch (err) {
                    console.error("=> Failed to parse activity.config.json. Using defaults.");
                }
            }

            // 2. Merge options: CLI takes precedence over config
            const finalProfile = options.profile || configData.profile;
            const finalBackground = options.background !== undefined ? options.background : configData.background;
            const finalClicks = options.clicks !== undefined ? options.clicks : configData.clicks;

            let finalUrls = undefined;
            if (options.urls) {
                finalUrls = options.urls.split(",").map((s: string) => s.trim());
            } else if (configData.urls && Array.isArray(configData.urls) && configData.urls.length > 0) {
                finalUrls = configData.urls;
            }

            const finalMinInterval = options.minInterval ? parseInt(options.minInterval, 10) : configData.minInterval;
            const finalMaxInterval = options.maxInterval ? parseInt(options.maxInterval, 10) : configData.maxInterval;
            const finalIdleThreshold = options.idleThreshold ? parseInt(options.idleThreshold, 10) : (configData.idleThreshold !== undefined ? configData.idleThreshold : 60);

            // 3. Validate required options
            if (!finalProfile) {
                console.error("Error: Profile must be specified via CLI (-p/--profile) or config file.");
                process.exit(1);
            }

            // 4. Handle background process detachment
            if (finalBackground && !process.env.ACTIVITY_BACKGROUND_CHILD) {
                console.log("Launching in background...");
                const { spawn } = require("child_process");

                // Remove the background flags if they exist in args
                const args = process.argv.slice(1).filter(arg => arg !== "-b" && arg !== "--background");

                const child = spawn(process.argv[0], args, {
                    detached: true,
                    stdio: "ignore",
                    env: { ...process.env, ACTIVITY_BACKGROUND_CHILD: "1" },
                    windowsHide: true
                });

                child.unref();
                console.log(`Background process started with PID: ${child.pid}`);
                process.exit(0);
            }

            console.log(`Using profile: ${finalProfile}...`);
            console.log("Press Ctrl+C to stop.");

            // 5. Run the selected profile
            if (finalProfile === "reading") {
                await runReadingProfile(finalUrls, finalMinInterval, finalMaxInterval, finalClicks, finalIdleThreshold);
            } else if (finalProfile === "coding") {
                await runCodingProfile(finalMinInterval, finalMaxInterval, finalClicks, finalIdleThreshold);
            } else {
                console.error("Unknown profile. Available profiles: reading, coding");
                process.exit(1);
            }
        } catch (error) {
            console.error("Error during simulation:", error);
            process.exit(1);
        }
    });

program.parse(process.argv);

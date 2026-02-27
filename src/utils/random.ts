/**
 * Generates a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pauses execution for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Pauses execution for a random duration between minMs and maxMs.
 */
export async function randomSleep(minMs: number, maxMs: number): Promise<void> {
    const ms = randomInt(minMs, maxMs);
    await sleep(ms);
}

/**
 * Returns true with the given probability (0.0 to 1.0).
 */
export function randomChance(probability: number): boolean {
    return Math.random() < probability;
}

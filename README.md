# Activity Simulator

A command-line tool designed to gracefully simulate user activity (such as typing, switching apps, scrolling, and mouse movements) to prevent idle tracking.

Unlike other macro tools, this simulator acts **silently** in the background. It uses native OS shortcuts (`Cmd+Tab` / `Alt+Tab`) to cycle your existing windows and wiggles the mouse without aggressively stealing focus from the window you are actively reading or brainstorming on.

Supports both **macOS** and **Windows** natively.

## Prerequisites

- Node.js (version 20+ recommended)
- `pnpm` (This project strictly uses `pnpm`, following our project guidelines)

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm run build
   ```

## Usage

You can run the simulator via the compiled JavaScript in `dist/`.

### Basic Usage
```bash
node dist/index.js start -p reading
# OR
node dist/index.js start -p coding
```

### Background Mode (Silent Run)
To run the simulator completely detached so you don't have to keep a terminal window open, use the `-b` or `--background` flag:
```bash
node dist/index.js start -p coding -b
```
*(To stop a background process, use `pkill -f "activity"` on Mac or end the `node` process in Windows Task Manager).*

### Custom URLs (Reading Profile)
By default, the `reading` profile browses DevOps documentation (AWS, Kubernetes, Docker, etc.). You can override this to browse any sites you want using the `-u` or `--urls` flag:
```bash
node dist/index.js start -p reading -b -u "https://news.ycombinator.com, https://reddit.com"
```

### Configuration File (`activity.config.json`)
Instead of passing URLs via the CLI every time, you can create a file named `activity.config.json` in the root directory where you run the command.
```json
{
  "urls": [
    "https://news.ycombinator.com",
    "https://stackoverflow.com"
  ]
}
```
The simulator will automatically load URLs from this config file if the `--urls` flag is not provided.

## Profiles

1. **`coding`**: Cycles your active windows, optionally typing realistic bash scripts (like `git status`, `docker compose up`) if your cursor is in an input field, and organically moves the mouse.
2. **`reading`**: Cycles active tabs, occasionally opens real-world DevOps documentation in your default browser, scrolls through them, and wiggles the mouse to simulate reading patterns.

## Stopping the Simulator

- **Foreground**: Press `Ctrl+C` in the terminal.
- **Background**: Run `pkill -f "activity"` (macOS/Linux) or end the Node process via Task Manager (Windows).

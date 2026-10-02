# Chrome Profiles - Raycast Extension

Quickly switch between Google Chrome profiles from Raycast.

![Type cp in Raycast, pick a profile, and Chrome opens in that profile](.github/demo.gif)

The profiles shown in the demo are placeholders.

## Features

- List all Chrome profiles with custom names
- Show Google account email for each profile
- Display Google avatar (circular, async loaded)
- Open Chrome with selected profile in one keystroke
- Auto-close Raycast after selection

## Install

Chrome Profiles is not in the Raycast Store yet, so install it from source. You need Node.js 22.14 or later.

```bash
git clone https://github.com/jaynguyen-vn/raycast-chrome-profiles.git
cd raycast-chrome-profiles
npm install
npm run dev
```

`npm run dev` imports the extension into Raycast. Once **Chrome Profiles** shows up in Raycast, you can stop it with `Ctrl + C` and the extension stays installed.

Then in Raycast:

1. Open **Raycast Settings** (`⌘ + ,`)
2. Go to **Extensions** → find **Chrome Profiles**
3. Set **Alias** to `cp` (or any shortcut you prefer)

## Usage

1. Open Raycast (default: `⌥ + Space`)
2. Type `cp` → Enter
3. Select a profile from the list → Enter
4. Chrome opens with that profile, Raycast closes automatically

## Permissions

On macOS 27 and later, Chrome's data folder (`~/Library/Application Support/Google/Chrome`) is protected by the system. Grant Raycast **Full Disk Access** in System Settings → Privacy & Security → Full Disk Access, then restart Raycast. Without it the command shows "Raycast can't read Chrome's profile data" with a shortcut to that settings pane.

## How It Works

- Reads Chrome's `Local State` file to get custom profile names
- Reads each profile's `Preferences` file for Google avatar URLs
- If Chrome is already running, runs Chrome's own binary with `--profile-directory=...` as a detached hand-off helper and closes Raycast without waiting for it. `open -na … --args` stopped passing the flag to a running Chrome on macOS 27 / Chrome 154.
- If Chrome is not running, starts it with `open -a … --args --profile-directory=...`
- Ignores repeated Enter presses while a profile is opening, so one selection opens one window

## Development

```bash
npm run dev    # Start dev mode (hot reload)
npm run build  # Build for production
npm run lint   # Lint code
```

## Requirements

- macOS
- Google Chrome installed
- Raycast
- Node.js >= 22.14 (to build the extension)

## Contributing

Issues and pull requests are welcome.

## License

[MIT](LICENSE)

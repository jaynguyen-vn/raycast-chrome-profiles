import {
  ActionPanel,
  Action,
  List,
  Icon,
  showToast,
  Toast,
  closeMainWindow,
  popToRoot,
  Image,
  getApplications,
} from "@raycast/api";
import { execFile, spawn } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const CHROME_DIR = `${process.env.HOME}/Library/Application Support/Google/Chrome`;

// Chrome's data folder is TCC-protected on macOS 27+, so Raycast needs Full
// Disk Access to read it. This deep link opens the matching settings pane.
const FULL_DISK_ACCESS_SETTINGS =
  "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles";

interface Profile {
  dir: string;
  name: string;
  email: string;
  avatarUrl: string;
}

// Chrome stores custom profile names in Local State (not per-profile Preferences)
interface LocalStateCache {
  [dir: string]: { name?: string; gaia_name?: string; user_name?: string };
}

// Throws when Local State cannot be read: ENOENT means Chrome is not installed,
// EPERM/EACCES means Raycast lacks permission to read Chrome's data.
function getLocalStateProfiles(): LocalStateCache {
  const localState = JSON.parse(
    readFileSync(join(CHROME_DIR, "Local State"), "utf-8"),
  );
  return localState.profile?.info_cache || {};
}

function getProfiles(): Profile[] {
  const cache = getLocalStateProfiles();
  const dirs = Object.keys(cache).sort();

  return dirs.map((dir) => {
    const info = cache[dir];
    const customName = info.name || "";
    const email = info.user_name || "";

    // Read avatar URL from per-profile Preferences
    let avatarUrl = "";
    try {
      const prefs = JSON.parse(
        readFileSync(join(CHROME_DIR, dir, "Preferences"), "utf-8"),
      );
      avatarUrl = prefs.account_info?.[0]?.picture_url || "";
    } catch {
      // no avatar
    }

    return { dir, name: customName || dir, email, avatarUrl };
  });
}

function loadProfiles(): {
  profiles: Profile[];
  error?: NodeJS.ErrnoException;
} {
  try {
    return { profiles: getProfiles() };
  } catch (error) {
    return { profiles: [], error: error as NodeJS.ErrnoException };
  }
}

function profileIcon(profile: Profile): Image.ImageLike {
  if (profile.avatarUrl) {
    return { source: profile.avatarUrl, mask: Image.Mask.Circle };
  }
  return Icon.PersonCircle;
}

// Only the main browser process is named exactly "Google Chrome"; helpers are
// "Google Chrome Helper…", so -x excludes them.
async function isChromeRunning(): Promise<boolean> {
  try {
    await execFileAsync("pgrep", ["-x", "Google Chrome"]);
    return true;
  } catch {
    return false;
  }
}

// Launching the Chrome binary hands its flags to the running instance through
// a short-lived helper process. Started from Raycast, that helper sometimes
// stalls for seconds before handing off, so it is not awaited: it runs detached
// with no stdio and finishes on its own after the command unloads (Raycast
// adopts leftover extension subprocesses instead of killing them).
function handOffToRunningChrome(binary: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const helper = spawn(binary, args, { detached: true, stdio: "ignore" });
    helper.once("error", reject);
    helper.once("spawn", () => {
      helper.unref();
      resolve();
    });
  });
}

// Each extra Enter press while a profile is opening would start another
// hand-off and open another Chrome window.
let isOpening = false;

async function openProfile(profile: Profile) {
  if (isOpening) {
    return;
  }
  isOpening = true;
  try {
    await launchProfile(profile);
  } finally {
    isOpening = false;
  }
}

async function launchProfile(profile: Profile) {
  const chrome = (await getApplications()).find(
    (app) => app.bundleId === "com.google.Chrome",
  );
  if (!chrome) {
    await showToast(Toast.Style.Failure, "Google Chrome not found");
    return;
  }

  const profileFlag = `--profile-directory=${profile.dir}`;
  try {
    if (await isChromeRunning()) {
      // `open -na … --args` no longer forwards the flag to a running Chrome
      // (observed with macOS 27 / Chrome 154), so hand it over through the
      // binary instead.
      await handOffToRunningChrome(
        join(chrome.path, "Contents", "MacOS", "Google Chrome"),
        [profileFlag],
      );
    } else {
      // Cold start through LaunchServices so Chrome is not a child of this
      // worker and survives the command unloading.
      await execFileAsync("open", ["-a", chrome.path, "--args", profileFlag]);
    }
  } catch (error) {
    await showToast(
      Toast.Style.Failure,
      "Could not open Chrome",
      error instanceof Error ? error.message : String(error),
    );
    return;
  }

  await showToast(Toast.Style.Success, `Opened ${profile.name}`);
  await closeMainWindow({ clearRootSearch: true });
  await popToRoot({ clearSearchBar: true });
}

export default function Command() {
  const { profiles, error } = loadProfiles();

  if (error?.code === "EPERM" || error?.code === "EACCES") {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Lock}
          title="Raycast can't read Chrome's profile data"
          description="Grant Raycast Full Disk Access in System Settings → Privacy & Security, then restart Raycast."
          actions={
            <ActionPanel>
              <Action.Open
                title="Open Full Disk Access Settings"
                target={FULL_DISK_ACCESS_SETTINGS}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  if (profiles.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No Chrome profiles found"
          description="Make sure Google Chrome is installed"
        />
      </List>
    );
  }

  return (
    <List searchBarPlaceholder="Select Chrome Profile...">
      {profiles.map((p) => (
        <List.Item
          key={p.dir}
          title={p.name}
          subtitle={p.email}
          accessories={[{ text: p.dir, icon: Icon.Folder }]}
          icon={profileIcon(p)}
          actions={
            <ActionPanel>
              <Action
                title="Open Profile"
                icon={Icon.Globe}
                onAction={() => openProfile(p)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const SETTINGS_FILE_NAME = "desktop-settings.txt";
const DEFAULT_SHARE_ON_LOCAL_NETWORK = true;
const LOCAL_PORT = 3007;

export type DesktopSettings = {
  shareOnLocalNetwork: boolean;
};

export type DesktopLanStatus = DesktopSettings & {
  macIp: string | null;
  ipadUrl: string | null;
};

function fallbackSettingsPath() {
  return path.join(process.cwd(), ".runtime", SETTINGS_FILE_NAME);
}

function desktopAppSupportSettingsPath() {
  return path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "com.praxis.desktop",
    SETTINGS_FILE_NAME,
  );
}

export function desktopSettingsPath() {
  const configured = process.env.PRAXIS_DESKTOP_SETTINGS_PATH?.trim();
  if (configured) return configured;
  const desktopPath = desktopAppSupportSettingsPath();
  if (
    process.platform === "darwin" &&
    process.env.NODE_ENV === "production" &&
    fsSync.existsSync(desktopPath)
  ) {
    return desktopPath;
  }
  return fallbackSettingsPath();
}

export async function readDesktopSettings(): Promise<DesktopSettings> {
  try {
    const text = await fs.readFile(desktopSettingsPath(), "utf8");
    const match = text.match(/^share_on_local_network=(.+)$/m);
    if (!match) {
      return { shareOnLocalNetwork: DEFAULT_SHARE_ON_LOCAL_NETWORK };
    }
    return {
      shareOnLocalNetwork: matchesEnabledValue(match[1]),
    };
  } catch {
    return { shareOnLocalNetwork: DEFAULT_SHARE_ON_LOCAL_NETWORK };
  }
}

export async function writeDesktopSettings(settings: DesktopSettings) {
  const settingsPath = desktopSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  const text = `share_on_local_network=${settings.shareOnLocalNetwork ? 1 : 0}\n`;
  await fs.writeFile(settingsPath, text, "utf8");
}

export async function getDesktopLanStatus(): Promise<DesktopLanStatus> {
  const settings = await readDesktopSettings();
  const macIp = detectMacLanIp();
  return {
    ...settings,
    macIp,
    ipadUrl: macIp ? `http://${macIp}:${LOCAL_PORT}` : null,
  };
}

function matchesEnabledValue(raw: string) {
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function detectMacLanIp() {
  const candidates = Object.entries(os.networkInterfaces())
    .flatMap(([name, entries]) =>
      (entries ?? []).map((entry) => ({
        interfaceName: name,
        ...entry,
      })),
    )
    .filter(
      (entry) =>
        entry.family === "IPv4" &&
        !entry.internal &&
        isPrivateLanAddress(entry.address),
    );

  const preferred = candidates.find((entry) => /^en\d+$/.test(entry.interfaceName));
  return preferred?.address ?? candidates[0]?.address ?? null;
}

function isPrivateLanAddress(address: string) {
  return (
    address.startsWith("10.") ||
    address.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  );
}

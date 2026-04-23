import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const builtApp = path.join(
  root,
  "src-tauri",
  "target",
  "release",
  "bundle",
  "macos",
  "Praxis.app",
);
const applicationsApp = "/Applications/Praxis.app";
const appSupportDir = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "com.praxis.desktop",
);
const envSource = path.join(root, ".env.local");
const envTarget = path.join(appSupportDir, ".env.local");
const storageSource = path.join(root, "local-storage", "praxis-files");
const storageTarget = path.join(appSupportDir, "files");

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(builtApp))) {
  throw new Error(`Built app not found at ${builtApp}. Run npm run desktop:build first.`);
}

await fs.rm(applicationsApp, { recursive: true, force: true });
await fs.cp(builtApp, applicationsApp, { recursive: true });

await fs.mkdir(appSupportDir, { recursive: true });

if (await exists(envSource)) {
  await fs.copyFile(envSource, envTarget);
}

if (await exists(storageSource)) {
  await fs.mkdir(storageTarget, { recursive: true });
  await fs.cp(storageSource, storageTarget, { recursive: true, force: true });
}

console.log(`Installed Praxis.app to ${applicationsApp}`);
console.log(`Synced desktop support files to ${appSupportDir}`);

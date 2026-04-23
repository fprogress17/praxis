import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneSrc = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const publicSrc = path.join(root, "public");
const bundleRoot = path.join(root, "src-tauri", "bundled");
const nextBundleRoot = path.join(bundleRoot, "next");

async function rmIfExists(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function ensureDir(target) {
  await fs.mkdir(target, { recursive: true });
}

async function copyIfExists(source, target) {
  try {
    await fs.access(source);
  } catch {
    return false;
  }
  await fs.cp(source, target, { recursive: true });
  return true;
}

await rmIfExists(bundleRoot);
await ensureDir(nextBundleRoot);

const copiedStandalone = await copyIfExists(standaloneSrc, nextBundleRoot);
if (!copiedStandalone) {
  throw new Error("Missing .next/standalone. Run a standalone Next build first.");
}

await ensureDir(path.join(nextBundleRoot, ".next"));
await copyIfExists(staticSrc, path.join(nextBundleRoot, ".next", "static"));
await copyIfExists(publicSrc, path.join(nextBundleRoot, "public"));

console.log(`Prepared desktop bundle assets in ${bundleRoot}`);

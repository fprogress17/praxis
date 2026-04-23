import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(loaderDir, "..");

function resolveAliasTarget(specifier) {
  const base = path.resolve(projectRoot, specifier.slice(2));
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const candidate = resolveAliasTarget(specifier);
    if (!candidate) {
      throw new Error(`Cannot resolve alias import: ${specifier}`);
    }
    return {
      url: pathToFileURL(candidate).href,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const SNAPSHOT_PATH = path.join(process.cwd(), "cache-snapshot.json");

async function collectFiles(dir: string, baseDir: string): Promise<Record<string, unknown>> {
  const entries = await readdir(dir, { withFileTypes: true });
  const result: Record<string, unknown> = {};

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, await collectFiles(fullPath, baseDir));
    } else if (entry.name.endsWith(".json")) {
      const relativePath = path.relative(baseDir, fullPath).split(path.sep).join("/");
      const raw = await readFile(fullPath, "utf-8");
      result[relativePath] = JSON.parse(raw);
    }
  }

  return result;
}

async function main() {
  const files = await collectFiles(CACHE_DIR, CACHE_DIR);
  const fileCount = Object.keys(files).length;

  await writeFile(
    SNAPSHOT_PATH,
    JSON.stringify({ exportedAt: new Date().toISOString(), files }, null, 2)
  );

  console.log(`Exported ${fileCount} cached file(s) from .cache/ to ${SNAPSHOT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

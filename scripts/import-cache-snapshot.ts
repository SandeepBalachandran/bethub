import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const SNAPSHOT_PATH = path.join(process.cwd(), "cache-snapshot.json");

async function main() {
  const raw = await readFile(SNAPSHOT_PATH, "utf-8");
  const snapshot = JSON.parse(raw) as { exportedAt: string; files: Record<string, unknown> };

  const entries = Object.entries(snapshot.files);
  for (const [relativePath, data] of entries) {
    const fullPath = path.join(CACHE_DIR, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    // Bump cachedAt to "now" so the restored cache is treated as fresh
    // immediately, instead of being seen as expired and re-fetched right away.
    const refreshed =
      data && typeof data === "object" && "cachedAt" in data
        ? { ...data, cachedAt: Date.now() }
        : data;
    await writeFile(fullPath, JSON.stringify(refreshed, null, 2));
  }

  console.log(
    `Restored ${entries.length} cached file(s) into .cache/ from a snapshot exported at ${snapshot.exportedAt}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { readFile } from "node:fs/promises";
import type { AssetRegistry } from "./types.js";

export async function loadAssets(path: string): Promise<AssetRegistry> {
  const raw = JSON.parse(await readFile(path, "utf8"));
  const galleries = (raw.galleries ?? {}) as AssetRegistry["galleries"];
  const files = (raw.files ?? {}) as AssetRegistry["files"];
  return { galleries, files };
}

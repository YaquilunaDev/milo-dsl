import type { AssetRegistry } from "./types";

export async function loadAssets(path: string): Promise<AssetRegistry> {
  const raw = await Bun.file(path).json();
  const galleries = (raw.galleries ?? {}) as AssetRegistry["galleries"];
  const files = (raw.files ?? {}) as AssetRegistry["files"];
  return { galleries, files };
}

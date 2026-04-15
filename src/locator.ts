import {
  LOCATOR_BRAND,
  type GalleryImageLocator,
  type GalleryRandomLocator,
  type FileLocator,
  type FilePatternLocator,
} from "./types";

export interface GalleryOptions {
  id: string;
  name: string;
}

export interface GalleryHandle {
  readonly id: string;
  readonly name: string;
  image(hash: string): GalleryImageLocator;
  random(): GalleryRandomLocator;
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const SHA1_RE = /^[0-9a-fA-F]{40}$/;

export function gallery(options: GalleryOptions): GalleryHandle {
  if (!UUID_RE.test(options.id)) {
    throw new Error(
      `gallery(): id ${JSON.stringify(options.id)} is not a UUID`
    );
  }
  return {
    id: options.id,
    name: options.name,
    image(hash: string): GalleryImageLocator {
      if (!SHA1_RE.test(hash)) {
        throw new Error(
          `gallery.image(): hash ${JSON.stringify(hash)} is not a 40-char SHA-1 hex`
        );
      }
      return {
        [LOCATOR_BRAND]: true,
        kind: "galleryImage",
        galleryId: options.id,
        hash,
      };
    },
    random(): GalleryRandomLocator {
      return {
        [LOCATOR_BRAND]: true,
        kind: "galleryRandom",
        galleryId: options.id,
      };
    },
  };
}

export function file(name: string): FileLocator {
  if (!name || name.includes("*") || name.includes("/")) {
    throw new Error(
      `file(): invalid filename ${JSON.stringify(name)} (no wildcards or slashes)`
    );
  }
  return { [LOCATOR_BRAND]: true, kind: "file", name };
}

file.pattern = function pattern(glob: string): FilePatternLocator {
  if (!glob) {
    throw new Error("file.pattern(): empty pattern");
  }
  return { [LOCATOR_BRAND]: true, kind: "filePattern", pattern: glob };
};

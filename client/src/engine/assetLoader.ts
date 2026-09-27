export interface AssetManifest {
  name: string;
  version: string;
  tileSize: number;
  tileset: {
    path: string;
    width: number;
    height: number;
    tiles: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  characters: {
    frameWidth: number;
    frameHeight: number;
    variants: Record<string, string>;
    animations: Record<string, { row: number; frames: number[]; frameRate: number }>;
  };
}

export interface LoadedAssets {
  manifest: AssetManifest;
  tilesetImage: HTMLImageElement;
  characterImages: Map<string, HTMLImageElement>;
}

export async function loadAssets(): Promise<LoadedAssets> {
  const manifestRes = await fetch('/assets/manifest.json');
  if (!manifestRes.ok) {
    throw new Error(`Failed to load asset manifest: ${manifestRes.statusText}`);
  }
  const manifest: AssetManifest = await manifestRes.json();

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image at ${src}: ${e}`));
      img.src = src;
    });

  const tilesetImage = await loadImage(manifest.tileset.path);

  const characterImages = new Map<string, HTMLImageElement>();
  for (const [key, path] of Object.entries(manifest.characters.variants)) {
    try {
      const img = await loadImage(path);
      characterImages.set(key, img);
    } catch (err) {
      console.warn(`Could not load character variant ${key} from ${path}`, err);
    }
  }

  return {
    manifest,
    tilesetImage,
    characterImages,
  };
}

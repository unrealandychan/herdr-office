import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

// Color Palette (RGB tuples)
const PALETTE = {
  transparent: [0, 0, 0, 0],
  // Floors
  woodLight: [198, 142, 94, 255],
  woodMid: [181, 126, 80, 255],
  woodDark: [153, 102, 60, 255],
  woodLine: [128, 82, 45, 255],

  carpetLight: [78, 92, 110, 255],
  carpetMid: [68, 80, 98, 255],
  carpetDark: [58, 68, 84, 255],

  tileLight: [225, 228, 232, 255],
  tileDark: [195, 200, 208, 255],

  // Walls
  wallTop: [110, 120, 138, 255],
  wallFace: [85, 95, 112, 255],
  wallTrim: [60, 68, 82, 255],
  baseboard: [140, 95, 60, 255],
  windowGlass: [135, 206, 235, 255],
  windowFrame: [45, 52, 65, 255],

  // Furniture
  deskWood: [165, 115, 75, 255],
  deskShadow: [130, 90, 55, 255],
  deskLeg: [40, 44, 52, 255],
  monitorBezel: [28, 30, 36, 255],
  screenOff: [45, 50, 60, 255],
  screenGlow: [50, 205, 150, 255],
  keyboardBase: [50, 54, 62, 255],
  keyboardKey: [200, 205, 215, 255],

  chairSeat: [40, 45, 55, 255],
  chairBack: [55, 60, 72, 255],
  chairMetal: [140, 145, 155, 255],

  // Plant
  potClay: [180, 85, 50, 255],
  plantGreenLight: [80, 175, 75, 255],
  plantGreenDark: [45, 120, 45, 255],

  // Characters
  skinLight: [255, 219, 172, 255],
  skinShadow: [225, 185, 140, 255],
  hairDark: [45, 35, 30, 255],
  hairBrown: [110, 65, 40, 255],
  hairBlonde: [220, 185, 70, 255],

  // Agent clothing
  piGreen: [50, 168, 82, 255],
  piGreenDark: [35, 125, 60, 255],
  claudeOrange: [217, 119, 54, 255],
  claudeOrangeDark: [175, 90, 35, 255],
  codexBlue: [59, 130, 246, 255],
  codexBlueDark: [37, 99, 235, 255],

  pantsDark: [35, 40, 50, 255],
  shoesBrown: [60, 45, 35, 255],
  eyesDark: [30, 30, 35, 255],
  white: [255, 255, 255, 255],
  redAlert: [239, 68, 68, 255],
  goldStar: [245, 158, 11, 255],
};

type RGBA = [number, number, number, number];

function createPNG(w: number, h: number): PNG {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h * 4; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }
  return png;
}

function setPixel(png: PNG, x: number, y: number, color: RGBA) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (png.width * y + x) * 4;
  png.data[idx] = color[0];
  png.data[idx + 1] = color[1];
  png.data[idx + 2] = color[2];
  png.data[idx + 3] = color[3];
}

function fillRect(png: PNG, rx: number, ry: number, rw: number, rh: number, color: RGBA) {
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      setPixel(png, x, y, color);
    }
  }
}

// ----------------------------------------------------
// 1. GENERATE OFFICE TILESET (128 x 64 pixels)
// ----------------------------------------------------
function generateOfficeTileset(): PNG {
  const png = createPNG(128, 64);

  // [0, 0]: Wood Floor (16x16)
  fillRect(png, 0, 0, 16, 16, PALETTE.woodMid);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 5 === 0) setPixel(png, x, y, PALETTE.woodLight);
      if ((x * 3 + y) % 7 === 0) setPixel(png, x, y, PALETTE.woodDark);
    }
    // Plank horizontal divider
    if (y === 7 || y === 15) {
      for (let x = 0; x < 16; x++) setPixel(png, x, y, PALETTE.woodLine);
    }
  }
  setPixel(png, 8, 3, PALETTE.woodLine);
  setPixel(png, 4, 11, PALETTE.woodLine);

  // [16, 0]: Carpet Floor (16x16)
  fillRect(png, 16, 0, 16, 16, PALETTE.carpetMid);
  for (let y = 0; y < 16; y++) {
    for (let x = 16; x < 32; x++) {
      if ((x + y) % 3 === 0) setPixel(png, x, y, PALETTE.carpetLight);
      if ((x * 2 + y * 3) % 5 === 0) setPixel(png, x, y, PALETTE.carpetDark);
    }
  }

  // [32, 0]: Breakroom Tile (16x16)
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const c = (tx + ty) % 2 === 0 ? PALETTE.tileLight : PALETTE.tileDark;
      fillRect(png, 32 + tx * 8, ty * 8, 8, 8, c);
    }
  }

  // [48, 0]: Wall Top & Base (16x24)
  fillRect(png, 48, 0, 16, 4, PALETTE.wallTop);
  fillRect(png, 48, 4, 16, 16, PALETTE.wallFace);
  fillRect(png, 48, 20, 16, 4, PALETTE.baseboard);
  // Add wall molding line
  for (let x = 48; x < 64; x++) {
    setPixel(png, x, 4, PALETTE.wallTrim);
    setPixel(png, x, 19, PALETTE.wallTrim);
  }

  // [64, 0]: Wall with Window (16x24)
  fillRect(png, 64, 0, 16, 4, PALETTE.wallTop);
  fillRect(png, 64, 4, 16, 16, PALETTE.wallFace);
  fillRect(png, 64, 20, 16, 4, PALETTE.baseboard);
  // Window frame & glass
  fillRect(png, 66, 6, 12, 10, PALETTE.windowGlass);
  for (let x = 66; x < 78; x++) {
    setPixel(png, x, 6, PALETTE.windowFrame);
    setPixel(png, x, 15, PALETTE.windowFrame);
    setPixel(png, x, 11, PALETTE.windowFrame);
  }
  for (let y = 6; y < 16; y++) {
    setPixel(png, 66, y, PALETTE.windowFrame);
    setPixel(png, 77, y, PALETTE.windowFrame);
    setPixel(png, 71, y, PALETTE.windowFrame);
    setPixel(png, 72, y, PALETTE.windowFrame);
  }

  // [80, 0]: Office Desk (32x24) - Two tiles wide
  // Desk surface
  fillRect(png, 80, 4, 32, 14, PALETTE.deskWood);
  fillRect(png, 80, 18, 32, 2, PALETTE.deskShadow);
  // Desk legs
  fillRect(png, 81, 20, 2, 4, PALETTE.deskLeg);
  fillRect(png, 109, 20, 2, 4, PALETTE.deskLeg);
  // Dual monitors
  // Left monitor
  fillRect(png, 84, 1, 10, 8, PALETTE.monitorBezel);
  fillRect(png, 85, 2, 8, 6, PALETTE.screenGlow);
  fillRect(png, 88, 9, 2, 2, PALETTE.deskLeg);
  // Right monitor
  fillRect(png, 97, 1, 10, 8, PALETTE.monitorBezel);
  fillRect(png, 98, 2, 8, 6, PALETTE.screenOff);
  fillRect(png, 101, 9, 2, 2, PALETTE.deskLeg);
  // Keyboard & Mouse
  fillRect(png, 91, 12, 10, 4, PALETTE.keyboardBase);
  for (let kx = 92; kx < 100; kx += 2) {
    setPixel(png, kx, 13, PALETTE.keyboardKey);
    setPixel(png, kx, 14, PALETTE.keyboardKey);
  }
  setPixel(png, 103, 13, PALETTE.chairMetal); // mouse

  // [0, 32]: Ergonomic Office Chair (16x16)
  fillRect(png, 3, 34, 10, 8, PALETTE.chairSeat);
  fillRect(png, 4, 32, 8, 3, PALETTE.chairBack);
  fillRect(png, 7, 42, 2, 3, PALETTE.chairMetal);
  // Caster wheels
  setPixel(png, 5, 45, PALETTE.deskLeg);
  setPixel(png, 10, 45, PALETTE.deskLeg);

  // [16, 32]: Potted Ficus Plant (16x24)
  fillRect(png, 20, 46, 8, 8, PALETTE.potClay);
  fillRect(png, 18, 34, 12, 12, PALETTE.plantGreenDark);
  fillRect(png, 20, 33, 8, 10, PALETTE.plantGreenLight);
  setPixel(png, 23, 31, PALETTE.plantGreenLight);
  setPixel(png, 24, 31, PALETTE.plantGreenLight);

  // [32, 32]: Water Cooler (16x24)
  fillRect(png, 36, 42, 8, 12, PALETTE.tileLight);
  fillRect(png, 37, 34, 6, 8, PALETTE.windowGlass);
  setPixel(png, 40, 44, PALETTE.redAlert); // hot tap
  setPixel(png, 42, 44, PALETTE.codexBlue); // cold tap

  // [48, 32]: Exclamation / Blocked Bubble (16x16)
  fillRect(png, 50, 33, 12, 10, PALETTE.white);
  fillRect(png, 54, 43, 3, 3, PALETTE.white); // bubble tail
  // Red exclamation mark
  fillRect(png, 55, 35, 2, 4, PALETTE.redAlert);
  fillRect(png, 55, 40, 2, 2, PALETTE.redAlert);

  // [64, 32]: Done Checkmark Bubble (16x16)
  fillRect(png, 66, 33, 12, 10, PALETTE.white);
  fillRect(png, 70, 43, 3, 3, PALETTE.white);
  // Green checkmark
  setPixel(png, 69, 39, PALETTE.piGreen);
  setPixel(png, 70, 40, PALETTE.piGreen);
  setPixel(png, 71, 39, PALETTE.piGreen);
  setPixel(png, 72, 38, PALETTE.piGreen);
  setPixel(png, 73, 37, PALETTE.piGreen);

  return png;
}

// ----------------------------------------------------
// 2. GENERATE CHARACTER SPRITESHEET (64 x 192 pixels)
// 16 wide x 24 high per frame, 4 frames wide, 8 rows high
// ----------------------------------------------------
interface CharacterTheme {
  shirt: RGBA;
  shirtDark: RGBA;
  hair: RGBA;
  skin: RGBA;
  pants: RGBA;
}

function drawCharacterFrame(
  png: PNG,
  fx: number,
  fy: number,
  theme: CharacterTheme,
  state: 'idle' | 'walk' | 'type' | 'alert' | 'done',
  dir: 'down' | 'up' | 'side',
  frame: number
) {
  const ox = fx * 16;
  const oy = fy * 24;

  const bob = (state === 'idle' && frame === 1) || (state === 'type' && frame % 2 === 1) ? 1 : 0;
  const legOffset = state === 'walk' ? (frame % 2 === 0 ? 1 : -1) : 0;

  // Head / Hair / Face
  if (dir === 'down') {
    // Hair
    fillRect(png, ox + 4, oy + 2 + bob, 8, 4, theme.hair);
    fillRect(png, ox + 3, oy + 4 + bob, 1, 3, theme.hair);
    fillRect(png, ox + 12, oy + 4 + bob, 1, 3, theme.hair);
    // Face skin
    fillRect(png, ox + 4, oy + 5 + bob, 8, 5, theme.skin);
    // Eyes
    if (state === 'alert') {
      fillRect(png, ox + 5, oy + 6 + bob, 2, 2, PALETTE.eyesDark);
      fillRect(png, ox + 9, oy + 6 + bob, 2, 2, PALETTE.eyesDark);
    } else {
      setPixel(png, ox + 5, oy + 7 + bob, PALETTE.eyesDark);
      setPixel(png, ox + 9, oy + 7 + bob, PALETTE.eyesDark);
    }
  } else if (dir === 'up') {
    // Full back of hair
    fillRect(png, ox + 4, oy + 2 + bob, 8, 8, theme.hair);
    fillRect(png, ox + 3, oy + 4 + bob, 1, 5, theme.hair);
    fillRect(png, ox + 12, oy + 4 + bob, 1, 5, theme.hair);
  } else {
    // Side profile
    fillRect(png, ox + 4, oy + 2 + bob, 7, 5, theme.hair);
    fillRect(png, ox + 6, oy + 6 + bob, 5, 4, theme.skin);
    setPixel(png, ox + 9, oy + 7 + bob, PALETTE.eyesDark);
  }

  // Torso / Shirt
  fillRect(png, ox + 4, oy + 10 + bob, 8, 7, theme.shirt);
  fillRect(png, ox + 4, oy + 15 + bob, 8, 2, theme.shirtDark);

  // Arms & Actions
  if (state === 'type') {
    // Arms forward typing
    fillRect(png, ox + 2, oy + 11 + bob, 2, 4, theme.shirt);
    fillRect(png, ox + 12, oy + 11 + bob, 2, 4, theme.shirt);
    // Hands on desk
    fillRect(png, ox + 3 + (frame % 2), oy + 14 + bob, 3, 2, theme.skin);
    fillRect(png, ox + 10 - (frame % 2), oy + 14 + bob, 3, 2, theme.skin);
  } else if (state === 'alert') {
    // Arms raised in worry / question
    fillRect(png, ox + 2, oy + 8 + bob, 2, 4, theme.shirt);
    fillRect(png, ox + 12, oy + 8 + bob, 2, 4, theme.shirt);
    fillRect(png, ox + 2, oy + 6 + bob, 2, 2, theme.skin);
    fillRect(png, ox + 12, oy + 6 + bob, 2, 2, theme.skin);
  } else if (state === 'done') {
    // Celebratory arms up
    fillRect(png, ox + 2, oy + 7 + bob, 2, 5, theme.shirt);
    fillRect(png, ox + 12, oy + 7 + bob, 2, 5, theme.shirt);
    fillRect(png, ox + 1, oy + 5 + bob, 3, 2, theme.skin);
    fillRect(png, ox + 12, oy + 5 + bob, 3, 2, theme.skin);
  } else {
    // Standard resting arms
    fillRect(png, ox + 3, oy + 11 + bob, 2, 5, theme.shirt);
    fillRect(png, ox + 11, oy + 11 + bob, 2, 5, theme.shirt);
    fillRect(png, ox + 3, oy + 15 + bob, 2, 2, theme.skin);
    fillRect(png, ox + 11, oy + 15 + bob, 2, 2, theme.skin);
  }

  // Pants
  fillRect(png, ox + 5, oy + 17, 6, 4, theme.pants);

  // Shoes / Walking Feet
  if (state === 'walk') {
    if (frame % 2 === 0) {
      fillRect(png, ox + 4, oy + 21, 3, 3, PALETTE.shoesBrown);
      fillRect(png, ox + 9, oy + 21 + legOffset, 3, 3, PALETTE.shoesBrown);
    } else {
      fillRect(png, ox + 4, oy + 21 + legOffset, 3, 3, PALETTE.shoesBrown);
      fillRect(png, ox + 9, oy + 21, 3, 3, PALETTE.shoesBrown);
    }
  } else {
    fillRect(png, ox + 4, oy + 21, 3, 3, PALETTE.shoesBrown);
    fillRect(png, ox + 9, oy + 21, 3, 3, PALETTE.shoesBrown);
  }
}

function generateCharacterSpritesheet(theme: CharacterTheme): PNG {
  const png = createPNG(64, 192); // 4 frames x 8 rows

  // Row 0: Idle Down (frames 0, 1)
  drawCharacterFrame(png, 0, 0, theme, 'idle', 'down', 0);
  drawCharacterFrame(png, 1, 0, theme, 'idle', 'down', 1);
  drawCharacterFrame(png, 2, 0, theme, 'idle', 'down', 0);
  drawCharacterFrame(png, 3, 0, theme, 'idle', 'down', 1);

  // Row 1: Idle Up (frames 0, 1)
  drawCharacterFrame(png, 0, 1, theme, 'idle', 'up', 0);
  drawCharacterFrame(png, 1, 1, theme, 'idle', 'up', 1);
  drawCharacterFrame(png, 2, 1, theme, 'idle', 'up', 0);
  drawCharacterFrame(png, 3, 1, theme, 'idle', 'up', 1);

  // Row 2: Walk Down (4 frames)
  for (let f = 0; f < 4; f++) drawCharacterFrame(png, f, 2, theme, 'walk', 'down', f);

  // Row 3: Walk Up (4 frames)
  for (let f = 0; f < 4; f++) drawCharacterFrame(png, f, 3, theme, 'walk', 'up', f);

  // Row 4: Walk Side (4 frames)
  for (let f = 0; f < 4; f++) drawCharacterFrame(png, f, 4, theme, 'walk', 'side', f);

  // Row 5: Type Up (4 frames, hands typing toward desk)
  for (let f = 0; f < 4; f++) drawCharacterFrame(png, f, 5, theme, 'type', 'up', f);

  // Row 6: Alert / Blocked (4 frames)
  for (let f = 0; f < 4; f++) drawCharacterFrame(png, f, 6, theme, 'alert', 'down', f);

  // Row 7: Done / Celebrate (4 frames)
  for (let f = 0; f < 4; f++) drawCharacterFrame(png, f, 7, theme, 'done', 'down', f);

  return png;
}

function savePNG(png: PNG, filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved: ${filePath} (${png.width}x${png.height})`);
}

// ----------------------------------------------------
// MAIN EXECUTION
// ----------------------------------------------------
const clientAssets = path.resolve(process.cwd(), 'client/public/assets');

console.log('Generating custom pixel art assets in:', clientAssets);

// 1. Tileset
const tileset = generateOfficeTileset();
savePNG(tileset, path.join(clientAssets, 'tiles/office_tiles.png'));

// 2. Character Variants
const themes: Record<string, CharacterTheme> = {
  pi: {
    shirt: PALETTE.piGreen,
    shirtDark: PALETTE.piGreenDark,
    hair: PALETTE.hairBrown,
    skin: PALETTE.skinLight,
    pants: PALETTE.pantsDark,
  },
  claude: {
    shirt: PALETTE.claudeOrange,
    shirtDark: PALETTE.claudeOrangeDark,
    hair: PALETTE.hairDark,
    skin: PALETTE.skinLight,
    pants: PALETTE.pantsDark,
  },
  codex: {
    shirt: PALETTE.codexBlue,
    shirtDark: PALETTE.codexBlueDark,
    hair: PALETTE.hairBlonde,
    skin: PALETTE.skinLight,
    pants: PALETTE.pantsDark,
  },
};

for (const [name, theme] of Object.entries(themes)) {
  const charSheet = generateCharacterSpritesheet(theme);
  savePNG(charSheet, path.join(clientAssets, `characters/character_${name}.png`));
}

// 3. Asset Manifest JSON
const manifest = {
  name: 'herdr-office-core-art',
  version: '1.0.0',
  tileSize: 16,
  tileset: {
    path: '/assets/tiles/office_tiles.png',
    width: 128,
    height: 64,
    tiles: {
      floor_wood: { x: 0, y: 0, w: 16, h: 16 },
      floor_carpet: { x: 16, y: 0, w: 16, h: 16 },
      floor_tile: { x: 32, y: 0, w: 16, h: 16 },
      wall_top: { x: 48, y: 0, w: 16, h: 24 },
      wall_window: { x: 64, y: 0, w: 16, h: 24 },
      desk: { x: 80, y: 0, w: 32, h: 24 },
      chair: { x: 0, y: 32, w: 16, h: 16 },
      plant: { x: 16, y: 32, w: 16, h: 24 },
      water_cooler: { x: 32, y: 32, w: 16, h: 24 },
      bubble_blocked: { x: 48, y: 32, w: 16, h: 16 },
      bubble_done: { x: 64, y: 32, w: 16, h: 16 },
    },
  },
  characters: {
    frameWidth: 16,
    frameHeight: 24,
    variants: {
      pi: '/assets/characters/character_pi.png',
      claude: '/assets/characters/character_claude.png',
      codex: '/assets/characters/character_codex.png',
      default: '/assets/characters/character_pi.png',
    },
    animations: {
      idle_down: { row: 0, frames: [0, 1], frameRate: 2 },
      idle_up: { row: 1, frames: [0, 1], frameRate: 2 },
      walk_down: { row: 2, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_up: { row: 3, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_side: { row: 4, frames: [0, 1, 2, 3], frameRate: 6 },
      type_up: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      alert: { row: 6, frames: [0, 1, 2, 3], frameRate: 4 },
      done: { row: 7, frames: [0, 1, 2, 3], frameRate: 4 },
    },
  },
};

fs.writeFileSync(
  path.join(clientAssets, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('Saved manifest:', path.join(clientAssets, 'manifest.json'));

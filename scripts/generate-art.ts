import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

type RGBA = [number, number, number, number];

// ====================================================
// FINAL FANTASY RETRO RPG COLOR PALETTE (SNES / PS1 ERA)
// ====================================================
const PALETTE = {
  transparent: [0, 0, 0, 0] as RGBA,

  // Castle Flagstone Flooring
  stoneLight: [148, 163, 184, 255] as RGBA,
  stoneMid: [100, 116, 139, 255] as RGBA,
  stoneDark: [71, 85, 105, 255] as RGBA,
  stoneShadow: [51, 65, 85, 255] as RGBA,
  stoneMortar: [30, 41, 59, 255] as RGBA,

  // Royal Tavern / Castle Hardwood
  woodGleam: [217, 160, 102, 255] as RGBA,
  woodLight: [180, 125, 70, 255] as RGBA,
  woodMid: [146, 94, 46, 255] as RGBA,
  woodDark: [110, 68, 30, 255] as RGBA,
  woodShadow: [74, 42, 16, 255] as RGBA,

  // Royal Velvet Castle Carpet with Gold Trim
  carpetCrimsonGleam: [220, 38, 38, 255] as RGBA,
  carpetCrimsonMid: [153, 27, 27, 255] as RGBA,
  carpetCrimsonDark: [127, 29, 29, 255] as RGBA,
  carpetShadow: [69, 10, 10, 255] as RGBA,
  goldGleam: [254, 240, 138, 255] as RGBA,
  goldLight: [251, 191, 36, 255] as RGBA,
  goldMid: [217, 119, 6, 255] as RGBA,
  goldDark: [146, 64, 14, 255] as RGBA,

  // Castle Stone Walls & Archways
  castleWallLight: [120, 130, 150, 255] as RGBA,
  castleWallMid: [85, 95, 115, 255] as RGBA,
  castleWallDark: [60, 70, 88, 255] as RGBA,
  castleBrickShadow: [40, 48, 64, 255] as RGBA,
  castleWoodTrim: [88, 52, 26, 255] as RGBA,

  // Torch & Fire Light
  torchIron: [35, 38, 46, 255] as RGBA,
  fireYellow: [254, 240, 138, 255] as RGBA,
  fireOrange: [249, 115, 22, 255] as RGBA,
  fireRed: [220, 38, 38, 255] as RGBA,
  glowWarm: [254, 215, 170, 100] as RGBA,

  // Gothic Stained Glass Window
  glassLeadFrame: [25, 28, 36, 255] as RGBA,
  glassRuby: [225, 29, 72, 255] as RGBA,
  glassSapphire: [37, 99, 235, 255] as RGBA,
  glassEmerald: [16, 185, 129, 255] as RGBA,
  glassAmber: [245, 158, 11, 255] as RGBA,
  glassHighlight: [255, 255, 255, 160] as RGBA,

  // Final Fantasy Mana / Save Crystal
  crystalCyanWhite: [236, 254, 255, 255] as RGBA,
  crystalCyanLight: [103, 232, 249, 255] as RGBA,
  crystalCyanMid: [6, 182, 212, 255] as RGBA,
  crystalCyanDark: [14, 116, 144, 255] as RGBA,
  crystalBaseStone: [51, 65, 85, 255] as RGBA,

  // Guild Master Wooden Workstation & Prop Elements
  deskOakLight: [168, 112, 60, 255] as RGBA,
  deskOakMid: [136, 86, 42, 255] as RGBA,
  deskOakDark: [98, 58, 26, 255] as RGBA,
  parchmentLight: [254, 243, 199, 255] as RGBA,
  parchmentMid: [245, 208, 138, 255] as RGBA,
  parchmentInk: [78, 48, 24, 255] as RGBA,
  candleWax: [254, 249, 195, 255] as RGBA,
  brassCandle: [202, 138, 4, 255] as RGBA,
  scryingOrbCyan: [34, 211, 238, 220] as RGBA,
  scryingOrbStand: [115, 115, 115, 255] as RGBA,

  // Royal Guild High-Back Velvet Chair
  chairVelvetLight: [185, 28, 28, 255] as RGBA,
  chairVelvetMid: [127, 29, 29, 255] as RGBA,
  chairWoodTrim: [88, 52, 26, 255] as RGBA,
  chairGoldStud: [251, 191, 36, 255] as RGBA,

  // Potions & Alchemy
  flaskGlass: [224, 242, 254, 200] as RGBA,
  potionRed: [239, 68, 68, 255] as RGBA,    // Potion
  potionBlue: [59, 130, 246, 255] as RGBA,   // Ether
  potionGreen: [34, 197, 94, 255] as RGBA,   // Elixir

  // Classic Final Fantasy Blue Dialogue Window
  ffBlueTop: [12, 34, 156, 255] as RGBA,
  ffBlueMid: [4, 16, 96, 255] as RGBA,
  ffBlueBottom: [0, 4, 48, 255] as RGBA,
  ffBorderWhite: [255, 255, 255, 255] as RGBA,
  ffBorderGrey: [148, 163, 184, 255] as RGBA,
  ffCornerBevel: [71, 85, 105, 255] as RGBA,

  // General Helpers
  white: [255, 255, 255, 255] as RGBA,
  black: [0, 0, 0, 255] as RGBA,
  shadowBlack: [0, 0, 0, 120] as RGBA,
  skinPale: [255, 228, 204, 255] as RGBA,
  skinMid: [248, 196, 162, 255] as RGBA,
  skinShadow: [214, 155, 120, 255] as RGBA,
};

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
  const alpha = color[3] / 255;
  if (alpha >= 0.99) {
    png.data[idx] = color[0];
    png.data[idx + 1] = color[1];
    png.data[idx + 2] = color[2];
    png.data[idx + 3] = 255;
  } else if (alpha > 0) {
    const bgA = png.data[idx + 3] / 255;
    const outA = alpha + bgA * (1 - alpha);
    if (outA > 0) {
      png.data[idx] = Math.round((color[0] * alpha + png.data[idx] * bgA * (1 - alpha)) / outA);
      png.data[idx + 1] = Math.round((color[1] * alpha + png.data[idx + 1] * bgA * (1 - alpha)) / outA);
      png.data[idx + 2] = Math.round((color[2] * alpha + png.data[idx + 2] * bgA * (1 - alpha)) / outA);
      png.data[idx + 3] = Math.round(outA * 255);
    }
  }
}

function fillRect(png: PNG, rx: number, ry: number, rw: number, rh: number, color: RGBA) {
  const x1 = Math.max(0, rx);
  const y1 = Math.max(0, ry);
  const x2 = Math.min(png.width, rx + rw);
  const y2 = Math.min(png.height, ry + rh);
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      setPixel(png, x, y, color);
    }
  }
}

function fillGradientV(png: PNG, rx: number, ry: number, rw: number, rh: number, topColor: RGBA, bottomColor: RGBA) {
  for (let y = 0; y < rh; y++) {
    const t = rh > 1 ? y / (rh - 1) : 0;
    const c: RGBA = [
      Math.round(topColor[0] * (1 - t) + bottomColor[0] * t),
      Math.round(topColor[1] * (1 - t) + bottomColor[1] * t),
      Math.round(topColor[2] * (1 - t) + bottomColor[2] * t),
      Math.round(topColor[3] * (1 - t) + bottomColor[3] * t),
    ];
    fillRect(png, rx, ry + y, rw, 1, c);
  }
}

function savePNG(png: PNG, filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log(`Saved Final Fantasy art asset: ${filePath} (${png.width}x${png.height})`);
}

// ====================================================
// 1. GENERATE FINAL FANTASY CASTLE & GUILD TILESET (256x256)
// ====================================================
export function generateFinalFantasyTileset(): PNG {
  const png = createPNG(256, 256);

  // --------------------------------------------------
  // TILE: Castle Tavern Hardwood Plank Floor (32x32) at [0, 0]
  // --------------------------------------------------
  fillRect(png, 0, 0, 32, 32, PALETTE.woodMid);
  for (let p = 0; p < 4; p++) {
    const py = p * 8;
    fillRect(png, 0, py, 32, 1, PALETTE.woodGleam);
    fillRect(png, 0, py + 7, 32, 1, PALETTE.woodShadow);
    // Vertical iron nail studs
    setPixel(png, 2, py + 4, PALETTE.stoneMortar);
    setPixel(png, 30, py + 4, PALETTE.stoneMortar);
    // Plank seams
    const vx = p % 2 === 0 ? 16 : 8;
    fillRect(png, vx, py, 1, 7, PALETTE.woodShadow);
    if (p % 2 !== 0) fillRect(png, vx + 16, py, 1, 7, PALETTE.woodShadow);
    // Wood grain accents
    setPixel(png, 10, py + 2, PALETTE.woodLight);
    setPixel(png, 22, py + 5, PALETTE.woodDark);
  }

  // --------------------------------------------------
  // TILE: Royal Crimson Castle Carpet with Gold Filigree (32x32) at [32, 0]
  // --------------------------------------------------
  fillRect(png, 32, 0, 32, 32, PALETTE.carpetCrimsonMid);
  // Gold filigree border on perimeter
  fillRect(png, 32, 0, 32, 2, PALETTE.goldLight);
  fillRect(png, 32, 30, 32, 2, PALETTE.goldMid);
  fillRect(png, 32, 0, 2, 32, PALETTE.goldLight);
  fillRect(png, 62, 0, 2, 32, PALETTE.goldMid);
  // Gold corner fleur-de-lis diamonds
  fillRect(png, 34, 2, 3, 3, PALETTE.goldGleam);
  fillRect(png, 59, 2, 3, 3, PALETTE.goldGleam);
  fillRect(png, 34, 27, 3, 3, PALETTE.goldGleam);
  fillRect(png, 59, 27, 3, 3, PALETTE.goldGleam);
  // Woven damask center cross
  fillRect(png, 46, 12, 4, 8, PALETTE.carpetCrimsonGleam);
  fillRect(png, 44, 14, 8, 4, PALETTE.carpetCrimsonGleam);
  setPixel(png, 47, 15, PALETTE.goldLight);
  setPixel(png, 48, 16, PALETTE.goldLight);

  // --------------------------------------------------
  // TILE: Ancient Flagstone Castle Floor (32x32) at [64, 0]
  // --------------------------------------------------
  fillRect(png, 64, 0, 32, 32, PALETTE.stoneMid);
  // Irregular stone slabs with deep mortar grooves
  // Slab 1 (top left)
  fillRect(png, 64, 0, 15, 14, PALETTE.stoneLight);
  fillRect(png, 64, 0, 15, 1, PALETTE.white);
  // Slab 2 (top right)
  fillRect(png, 81, 0, 15, 14, PALETTE.stoneDark);
  // Slab 3 (bottom left)
  fillRect(png, 64, 16, 18, 16, PALETTE.stoneDark);
  // Slab 4 (bottom right)
  fillRect(png, 84, 16, 12, 16, PALETTE.stoneLight);
  // Mortar lines
  fillRect(png, 64, 14, 32, 2, PALETTE.stoneMortar);
  fillRect(png, 79, 0, 2, 14, PALETTE.stoneMortar);
  fillRect(png, 82, 16, 2, 16, PALETTE.stoneMortar);
  // Stone surface cracks and texture
  setPixel(png, 68, 6, PALETTE.stoneShadow);
  setPixel(png, 69, 7, PALETTE.stoneShadow);
  setPixel(png, 88, 22, PALETTE.stoneShadow);

  // --------------------------------------------------
  // TILE: Castle Wall with Wall Torch (32x48) at [96, 0]
  // --------------------------------------------------
  // Castle stone blocks (y=0 to 40)
  fillRect(png, 96, 0, 32, 40, PALETTE.castleWallMid);
  for (let by = 0; by < 40; by += 10) {
    fillRect(png, 96, by, 32, 1, PALETTE.castleWallLight);
    fillRect(png, 96, by + 9, 32, 1, PALETTE.castleBrickShadow);
    const ox = by % 20 === 0 ? 16 : 8;
    fillRect(png, 96 + ox, by, 1, 9, PALETTE.castleBrickShadow);
    if (by % 20 !== 0) fillRect(png, 96 + ox + 16, by, 1, 9, PALETTE.castleBrickShadow);
  }
  // Iron bracket torch at center (x=110, y=14)
  fillRect(png, 111, 20, 2, 12, PALETTE.torchIron);
  fillRect(png, 109, 18, 6, 3, PALETTE.torchIron); // sconce cup
  // Flickering Fire Flame (yellow/orange/red)
  fillRect(png, 110, 12, 4, 6, PALETTE.fireRed);
  fillRect(png, 111, 10, 2, 6, PALETTE.fireOrange);
  fillRect(png, 111, 11, 2, 3, PALETTE.fireYellow);
  // Torchlight ambient halo
  fillRect(png, 106, 8, 12, 12, PALETTE.glowWarm);
  // Dark wood wainscoting at base (y=40 to 48)
  fillRect(png, 96, 40, 32, 8, PALETTE.castleWoodTrim);
  fillRect(png, 96, 40, 32, 1, PALETTE.goldMid);

  // --------------------------------------------------
  // TILE: Gothic Stained-Glass Crystal Window (32x48) at [128, 0]
  // --------------------------------------------------
  fillRect(png, 128, 0, 32, 48, PALETTE.castleWallDark);
  // Gothic stone arch window (24x36 at x=132, y=4)
  fillRect(png, 132, 4, 24, 36, PALETTE.glassLeadFrame);
  // Stained glass crystal facets
  fillRect(png, 134, 6, 9, 14, PALETTE.glassRuby);
  fillRect(png, 145, 6, 9, 14, PALETTE.glassSapphire);
  fillRect(png, 134, 22, 9, 16, PALETTE.glassEmerald);
  fillRect(png, 145, 22, 9, 16, PALETTE.glassAmber);
  // Center Crystal Emblem
  fillRect(png, 141, 14, 6, 12, PALETTE.crystalCyanLight);
  setPixel(png, 143, 12, PALETTE.crystalCyanWhite);
  setPixel(png, 144, 12, PALETTE.crystalCyanWhite);
  // Sunlight beam reflection
  fillRect(png, 136, 8, 2, 10, PALETTE.glassHighlight);
  fillRect(png, 147, 8, 2, 10, PALETTE.glassHighlight);
  // Wood trim base
  fillRect(png, 128, 42, 32, 6, PALETTE.castleWoodTrim);

  // --------------------------------------------------
  // TILE: Grand Library Bookshelf of Ancient Tomes (32x48) at [160, 0]
  // --------------------------------------------------
  fillRect(png, 160, 0, 32, 48, PALETTE.castleWallDark);
  // Ornate mahogany bookcase (28x44 at x=162, y=2)
  fillRect(png, 162, 2, 28, 44, PALETTE.woodDark);
  fillRect(png, 162, 2, 28, 2, PALETTE.goldLight); // carved top pediment
  // Shelves at y=14, y=26, y=38
  fillRect(png, 164, 14, 24, 2, PALETTE.woodLight);
  fillRect(png, 164, 26, 24, 2, PALETTE.woodLight);
  fillRect(png, 164, 38, 24, 2, PALETTE.woodLight);
  // Top Shelf: Ancient Leather Spellbooks (Red, Blue, Green, Gold)
  fillRect(png, 165, 5, 4, 9, PALETTE.potionRed);
  fillRect(png, 170, 4, 5, 10, PALETTE.potionBlue);
  fillRect(png, 176, 6, 4, 8, PALETTE.potionGreen);
  fillRect(png, 181, 4, 4, 10, PALETTE.goldLight);
  // Middle Shelf: Tomes + Glowing Health Potion Flask
  fillRect(png, 165, 17, 10, 9, PALETTE.woodLight);
  // Red potion vial
  fillRect(png, 178, 20, 4, 6, PALETTE.potionRed);
  fillRect(png, 179, 18, 2, 2, PALETTE.flaskGlass); // cork
  // Bottom Shelf: Stacks of magical scrolls
  fillRect(png, 166, 31, 10, 7, PALETTE.parchmentLight);
  fillRect(png, 178, 30, 4, 8, PALETTE.potionBlue); // Ether bottle

  // --------------------------------------------------
  // TILE: Iconic Final Fantasy Save / Mana Crystal (32x48) at [192, 0]
  // --------------------------------------------------
  fillRect(png, 192, 0, 32, 48, PALETTE.castleWallMid);
  // Stone pedestal dais at bottom (y=34 to 46)
  fillRect(png, 196, 36, 24, 10, PALETTE.stoneLight);
  fillRect(png, 198, 34, 20, 4, PALETTE.goldLight);
  // Floating Octahedral Blue Mana Crystal (x=200 to 216, y=6 to 30)
  // Crystal top vertex (x=208, y=6)
  fillGradientV(png, 203, 8, 10, 12, PALETTE.crystalCyanWhite, PALETTE.crystalCyanLight);
  fillGradientV(png, 201, 16, 14, 14, PALETTE.crystalCyanLight, PALETTE.crystalCyanDark);
  // Specular crystal gleams
  fillRect(png, 206, 10, 2, 10, PALETTE.white);
  // Sparkling magic energy particles around crystal
  setPixel(png, 198, 12, PALETTE.crystalCyanWhite);
  setPixel(png, 219, 14, PALETTE.crystalCyanWhite);
  setPixel(png, 200, 24, PALETTE.crystalCyanWhite);
  setPixel(png, 217, 26, PALETTE.crystalCyanWhite);
  setPixel(png, 208, 32, PALETTE.goldGleam);

  // --------------------------------------------------
  // OBJECT: Guild Master RPG Workstation Desk (64x48) at [0, 64]
  // --------------------------------------------------
  // Drop shadow
  fillRect(png, 4, 102, 56, 8, PALETTE.shadowBlack);

  // Heavy carved oak table legs
  fillRect(png, 6, 88, 6, 20, PALETTE.deskOakDark);
  fillRect(png, 6, 88, 2, 20, PALETTE.deskOakLight);
  fillRect(png, 52, 88, 6, 20, PALETTE.deskOakDark);
  fillRect(png, 52, 88, 2, 20, PALETTE.deskOakLight);
  fillRect(png, 12, 98, 40, 3, PALETTE.deskOakDark); // cross brace

  // Table front face (y=86 to 92)
  fillRect(png, 2, 86, 60, 6, PALETTE.deskOakMid);
  fillRect(png, 2, 86, 60, 1, PALETTE.goldLight); // gold filigree rail
  fillRect(png, 2, 91, 60, 1, PALETTE.deskOakDark);

  // Desk top surface (60x18 at x=2, y=70 to 86)
  fillGradientV(png, 2, 70, 60, 16, PALETTE.deskOakLight, PALETTE.deskOakMid);
  fillRect(png, 2, 70, 60, 1, PALETTE.woodGleam);

  // Workstation Items on Desk:
  // 1. Unrolled World Map / Quest Scroll (20x10 at x=10, y=73)
  fillRect(png, 10, 73, 20, 10, PALETTE.parchmentLight);
  fillRect(png, 10, 73, 20, 1, PALETTE.parchmentMid);
  fillRect(png, 10, 82, 20, 1, PALETTE.parchmentMid);
  // Ink map lines / runes
  setPixel(png, 13, 76, PALETTE.parchmentInk);
  setPixel(png, 14, 77, PALETTE.parchmentInk);
  setPixel(png, 22, 75, PALETTE.parchmentInk);
  setPixel(png, 23, 76, PALETTE.parchmentInk);
  setPixel(png, 18, 79, PALETTE.potionRed); // X marks the quest spot!

  // 2. Inkwell with White Feather Quill (x=32, y=73)
  fillRect(png, 32, 77, 4, 4, PALETTE.black);
  fillRect(png, 34, 71, 1, 6, PALETTE.white); // feather quill
  setPixel(png, 35, 70, PALETTE.white);

  // 3. Brass Candelabra with 2 Lit Candles (x=46, y=60 to 76)
  fillRect(png, 49, 70, 4, 6, PALETTE.brassCandle); // base
  fillRect(png, 46, 68, 10, 2, PALETTE.brassCandle); // branches
  // Left candle & flame
  fillRect(png, 46, 64, 2, 4, PALETTE.candleWax);
  setPixel(png, 46, 62, PALETTE.fireYellow);
  setPixel(png, 47, 61, PALETTE.fireOrange);
  // Right candle & flame
  fillRect(png, 54, 64, 2, 4, PALETTE.candleWax);
  setPixel(png, 54, 62, PALETTE.fireYellow);
  setPixel(png, 55, 61, PALETTE.fireOrange);

  // 4. Mystical Floating Scrying Orb (Tech-Magic Terminal) at Center (x=24, y=54 to 70)
  fillRect(png, 26, 68, 6, 3, PALETTE.scryingOrbStand);
  // Glowing cyan crystal orb
  fillRect(png, 25, 56, 8, 8, PALETTE.scryingOrbCyan);
  setPixel(png, 27, 57, PALETTE.white); // specular sheen
  setPixel(png, 28, 60, PALETTE.crystalCyanWhite); // inner magical rune

  // --------------------------------------------------
  // OBJECT: Royal Velvet High-Back Guild Chair (32x32) at [64, 64]
  // --------------------------------------------------
  // Drop shadow
  fillRect(png, 70, 90, 20, 5, PALETTE.shadowBlack);

  // Carved wooden legs & claw feet (y=88 to 94)
  fillRect(png, 70, 86, 3, 7, PALETTE.woodDark);
  fillRect(png, 85, 86, 3, 7, PALETTE.woodDark);
  setPixel(png, 70, 93, PALETTE.goldLight);
  setPixel(png, 87, 93, PALETTE.goldLight);

  // Crimson velvet seat cushion (20x8 at x=69, y=78)
  fillGradientV(png, 69, 78, 20, 8, PALETTE.chairVelvetLight, PALETTE.chairVelvetMid);
  fillRect(png, 69, 78, 20, 1, PALETTE.goldMid);

  // Royal High Backrest with Gold Crest (18x14 at x=70, y=64)
  fillGradientV(png, 70, 64, 18, 14, PALETTE.chairVelvetMid, PALETTE.carpetShadow);
  fillRect(png, 70, 64, 18, 1, PALETTE.goldLight);
  fillRect(png, 70, 64, 1, 14, PALETTE.goldMid);
  fillRect(png, 87, 64, 1, 14, PALETTE.goldMid);
  // Gold crown embroidery on headrest
  fillRect(png, 77, 67, 4, 3, PALETTE.goldLight);
  setPixel(png, 76, 66, PALETTE.goldGleam);
  setPixel(png, 79, 66, PALETTE.goldGleam);

  // Carved wooden armrests
  fillRect(png, 66, 72, 3, 8, PALETTE.woodDark);
  setPixel(png, 66, 72, PALETTE.goldLight);
  fillRect(png, 89, 72, 3, 8, PALETTE.woodDark);
  setPixel(png, 91, 72, PALETTE.goldLight);

  // --------------------------------------------------
  // OBJECT: Medieval Alchemist Table of Potions (32x48) at [96, 64]
  // --------------------------------------------------
  fillRect(png, 100, 106, 24, 5, PALETTE.shadowBlack);
  // Wooden potion rack table (24x20 at x=100, y=90)
  fillGradientV(png, 100, 90, 24, 20, PALETTE.woodLight, PALETTE.woodDark);
  fillRect(png, 100, 90, 24, 1, PALETTE.woodGleam);
  // Three glass potion flasks on table
  // Red Health Potion
  fillRect(png, 103, 80, 5, 8, PALETTE.potionRed);
  fillRect(png, 104, 78, 3, 2, PALETTE.flaskGlass);
  setPixel(png, 104, 82, PALETTE.white);
  // Blue Magic Ether
  fillRect(png, 110, 79, 5, 9, PALETTE.potionBlue);
  fillRect(png, 111, 77, 3, 2, PALETTE.flaskGlass);
  setPixel(png, 111, 81, PALETTE.white);
  // Green Elixir
  fillRect(png, 117, 81, 5, 7, PALETTE.potionGreen);
  fillRect(png, 118, 79, 3, 2, PALETTE.flaskGlass);
  setPixel(png, 118, 83, PALETTE.white);

  // --------------------------------------------------
  // OBJECT: Ornate Brass-Trimmed Treasure Chest (32x48) at [128, 64]
  // --------------------------------------------------
  fillRect(png, 132, 106, 24, 5, PALETTE.shadowBlack);
  // Wooden chest body (22x18 at x=133, y=90)
  fillGradientV(png, 133, 90, 22, 18, PALETTE.woodMid, PALETTE.woodDark);
  // Rounded chest lid
  fillRect(png, 133, 84, 22, 6, PALETTE.woodGleam);
  // Gold corner brackets and center latch
  fillRect(png, 133, 84, 2, 24, PALETTE.goldLight);
  fillRect(png, 153, 84, 2, 24, PALETTE.goldLight);
  fillRect(png, 133, 90, 22, 2, PALETTE.goldLight);
  // Center lock with keyhole
  fillRect(png, 142, 91, 4, 5, PALETTE.goldGleam);
  setPixel(png, 143, 93, PALETTE.black);

  // --------------------------------------------------
  // OBJECT: Astrologer / Guild Telescope & Map Globe (32x48) at [160, 64]
  // --------------------------------------------------
  fillRect(png, 164, 106, 24, 5, PALETTE.shadowBlack);
  // Tripod wooden stand
  fillRect(png, 174, 82, 4, 26, PALETTE.woodDark);
  fillRect(png, 168, 92, 4, 16, PALETTE.woodDark);
  fillRect(png, 180, 92, 4, 16, PALETTE.woodDark);
  // Brass Armillary Celestial Sphere (Globe)
  fillRect(png, 168, 70, 16, 16, PALETTE.goldMid);
  fillRect(png, 170, 72, 12, 12, PALETTE.crystalCyanMid);
  setPixel(png, 173, 75, PALETTE.goldGleam);
  setPixel(png, 178, 79, PALETTE.goldGleam);

  // --------------------------------------------------
  // CLASSIC FINAL FANTASY BLUE DIALOGUE WINDOW TILE (32x32) at [192, 64]
  // --------------------------------------------------
  // Outer 1px white border
  fillRect(png, 192, 64, 32, 32, PALETTE.ffBorderWhite);
  // 1px grey inner border
  fillRect(png, 193, 65, 30, 30, PALETTE.ffBorderGrey);
  // Dark corner bevels
  setPixel(png, 192, 64, PALETTE.ffCornerBevel);
  setPixel(png, 223, 64, PALETTE.ffCornerBevel);
  setPixel(png, 192, 95, PALETTE.ffCornerBevel);
  setPixel(png, 223, 95, PALETTE.ffCornerBevel);
  // Iconic Final Fantasy rich navy blue gradient
  fillGradientV(png, 194, 66, 28, 28, PALETTE.ffBlueTop, PALETTE.ffBlueBottom);

  // --------------------------------------------------
  // CLASSIC FINAL FANTASY POINTING HAND CURSOR (16x16) at [224, 64]
  // --------------------------------------------------
  // White pointing glove
  fillRect(png, 228, 70, 8, 6, PALETTE.white);
  fillRect(png, 224, 71, 4, 3, PALETTE.white); // index finger pointing left
  fillRect(png, 234, 68, 4, 10, PALETTE.white); // cuff
  fillRect(png, 237, 69, 1, 8, PALETTE.goldLight); // gold cuff button
  // Dark glove outline
  setPixel(png, 224, 70, PALETTE.black);
  setPixel(png, 224, 74, PALETTE.black);

  return png;
}

// ====================================================
// 2. GENERATE FINAL FANTASY CHIBI RPG HERO SPRITESHEETS (128x384)
// ====================================================
// Distinct FF character archetype themes:
// 1. Pi: The Green Mage / Summoner (cowl/robe with gold trim, flowing cape, staff)
// 2. Claude: The Red Mage (crimson cavalier hat with tall white feather, rapier cape)
// 3. Codex: The Blue Paladin / Dragoon (cobalt silver knight armor, flowing blonde locks)
// 4. Default: The Adventurer / Fighter (warrior headband, leather bracers, adventurer tunic)
export interface FFHeroTheme {
  primary: RGBA;
  primaryLight: RGBA;
  primaryDark: RGBA;
  cape: RGBA;
  hair: RGBA;
  hairHighlight: RGBA;
  hasHat?: 'wizard' | 'feather_cap' | 'headband' | 'none';
  trimGold?: boolean;
}

function drawFFHeroFrame(
  png: PNG,
  frame: number,
  row: number,
  theme: FFHeroTheme,
  action: 'idle' | 'walk' | 'cast' | 'alert' | 'victory',
  dir: 'down' | 'up' | 'side'
) {
  const ox = frame * 32;
  const oy = row * 48;

  // Natural RPG breathing / step bob
  const bob = (action === 'idle' || action === 'cast') && frame % 2 === 1 ? 1 : 0;
  const walkBob = action === 'walk' ? (frame % 2 === 1 ? -1 : 1) : 0;
  const yOffset = bob + walkBob;

  // Shadow under hero's boots
  fillRect(png, ox + 8, oy + 43, 16, 4, PALETTE.shadowBlack);

  // 1. BOOTS & LEGS (y=34 to 44)
  const leftLegOffset = action === 'walk' && (frame === 1 || frame === 3) ? -2 : 0;
  const rightLegOffset = action === 'walk' && (frame === 0 || frame === 2) ? -2 : 0;

  if (dir === 'side') {
    fillRect(png, ox + 11, oy + 34, 8, 8, theme.primaryDark);
    fillRect(png, ox + 10, oy + 41, 10, 4, PALETTE.woodDark); // leather boot
    fillRect(png, ox + 10, oy + 44, 10, 1, PALETTE.stoneMortar);
  } else {
    // Left boot
    fillRect(png, ox + 9, oy + 34, 6, 7 + leftLegOffset, theme.primaryDark);
    fillRect(png, ox + 8, oy + 41 + leftLegOffset, 7, 4, PALETTE.woodDark);
    // Right boot
    fillRect(png, ox + 17, oy + 34, 6, 7 + rightLegOffset, theme.primaryDark);
    fillRect(png, ox + 17, oy + 41 + rightLegOffset, 7, 4, PALETTE.woodDark);
  }

  // 2. CAPE (Rendered behind torso if facing down or side)
  const capeY = oy + 20 + yOffset;
  if (dir === 'down' || dir === 'side') {
    // Cape edges fluttering behind body
    fillRect(png, ox + 6, capeY + 4, 3, 16, theme.cape);
    fillRect(png, ox + 23, capeY + 4, 3, 16, theme.cape);
  } else {
    // Full flowing back of cape
    fillRect(png, ox + 7, capeY, 18, 18, theme.cape);
    fillRect(png, ox + 7, capeY + 16, 18, 2, theme.primaryDark);
  }

  // 3. TORSO & TUNIC / ARMOR (y=20 to 34)
  const torsoY = oy + 20 + yOffset;
  fillRect(png, ox + 9, torsoY, 14, 14, theme.primary);
  fillRect(png, ox + 9, torsoY, 14, 1, theme.primaryLight); // shoulder line

  // Gold Trim / Belt buckle
  if (theme.trimGold) {
    fillRect(png, ox + 9, torsoY + 11, 14, 2, PALETTE.goldMid);
    fillRect(png, ox + 14, torsoY + 10, 4, 3, PALETTE.goldGleam); // buckle
  }

  // 4. CHIBI RPG HEAD & EXPRESSIVE FACE (y=5 to 20)
  const headY = oy + 6 + yOffset;

  if (dir === 'down') {
    // Chibi round face
    fillRect(png, ox + 10, headY + 4, 12, 11, PALETTE.skinPale);
    fillRect(png, ox + 10, headY + 13, 12, 2, PALETTE.skinShadow);

    // Big Classic Anime / Final Fantasy Eyes
    if (action === 'alert') {
      // Exclamation wide anime eyes
      fillRect(png, ox + 11, headY + 6, 4, 5, PALETTE.white);
      fillRect(png, ox + 17, headY + 6, 4, 5, PALETTE.white);
      fillRect(png, ox + 12, headY + 7, 2, 3, PALETTE.black);
      fillRect(png, ox + 18, headY + 7, 2, 3, PALETTE.black);
      setPixel(png, ox + 12, headY + 7, PALETTE.white); // specular sparkle
      setPixel(png, ox + 18, headY + 7, PALETTE.white);
    } else {
      // Classic RPG focused eyes
      fillRect(png, ox + 11, headY + 7, 3, 4, PALETTE.white);
      fillRect(png, ox + 17, headY + 7, 3, 4, PALETTE.white);
      fillRect(png, ox + 12, headY + 7, 2, 3, PALETTE.black);
      fillRect(png, ox + 18, headY + 7, 2, 3, PALETTE.black);
      setPixel(png, ox + 12, headY + 7, PALETTE.white); // sparkle gleam
      setPixel(png, ox + 18, headY + 7, PALETTE.white);
      // Eyebrows
      fillRect(png, ox + 11, headY + 5, 3, 1, theme.hair);
      fillRect(png, ox + 17, headY + 5, 3, 1, theme.hair);
    }

    // Cute blush dots
    setPixel(png, ox + 10, headY + 11, [248, 160, 150, 255]);
    setPixel(png, ox + 21, headY + 11, [248, 160, 150, 255]);

    // Layered Anime Hair
    fillRect(png, ox + 8, headY - 1, 16, 6, theme.hair);
    fillRect(png, ox + 9, headY - 2, 14, 2, theme.hairHighlight);
    fillRect(png, ox + 7, headY + 2, 3, 7, theme.hair); // left bangs
    fillRect(png, ox + 22, headY + 2, 3, 7, theme.hair); // right bangs
    fillRect(png, ox + 11, headY + 4, 2, 3, theme.hair); // forehead bangs
    fillRect(png, ox + 15, headY + 4, 3, 3, theme.hair);
  } else if (dir === 'up') {
    // Back of head - full majestic hair volume
    fillRect(png, ox + 8, headY - 2, 16, 16, theme.hair);
    fillRect(png, ox + 9, headY - 3, 14, 3, theme.hairHighlight);
    fillRect(png, ox + 7, headY + 2, 3, 12, theme.hair);
    fillRect(png, ox + 22, headY + 2, 3, 12, theme.hair);
  } else {
    // Side profile
    fillRect(png, ox + 9, headY - 1, 14, 6, theme.hair);
    fillRect(png, ox + 14, headY + 4, 8, 10, PALETTE.skinPale);
    fillRect(png, ox + 17, headY + 7, 2, 3, PALETTE.black);
    setPixel(png, ox + 17, headY + 7, PALETTE.white);
    fillRect(png, ox + 8, headY + 1, 4, 12, theme.hair);
  }

  // 5. ICONIC FINAL FANTASY HEADGEAR
  if (theme.hasHat === 'wizard') {
    // Pointed Wizard / Green Mage Cowl Hat
    if (dir === 'down' || dir === 'side') {
      fillRect(png, ox + 5, headY - 1, 22, 3, theme.primaryDark); // wide brim
      fillRect(png, ox + 9, headY - 6, 14, 5, theme.primary);
      fillRect(png, ox + 12, headY - 10, 8, 4, theme.primaryLight);
      fillRect(png, ox + 14, headY - 12, 4, 2, PALETTE.goldGleam); // tip
      fillRect(png, ox + 9, headY - 2, 14, 1, PALETTE.goldLight); // gold ribbon
    }
  } else if (theme.hasHat === 'feather_cap') {
    // Red Mage Cavalier Hat with Large White Feather!
    fillRect(png, ox + 5, headY - 2, 22, 3, PALETTE.carpetCrimsonDark); // brim
    fillRect(png, ox + 8, headY - 7, 16, 5, PALETTE.carpetCrimsonMid);
    // Glorious white plume feather
    fillRect(png, ox + 18, headY - 12, 3, 7, PALETTE.white);
    fillRect(png, ox + 20, headY - 14, 4, 4, PALETTE.white);
    fillRect(png, ox + 22, headY - 10, 2, 3, PALETTE.white);
    setPixel(png, ox + 17, headY - 5, PALETTE.goldGleam); // clasp brooch
  } else if (theme.hasHat === 'headband') {
    // Monk / Fighter Crimson Headband with fluttering tails
    fillRect(png, ox + 8, headY + 2, 16, 2, PALETTE.carpetCrimsonMid);
    fillRect(png, ox + 23, headY + 3, 4, 6, PALETTE.carpetCrimsonMid); // tail
  }

  // 6. ARMS, SPELLS & WEAPONS (Magic Casting / Victory Dance)
  if (action === 'cast') {
    // Channeling Magic Spell (Hands forward with glowing sparkle runes!)
    fillRect(png, ox + 5, torsoY + 2, 4, 8, theme.primary);
    fillRect(png, ox + 23, torsoY + 2, 4, 8, theme.primary);
    // Glowing magic runes in hands
    fillRect(png, ox + 4, torsoY + 8, 4, 4, PALETTE.crystalCyanLight);
    fillRect(png, ox + 24, torsoY + 8, 4, 4, PALETTE.crystalCyanLight);
    setPixel(png, ox + 5, torsoY + 9, PALETTE.white);
    setPixel(png, ox + 25, torsoY + 9, PALETTE.white);
  } else if (action === 'victory') {
    // Classic Final Fantasy Victory Pose (Arms raised high with glowing sparkles!)
    fillRect(png, ox + 5, torsoY - 8, 3, 12, theme.primary);
    fillRect(png, ox + 24, torsoY - 8, 3, 12, theme.primary);
    fillRect(png, ox + 4, torsoY - 11, 4, 4, PALETTE.skinPale);
    fillRect(png, ox + 24, torsoY - 11, 4, 4, PALETTE.skinPale);
    // Victory golden stars
    setPixel(png, ox + 3, torsoY - 13, PALETTE.goldGleam);
    setPixel(png, ox + 27, torsoY - 13, PALETTE.goldGleam);
    setPixel(png, ox + 16, headY - 5, PALETTE.goldGleam);
  } else if (action === 'alert') {
    // Alarmed / Blocked pose with hand scratching head
    fillRect(png, ox + 5, torsoY - 2, 4, 8, theme.primary);
    fillRect(png, ox + 23, torsoY - 2, 4, 8, theme.primary);
    fillRect(png, ox + 6, headY + 2, 3, 3, PALETTE.skinPale);
    fillRect(png, ox + 23, headY + 2, 3, 3, PALETTE.skinPale);
  } else {
    // Standard resting / walking arms with natural counter-swing
    const armSwing = action === 'walk' ? (frame % 2 === 0 ? 2 : -2) : 0;
    fillRect(png, ox + 6, torsoY + 2 + armSwing, 3, 8, theme.primary);
    fillRect(png, ox + 6, torsoY + 10 + armSwing, 3, 3, PALETTE.skinPale);
    fillRect(png, ox + 23, torsoY + 2 - armSwing, 3, 8, theme.primary);
    fillRect(png, ox + 23, torsoY + 10 - armSwing, 3, 3, PALETTE.skinPale);
  }
}

export function generateFFCharacterSpritesheet(theme: FFHeroTheme): PNG {
  const png = createPNG(128, 384); // 4 frames x 8 rows

  // Row 0: Idle Down (Breathing / Cape flutter)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 0, theme, 'idle', 'down');
  // Row 1: Idle Up (Back view)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 1, theme, 'idle', 'up');
  // Row 2: Walk Down (Classic 4-frame RPG walk)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 2, theme, 'walk', 'down');
  // Row 3: Walk Up (Back walk)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 3, theme, 'walk', 'up');
  // Row 4: Walk Side (Side walk)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 4, theme, 'walk', 'side');
  // Row 5: Cast Magic / Work (Channeling spell runes)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 5, theme, 'cast', 'down');
  // Row 6: Alert / Blocked (Alarmed / Confused)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 6, theme, 'alert', 'down');
  // Row 7: Victory Fanfare / Done (Arms up, sparkles)
  for (let f = 0; f < 4; f++) drawFFHeroFrame(png, f, 7, theme, 'victory', 'down');

  return png;
}

// ====================================================
// MAIN ASSET PIPELINE EXECUTION
// ====================================================
const clientAssets = path.resolve(process.cwd(), 'client/public/assets');
console.log('Generating Final Fantasy Retro RPG artwork in:', clientAssets);

// 1. Generate Final Fantasy Castle & Guild Tileset
const tileset = generateFinalFantasyTileset();
savePNG(tileset, path.join(clientAssets, 'tiles/office_tiles.png'));

// 2. Generate Final Fantasy Hero Characters
const themes: Record<string, FFHeroTheme> = {
  // Pi: The Green Mage / Summoner (cowl/robe with gold trim, flowing emerald cape)
  pi: {
    primary: [22, 101, 52, 255],        // Emerald Green Robe
    primaryLight: [34, 197, 94, 255],
    primaryDark: [20, 83, 45, 255],
    cape: [15, 118, 110, 255],          // Teal Cape
    hair: [55, 40, 30, 255],
    hairHighlight: [74, 222, 128, 255], // Green anime highlight
    hasHat: 'wizard',
    trimGold: true,
  },
  // Claude: The Red Mage (crimson cavalier hat with tall white feather, scarlet cape)
  claude: {
    primary: [185, 28, 28, 255],        // Crimson Red Tunic
    primaryLight: [239, 68, 68, 255],
    primaryDark: [127, 29, 29, 255],
    cape: [153, 27, 27, 255],
    hair: [45, 30, 20, 255],
    hairHighlight: [180, 83, 9, 255],
    hasHat: 'feather_cap',
    trimGold: true,
  },
  // Codex: The Blue Paladin / Dragoon (cobalt knight tunic with gold crest)
  codex: {
    primary: [29, 78, 216, 255],        // Cobalt Blue Armor
    primaryLight: [59, 130, 246, 255],
    primaryDark: [30, 58, 138, 255],
    cape: [37, 99, 235, 255],
    hair: [234, 179, 8, 255],           // Golden Blonde
    hairHighlight: [254, 240, 138, 255],
    hasHat: 'none',
    trimGold: true,
  },
};

for (const [name, theme] of Object.entries(themes)) {
  const charSheet = generateFFCharacterSpritesheet(theme);
  savePNG(charSheet, path.join(clientAssets, `characters/character_${name}.png`));
}

// 3. Asset Manifest JSON
const manifest = {
  name: 'herdr-office-final-fantasy-art',
  version: '3.0.0',
  tileSize: 32,
  tileset: {
    path: '/assets/tiles/office_tiles.png',
    width: 256,
    height: 256,
    tiles: {
      floor_wood: { x: 0, y: 0, w: 32, h: 32 },
      floor_carpet: { x: 32, y: 0, w: 32, h: 32 },
      floor_stone: { x: 64, y: 0, w: 32, h: 32 },
      floor_tile: { x: 64, y: 0, w: 32, h: 32 }, // alias for breakroom stone
      wall_top: { x: 96, y: 0, w: 32, h: 48 },   // Castle wall with torch
      wall_window: { x: 128, y: 0, w: 32, h: 48 }, // Gothic crystal window
      wall_bookshelf: { x: 160, y: 0, w: 32, h: 48 }, // Library bookshelf
      wall_whiteboard: { x: 160, y: 0, w: 32, h: 48 }, // alias
      crystal: { x: 192, y: 0, w: 32, h: 48 },    // Floating Save Crystal
      wall_server: { x: 192, y: 0, w: 32, h: 48 }, // alias
      desk: { x: 0, y: 64, w: 64, h: 48 },
      chair: { x: 64, y: 64, w: 32, h: 32 },
      potions: { x: 96, y: 64, w: 32, h: 48 },
      plant: { x: 96, y: 64, w: 32, h: 48 },      // alias
      chest: { x: 128, y: 64, w: 32, h: 48 },
      water_cooler: { x: 128, y: 64, w: 32, h: 48 }, // alias
      astronomy: { x: 160, y: 64, w: 32, h: 48 },
      espresso_bar: { x: 160, y: 64, w: 32, h: 48 }, // alias
      ff_dialog: { x: 192, y: 64, w: 32, h: 32 },
      cursor_hand: { x: 224, y: 64, w: 16, h: 16 },
    },
  },
  characters: {
    frameWidth: 32,
    frameHeight: 48,
    variants: {
      pi: '/assets/characters/character_pi.png',
      claude: '/assets/characters/character_claude.png',
      codex: '/assets/characters/character_codex.png',
      default: '/assets/characters/character_pi.png',
    },
    animations: {
      idle_down: { row: 0, frames: [0, 1, 2, 3], frameRate: 3 },
      idle_up: { row: 1, frames: [0, 1, 2, 3], frameRate: 3 },
      walk_down: { row: 2, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_up: { row: 3, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_side: { row: 4, frames: [0, 1, 2, 3], frameRate: 6 },
      cast_magic: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      type_up: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      alert: { row: 6, frames: [0, 1, 2, 3], frameRate: 4 },
      victory: { row: 7, frames: [0, 1, 2, 3], frameRate: 4 },
      done: { row: 7, frames: [0, 1, 2, 3], frameRate: 4 },
    },
  },
};

fs.writeFileSync(
  path.join(clientAssets, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('Saved Final Fantasy asset manifest:', path.join(clientAssets, 'manifest.json'));

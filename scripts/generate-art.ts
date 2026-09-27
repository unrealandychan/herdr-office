import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

type RGBA = [number, number, number, number];

// ====================================================
// AUTHENTIC 2D PIXEL ART MODERN TECH OFFICE COLOR PALETTE
// (Retro cozy tech startup aesthetic: Stardew / Kairosoft / Habbo)
// ====================================================
const PALETTE = {
  transparent: [0, 0, 0, 0] as RGBA,

  // 1. Honey Oak Parquet Hardwood Floor
  woodHighlight: [245, 208, 150, 255] as RGBA,
  woodLight: [224, 178, 118, 255] as RGBA,
  woodMid: [198, 142, 86, 255] as RGBA,
  woodDark: [164, 108, 58, 255] as RGBA,
  woodShadow: [126, 76, 38, 255] as RGBA,
  woodSeam: [88, 52, 26, 255] as RGBA,

  // 2. Modern Navy / Slate Gray Carpet Tiles
  carpetHighlight: [82, 102, 130, 255] as RGBA,
  carpetLight: [64, 82, 110, 255] as RGBA,
  carpetMid: [46, 60, 84, 255] as RGBA,
  carpetDark: [32, 44, 66, 255] as RGBA,
  carpetShadow: [22, 30, 48, 255] as RGBA,
  carpetSeam: [16, 22, 36, 255] as RGBA,

  // 3. Breakroom Ceramic / Checkerboard Tile Floor
  tileIvoryLight: [252, 252, 254, 255] as RGBA,
  tileIvoryMid: [236, 240, 246, 255] as RGBA,
  tileIvoryShadow: [208, 216, 228, 255] as RGBA,
  tileSlateLight: [172, 184, 202, 255] as RGBA,
  tileSlateMid: [138, 150, 172, 255] as RGBA,
  tileSlateShadow: [110, 122, 142, 255] as RGBA,
  tileGrout: [82, 94, 112, 255] as RGBA,

  // 4. Modern Office Drywall & Trim
  wallDrywallTop: [244, 246, 250, 255] as RGBA,
  wallDrywallMid: [220, 226, 234, 255] as RGBA,
  wallDrywallDark: [196, 204, 214, 255] as RGBA,
  wallTrimSilver: [168, 178, 192, 255] as RGBA,
  baseboardWoodMid: [112, 70, 40, 255] as RGBA,
  baseboardWoodDark: [76, 44, 22, 255] as RGBA,
  baseboardMetalLight: [142, 152, 166, 255] as RGBA,
  baseboardMetalDark: [68, 76, 90, 255] as RGBA,
  floorShadow: [16, 20, 30, 140] as RGBA,

  // 5. Panoramic City Skyline Window
  windowFrameOuter: [38, 44, 56, 255] as RGBA,
  windowFrameInner: [60, 68, 84, 255] as RGBA,
  windowFrameHighlight: [92, 104, 124, 255] as RGBA,
  skyDayTop: [84, 164, 246, 255] as RGBA,
  skyDayMid: [136, 194, 252, 255] as RGBA,
  skyDayHorizon: [194, 226, 255, 255] as RGBA,
  cloudWhite: [255, 255, 255, 255] as RGBA,
  cloudShadow: [216, 230, 246, 230] as RGBA,
  buildingFar: [142, 166, 198, 255] as RGBA,
  buildingMid: [100, 122, 156, 255] as RGBA,
  buildingNear: [68, 86, 118, 255] as RGBA,
  buildingLitWindow: [254, 240, 138, 255] as RGBA,
  buildingCyanWindow: [165, 243, 252, 255] as RGBA,
  windowGlassGlare: [255, 255, 255, 75] as RGBA,

  // 6. Whiteboard & Agile Sticky Notes
  whiteboardFrame: [178, 186, 198, 255] as RGBA,
  whiteboardSurface: [250, 252, 255, 255] as RGBA,
  whiteboardShadow: [222, 228, 238, 255] as RGBA,
  stickyYellow: [254, 240, 138, 255] as RGBA,
  stickyYellowDark: [234, 179, 8, 255] as RGBA,
  stickyCyan: [165, 243, 252, 255] as RGBA,
  stickyCyanDark: [6, 182, 212, 255] as RGBA,
  stickyPink: [251, 207, 232, 255] as RGBA,
  stickyPinkDark: [236, 72, 153, 255] as RGBA,
  stickyGreen: [187, 247, 208, 255] as RGBA,
  diagramBox: [37, 99, 235, 255] as RGBA,
  diagramLine: [225, 29, 72, 255] as RGBA,
  diagramGreen: [22, 163, 74, 255] as RGBA,
  markerTray: [148, 158, 172, 255] as RGBA,

  // 7. Server Rack
  serverCabinet: [18, 20, 26, 255] as RGBA,
  serverBladeDark: [28, 32, 40, 255] as RGBA,
  serverBladeTrim: [78, 88, 106, 255] as RGBA,
  ledGreen: [34, 197, 94, 255] as RGBA,
  ledCyan: [34, 211, 238, 255] as RGBA,
  ledAmber: [245, 158, 11, 255] as RGBA,
  ledBlue: [59, 130, 246, 255] as RGBA,
  cableBlue: [37, 99, 235, 255] as RGBA,
  cableYellow: [234, 179, 8, 255] as RGBA,
  cableMagenta: [217, 70, 239, 255] as RGBA,

  // 8. Modern Workstation Desk & Dual Monitors
  deskOakLight: [216, 166, 116, 255] as RGBA,
  deskOakMid: [184, 132, 86, 255] as RGBA,
  deskOakDark: [146, 98, 58, 255] as RGBA,
  deskBevel: [236, 190, 142, 255] as RGBA,
  deskLegSteel: [46, 52, 64, 255] as RGBA,
  deskLegHighlight: [78, 86, 102, 255] as RGBA,
  monitorBezel: [20, 22, 28, 255] as RGBA,
  monitorStand: [118, 126, 140, 255] as RGBA,
  screenCodeBg: [14, 18, 26, 255] as RGBA,
  syntaxKeyword: [192, 132, 252, 255] as RGBA, // purple
  syntaxFunction: [56, 189, 248, 255] as RGBA, // cyan
  syntaxString: [250, 204, 21, 255] as RGBA,  // yellow
  syntaxComment: [74, 222, 128, 255] as RGBA, // green
  syntaxCursor: [244, 244, 245, 255] as RGBA, // white cursor
  pcTowerCase: [24, 26, 34, 255] as RGBA,
  pcRgbLight: [168, 85, 247, 255] as RGBA,
  keyboardDark: [30, 32, 42, 255] as RGBA,
  keyboardKey: [224, 228, 238, 255] as RGBA,
  mouseBlack: [36, 40, 50, 255] as RGBA,
  mugCeramic: [248, 248, 252, 255] as RGBA,
  coffeeLiquid: [96, 52, 24, 255] as RGBA,

  // 9. Ergonomic Mesh Swivel Chair
  chairMesh: [26, 30, 38, 255] as RGBA,
  chairMeshLight: [46, 54, 68, 255] as RGBA,
  chairFrame: [62, 70, 84, 255] as RGBA,
  chairChrome: [176, 186, 202, 255] as RGBA,
  chairCaster: [18, 20, 26, 255] as RGBA,

  // 10. Potted Plant (Monstera / Ficus)
  potClayLight: [218, 128, 88, 255] as RGBA,
  potClayMid: [186, 96, 60, 255] as RGBA,
  potClayDark: [144, 70, 40, 255] as RGBA,
  leafHighlight: [136, 240, 112, 255] as RGBA,
  leafMid: [72, 186, 70, 255] as RGBA,
  leafDark: [34, 126, 42, 255] as RGBA,
  leafShadow: [16, 74, 28, 255] as RGBA,

  // 11. Water Cooler
  waterBottleAqua: [56, 189, 248, 180] as RGBA,
  waterBottleLight: [186, 230, 253, 230] as RGBA,
  coolerSteelLight: [238, 242, 248, 255] as RGBA,
  coolerSteelShadow: [178, 188, 202, 255] as RGBA,
  tapRed: [239, 68, 68, 255] as RGBA,
  tapBlue: [59, 130, 246, 255] as RGBA,

  // 12. Coffee Machine / Breakroom Counter
  counterSurface: [176, 132, 88, 255] as RGBA,
  counterCabinet: [62, 42, 26, 255] as RGBA,
  espressoChrome: [222, 230, 240, 255] as RGBA,
  espressoDark: [66, 74, 86, 255] as RGBA,
  steamWhite: [255, 255, 255, 140] as RGBA,

  // 13. Conference Table & Meeting Setup
  confWoodTop: [180, 124, 76, 255] as RGBA,
  confWoodBevel: [220, 164, 110, 255] as RGBA,
  confLeg: [48, 54, 66, 255] as RGBA,
  micPuck: [30, 32, 38, 255] as RGBA,
  micPuckGreen: [34, 197, 94, 255] as RGBA,
  laptopSilver: [204, 210, 222, 255] as RGBA,
  glassWater: [186, 230, 253, 200] as RGBA,

  // Bookshelf / Tech Decor
  bookSpineRed: [225, 29, 72, 255] as RGBA,
  bookSpineBlue: [37, 99, 235, 255] as RGBA,
  bookSpineGreen: [22, 163, 74, 255] as RGBA,
  bookSpineYellow: [234, 179, 8, 255] as RGBA,
  trophyGold: [251, 191, 36, 255] as RGBA,

  // UI & General
  white: [255, 255, 255, 255] as RGBA,
  black: [0, 0, 0, 255] as RGBA,
  uiDarkBg: [15, 23, 42, 255] as RGBA,
  uiBorderSlate: [71, 85, 105, 255] as RGBA,
  statusGreen: [34, 197, 94, 255] as RGBA,
  statusAmber: [245, 158, 11, 255] as RGBA,
  statusRed: [239, 68, 68, 255] as RGBA,
  statusBlue: [59, 130, 246, 255] as RGBA,
};

// ====================================================
// DRAWING UTILITIES
// ====================================================
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
      png.data[idx + 1] = Math.round((color[1] * alpha + png.data[idx] * bgA * (1 - alpha)) / outA);
      png.data[idx + 2] = Math.round((color[2] * alpha + png.data[idx] * bgA * (1 - alpha)) / outA);
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
  console.log(`Saved pixel art asset: ${filePath} (${png.width}x${png.height})`);
}

// ====================================================
// 1. GENERATE HIGH-QUALITY 2D PIXEL ART OFFICE TILESET (256x256)
// ====================================================
export function generateModernOfficeTileset(): PNG {
  const png = createPNG(256, 256);

  // --------------------------------------------------
  // TILE: Honey Oak Parquet Hardwood Floor (32x32) at [0, 0]
  // Visible plank lines and warm honey grain
  // --------------------------------------------------
  fillRect(png, 0, 0, 32, 32, PALETTE.woodMid);
  for (let p = 0; p < 4; p++) {
    const py = p * 8;
    const isAlt = p % 2 === 1;

    // Horizontal plank seam & top highlight
    fillRect(png, 0, py, 32, 1, PALETTE.woodHighlight);
    fillRect(png, 0, py + 7, 32, 1, PALETTE.woodSeam);

    // Staggered vertical seams
    const vx1 = isAlt ? 10 : 16;
    const vx2 = isAlt ? 26 : 31;
    fillRect(png, vx1, py, 1, 7, PALETTE.woodSeam);
    fillRect(png, vx2, py, 1, 7, PALETTE.woodSeam);

    // Warm organic wood grain
    for (let x = 0; x < 32; x++) {
      if ((x + p * 7) % 5 === 0) setPixel(png, x, py + 2, PALETTE.woodLight);
      if ((x * 3 + p * 4) % 8 === 0) setPixel(png, x, py + 4, PALETTE.woodDark);
      if ((x * 2 + p * 3) % 9 === 0) setPixel(png, x, py + 5, PALETTE.woodLight);
      if ((x + p * 11) % 13 === 0) setPixel(png, x, py + 3, PALETTE.woodShadow);
    }
  }

  // --------------------------------------------------
  // TILE: Modern Navy / Slate Gray Carpet Tiles (32x32) at [32, 0]
  // Subtle modular seam pattern and micro-woven texture
  // --------------------------------------------------
  fillRect(png, 32, 0, 32, 32, PALETTE.carpetMid);
  // Modular 16x16 carpet tiles divider seams
  fillRect(png, 32, 15, 32, 1, PALETTE.carpetSeam);
  fillRect(png, 32, 16, 32, 1, PALETTE.carpetHighlight);
  fillRect(png, 47, 0, 1, 32, PALETTE.carpetSeam);
  fillRect(png, 48, 0, 1, 32, PALETTE.carpetHighlight);

  // Micro-woven loop texture with subtle directional grain
  for (let y = 0; y < 32; y++) {
    for (let x = 32; x < 64; x++) {
      const isTopRightOrBottomLeft = ((x < 48 && y >= 16) || (x >= 48 && y < 16));
      const grain = isTopRightOrBottomLeft ? (x + y * 2) % 4 : (x * 2 + y) % 4;

      if (grain === 0) setPixel(png, x, y, PALETTE.carpetHighlight);
      else if (grain === 2) setPixel(png, x, y, PALETTE.carpetDark);
      if ((x - 32) % 4 === 0 && y % 4 === 0) setPixel(png, x, y, PALETTE.carpetShadow);
    }
  }

  // --------------------------------------------------
  // TILE: Breakroom / Ceramic Checkerboard Tiles (32x32) at [64, 0]
  // Clean alternating ivory porcelain and slate ceramic tiles
  // --------------------------------------------------
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const bx = 64 + tx * 16;
      const by = ty * 16;
      const isAlt = (tx + ty) % 2 === 0;

      // Base tile color
      fillRect(png, bx, by, 16, 16, isAlt ? PALETTE.tileIvoryMid : PALETTE.tileSlateMid);

      // Top and left glossy bevel highlight
      fillRect(png, bx + 1, by + 1, 14, 1, isAlt ? PALETTE.tileIvoryLight : PALETTE.tileSlateLight);
      fillRect(png, bx + 1, by + 1, 1, 14, isAlt ? PALETTE.tileIvoryLight : PALETTE.tileSlateLight);

      // Specular shine glint at top-left
      setPixel(png, bx + 2, by + 2, PALETTE.white);
      setPixel(png, bx + 3, by + 2, PALETTE.white);

      // Bottom and right bevel shadow
      fillRect(png, bx, by + 15, 16, 1, isAlt ? PALETTE.tileIvoryShadow : PALETTE.tileSlateShadow);
      fillRect(png, bx + 15, by, 1, 16, isAlt ? PALETTE.tileIvoryShadow : PALETTE.tileSlateShadow);

      // Grout line on outer rim
      fillRect(png, bx, by + 15, 16, 1, PALETTE.tileGrout);
      fillRect(png, bx + 15, by, 1, 16, PALETTE.tileGrout);
    }
  }

  // --------------------------------------------------
  // TILE: Modern Office Drywall & Baseboard Molding (32x48) at [96, 0]
  // Warm off-white / light slate drywall with neat wood/metal baseboard
  // --------------------------------------------------
  // Upper ceiling shadow / drop
  fillRect(png, 96, 0, 32, 2, PALETTE.wallDrywallDark);
  fillRect(png, 96, 2, 32, 1, PALETTE.wallTrimSilver);

  // Smooth modern painted drywall face
  fillGradientV(png, 96, 3, 32, 35, PALETTE.wallDrywallTop, PALETTE.wallDrywallMid);

  // Picture hanging rail / aluminum wall trim at y=38
  fillRect(png, 96, 38, 32, 2, PALETTE.wallTrimSilver);

  // Baseboard molding (y=40 to 48): warm mahogany wood with beveled metal cap
  fillRect(png, 96, 40, 32, 2, PALETTE.baseboardMetalLight);
  fillRect(png, 96, 42, 32, 5, PALETTE.baseboardWoodMid);
  fillRect(png, 96, 47, 32, 1, PALETTE.baseboardWoodDark);

  // --------------------------------------------------
  // TILE: Large Office Window with City Skyline (32x48) at [128, 0]
  // Panoramic window: blue sky, fluffy white clouds, skyscraper silhouettes, glass glare
  // --------------------------------------------------
  // Window outer wall frame
  fillRect(png, 128, 0, 32, 6, PALETTE.wallDrywallMid);
  fillRect(png, 128, 42, 32, 6, PALETTE.baseboardWoodMid);
  fillRect(png, 128, 6, 2, 36, PALETTE.windowFrameOuter);
  fillRect(png, 158, 6, 2, 36, PALETTE.windowFrameOuter);

  // Glass pane sky gradient (28x36 at x=130, y=6)
  fillGradientV(png, 130, 6, 28, 18, PALETTE.skyDayTop, PALETTE.skyDayMid);
  fillGradientV(png, 130, 24, 28, 18, PALETTE.skyDayMid, PALETTE.skyDayHorizon);

  // Fluffy white pixel clouds (upper sky: y=8 to 14)
  // Cloud 1 (left)
  fillRect(png, 133, 9, 8, 3, PALETTE.cloudWhite);
  fillRect(png, 135, 7, 5, 2, PALETTE.cloudWhite);
  fillRect(png, 134, 12, 7, 1, PALETTE.cloudShadow);
  // Cloud 2 (right)
  fillRect(png, 147, 11, 9, 3, PALETTE.cloudWhite);
  fillRect(png, 149, 9, 6, 2, PALETTE.cloudWhite);
  fillRect(png, 148, 14, 8, 1, PALETTE.cloudShadow);

  // Skyscraper Silhouettes (Horizon: y=18 to 41)
  // Far layer (lightest slate blue)
  fillRect(png, 131, 24, 6, 18, PALETTE.buildingFar);
  fillRect(png, 144, 22, 5, 20, PALETTE.buildingFar);

  // Mid layer (medium slate)
  fillRect(png, 135, 20, 8, 22, PALETTE.buildingMid);
  fillRect(png, 138, 17, 2, 3, PALETTE.buildingMid); // spire
  fillRect(png, 151, 23, 7, 19, PALETTE.buildingMid);

  // Near layer (dark slate silhouettes with lit windows)
  fillRect(png, 141, 25, 9, 17, PALETTE.buildingNear);
  for (let wy = 27; wy < 40; wy += 3) {
    setPixel(png, 143, wy, PALETTE.buildingLitWindow);
    setPixel(png, 146, wy, PALETTE.buildingCyanWindow);
    setPixel(png, 148, wy, PALETTE.buildingLitWindow);
  }

  fillRect(png, 132, 28, 5, 14, PALETTE.buildingNear);
  for (let wy = 30; wy < 40; wy += 3) {
    setPixel(png, 134, wy, PALETTE.buildingLitWindow);
  }

  // Window mullions (center cross divider)
  fillRect(png, 143, 6, 2, 36, PALETTE.windowFrameInner);
  fillRect(png, 130, 24, 28, 2, PALETTE.windowFrameInner);
  fillRect(png, 143, 6, 1, 36, PALETTE.windowFrameHighlight);
  fillRect(png, 130, 24, 28, 1, PALETTE.windowFrameHighlight);

  // Diagonal glass glare sheen
  for (let g = 0; g < 18; g++) {
    setPixel(png, 132 + g, 8 + g, PALETTE.windowGlassGlare);
    setPixel(png, 133 + g, 8 + g, PALETTE.windowGlassGlare);
  }

  // Windowsill at bottom
  fillRect(png, 128, 41, 32, 2, PALETTE.wallTrimSilver);

  // --------------------------------------------------
  // TILE: Office Whiteboard (32x48) at [160, 0]
  // Glassboard/whiteboard with sprint sticky notes, architecture diagrams, charts
  // --------------------------------------------------
  fillRect(png, 160, 0, 32, 48, PALETTE.wallDrywallMid);

  // Whiteboard aluminum frame (28x32 at x=162, y=8)
  fillRect(png, 162, 8, 28, 32, PALETTE.whiteboardFrame);
  fillRect(png, 164, 10, 24, 28, PALETTE.whiteboardSurface);

  // Specular sheen on whiteboard
  fillRect(png, 164, 10, 24, 1, PALETTE.white);
  fillRect(png, 164, 10, 1, 28, PALETTE.white);

  // Architecture System Diagram:
  // Microservice Box 1 (Blue)
  fillRect(png, 166, 13, 7, 5, PALETTE.diagramBox);
  fillRect(png, 167, 14, 5, 3, PALETTE.white);
  // Microservice Box 2 (Green)
  fillRect(png, 178, 13, 7, 5, PALETTE.diagramGreen);
  fillRect(png, 179, 14, 5, 3, PALETTE.white);
  // Connecting Arrow Line
  fillRect(png, 173, 15, 5, 1, PALETTE.diagramLine);
  setPixel(png, 177, 14, PALETTE.diagramLine);
  setPixel(png, 177, 16, PALETTE.diagramLine);

  // Sprint Sticky Notes:
  // Sticky 1: Yellow Post-it
  fillRect(png, 166, 21, 4, 4, PALETTE.stickyYellow);
  fillRect(png, 166, 21, 4, 1, PALETTE.stickyYellowDark);
  // Sticky 2: Cyan Post-it
  fillRect(png, 172, 21, 4, 4, PALETTE.stickyCyan);
  fillRect(png, 172, 21, 4, 1, PALETTE.stickyCyanDark);
  // Sticky 3: Pink Post-it
  fillRect(png, 178, 21, 4, 4, PALETTE.stickyPink);
  fillRect(png, 178, 21, 4, 1, PALETTE.stickyPinkDark);
  // Sticky 4: Mint Green
  fillRect(png, 184, 21, 3, 4, PALETTE.stickyGreen);

  // Burndown / Velocity Chart (bottom left: y=28 to 35)
  fillRect(png, 166, 28, 1, 7, PALETTE.uiBorderSlate); // Y-axis
  fillRect(png, 166, 35, 9, 1, PALETTE.uiBorderSlate); // X-axis
  // Mini chart bars
  fillRect(png, 168, 32, 2, 3, PALETTE.syntaxFunction);
  fillRect(png, 171, 30, 2, 5, PALETTE.syntaxKeyword);
  fillRect(png, 174, 28, 2, 7, PALETTE.statusGreen);

  // Marker Tray at bottom of board (holds black, blue, red markers + eraser)
  fillRect(png, 162, 39, 28, 2, PALETTE.markerTray);
  setPixel(png, 167, 39, PALETTE.black); // black marker
  setPixel(png, 172, 39, PALETTE.cableBlue); // blue marker
  setPixel(png, 177, 39, PALETTE.tapRed); // red marker
  fillRect(png, 182, 38, 4, 2, PALETTE.uiBorderSlate); // eraser

  // Baseboard at bottom
  fillRect(png, 160, 43, 32, 5, PALETTE.baseboardWoodMid);

  // --------------------------------------------------
  // TILE: Modern Server Rack (32x48) at [192, 0]
  // Modern matte black chassis, blinking green/blue/amber LEDs, cables
  // --------------------------------------------------
  fillRect(png, 192, 0, 32, 48, PALETTE.wallDrywallMid);

  // Server Cabinet Chassis (24x42 at x=196, y=4)
  fillRect(png, 196, 4, 24, 42, PALETTE.serverCabinet);
  fillRect(png, 196, 4, 24, 1, PALETTE.serverBladeTrim);
  fillRect(png, 196, 4, 1, 42, PALETTE.serverBladeTrim);
  fillRect(png, 219, 4, 1, 42, PALETTE.serverBladeTrim);

  // 1U/2U Server Blades & LEDs (8 blade chassis units)
  for (let b = 0; b < 8; b++) {
    const by = 7 + b * 4;
    fillRect(png, 198, by, 20, 3, PALETTE.serverBladeDark);
    fillRect(png, 198, by + 2, 20, 1, PALETTE.serverCabinet);

    // Blinking LED status lights
    setPixel(png, 200, by + 1, b % 2 === 0 ? PALETTE.ledGreen : PALETTE.ledCyan);
    setPixel(png, 202, by + 1, b % 3 === 0 ? PALETTE.ledAmber : PALETTE.ledGreen);
    setPixel(png, 204, by + 1, PALETTE.ledGreen);
    setPixel(png, 206, by + 1, b % 4 === 0 ? PALETTE.ledBlue : PALETTE.ledCyan);

    // Drive bays / vent slots
    fillRect(png, 209, by + 1, 7, 1, PALETTE.serverBladeTrim);
  }

  // Vertical cable management duct & colorful patch cables (x=214, y=7 to 38)
  fillRect(png, 216, 7, 2, 32, PALETTE.serverCabinet);
  // Interwoven patch cables
  fillRect(png, 216, 10, 1, 6, PALETTE.cableBlue);
  fillRect(png, 217, 14, 1, 8, PALETTE.cableYellow);
  fillRect(png, 216, 20, 1, 7, PALETTE.cableMagenta);
  fillRect(png, 217, 26, 1, 8, PALETTE.cableBlue);

  // Baseboard at bottom
  fillRect(png, 192, 44, 32, 4, PALETTE.baseboardWoodMid);

  // --------------------------------------------------
  // TILE: Modern Tech Bookshelf & Awards (32x48) at [224, 0]
  // Open Scandinavian shelf with programming books, succulent, and trophy
  // --------------------------------------------------
  fillRect(png, 224, 0, 32, 48, PALETTE.wallDrywallMid);

  // Shelf frame (24x42 at x=228, y=4)
  fillRect(png, 228, 4, 24, 42, PALETTE.deskOakDark);
  fillRect(png, 228, 4, 24, 2, PALETTE.deskOakLight);

  // Shelves at y=15, y=27, y=39
  fillRect(png, 229, 15, 22, 2, PALETTE.deskOakLight);
  fillRect(png, 229, 27, 22, 2, PALETTE.deskOakLight);
  fillRect(png, 229, 39, 22, 2, PALETTE.deskOakLight);

  // Top Shelf: Colorful Tech Books (O'Reilly style)
  fillRect(png, 231, 7, 3, 8, PALETTE.bookSpineRed);
  fillRect(png, 235, 6, 3, 9, PALETTE.bookSpineBlue);
  fillRect(png, 239, 8, 3, 7, PALETTE.bookSpineGreen);
  fillRect(png, 243, 7, 4, 8, PALETTE.bookSpineYellow);

  // Middle Shelf: Mini potted succulent + Gold Hackathon Trophy
  // Succulent in white ceramic cube
  fillRect(png, 231, 22, 5, 5, PALETTE.white);
  fillRect(png, 232, 19, 3, 3, PALETTE.leafMid);
  // Gold Trophy
  fillRect(png, 242, 24, 6, 3, PALETTE.trophyGold);
  fillRect(png, 244, 21, 2, 3, PALETTE.trophyGold);
  fillRect(png, 243, 18, 4, 3, PALETTE.trophyGold);

  // Bottom Shelf: Magazine stack + Rubik's Cube
  fillRect(png, 231, 33, 9, 6, PALETTE.syntaxKeyword);
  fillRect(png, 242, 33, 5, 5, PALETTE.bookSpineRed);
  setPixel(png, 243, 34, PALETTE.syntaxFunction);
  setPixel(png, 245, 34, PALETTE.syntaxString);
  setPixel(png, 244, 36, PALETTE.syntaxComment);

  // Baseboard
  fillRect(png, 224, 44, 32, 4, PALETTE.baseboardWoodMid);

  // --------------------------------------------------
  // OBJECT: Modern Developer Workstation Desk (64x48) at [0, 64]
  // Dual widescreen monitors with syntax code, desktop tower, mechanical keyboard, mouse, coffee mug
  // --------------------------------------------------
  // Drop shadow on floor
  fillRect(png, 4, 102, 56, 8, PALETTE.floorShadow);

  // Sleek black powder-coated steel legs (y=88 to 106)
  fillRect(png, 6, 88, 4, 20, PALETTE.deskLegSteel);
  fillRect(png, 6, 88, 1, 20, PALETTE.deskLegHighlight);
  fillRect(png, 54, 88, 4, 20, PALETTE.deskLegSteel);
  fillRect(png, 54, 88, 1, 20, PALETTE.deskLegHighlight);
  // Cable raceway / cross brace
  fillRect(png, 10, 98, 44, 2, PALETTE.deskLegSteel);

  // Desktop front edge (y=86 to 91)
  fillRect(png, 2, 86, 60, 5, PALETTE.deskOakDark);
  fillRect(png, 2, 90, 60, 1, PALETTE.woodSeam);

  // Desk top surface (60x16 at x=2, y=70 to 86)
  fillGradientV(png, 2, 70, 60, 16, PALETTE.deskOakLight, PALETTE.deskOakMid);
  fillRect(png, 2, 70, 60, 1, PALETTE.deskBevel);

  // Large Extended Desk Mat (42x12 at x=11, y=74)
  fillRect(png, 11, 74, 42, 12, PALETTE.serverCabinet);
  fillRect(png, 11, 74, 42, 1, PALETTE.syntaxFunction); // Cyan RGB edge glow
  fillRect(png, 11, 85, 42, 1, PALETTE.syntaxKeyword);

  // DUAL WIDESCREEN MONITORS ON ARTICULATED MOUNT
  // Monitor stand base & arm
  fillRect(png, 29, 68, 6, 6, PALETTE.monitorStand);
  fillRect(png, 20, 66, 24, 2, PALETTE.monitorStand);

  // LEFT MONITOR: Code Editor / IDE (23x17 at x=6, y=50)
  fillRect(png, 6, 50, 23, 17, PALETTE.monitorBezel);
  fillRect(png, 7, 51, 21, 15, PALETTE.screenCodeBg);
  // Code syntax highlighting:
  // Line 1: import { Agent } from 'herdr'
  fillRect(png, 9, 53, 5, 1, PALETTE.syntaxKeyword);
  fillRect(png, 15, 53, 6, 1, PALETTE.syntaxFunction);
  fillRect(png, 22, 53, 4, 1, PALETTE.syntaxString);
  // Line 2: const office = new Office()
  fillRect(png, 9, 56, 4, 1, PALETTE.syntaxKeyword);
  fillRect(png, 14, 56, 5, 1, PALETTE.syntaxFunction);
  fillRect(png, 20, 56, 6, 1, PALETTE.syntaxString);
  // Line 3: await office.spawn()
  fillRect(png, 11, 59, 4, 1, PALETTE.syntaxKeyword);
  fillRect(png, 16, 59, 7, 1, PALETTE.syntaxFunction);
  // Line 4: // tests passing!
  fillRect(png, 11, 62, 10, 1, PALETTE.syntaxComment);
  // Line 5: return true | cursor
  fillRect(png, 11, 64, 5, 1, PALETTE.syntaxKeyword);
  setPixel(png, 17, 64, PALETTE.syntaxCursor);

  // RIGHT MONITOR: Terminal & Real-Time Dashboard (23x17 at x=31, y=50)
  fillRect(png, 31, 50, 23, 17, PALETTE.monitorBezel);
  fillRect(png, 32, 51, 21, 15, PALETTE.screenCodeBg);
  // Terminal prompt: $ git commit -m "feat"
  fillRect(png, 34, 53, 3, 1, PALETTE.statusGreen); // $ prompt
  fillRect(png, 38, 53, 12, 1, PALETTE.syntaxCursor);
  // Status checkmarks
  setPixel(png, 34, 56, PALETTE.statusGreen);
  fillRect(png, 36, 56, 9, 1, PALETTE.syntaxComment);
  // Mini live performance bar chart (y=59 to 64)
  fillRect(png, 34, 62, 2, 3, PALETTE.syntaxFunction);
  fillRect(png, 37, 60, 2, 5, PALETTE.syntaxFunction);
  fillRect(png, 40, 58, 2, 7, PALETTE.statusGreen);
  fillRect(png, 43, 61, 2, 4, PALETTE.syntaxKeyword);
  fillRect(png, 46, 59, 2, 6, PALETTE.syntaxFunction);
  fillRect(png, 49, 62, 2, 3, PALETTE.syntaxString);

  // Mechanical Keyboard (16x6 at x=19, y=77)
  fillRect(png, 19, 77, 16, 6, PALETTE.keyboardDark);
  fillRect(png, 19, 77, 16, 1, PALETTE.syntaxFunction); // underglow
  for (let ky = 78; ky < 82; ky += 2) {
    for (let kx = 20; kx < 34; kx += 2) {
      setPixel(png, kx, ky, PALETTE.keyboardKey);
    }
  }

  // Ergonomic Mouse (4x6 at x=39, y=77)
  fillRect(png, 39, 77, 4, 6, PALETTE.mouseBlack);
  setPixel(png, 40, 77, PALETTE.syntaxFunction); // cyan glowing wheel

  // Desktop Tower PC Case (10x16 at x=53, y=70 to 86)
  fillRect(png, 53, 70, 8, 16, PALETTE.pcTowerCase);
  fillRect(png, 54, 71, 6, 14, PALETTE.serverCabinet);
  // Interior RGB strip & cooling fan glow
  fillRect(png, 55, 73, 4, 1, PALETTE.pcRgbLight);
  fillRect(png, 56, 76, 2, 2, PALETTE.syntaxFunction);
  fillRect(png, 55, 80, 4, 1, PALETTE.pcRgbLight);

  // Ceramic Coffee Mug with Rising Pixel Steam (x=46, y=74)
  fillRect(png, 46, 75, 5, 6, PALETTE.mugCeramic);
  fillRect(png, 47, 75, 3, 2, PALETTE.coffeeLiquid);
  setPixel(png, 51, 77, PALETTE.mugCeramic); // handle
  // Rising steam puffs
  setPixel(png, 47, 73, PALETTE.steamWhite);
  setPixel(png, 49, 72, PALETTE.steamWhite);

  // Post-it on desk
  fillRect(png, 4, 75, 5, 5, PALETTE.stickyYellow);
  fillRect(png, 5, 76, 4, 4, PALETTE.stickyYellowDark);

  // --------------------------------------------------
  // OBJECT: Ergonomic Office Swivel Chair (32x32) at [64, 64]
  // Modern mesh high-back office chair with castors and armrests
  // --------------------------------------------------
  // Floor drop shadow
  fillRect(png, 70, 90, 20, 5, PALETTE.floorShadow);

  // Chrome 5-star base & caster wheels (y=87 to 93)
  fillRect(png, 78, 86, 4, 4, PALETTE.chairChrome); // pneumatic cylinder
  fillRect(png, 72, 89, 16, 2, PALETTE.chairChrome); // star leg base
  setPixel(png, 70, 91, PALETTE.chairCaster);
  setPixel(png, 89, 91, PALETTE.chairCaster);
  setPixel(png, 79, 92, PALETTE.chairCaster);

  // Contoured waterfall mesh seat pan (20x8 at x=70, y=78)
  fillGradientV(png, 70, 78, 20, 8, PALETTE.chairMeshLight, PALETTE.chairMesh);
  fillRect(png, 70, 78, 20, 1, PALETTE.chairFrame);

  // High-back breathable mesh lumbar backrest with headrest (18x13 at x=71, y=65)
  fillGradientV(png, 71, 65, 18, 13, PALETTE.chairMesh, PALETTE.chairMeshLight);
  fillRect(png, 71, 65, 18, 1, PALETTE.chairFrame);
  fillRect(png, 71, 65, 1, 13, PALETTE.chairFrame);
  fillRect(png, 88, 65, 1, 13, PALETTE.chairFrame);
  // Headrest pill at top
  fillRect(png, 74, 63, 12, 3, PALETTE.chairFrame);
  fillRect(png, 75, 63, 10, 2, PALETTE.chairMeshLight);

  // 3D Contoured armrests on left and right
  fillRect(png, 67, 72, 3, 8, PALETTE.chairMeshLight);
  fillRect(png, 67, 72, 3, 2, PALETTE.chairFrame);
  fillRect(png, 90, 72, 3, 8, PALETTE.chairMeshLight);
  fillRect(png, 90, 72, 3, 2, PALETTE.chairFrame);

  // --------------------------------------------------
  // OBJECT: Potted Lush Monstera / Ficus Plant (32x48) at [96, 64]
  // Terracotta fluted pot with dark rich soil and lush overlapping leaves
  // --------------------------------------------------
  fillRect(png, 102, 106, 20, 5, PALETTE.floorShadow);

  // Terracotta Pot (18x16 at x=103, y=94)
  fillGradientV(png, 103, 94, 18, 16, PALETTE.potClayLight, PALETTE.potClayDark);
  fillRect(png, 101, 93, 22, 3, PALETTE.potClayLight); // fluted rim
  fillRect(png, 103, 95, 18, 2, PALETTE.woodShadow); // rich soil
  fillRect(png, 105, 108, 14, 2, PALETTE.potClayDark); // saucer base

  // Lush Overlapping Monstera Leaves (y=66 to 93)
  // Large Center Leaf (14x16 at x=105, y=68)
  fillGradientV(png, 105, 68, 14, 15, PALETTE.leafHighlight, PALETTE.leafDark);
  // Characteristic Monstera fenestrations (cutouts)
  setPixel(png, 108, 72, PALETTE.leafShadow);
  setPixel(png, 115, 73, PALETTE.leafShadow);
  setPixel(png, 109, 76, PALETTE.leafShadow);
  setPixel(png, 114, 78, PALETTE.leafShadow);
  setPixel(png, 110, 80, PALETTE.leafShadow);
  // Center main vein
  fillRect(png, 111, 69, 1, 14, PALETTE.leafHighlight);

  // Left Fan Leaf (11x12 at x=98, y=74)
  fillGradientV(png, 98, 74, 11, 12, PALETTE.leafMid, PALETTE.leafShadow);
  fillRect(png, 101, 76, 1, 9, PALETTE.leafHighlight);
  setPixel(png, 103, 77, PALETTE.leafShadow);
  setPixel(png, 104, 80, PALETTE.leafShadow);

  // Right Fan Leaf (12x13 at x=115, y=73)
  fillGradientV(png, 115, 73, 12, 13, PALETTE.leafHighlight, PALETTE.leafDark);
  fillRect(png, 119, 75, 1, 10, PALETTE.leafHighlight);
  setPixel(png, 118, 77, PALETTE.leafShadow);
  setPixel(png, 123, 78, PALETTE.leafShadow);

  // Central Stems down to soil
  fillRect(png, 111, 82, 2, 12, PALETTE.leafDark);
  fillRect(png, 108, 85, 1, 9, PALETTE.leafDark);
  fillRect(png, 114, 85, 1, 9, PALETTE.leafDark);

  // --------------------------------------------------
  // OBJECT: Stainless Steel Water Cooler (32x48) at [128, 64]
  // Transparent inverted blue bottle with bubbles, drip tray, cold/hot taps
  // --------------------------------------------------
  fillRect(png, 134, 106, 20, 5, PALETTE.floorShadow);

  // Lower Dispenser Cabinet (16x22 at x=136, y=88)
  fillGradientV(png, 136, 88, 16, 22, PALETTE.coolerSteelLight, PALETTE.coolerSteelShadow);
  fillRect(png, 136, 88, 1, 22, PALETTE.white); // specular highlight

  // Dispenser Alcove (12x10 at x=138, y=90)
  fillRect(png, 138, 90, 12, 10, PALETTE.serverCabinet);
  // Red Hot Water Tap & Blue Cold Water Tap
  fillRect(png, 140, 91, 2, 3, PALETTE.tapRed);
  fillRect(png, 146, 91, 2, 3, PALETTE.tapBlue);
  // Stainless Steel Drip Tray Grill
  fillRect(png, 138, 98, 12, 2, PALETTE.coolerSteelShadow);
  for (let gx = 139; gx < 149; gx += 2) setPixel(png, gx, 98, PALETTE.black);

  // Inverted Blue Polycarbonate Water Jug (14x16 at x=137, y=70)
  fillRect(png, 137, 70, 14, 16, PALETTE.waterBottleAqua);
  fillRect(png, 139, 68, 10, 3, PALETTE.waterBottleAqua); // neck
  // Bottle curvature highlight & rim
  fillRect(png, 138, 71, 2, 14, PALETTE.waterBottleLight);
  fillRect(png, 139, 70, 10, 1, PALETTE.waterBottleLight);
  // Water bubbles inside bottle
  setPixel(png, 143, 76, PALETTE.white);
  setPixel(png, 144, 75, PALETTE.white);
  setPixel(png, 141, 81, PALETTE.white);

  // --------------------------------------------------
  // OBJECT: Espresso Coffee Machine & Breakroom Counter (32x48) at [160, 64]
  // Counter with espresso machine, steam, cups, pressure gauge
  // --------------------------------------------------
  fillRect(png, 166, 106, 20, 5, PALETTE.floorShadow);

  // Wooden / laminate counter block (24x16 at x=164, y=94)
  fillGradientV(png, 164, 94, 24, 16, PALETTE.counterSurface, PALETTE.counterCabinet);
  fillRect(png, 164, 94, 24, 1, PALETTE.deskBevel);
  // Cabinet door separation & chrome handles
  fillRect(png, 175, 96, 1, 14, PALETTE.woodSeam);
  fillRect(png, 173, 100, 1, 5, PALETTE.chairChrome);
  fillRect(png, 177, 100, 1, 5, PALETTE.chairChrome);

  // Italian Espresso Machine Body (18x18 at x=167, y=76)
  fillGradientV(png, 167, 76, 18, 18, PALETTE.espressoChrome, PALETTE.espressoDark);
  fillRect(png, 167, 76, 18, 1, PALETTE.white);

  // Grouphead & Portafilter handle
  fillRect(png, 173, 85, 6, 2, PALETTE.black);
  fillRect(png, 178, 86, 4, 1, PALETTE.black); // handle

  // Round pressure gauge with red needle
  fillRect(png, 170, 78, 3, 3, PALETTE.white);
  setPixel(png, 171, 79, PALETTE.tapRed);

  // Chrome steam wand & ceramic cup
  fillRect(png, 181, 84, 1, 6, PALETTE.chairChrome);
  fillRect(png, 174, 90, 4, 3, PALETTE.mugCeramic);
  // Rising steam puffs
  setPixel(png, 174, 88, PALETTE.steamWhite);
  setPixel(png, 176, 86, PALETTE.steamWhite);

  // Stack of clean mugs on top warming tray
  fillRect(png, 175, 73, 4, 3, PALETTE.mugCeramic);
  fillRect(png, 180, 73, 4, 3, PALETTE.syntaxKeyword);

  // --------------------------------------------------
  // OBJECT: Modern Tech Dialogue Card Bubble (32x32) at [192, 64]
  // Clean dark slate card with subtle border and status indicator
  // --------------------------------------------------
  fillRect(png, 194, 66, 28, 20, PALETTE.floorShadow);
  fillRect(png, 193, 65, 28, 20, PALETTE.uiDarkBg);
  fillRect(png, 193, 65, 28, 1, PALETTE.uiBorderSlate);
  fillRect(png, 193, 84, 28, 1, PALETTE.uiBorderSlate);
  fillRect(png, 193, 65, 1, 20, PALETTE.uiBorderSlate);
  fillRect(png, 220, 65, 1, 20, PALETTE.uiBorderSlate);

  // Bubble downward pointer
  fillRect(png, 205, 85, 4, 2, PALETTE.uiDarkBg);
  setPixel(png, 206, 87, PALETTE.uiBorderSlate);

  // Mini modern status badge inside bubble
  fillRect(png, 196, 68, 4, 4, PALETTE.statusGreen);
  fillRect(png, 203, 69, 14, 2, PALETTE.white);
  fillRect(png, 196, 75, 21, 2, PALETTE.wallTrimSilver);
  fillRect(png, 196, 79, 16, 2, PALETTE.wallTrimSilver);

  // --------------------------------------------------
  // OBJECT: Modern Pixel Pointer Cursor (16x16) at [224, 64]
  // --------------------------------------------------
  // Crisp dark outline + white fill sleek cursor
  const cursorShape = [
    [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9],
    [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8],
    [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7],
    [3, 3], [3, 4], [3, 5], [3, 6],
    [4, 4], [4, 5], [4, 6], [4, 7], [4, 8],
    [5, 5], [5, 8], [5, 9],
    [6, 6], [6, 9], [6, 10],
  ];
  for (const [cx, cy] of cursorShape) {
    setPixel(png, 225 + cx, 65 + cy, PALETTE.white);
  }
  // Dark crisp border
  fillRect(png, 224, 64, 1, 11, PALETTE.black);
  setPixel(png, 225, 75, PALETTE.black);
  setPixel(png, 226, 74, PALETTE.black);
  setPixel(png, 227, 73, PALETTE.black);
  setPixel(png, 228, 74, PALETTE.black);
  setPixel(png, 229, 76, PALETTE.black);
  setPixel(png, 230, 77, PALETTE.black);

  // --------------------------------------------------
  // OBJECT: Large Conference Table & Meeting Setup (64x48) at [0, 128]
  // Polished meeting table with conference phone mic puck, laptops, notebooks, water glasses
  // --------------------------------------------------
  // Table floor shadow
  fillRect(png, 4, 166, 56, 8, PALETTE.floorShadow);

  // Sleek conference table chrome pedestal legs (y=154 to 170)
  fillRect(png, 10, 154, 6, 14, PALETTE.confLeg);
  fillRect(png, 8, 167, 10, 2, PALETTE.chairChrome);
  fillRect(png, 48, 154, 6, 14, PALETTE.confLeg);
  fillRect(png, 46, 167, 10, 2, PALETTE.chairChrome);

  // Rounded modern conference table top (60x22 at x=2, y=134 to 156)
  fillGradientV(png, 2, 134, 60, 22, PALETTE.confWoodBevel, PALETTE.confWoodTop);
  // Rounded end bevels
  fillRect(png, 2, 134, 60, 1, PALETTE.woodHighlight);
  fillRect(png, 2, 155, 60, 1, PALETTE.woodSeam);

  // Center Conference Spider Microphone Puck (x=29, y=142)
  fillRect(png, 28, 142, 8, 5, PALETTE.micPuck);
  setPixel(png, 31, 144, PALETTE.micPuckGreen); // active conference call LED
  setPixel(png, 32, 144, PALETTE.micPuckGreen);

  // Left Open Laptop (12x8 at x=10, y=138)
  fillRect(png, 10, 138, 12, 8, PALETTE.laptopSilver);
  fillRect(png, 11, 139, 10, 6, PALETTE.screenCodeBg);
  fillRect(png, 12, 141, 4, 3, PALETTE.syntaxFunction); // mini chart on screen
  fillRect(png, 17, 140, 3, 4, PALETTE.statusGreen);

  // Right Open Laptop (12x8 at x=42, y=138)
  fillRect(png, 42, 138, 12, 8, PALETTE.laptopSilver);
  fillRect(png, 43, 139, 10, 6, PALETTE.screenCodeBg);
  fillRect(png, 44, 141, 7, 1, PALETTE.syntaxKeyword);
  fillRect(png, 44, 143, 5, 1, PALETTE.syntaxString);

  // Meeting Notebooks & Water Glasses
  fillRect(png, 23, 144, 4, 5, PALETTE.bookSpineRed); // notebook
  setPixel(png, 24, 143, PALETTE.black); // pen
  fillRect(png, 37, 144, 3, 4, PALETTE.glassWater); // water tumbler
  setPixel(png, 38, 144, PALETTE.white);

  // --------------------------------------------------
  // OBJECT: Modern Conference Meeting Chair (32x32) at [64, 128]
  // Cantilever chrome base with charcoal mesh back
  // --------------------------------------------------
  fillRect(png, 70, 154, 20, 5, PALETTE.floorShadow);
  // Chrome sled base
  fillRect(png, 72, 150, 16, 2, PALETTE.chairChrome);
  fillRect(png, 72, 144, 2, 8, PALETTE.chairChrome);
  fillRect(png, 86, 144, 2, 8, PALETTE.chairChrome);
  // Seat cushion
  fillGradientV(png, 70, 142, 20, 6, PALETTE.chairMeshLight, PALETTE.chairMesh);
  // Mesh backrest
  fillGradientV(png, 72, 132, 16, 10, PALETTE.chairMesh, PALETTE.chairMeshLight);
  fillRect(png, 72, 132, 16, 1, PALETTE.chairFrame);

  // --------------------------------------------------
  // OBJECT: Cozy Breakout Lounge Sofa (48x32) at [96, 128]
  // Modern startup breakout couch with deep teal fabric and wooden peg legs
  // --------------------------------------------------
  fillRect(png, 98, 154, 44, 5, PALETTE.floorShadow);
  // Wooden angled peg legs
  fillRect(png, 100, 151, 3, 5, PALETTE.woodDark);
  fillRect(png, 137, 151, 3, 5, PALETTE.woodDark);

  // Sofa Base & Seat Cushions (44x12 at x=98, y=142)
  const sofaTealLight: RGBA = [30, 95, 110, 255];
  const sofaTealMid: RGBA = [20, 75, 88, 255];
  const sofaTealDark: RGBA = [14, 55, 65, 255];
  fillGradientV(png, 98, 142, 44, 10, sofaTealLight, sofaTealMid);
  fillRect(png, 119, 142, 1, 10, sofaTealDark); // cushion split

  // Sofa Backrest & Padded Armrests
  fillGradientV(png, 98, 132, 44, 10, sofaTealMid, sofaTealDark);
  fillRect(png, 98, 132, 44, 1, sofaTealLight);
  // Left & Right Armrests
  fillRect(png, 96, 136, 4, 12, sofaTealLight);
  fillRect(png, 140, 136, 4, 12, sofaTealLight);

  // Throw Pillow (Coral/Yellow accent)
  fillRect(png, 101, 137, 7, 7, PALETTE.stickyYellow);
  fillRect(png, 102, 138, 5, 5, PALETTE.stickyYellowDark);

  // --------------------------------------------------
  // OBJECT: Low Coffee / Breakout Table (32x32) at [144, 128]
  // --------------------------------------------------
  fillRect(png, 148, 154, 24, 4, PALETTE.floorShadow);
  // Wooden legs
  fillRect(png, 150, 148, 2, 6, PALETTE.woodDark);
  fillRect(png, 168, 148, 2, 6, PALETTE.woodDark);
  // Table top surface (24x8 at x=148, y=142)
  fillGradientV(png, 148, 142, 24, 7, PALETTE.deskOakLight, PALETTE.deskOakMid);
  fillRect(png, 148, 142, 24, 1, PALETTE.woodHighlight);
  // Tech magazine & mini coffee mug
  fillRect(png, 152, 143, 6, 4, PALETTE.syntaxKeyword);
  fillRect(png, 162, 143, 3, 3, PALETTE.mugCeramic);

  return png;
}

// ====================================================
// 2. GENERATE HIGH-QUALITY MODERN TECH CHARACTER SPRITESHEETS (128x384)
// (Pi, Claude, Codex, Gemini - 4 frames x 8 rows, 32x48 per frame)
// ====================================================
export interface TechAgentTheme {
  name: string;
  hoodieColor: RGBA;
  hoodieLight: RGBA;
  hoodieDark: RGBA;
  pantsColor: RGBA;
  shoesColor: RGBA;
  hairColor: RGBA;
  hairHighlight: RGBA;
  skinColor: RGBA;
  skinShadow: RGBA;
  brandAccent: RGBA;
  hasGlasses?: boolean;
  hasHeadset?: boolean;
  hasEarbuds?: boolean;
  chestLogo?: 'pi' | 'c' | 'code' | 'gemini';
}

function drawDeveloperFrame(
  png: PNG,
  frame: number,
  row: number,
  theme: TechAgentTheme,
  action: 'idle' | 'walk' | 'type' | 'think' | 'celebrate',
  dir: 'down' | 'up' | 'side'
) {
  const ox = frame * 32;
  const oy = row * 48;

  // Natural breathing bob / walk stride bounce
  const idleBob = (action === 'idle' || action === 'type') && frame % 2 === 1 ? 1 : 0;
  const walkBob = action === 'walk' ? (frame % 2 === 1 ? -1 : 1) : 0;
  const yOffset = idleBob + walkBob;

  // Drop shadow beneath sneakers
  fillRect(png, ox + 8, oy + 44, 16, 3, PALETTE.floorShadow);

  // 1. PANTS & SNEAKERS (y=34 to 45)
  const leftLegOffset = action === 'walk' && (frame === 1 || frame === 3) ? -2 : 0;
  const rightLegOffset = action === 'walk' && (frame === 0 || frame === 2) ? -2 : 0;

  if (dir === 'side') {
    // Side profile legs & sneakers
    fillRect(png, ox + 12, oy + 34, 7, 8, theme.pantsColor);
    fillRect(png, ox + 11, oy + 42, 9, 3, theme.shoesColor);
    fillRect(png, ox + 11, oy + 44, 9, 1, PALETTE.white); // sneaker sole
  } else {
    // Left leg
    fillRect(png, ox + 10, oy + 34, 5, 8 + leftLegOffset, theme.pantsColor);
    fillRect(png, ox + 9, oy + 42 + leftLegOffset, 6, 3, theme.shoesColor);
    fillRect(png, ox + 9, oy + 44 + leftLegOffset, 6, 1, PALETTE.white);
    // Right leg
    fillRect(png, ox + 17, oy + 34, 5, 8 + rightLegOffset, theme.pantsColor);
    fillRect(png, ox + 17, oy + 42 + rightLegOffset, 6, 3, theme.shoesColor);
    fillRect(png, ox + 17, oy + 44 + rightLegOffset, 6, 1, PALETTE.white);
  }

  // 2. TORSO / HOODIE / SWEATER (y=20 to 34)
  const torsoY = oy + 20 + yOffset;
  fillRect(png, ox + 9, torsoY, 14, 14, theme.hoodieColor);
  fillRect(png, ox + 9, torsoY + 12, 14, 2, theme.hoodieDark); // waistband
  fillRect(png, ox + 9, torsoY, 14, 1, theme.hoodieLight); // shoulder highlight

  // Brand Chest Emblem or Hoodie Drawstring (Front View)
  if (dir === 'down') {
    if (theme.chestLogo === 'pi') {
      // Elegant Pi 'π' chest badge
      fillRect(png, ox + 14, torsoY + 4, 4, 1, theme.brandAccent);
      fillRect(png, ox + 14, torsoY + 5, 1, 3, theme.brandAccent);
      fillRect(png, ox + 17, torsoY + 5, 1, 3, theme.brandAccent);
    } else if (theme.chestLogo === 'c') {
      // Anthropic Claude 'C' / chevron
      fillRect(png, ox + 14, torsoY + 4, 4, 1, theme.brandAccent);
      fillRect(png, ox + 14, torsoY + 5, 1, 2, theme.brandAccent);
      fillRect(png, ox + 14, torsoY + 7, 4, 1, theme.brandAccent);
    } else if (theme.chestLogo === 'code') {
      // OpenAI Codex code brackets '<>'
      setPixel(png, ox + 14, torsoY + 5, theme.brandAccent);
      setPixel(png, ox + 17, torsoY + 5, theme.brandAccent);
    } else if (theme.chestLogo === 'gemini') {
      // Gemini sparkle star diamond
      fillRect(png, ox + 15, torsoY + 4, 2, 3, theme.brandAccent);
      fillRect(png, ox + 14, torsoY + 5, 4, 1, theme.brandAccent);
    } else {
      // Subtle hoodie drawstring lines
      fillRect(png, ox + 14, torsoY + 2, 1, 4, PALETTE.white);
      fillRect(png, ox + 17, torsoY + 2, 1, 4, PALETTE.white);
    }
  }

  // 3. HEAD, FACE, GLASSES & STYLISH HAIR (y=6 to 20)
  const headY = oy + 6 + yOffset;

  if (dir === 'down') {
    // Face skin
    fillRect(png, ox + 10, headY + 5, 12, 10, theme.skinColor);
    fillRect(png, ox + 11, headY + 13, 10, 2, theme.skinShadow); // neck shadow

    // Expressive Eyes with Pupils and Specular Highlights
    if (action === 'celebrate') {
      // Happy curved anime eyes (^_^)
      fillRect(png, ox + 12, headY + 7, 3, 1, PALETTE.black);
      fillRect(png, ox + 17, headY + 7, 3, 1, PALETTE.black);
      setPixel(png, ox + 11, headY + 8, PALETTE.black);
      setPixel(png, ox + 14, headY + 8, PALETTE.black);
      setPixel(png, ox + 16, headY + 8, PALETTE.black);
      setPixel(png, ox + 19, headY + 8, PALETTE.black);
    } else if (action === 'think') {
      // Thinking / looking up quizzical eyes
      fillRect(png, ox + 12, headY + 6, 3, 3, PALETTE.white);
      fillRect(png, ox + 17, headY + 6, 3, 3, PALETTE.white);
      setPixel(png, ox + 13, headY + 6, PALETTE.black);
      setPixel(png, ox + 18, headY + 6, PALETTE.black);
      // One raised eyebrow
      fillRect(png, ox + 12, headY + 5, 3, 1, theme.hairColor);
      fillRect(png, ox + 17, headY + 4, 3, 1, theme.hairColor);
    } else {
      // Focused eyes
      fillRect(png, ox + 12, headY + 8, 3, 2, PALETTE.white);
      fillRect(png, ox + 17, headY + 8, 3, 2, PALETTE.white);
      setPixel(png, ox + 13, headY + 8, PALETTE.black);
      setPixel(png, ox + 18, headY + 8, PALETTE.black);
      setPixel(png, ox + 12, headY + 8, PALETTE.white); // specular shine
      setPixel(png, ox + 17, headY + 8, PALETTE.white);
      // Eyebrows
      fillRect(png, ox + 12, headY + 6, 3, 1, theme.hairColor);
      fillRect(png, ox + 17, headY + 6, 3, 1, theme.hairColor);
    }

    // Modern Stylish Glasses
    if (theme.hasGlasses) {
      fillRect(png, ox + 11, headY + 7, 4, 3, PALETTE.black);
      fillRect(png, ox + 17, headY + 7, 4, 3, PALETTE.black);
      fillRect(png, ox + 15, headY + 8, 2, 1, PALETTE.black); // bridge
      // Subtle glass glare glint
      setPixel(png, ox + 12, headY + 7, PALETTE.windowGlassGlare);
      setPixel(png, ox + 18, headY + 7, PALETTE.windowGlassGlare);
    }

    // Cheerful blush & subtle smile
    setPixel(png, ox + 11, headY + 11, [248, 165, 150, 255]);
    setPixel(png, ox + 20, headY + 11, [248, 165, 150, 255]);
    fillRect(png, ox + 14, headY + 12, 4, 1, theme.skinShadow);

    // Layered Textured Hair
    fillRect(png, ox + 9, headY, 14, 6, theme.hairColor);
    fillRect(png, ox + 10, headY - 1, 12, 2, theme.hairHighlight);
    fillRect(png, ox + 8, headY + 2, 2, 6, theme.hairColor); // left fringe
    fillRect(png, ox + 22, headY + 2, 2, 6, theme.hairColor); // right fringe
    // Front bangs styling
    fillRect(png, ox + 11, headY + 4, 2, 2, theme.hairColor);
    fillRect(png, ox + 15, headY + 4, 3, 2, theme.hairColor);
  } else if (dir === 'up') {
    // Back of head - full hair volume and hoodie collar
    fillRect(png, ox + 9, headY, 14, 14, theme.hairColor);
    fillRect(png, ox + 10, headY - 1, 12, 3, theme.hairHighlight);
    fillRect(png, ox + 8, headY + 3, 2, 10, theme.hairColor);
    fillRect(png, ox + 22, headY + 3, 2, 10, theme.hairColor);
    fillRect(png, ox + 10, headY + 13, 12, 2, theme.hoodieDark); // back collar
  } else {
    // Side profile
    fillRect(png, ox + 10, headY, 12, 6, theme.hairColor);
    fillRect(png, ox + 14, headY + 5, 8, 9, theme.skinColor);
    setPixel(png, ox + 18, headY + 8, PALETTE.black); // eye
    if (theme.hasGlasses) {
      fillRect(png, ox + 16, headY + 7, 4, 2, PALETTE.black);
      setPixel(png, ox + 17, headY + 7, PALETTE.white);
    }
    fillRect(png, ox + 9, headY + 2, 4, 10, theme.hairColor);
  }

  // 4. TECH ACCESSORIES (Headsets, Earbuds)
  if (theme.hasHeadset) {
    // Over-ear developer headset with boom mic
    fillRect(png, ox + 8, headY + 6, 2, 6, PALETTE.serverCabinet);
    fillRect(png, ox + 22, headY + 6, 2, 6, PALETTE.serverCabinet);
    setPixel(png, ox + 8, headY + 8, theme.brandAccent); // status LED
    setPixel(png, ox + 23, headY + 8, theme.brandAccent);
    if (dir === 'down' || dir === 'side') {
      // Boom mic extending toward mouth
      fillRect(png, ox + 10, headY + 11, 3, 1, PALETTE.serverCabinet);
      setPixel(png, ox + 13, headY + 11, theme.brandAccent);
    }
  } else if (theme.hasEarbuds) {
    // Modern wireless earbuds
    setPixel(png, ox + 9, headY + 9, PALETTE.white);
    setPixel(png, ox + 22, headY + 9, PALETTE.white);
    setPixel(png, ox + 9, headY + 8, theme.brandAccent);
  }

  // 5. ARMS, HANDS & ACTION ANIMATIONS
  if (action === 'type') {
    // Rapid typing at mechanical keyboard
    const handLeftY = frame % 2 === 0 ? -1 : 1;
    const handRightY = frame % 2 === 0 ? 1 : -1;
    // Left arm & hand
    fillRect(png, ox + 6, torsoY + 2, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 6, torsoY + 9 + handLeftY, 4, 3, theme.skinColor);
    // Right arm & hand
    fillRect(png, ox + 23, torsoY + 2, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 22, torsoY + 9 + handRightY, 4, 3, theme.skinColor);
  } else if (action === 'think') {
    // Reading documentation / thinking pose:
    // Left hand holds tech tablet / notebook
    fillRect(png, ox + 5, torsoY + 2, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 4, torsoY + 7, 5, 6, PALETTE.laptopSilver); // tablet
    fillRect(png, ox + 5, torsoY + 8, 3, 4, PALETTE.screenCodeBg);
    // Right hand scratching head / tapping chin
    fillRect(png, ox + 23, torsoY - 1, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 21, headY + 8, 4, 3, theme.skinColor);
    // Thinking sparkle / lightbulb dot on frame 2 & 3
    if (frame >= 2) {
      setPixel(png, ox + 25, headY - 2, PALETTE.stickyYellow);
      setPixel(png, ox + 26, headY - 3, PALETTE.stickyYellow);
    }
  } else if (action === 'celebrate') {
    // Arms raised in celebration / double thumbs-up!
    fillRect(png, ox + 5, torsoY - 6, 3, 10, theme.hoodieColor);
    fillRect(png, ox + 24, torsoY - 6, 3, 10, theme.hoodieColor);
    fillRect(png, ox + 4, torsoY - 9, 4, 4, theme.skinColor);
    fillRect(png, ox + 24, torsoY - 9, 4, 4, theme.skinColor);
    // Golden accomplishment stars around hands
    setPixel(png, ox + 2, torsoY - 10, PALETTE.statusAmber);
    setPixel(png, ox + 28, torsoY - 10, PALETTE.statusAmber);
    setPixel(png, ox + 16, headY - 4, PALETTE.statusGreen);
  } else {
    // Standard resting / walking arms with natural counter-swing
    const armSwing = action === 'walk' ? (frame % 2 === 0 ? 2 : -2) : 0;
    fillRect(png, ox + 6, torsoY + 2 + armSwing, 3, 8, theme.hoodieColor);
    fillRect(png, ox + 6, torsoY + 10 + armSwing, 3, 3, theme.skinColor);
    fillRect(png, ox + 23, torsoY + 2 - armSwing, 3, 8, theme.hoodieColor);
    fillRect(png, ox + 23, torsoY + 10 - armSwing, 3, 3, theme.skinColor);
  }
}

export function generateTechDeveloperSpritesheet(theme: TechAgentTheme): PNG {
  const png = createPNG(128, 384); // 4 frames wide x 8 rows high

  // Row 0: Idle Down (Breathing / subtle blinking)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 0, theme, 'idle', 'down');
  // Row 1: Idle Up / Sitting (Back view facing workstation desk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 1, theme, 'idle', 'up');
  // Row 2: Walk Down (Smooth 4-frame forward walk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 2, theme, 'walk', 'down');
  // Row 3: Walk Up (Smooth 4-frame backward walk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 3, theme, 'walk', 'up');
  // Row 4: Walk Side (Smooth 4-frame profile walk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 4, theme, 'walk', 'side');
  // Row 5: Typing on Keyboard (Working at workstation desk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 5, theme, 'type', 'up');
  // Row 6: Reading / Thinking (Reviewing PR / documentation / lightbulb)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 6, theme, 'think', 'down');
  // Row 7: Done / Celebratory (Thumbs up / triumph / sparkle celebration)
  for (let f = 0; f < 4; f++) drawDeveloperFrame(png, f, 7, theme, 'celebrate', 'down');

  return png;
}

// ====================================================
// 3. MAIN ASSET PIPELINE EXECUTION
// ====================================================
const clientAssets = path.resolve(process.cwd(), 'client/public/assets');
console.log('Generating 2D Pixel Art Modern Tech Office assets in:', clientAssets);

// 1. Generate Modern Office Tileset
const tileset = generateModernOfficeTileset();
savePNG(tileset, path.join(clientAssets, 'tiles/office_tiles.png'));

// 2. Generate Modern Tech Developer Character Spritesheets
const agentThemes: Record<string, TechAgentTheme> = {
  // Pi Agent: Minimalist powerhouse, dark slate hoodie with emerald green accent, headset with mic
  pi: {
    name: 'Pi',
    hoodieColor: [36, 40, 48, 255],
    hoodieLight: [52, 58, 70, 255],
    hoodieDark: [24, 26, 32, 255],
    pantsColor: [28, 32, 40, 255],
    shoesColor: [240, 244, 248, 255],
    hairColor: [46, 36, 28, 255],
    hairHighlight: [78, 58, 44, 255],
    skinColor: [255, 226, 202, 255],
    skinShadow: [218, 164, 134, 255],
    brandAccent: [34, 197, 94, 255], // Emerald green
    hasHeadset: true,
    chestLogo: 'pi',
  },

  // Claude Agent: Warm terracotta/coral sweater, round stylish glasses, neatly parted auburn hair
  claude: {
    name: 'Claude',
    hoodieColor: [217, 83, 30, 255], // Warm terracotta
    hoodieLight: [244, 114, 62, 255],
    hoodieDark: [168, 58, 18, 255],
    pantsColor: [72, 64, 54, 255], // Khaki chinos
    shoesColor: [88, 52, 28, 255], // Leather shoes
    hairColor: [64, 36, 24, 255],
    hairHighlight: [118, 68, 38, 255],
    skinColor: [255, 228, 204, 255],
    skinShadow: [220, 168, 138, 255],
    brandAccent: [250, 204, 21, 255], // Warm gold
    hasGlasses: true,
    chestLogo: 'c',
  },

  // Codex Agent: Royal cobalt blue jacket, studio over-ear headphones, blonde hair
  codex: {
    name: 'Codex',
    hoodieColor: [30, 78, 200, 255], // Cobalt blue
    hoodieLight: [59, 130, 246, 255],
    hoodieDark: [22, 58, 150, 255],
    pantsColor: [24, 28, 36, 255],
    shoesColor: [44, 64, 98, 255],
    hairColor: [232, 190, 80, 255], // Blonde
    hairHighlight: [254, 230, 136, 255],
    skinColor: [255, 230, 208, 255],
    skinShadow: [222, 170, 140, 255],
    brandAccent: [34, 211, 238, 255], // Cyan
    hasHeadset: true,
    chestLogo: 'code',
  },

  // Gemini Agent: Modern lilac/electric violet pullover, wireless earbuds, smart glasses
  gemini: {
    name: 'Gemini',
    hoodieColor: [124, 58, 237, 255], // Deep violet
    hoodieLight: [167, 139, 250, 255],
    hoodieDark: [91, 33, 182, 255],
    pantsColor: [22, 28, 48, 255], // Navy joggers
    shoesColor: [225, 215, 245, 255],
    hairColor: [28, 24, 34, 255],
    hairHighlight: [68, 46, 92, 255],
    skinColor: [248, 214, 182, 255],
    skinShadow: [214, 158, 126, 255],
    brandAccent: [56, 189, 248, 255], // Electric cyan
    hasGlasses: true,
    hasEarbuds: true,
    chestLogo: 'gemini',
  },
};

for (const [name, theme] of Object.entries(agentThemes)) {
  const charSheet = generateTechDeveloperSpritesheet(theme);
  savePNG(charSheet, path.join(clientAssets, `characters/character_${name}.png`));
}

// 3. Asset Manifest JSON
const manifest = {
  name: 'herdr-office-pixel-art',
  version: '4.0.0',
  tileSize: 32,
  tileset: {
    path: '/assets/tiles/office_tiles.png',
    width: 256,
    height: 256,
    tiles: {
      // Floors
      floor_wood: { x: 0, y: 0, w: 32, h: 32 },
      floor_carpet: { x: 32, y: 0, w: 32, h: 32 },
      floor_tile: { x: 64, y: 0, w: 32, h: 32 },
      floor_stone: { x: 64, y: 0, w: 32, h: 32 }, // alias for breakroom tile
      // Walls
      wall_top: { x: 96, y: 0, w: 32, h: 48 },
      wall_window: { x: 128, y: 0, w: 32, h: 48 },
      wall_whiteboard: { x: 160, y: 0, w: 32, h: 48 },
      wall_server: { x: 192, y: 0, w: 32, h: 48 },
      wall_bookshelf: { x: 224, y: 0, w: 32, h: 48 },
      // Furniture & Workstations
      desk: { x: 0, y: 64, w: 64, h: 48 },
      chair: { x: 64, y: 64, w: 32, h: 32 },
      plant: { x: 96, y: 64, w: 32, h: 48 },
      water_cooler: { x: 128, y: 64, w: 32, h: 48 },
      espresso_bar: { x: 160, y: 64, w: 32, h: 48 },
      coffee_bar: { x: 160, y: 64, w: 32, h: 48 },
      // Meeting & Lounge
      conference_table: { x: 0, y: 128, w: 64, h: 48 },
      conference_chair: { x: 64, y: 128, w: 32, h: 32 },
      lounge_sofa: { x: 96, y: 128, w: 48, h: 32 },
      coffee_table: { x: 144, y: 128, w: 32, h: 32 },
      // UI Elements
      office_dialog: { x: 192, y: 64, w: 32, h: 32 },
      cursor_hand: { x: 224, y: 64, w: 16, h: 16 },
      cursor_pointer: { x: 224, y: 64, w: 16, h: 16 },
    },
  },
  characters: {
    frameWidth: 32,
    frameHeight: 48,
    variants: {
      pi: '/assets/characters/character_pi.png',
      claude: '/assets/characters/character_claude.png',
      codex: '/assets/characters/character_codex.png',
      gemini: '/assets/characters/character_gemini.png',
      default: '/assets/characters/character_pi.png',
    },
    animations: {
      idle_down: { row: 0, frames: [0, 1, 2, 3], frameRate: 3 },
      idle_up: { row: 1, frames: [0, 1, 2, 3], frameRate: 3 },
      sitting: { row: 1, frames: [0, 1, 2, 3], frameRate: 3 },
      walk_down: { row: 2, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_up: { row: 3, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_side: { row: 4, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_left: { row: 4, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_right: { row: 4, frames: [0, 1, 2, 3], frameRate: 6 },
      type_up: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      typing: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      working: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      thinking: { row: 6, frames: [0, 1, 2, 3], frameRate: 4 },
      reading: { row: 6, frames: [0, 1, 2, 3], frameRate: 4 },
      alert: { row: 6, frames: [0, 1, 2, 3], frameRate: 4 },
      done: { row: 7, frames: [0, 1, 2, 3], frameRate: 4 },
      celebrate: { row: 7, frames: [0, 1, 2, 3], frameRate: 4 },
    },
  },
};

fs.writeFileSync(
  path.join(clientAssets, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('Saved pixel art asset manifest:', path.join(clientAssets, 'manifest.json'));

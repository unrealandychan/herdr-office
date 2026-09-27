import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

// ====================================================
// 32-BIT HIGH-RES RETRO COLOR PALETTE
// ====================================================
type RGBA = [number, number, number, number];

const PALETTE = {
  transparent: [0, 0, 0, 0] as RGBA,

  // Warm Parquet Hardwood Floor
  woodHighlight: [224, 175, 126, 255] as RGBA,
  woodLight: [205, 153, 105, 255] as RGBA,
  woodMid: [180, 128, 80, 255] as RGBA,
  woodDark: [148, 98, 55, 255] as RGBA,
  woodShadow: [115, 72, 38, 255] as RGBA,
  woodSeam: [88, 52, 26, 255] as RGBA,

  // Tech Executive Woven Carpet
  carpetHighlight: [92, 108, 128, 255] as RGBA,
  carpetLight: [76, 90, 108, 255] as RGBA,
  carpetMid: [62, 74, 92, 255] as RGBA,
  carpetDark: [48, 58, 74, 255] as RGBA,
  carpetShadow: [36, 44, 58, 255] as RGBA,

  // Polished Calacatta / Slate Breakroom Tile
  tileGleam: [248, 250, 252, 255] as RGBA,
  tileLight: [226, 232, 240, 255] as RGBA,
  tileMid: [195, 203, 217, 255] as RGBA,
  tileDark: [148, 163, 184, 255] as RGBA,
  tileGrout: [100, 116, 139, 255] as RGBA,

  // High-Ceiling Office Acoustic & Wainscot Wall
  crownMoldingLight: [145, 158, 178, 255] as RGBA,
  crownMoldingDark: [100, 112, 132, 255] as RGBA,
  wallFaceTop: [75, 85, 105, 255] as RGBA,
  wallFaceMid: [58, 66, 84, 255] as RGBA,
  wallFaceDark: [44, 52, 68, 255] as RGBA,
  wallSlatLine: [35, 42, 56, 255] as RGBA,
  wallBrassTrim: [212, 175, 95, 255] as RGBA,
  baseboardDark: [82, 52, 32, 255] as RGBA,
  baseboardShadow: [40, 24, 14, 255] as RGBA,

  // Skyline Window
  windowFrameOuter: [30, 36, 48, 255] as RGBA,
  windowFrameInner: [45, 54, 72, 255] as RGBA,
  skyDuskTop: [26, 16, 60, 255] as RGBA,
  skyDuskMid: [58, 28, 92, 255] as RGBA,
  skyDuskBottom: [112, 48, 100, 255] as RGBA,
  skyHorizon: [217, 119, 87, 255] as RGBA,
  skyBuildingDark: [18, 14, 38, 255] as RGBA,
  skyBuildingLit: [254, 240, 138, 255] as RGBA,
  skyWindowCyan: [103, 232, 249, 255] as RGBA,
  windowGlassGlare: [255, 255, 255, 60] as RGBA,

  // Executive Walnut Desk
  deskTopLight: [175, 125, 85, 255] as RGBA,
  deskTopMid: [145, 100, 65, 255] as RGBA,
  deskTopDark: [118, 78, 48, 255] as RGBA,
  deskBevelHighlight: [210, 160, 115, 255] as RGBA,
  deskFrontFace: [95, 62, 38, 255] as RGBA,
  deskLegSteel: [45, 50, 60, 255] as RGBA,
  deskLegHighlight: [75, 82, 98, 255] as RGBA,
  deskShadow: [20, 20, 28, 140] as RGBA,

  // Dual Ultra-Wide Monitors & Tech
  bezelDark: [22, 24, 30, 255] as RGBA,
  bezelSilver: [110, 118, 132, 255] as RGBA,
  screenBg: [13, 17, 23, 255] as RGBA,
  ideKeyword: [192, 132, 252, 255] as RGBA, // purple
  ideFunction: [56, 189, 248, 255] as RGBA, // cyan
  ideString: [250, 204, 21, 255] as RGBA,  // yellow
  ideComment: [74, 222, 128, 255] as RGBA, // green
  ideCursor: [244, 244, 245, 255] as RGBA,
  termGreen: [52, 211, 153, 255] as RGBA,
  rgbLedCyan: [34, 211, 238, 255] as RGBA,
  rgbLedMagenta: [244, 63, 94, 255] as RGBA,

  // Ergonomic Mesh Chair
  meshBlack: [24, 26, 32, 255] as RGBA,
  meshCharcoal: [42, 46, 56, 255] as RGBA,
  chairFrame: [65, 72, 86, 255] as RGBA,
  chairChrome: [165, 175, 192, 255] as RGBA,
  casterBlack: [18, 18, 22, 255] as RGBA,

  // Plants & Foliage
  potClayLight: [210, 115, 75, 255] as RGBA,
  potClayMid: [180, 85, 50, 255] as RGBA,
  potClayDark: [140, 60, 35, 255] as RGBA,
  leafHighlight: [134, 239, 110, 255] as RGBA,
  leafMid: [74, 182, 68, 255] as RGBA,
  leafDark: [35, 122, 38, 255] as RGBA,
  leafShadow: [18, 70, 24, 255] as RGBA,

  // Breakroom Props
  coolerBaseSteel: [190, 198, 210, 255] as RGBA,
  coolerSteelShadow: [140, 150, 165, 255] as RGBA,
  waterBottleAqua: [56, 189, 248, 180] as RGBA,
  waterBottleLight: [186, 230, 253, 220] as RGBA,
  waterTapRed: [239, 68, 68, 255] as RGBA,
  waterTapBlue: [59, 130, 246, 255] as RGBA,

  espressoChrome: [215, 222, 232, 255] as RGBA,
  espressoDark: [70, 78, 90, 255] as RGBA,
  coffeeBrown: [110, 60, 30, 255] as RGBA,

  // Speech & Status Badges
  bubbleBg: [255, 255, 255, 255] as RGBA,
  bubbleBorder: [24, 24, 27, 255] as RGBA,
  bubbleShadow: [0, 0, 0, 120] as RGBA,
  alertRed: [239, 68, 68, 255] as RGBA,
  doneGreen: [16, 185, 129, 255] as RGBA,
  amberWarm: [245, 158, 11, 255] as RGBA,
  white: [255, 255, 255, 255] as RGBA,
  black: [0, 0, 0, 255] as RGBA,

  // Character Tones
  skinPale: [255, 228, 200, 255] as RGBA,
  skinMid: [245, 195, 160, 255] as RGBA,
  skinShadow: [215, 155, 120, 255] as RGBA,
  skinBlush: [248, 165, 150, 255] as RGBA,

  piGreenLight: [74, 222, 128, 255] as RGBA,
  piGreen: [34, 197, 94, 255] as RGBA,
  piGreenDark: [21, 128, 61, 255] as RGBA,

  claudeOrangeLight: [251, 146, 60, 255] as RGBA,
  claudeOrange: [234, 88, 12, 255] as RGBA,
  claudeOrangeDark: [154, 52, 18, 255] as RGBA,

  codexBlueLight: [96, 165, 250, 255] as RGBA,
  codexBlue: [37, 99, 235, 255] as RGBA,
  codexBlueDark: [29, 78, 216, 255] as RGBA,
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
  console.log(`Saved art asset: ${filePath} (${png.width}x${png.height})`);
}

// ====================================================
// 1. GENERATE 32-BIT RETRO OFFICE TILESET (256x256)
// ====================================================
export function generateOfficeTileset(): PNG {
  const png = createPNG(256, 256);

  // --------------------------------------------------
  // TILE: Parquet Hardwood Floor (32x32) at [0, 0]
  // --------------------------------------------------
  fillRect(png, 0, 0, 32, 32, PALETTE.woodMid);
  // Alternating parquet planks (4 horizontal planks, 8px high each)
  for (let p = 0; p < 4; p++) {
    const py = p * 8;
    const isAlt = p % 2 === 1;
    // Plank horizontal divider shadow & highlight
    fillRect(png, 0, py + 7, 32, 1, PALETTE.woodSeam);
    fillRect(png, 0, py, 32, 1, PALETTE.woodHighlight);

    // Vertical seam divider
    const vx1 = isAlt ? 10 : 16;
    const vx2 = isAlt ? 24 : 31;
    fillRect(png, vx1, py, 1, 7, PALETTE.woodSeam);
    fillRect(png, vx2, py, 1, 7, PALETTE.woodSeam);

    // Subtle natural wood grain lines
    for (let x = 0; x < 32; x++) {
      if ((x + p * 5) % 4 === 0) setPixel(png, x, py + 2, PALETTE.woodLight);
      if ((x * 2 + p * 7) % 7 === 0) setPixel(png, x, py + 4, PALETTE.woodDark);
      if ((x * 3 + p * 3) % 9 === 0) setPixel(png, x, py + 5, PALETTE.woodLight);
    }
  }

  // --------------------------------------------------
  // TILE: Executive Woven Carpet (32x32) at [32, 0]
  // --------------------------------------------------
  fillRect(png, 32, 0, 32, 32, PALETTE.carpetMid);
  // High-density fine woven micro-texture
  for (let y = 0; y < 32; y++) {
    for (let x = 32; x < 64; x++) {
      const pattern = (x + y) % 4;
      if (pattern === 0) setPixel(png, x, y, PALETTE.carpetHighlight);
      else if (pattern === 2) setPixel(png, x, y, PALETTE.carpetDark);
      // Subtle weave grid every 8px
      if ((x - 32) % 8 === 0 || y % 8 === 0) {
        setPixel(png, x, y, PALETTE.carpetShadow);
      }
    }
  }

  // --------------------------------------------------
  // TILE: Breakroom Slate / Marble Tile (32x32) at [64, 0]
  // --------------------------------------------------
  // 4 large square tiles (16x16 each)
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const bx = 64 + tx * 16;
      const by = ty * 16;
      const isAlt = (tx + ty) % 2 === 0;
      fillRect(png, bx, by, 16, 16, isAlt ? PALETTE.tileLight : PALETTE.tileMid);
      // Specular highlight gleam on top/left
      fillRect(png, bx + 1, by + 1, 14, 1, PALETTE.tileGleam);
      fillRect(png, bx + 1, by + 1, 1, 14, PALETTE.tileGleam);
      // Bevel shadow on bottom/right
      fillRect(png, bx, by + 15, 16, 1, PALETTE.tileDark);
      fillRect(png, bx + 15, by, 1, 16, PALETTE.tileDark);
      // Grout line
      fillRect(png, bx, by + 15, 16, 1, PALETTE.tileGrout);
      fillRect(png, bx + 15, by, 1, 16, PALETTE.tileGrout);
      // Subtle marble vein
      setPixel(png, bx + 4, by + 6, PALETTE.tileDark);
      setPixel(png, bx + 5, by + 7, PALETTE.tileDark);
      setPixel(png, bx + 6, by + 8, PALETTE.tileDark);
    }
  }

  // --------------------------------------------------
  // TILE: High-Ceiling Office Acoustic Wall (32x48) at [96, 0]
  // --------------------------------------------------
  // Crown molding at top (8px)
  fillRect(png, 96, 0, 32, 2, PALETTE.crownMoldingLight);
  fillRect(png, 96, 2, 32, 4, PALETTE.crownMoldingDark);
  fillRect(png, 96, 6, 32, 2, PALETTE.wallBrassTrim);

  // Acoustic slat wall face (32px high: y=8 to 40)
  fillGradientV(png, 96, 8, 32, 32, PALETTE.wallFaceTop, PALETTE.wallFaceDark);
  // Elegant vertical acoustic wood slats every 4px
  for (let sx = 96; sx < 128; sx += 4) {
    fillRect(png, sx, 8, 1, 32, PALETTE.wallSlatLine);
    fillRect(png, sx + 1, 8, 1, 32, PALETTE.crownMoldingLight);
  }

  // Brass wainscot rail & mahogany baseboard (8px: y=40 to 48)
  fillRect(png, 96, 40, 32, 2, PALETTE.wallBrassTrim);
  fillRect(png, 96, 42, 32, 5, PALETTE.baseboardDark);
  fillRect(png, 96, 47, 32, 1, PALETTE.baseboardShadow);

  // --------------------------------------------------
  // TILE: Panoramic Skyline Window (32x48) at [128, 0]
  // --------------------------------------------------
  // Outer wall frame
  fillRect(png, 128, 0, 32, 8, PALETTE.crownMoldingDark);
  fillRect(png, 128, 40, 32, 8, PALETTE.baseboardDark);
  fillRect(png, 128, 8, 2, 32, PALETTE.windowFrameOuter);
  fillRect(png, 158, 8, 2, 32, PALETTE.windowFrameOuter);

  // Glass backdrop: twilight dusk gradient (28x32: x=130, y=8)
  fillGradientV(png, 130, 8, 28, 14, PALETTE.skyDuskTop, PALETTE.skyDuskMid);
  fillGradientV(png, 130, 22, 28, 18, PALETTE.skyDuskMid, PALETTE.skyHorizon);

  // Distant glowing skyscrapers
  // Building 1 (left)
  fillRect(png, 132, 22, 6, 18, PALETTE.skyBuildingDark);
  for (let by = 24; by < 38; by += 3) {
    setPixel(png, 134, by, PALETTE.skyBuildingLit);
    setPixel(png, 136, by, PALETTE.skyBuildingLit);
  }
  // Building 2 (center tall spire)
  fillRect(png, 140, 16, 8, 24, PALETTE.skyBuildingDark);
  fillRect(png, 143, 13, 2, 3, PALETTE.skyBuildingDark); // spire
  setPixel(png, 143, 12, PALETTE.alertRed); // beacon light
  for (let by = 18; by < 38; by += 3) {
    setPixel(png, 142, by, PALETTE.skyWindowCyan);
    setPixel(png, 145, by, PALETTE.skyWindowCyan);
  }
  // Building 3 (right)
  fillRect(png, 150, 25, 7, 15, PALETTE.skyBuildingDark);
  for (let by = 27; by < 38; by += 3) {
    setPixel(png, 152, by, PALETTE.skyBuildingLit);
    setPixel(png, 154, by, PALETTE.skyBuildingLit);
  }

  // Architectural window mullions
  fillRect(png, 143, 8, 2, 32, PALETTE.windowFrameInner);
  fillRect(png, 130, 24, 28, 2, PALETTE.windowFrameInner);
  // Glass glare sheen diagonal
  for (let i = 0; i < 18; i++) {
    setPixel(png, 132 + i, 10 + i, PALETTE.windowGlassGlare);
    setPixel(png, 133 + i, 10 + i, PALETTE.windowGlassGlare);
  }

  // --------------------------------------------------
  // TILE: Wall Whiteboard Architecture (32x48) at [160, 0]
  // --------------------------------------------------
  fillRect(png, 160, 0, 32, 48, PALETTE.wallFaceDark);
  // Whiteboard aluminum frame (28x26 at x=162, y=10)
  fillRect(png, 162, 10, 28, 26, PALETTE.crownMoldingLight);
  fillRect(png, 164, 12, 24, 22, PALETTE.white);
  // Diagram boxes and arrows
  fillRect(png, 166, 14, 6, 4, PALETTE.bezelDark);
  fillRect(png, 178, 14, 6, 4, PALETTE.codexBlue);
  fillRect(png, 172, 24, 8, 4, PALETTE.piGreen);
  // Connecting lines
  fillRect(png, 172, 16, 6, 1, PALETTE.alertRed);
  fillRect(png, 176, 18, 1, 6, PALETTE.alertRed);
  // Sticky notes (pink, yellow, cyan)
  fillRect(png, 166, 22, 3, 3, PALETTE.rgbLedMagenta);
  fillRect(png, 182, 22, 3, 3, PALETTE.ideString);
  // Marker tray at bottom
  fillRect(png, 162, 35, 28, 2, PALETTE.coolerSteelShadow);

  // --------------------------------------------------
  // TILE: Wall Server Rack with LEDs (32x48) at [192, 0]
  // --------------------------------------------------
  fillRect(png, 192, 0, 32, 48, PALETTE.wallFaceDark);
  // Black server cabinet
  fillRect(png, 194, 6, 24, 38, PALETTE.black);
  fillRect(png, 196, 8, 20, 34, PALETTE.meshBlack);
  // 1U/2U server blades
  for (let u = 0; u < 8; u++) {
    const uy = 10 + u * 4;
    fillRect(png, 197, uy, 18, 3, PALETTE.bezelDark);
    fillRect(png, 197, uy + 2, 18, 1, PALETTE.bezelSilver);
    // Blinking LEDs
    setPixel(png, 199, uy + 1, u % 2 === 0 ? PALETTE.termGreen : PALETTE.rgbLedCyan);
    setPixel(png, 201, uy + 1, u % 3 === 0 ? PALETTE.amberWarm : PALETTE.termGreen);
    setPixel(png, 203, uy + 1, PALETTE.termGreen);
  }

  // --------------------------------------------------
  // OBJECT: Executive Dual-Monitor Workstation (64x48) at [0, 64]
  // --------------------------------------------------
  // Desk drop shadow
  fillRect(png, 4, 102, 56, 8, PALETTE.deskShadow);

  // Heavy steel legs & cable raceway (y=96 to 110)
  fillRect(png, 6, 90, 4, 18, PALETTE.deskLegSteel);
  fillRect(png, 6, 90, 1, 18, PALETTE.deskLegHighlight);
  fillRect(png, 54, 90, 4, 18, PALETTE.deskLegSteel);
  fillRect(png, 54, 90, 1, 18, PALETTE.deskLegHighlight);
  // Crossbar
  fillRect(png, 10, 100, 44, 2, PALETTE.deskLegSteel);

  // Desk front beveled face (y=88 to 92)
  fillRect(png, 2, 88, 60, 4, PALETTE.deskFrontFace);
  fillRect(png, 2, 91, 60, 1, PALETTE.deskShadow);

  // Desk top surface (60x18 at x=2, y=72 to 88)
  fillGradientV(png, 2, 72, 60, 16, PALETTE.deskTopLight, PALETTE.deskTopDark);
  fillRect(png, 2, 72, 60, 1, PALETTE.deskBevelHighlight);

  // Oversized Tech Desk Mat (40x12 at x=12, y=75)
  fillRect(png, 12, 75, 40, 12, PALETTE.meshBlack);
  fillRect(png, 12, 75, 40, 1, PALETTE.rgbLedCyan); // RGB edge glow
  fillRect(png, 12, 86, 40, 1, PALETTE.rgbLedMagenta);

  // DUAL CURVED BORDERLESS MONITORS
  // Monitor stand & articulated arms
  fillRect(png, 29, 70, 6, 6, PALETTE.bezelSilver);
  fillRect(png, 22, 68, 20, 2, PALETTE.bezelSilver);

  // LEFT MONITOR: Code Editor / IDE (24x18 at x=7, y=52)
  fillRect(png, 7, 52, 24, 18, PALETTE.bezelDark);
  fillRect(png, 8, 53, 22, 16, PALETTE.screenBg);
  // IDE syntax highlight lines
  // Line 1: import
  fillRect(png, 10, 55, 6, 1, PALETTE.ideKeyword);
  fillRect(png, 17, 55, 8, 1, PALETTE.ideFunction);
  // Line 2: function
  fillRect(png, 10, 58, 8, 1, PALETTE.ideFunction);
  fillRect(png, 19, 58, 7, 1, PALETTE.ideString);
  // Line 3: loop
  fillRect(png, 12, 61, 5, 1, PALETTE.ideKeyword);
  fillRect(png, 18, 61, 10, 1, PALETTE.ideComment);
  // Line 4: code + cursor
  fillRect(png, 12, 64, 8, 1, PALETTE.ideString);
  setPixel(png, 21, 64, PALETTE.ideCursor);

  // RIGHT MONITOR: Terminal / Analytics (24x18 at x=33, y=52)
  fillRect(png, 33, 52, 24, 18, PALETTE.bezelDark);
  fillRect(png, 34, 53, 22, 16, PALETTE.screenBg);
  // Terminal text & mini chart
  fillRect(png, 36, 55, 3, 1, PALETTE.termGreen); // $ prompt
  fillRect(png, 40, 55, 12, 1, PALETTE.ideCursor);
  // Mini bar graph
  fillRect(png, 36, 64, 2, 3, PALETTE.rgbLedCyan);
  fillRect(png, 39, 61, 2, 6, PALETTE.rgbLedCyan);
  fillRect(png, 42, 59, 2, 8, PALETTE.termGreen);
  fillRect(png, 45, 63, 2, 4, PALETTE.amberWarm);
  fillRect(png, 48, 60, 2, 7, PALETTE.rgbLedCyan);
  fillRect(png, 51, 62, 2, 5, PALETTE.ideKeyword);

  // Mechanical Keyboard (16x6 at x=20, y=78)
  fillRect(png, 20, 78, 16, 6, PALETTE.bezelDark);
  fillRect(png, 20, 78, 16, 1, PALETTE.ideFunction); // RGB strip
  for (let ky = 79; ky < 83; ky += 2) {
    for (let kx = 21; kx < 35; kx += 2) {
      setPixel(png, kx, ky, PALETTE.tileGleam);
    }
  }

  // Ergonomic Mouse (4x6 at x=40, y=78)
  fillRect(png, 40, 78, 4, 6, PALETTE.meshCharcoal);
  setPixel(png, 41, 78, PALETTE.rgbLedCyan); // glowing scroll wheel

  // Desk Accessories: Ceramic Coffee Mug with Steam (x=50, y=74)
  fillRect(png, 50, 75, 5, 6, PALETTE.tileGleam);
  fillRect(png, 51, 75, 3, 2, PALETTE.coffeeBrown); // coffee surface
  setPixel(png, 55, 77, PALETTE.tileGleam); // handle
  // Rising pixel steam
  setPixel(png, 51, 73, PALETTE.windowGlassGlare);
  setPixel(png, 53, 72, PALETTE.windowGlassGlare);

  // Sticky notes (x=5, y=75)
  fillRect(png, 4, 75, 5, 5, PALETTE.ideString);
  fillRect(png, 5, 76, 4, 4, PALETTE.amberWarm);

  // --------------------------------------------------
  // OBJECT: Ergonomic Mesh Chair (32x32) at [64, 64]
  // --------------------------------------------------
  // Drop shadow
  fillRect(png, 70, 90, 20, 5, PALETTE.deskShadow);

  // Chrome 5-star base & caster wheels (y=88 to 94)
  fillRect(png, 78, 86, 4, 4, PALETTE.chairChrome); // pneumatic cylinder
  fillRect(png, 72, 89, 16, 2, PALETTE.chairChrome); // horizontal star legs
  setPixel(png, 70, 91, PALETTE.casterBlack);
  setPixel(png, 89, 91, PALETTE.casterBlack);
  setPixel(png, 79, 92, PALETTE.casterBlack);

  // Ergonomic Contoured Seat Pan (20x8 at x=70, y=78)
  fillGradientV(png, 70, 78, 20, 8, PALETTE.meshCharcoal, PALETTE.meshBlack);
  fillRect(png, 70, 78, 20, 1, PALETTE.chairFrame);

  // Lumbar Mesh Backrest (18x12 at x=71, y=66)
  fillGradientV(png, 71, 66, 18, 12, PALETTE.meshBlack, PALETTE.meshCharcoal);
  fillRect(png, 71, 66, 18, 1, PALETTE.chairFrame);
  fillRect(png, 71, 66, 1, 12, PALETTE.chairFrame);
  fillRect(png, 88, 66, 1, 12, PALETTE.chairFrame);

  // 3D Contoured Armrests (Left & Right)
  fillRect(png, 67, 72, 3, 8, PALETTE.meshCharcoal);
  fillRect(png, 67, 72, 3, 2, PALETTE.chairFrame);
  fillRect(png, 90, 72, 3, 8, PALETTE.meshCharcoal);
  fillRect(png, 90, 72, 3, 2, PALETTE.chairFrame);

  // --------------------------------------------------
  // OBJECT: Potted Tropical Monstera Plant (32x48) at [96, 64]
  // --------------------------------------------------
  // Drop shadow
  fillRect(png, 102, 106, 20, 5, PALETTE.deskShadow);

  // Terracotta Fluted Planter (18x16 at x=103, y=94)
  fillGradientV(png, 103, 94, 18, 16, PALETTE.potClayLight, PALETTE.potClayDark);
  fillRect(png, 101, 93, 22, 3, PALETTE.potClayLight); // rim
  fillRect(png, 103, 95, 18, 2, PALETTE.baseboardShadow); // soil

  // Lush Overlapping Monstera Leaves (y=66 to 93)
  // Large center leaf
  fillGradientV(png, 106, 68, 12, 14, PALETTE.leafHighlight, PALETTE.leafDark);
  // Leaf cutouts (monstera fenestrations)
  setPixel(png, 108, 72, PALETTE.leafShadow);
  setPixel(png, 115, 73, PALETTE.leafShadow);
  setPixel(png, 109, 76, PALETTE.leafShadow);
  setPixel(png, 114, 77, PALETTE.leafShadow);
  // Leaf vein
  fillRect(png, 111, 70, 1, 12, PALETTE.leafHighlight);

  // Left leaf
  fillGradientV(png, 98, 76, 10, 12, PALETTE.leafMid, PALETTE.leafShadow);
  fillRect(png, 101, 78, 1, 8, PALETTE.leafHighlight);

  // Right leaf
  fillGradientV(png, 116, 74, 11, 13, PALETTE.leafHighlight, PALETTE.leafDark);
  fillRect(png, 120, 76, 1, 9, PALETTE.leafHighlight);

  // Stems
  fillRect(png, 111, 82, 2, 12, PALETTE.leafDark);

  // --------------------------------------------------
  // OBJECT: Stainless Steel Water Cooler (32x48) at [128, 64]
  // --------------------------------------------------
  // Drop shadow
  fillRect(png, 134, 106, 20, 5, PALETTE.deskShadow);

  // Stainless steel lower cabinet (16x22 at x=136, y=88)
  fillGradientV(png, 136, 88, 16, 22, PALETTE.coolerBaseSteel, PALETTE.coolerSteelShadow);
  fillRect(png, 136, 88, 1, 22, PALETTE.tileGleam); // specular edge

  // Dispenser alcove (12x10 at x=138, y=90)
  fillRect(png, 138, 90, 12, 10, PALETTE.meshBlack);
  // Hot & cold taps
  fillRect(png, 140, 91, 2, 3, PALETTE.waterTapRed);
  fillRect(png, 146, 91, 2, 3, PALETTE.waterTapBlue);
  // Drip tray
  fillRect(png, 138, 98, 12, 2, PALETTE.coolerSteelShadow);

  // Aqua Transparent Water Jug (14x16 at x=137, y=70)
  fillRect(png, 137, 70, 14, 16, PALETTE.waterBottleAqua);
  fillRect(png, 139, 68, 10, 3, PALETTE.waterBottleAqua); // neck
  // Water highlights & air bubble
  fillRect(png, 138, 72, 2, 12, PALETTE.waterBottleLight);
  setPixel(png, 143, 76, PALETTE.tileGleam); // air bubble
  setPixel(png, 144, 75, PALETTE.tileGleam);

  // --------------------------------------------------
  // OBJECT: Italian Espresso Machine Bar (32x48) at [160, 64]
  // --------------------------------------------------
  // Drop shadow
  fillRect(png, 166, 106, 20, 5, PALETTE.deskShadow);

  // Wooden counter block (24x16 at x=164, y=94)
  fillGradientV(png, 164, 94, 24, 16, PALETTE.deskTopMid, PALETTE.deskFrontFace);
  fillRect(png, 164, 94, 24, 1, PALETTE.deskBevelHighlight);

  // Espresso machine body (18x18 at x=167, y=76)
  fillGradientV(png, 167, 76, 18, 18, PALETTE.espressoChrome, PALETTE.espressoDark);
  fillRect(png, 167, 76, 18, 1, PALETTE.tileGleam);
  // Group head portafilter
  fillRect(png, 173, 85, 6, 2, PALETTE.meshBlack);
  fillRect(png, 178, 86, 4, 1, PALETTE.meshBlack); // handle
  // Pressure gauge
  fillRect(png, 170, 78, 3, 3, PALETTE.white);
  setPixel(png, 171, 79, PALETTE.alertRed); // needle
  // Steam wand & espresso cup
  fillRect(png, 181, 84, 1, 6, PALETTE.chairChrome);
  fillRect(png, 174, 90, 4, 3, PALETTE.tileGleam); // mini cup

  // --------------------------------------------------
  // 32-BIT HIGH-RES SPEECH & STATUS BUBBLES (32x32 each)
  // --------------------------------------------------
  // Bubble 1: Blocked / Alert Bubble at [192, 64]
  fillRect(png, 196, 68, 24, 18, PALETTE.bubbleShadow);
  fillRect(png, 194, 66, 24, 18, PALETTE.bubbleBg);
  fillRect(png, 194, 66, 24, 1, PALETTE.bubbleBorder);
  fillRect(png, 194, 83, 24, 1, PALETTE.bubbleBorder);
  fillRect(png, 194, 66, 1, 18, PALETTE.bubbleBorder);
  fillRect(png, 217, 66, 1, 18, PALETTE.bubbleBorder);
  // Tail
  fillRect(png, 204, 84, 4, 3, PALETTE.bubbleBg);
  fillRect(png, 203, 84, 1, 3, PALETTE.bubbleBorder);
  fillRect(png, 207, 84, 1, 3, PALETTE.bubbleBorder);
  // Big Red Exclamation
  fillRect(png, 204, 69, 4, 7, PALETTE.alertRed);
  fillRect(png, 204, 78, 4, 3, PALETTE.alertRed);

  // Bubble 2: Done / Star Bubble at [224, 64]
  fillRect(png, 228, 68, 24, 18, PALETTE.bubbleShadow);
  fillRect(png, 226, 66, 24, 18, PALETTE.bubbleBg);
  fillRect(png, 226, 66, 24, 1, PALETTE.bubbleBorder);
  fillRect(png, 226, 83, 24, 1, PALETTE.bubbleBorder);
  fillRect(png, 226, 66, 1, 18, PALETTE.bubbleBorder);
  fillRect(png, 249, 66, 1, 18, PALETTE.bubbleBorder);
  // Tail
  fillRect(png, 236, 84, 4, 3, PALETTE.bubbleBg);
  // Emerald checkmark
  fillRect(png, 232, 75, 3, 2, PALETTE.doneGreen);
  fillRect(png, 235, 76, 3, 2, PALETTE.doneGreen);
  fillRect(png, 238, 72, 3, 3, PALETTE.doneGreen);
  fillRect(png, 241, 69, 3, 3, PALETTE.doneGreen);

  // Bubble 3: Working / Thought Typing Bubble at [0, 128]
  fillRect(png, 4, 132, 24, 18, PALETTE.bubbleShadow);
  fillRect(png, 2, 130, 24, 18, PALETTE.bubbleBg);
  fillRect(png, 2, 130, 24, 1, PALETTE.bubbleBorder);
  fillRect(png, 2, 147, 24, 1, PALETTE.bubbleBorder);
  fillRect(png, 2, 130, 1, 18, PALETTE.bubbleBorder);
  fillRect(png, 25, 130, 1, 18, PALETTE.bubbleBorder);
  // Animated-looking 3 dots
  fillRect(png, 6, 138, 3, 3, PALETTE.ideKeyword);
  fillRect(png, 12, 138, 3, 3, PALETTE.ideFunction);
  fillRect(png, 18, 138, 3, 3, PALETTE.termGreen);

  return png;
}

// ====================================================
// 2. GENERATE 32-BIT RETRO CHARACTER SPRITESHEET (128x384)
// ====================================================
// 4 animation frames wide (4 x 32 = 128px)
// 8 action rows high (8 x 48 = 384px)
interface CharacterTheme {
  primary: RGBA;
  primaryLight: RGBA;
  primaryDark: RGBA;
  hair: RGBA;
  hairLight: RGBA;
  skin: RGBA;
  skinShadow: RGBA;
  pants: RGBA;
  shoes: RGBA;
  accent: RGBA;
  hasGlasses?: boolean;
  hasHeadphones?: boolean;
}

function drawRetroCharacterFrame(
  png: PNG,
  frame: number,
  row: number,
  theme: CharacterTheme,
  action: 'idle' | 'walk' | 'type' | 'alert' | 'done',
  dir: 'down' | 'up' | 'side'
) {
  const ox = frame * 32;
  const oy = row * 48;

  // Natural breathing bob
  const bob = (action === 'idle' || action === 'type') && frame % 2 === 1 ? 1 : 0;
  const walkBob = action === 'walk' ? (frame % 2 === 1 ? -1 : 1) : 0;
  const yOffset = bob + walkBob;

  // Drop shadow beneath feet
  fillRect(png, ox + 8, oy + 44, 16, 3, PALETTE.deskShadow);

  // 1. LEGS & SHOES (y=34 to 45)
  const leftLegOffset = action === 'walk' && (frame === 1 || frame === 3) ? -2 : 0;
  const rightLegOffset = action === 'walk' && (frame === 0 || frame === 2) ? -2 : 0;

  if (dir === 'side') {
    fillRect(png, ox + 12, oy + 34, 7, 8, theme.pants);
    fillRect(png, ox + 11, oy + 42, 9, 3, theme.shoes);
    fillRect(png, ox + 11, oy + 44, 9, 1, PALETTE.white); // sneaker sole
  } else {
    // Left leg
    fillRect(png, ox + 10, oy + 34, 5, 8 + leftLegOffset, theme.pants);
    fillRect(png, ox + 9, oy + 42 + leftLegOffset, 6, 3, theme.shoes);
    fillRect(png, ox + 9, oy + 44 + leftLegOffset, 6, 1, PALETTE.white);
    // Right leg
    fillRect(png, ox + 17, oy + 34, 5, 8 + rightLegOffset, theme.pants);
    fillRect(png, ox + 17, oy + 42 + rightLegOffset, 6, 3, theme.shoes);
    fillRect(png, ox + 17, oy + 44 + rightLegOffset, 6, 1, PALETTE.white);
  }

  // 2. TORSO & CLOTHING (y=20 to 34)
  const torsoY = oy + 20 + yOffset;
  fillRect(png, ox + 9, torsoY, 14, 14, theme.primary);
  fillRect(png, ox + 9, torsoY + 12, 14, 2, theme.primaryDark); // waistband
  fillRect(png, ox + 9, torsoY, 14, 1, theme.primaryLight); // shoulder highlight

  // Chest Logo / Accent Emblem (e.g. Pi logo or stripe)
  if (dir === 'down') {
    fillRect(png, ox + 14, torsoY + 4, 4, 1, theme.accent);
    fillRect(png, ox + 14, torsoY + 5, 1, 3, theme.accent);
    fillRect(png, ox + 17, torsoY + 5, 1, 3, theme.accent);
  }

  // 3. HEAD & FACE & HAIR (y=6 to 20)
  const headY = oy + 6 + yOffset;

  if (dir === 'down') {
    // Face skin
    fillRect(png, ox + 10, headY + 5, 12, 10, theme.skin);
    fillRect(png, ox + 11, headY + 13, 10, 2, theme.skinShadow); // neck shadow

    // Eyes with pupils
    if (action === 'alert') {
      // Wide alarmed eyes
      fillRect(png, ox + 12, headY + 7, 3, 4, PALETTE.white);
      fillRect(png, ox + 17, headY + 7, 3, 4, PALETTE.white);
      setPixel(png, ox + 13, headY + 8, PALETTE.black);
      setPixel(png, ox + 18, headY + 8, PALETTE.black);
    } else {
      // Normal focused eyes
      fillRect(png, ox + 12, headY + 8, 3, 2, PALETTE.white);
      fillRect(png, ox + 17, headY + 8, 3, 2, PALETTE.white);
      setPixel(png, ox + 13, headY + 8, PALETTE.black);
      setPixel(png, ox + 18, headY + 8, PALETTE.black);
      // Eyebrows
      fillRect(png, ox + 12, headY + 6, 3, 1, theme.hair);
      fillRect(png, ox + 17, headY + 6, 3, 1, theme.hair);
    }

    // Glasses if equipped
    if (theme.hasGlasses) {
      fillRect(png, ox + 11, headY + 7, 4, 3, PALETTE.crownMoldingDark);
      fillRect(png, ox + 17, headY + 7, 4, 3, PALETTE.crownMoldingDark);
      fillRect(png, ox + 15, headY + 8, 2, 1, PALETTE.crownMoldingDark);
      setPixel(png, ox + 12, headY + 8, PALETTE.windowGlassGlare);
      setPixel(png, ox + 18, headY + 8, PALETTE.windowGlassGlare);
    }

    // Cheeks blush & smile
    setPixel(png, ox + 11, headY + 11, PALETTE.skinBlush);
    setPixel(png, ox + 20, headY + 11, PALETTE.skinBlush);
    fillRect(png, ox + 14, headY + 12, 4, 1, theme.skinShadow);

    // Hair (stylish layered bangs & volume)
    fillRect(png, ox + 9, headY, 14, 6, theme.hair);
    fillRect(png, ox + 10, headY - 1, 12, 2, theme.hairLight);
    fillRect(png, ox + 8, headY + 2, 2, 6, theme.hair); // left fringe
    fillRect(png, ox + 22, headY + 2, 2, 6, theme.hair); // right fringe
    // Over-forehead tufts
    fillRect(png, ox + 11, headY + 5, 2, 2, theme.hair);
    fillRect(png, ox + 15, headY + 5, 3, 2, theme.hair);
  } else if (dir === 'up') {
    // Back of head & full textured hair
    fillRect(png, ox + 9, headY, 14, 14, theme.hair);
    fillRect(png, ox + 10, headY - 1, 12, 3, theme.hairLight);
    fillRect(png, ox + 8, headY + 3, 2, 10, theme.hair);
    fillRect(png, ox + 22, headY + 3, 2, 10, theme.hair);
    fillRect(png, ox + 10, headY + 13, 12, 2, theme.primaryDark); // hoodie collar
  } else {
    // Side profile
    fillRect(png, ox + 10, headY, 12, 6, theme.hair);
    fillRect(png, ox + 14, headY + 5, 8, 9, theme.skin);
    setPixel(png, ox + 18, headY + 8, PALETTE.black); // eye
    fillRect(png, ox + 9, headY + 2, 4, 10, theme.hair);
  }

  // Headphones around neck or ears
  if (theme.hasHeadphones) {
    fillRect(png, ox + 8, headY + 6, 2, 6, PALETTE.bezelDark);
    fillRect(png, ox + 22, headY + 6, 2, 6, PALETTE.bezelDark);
    setPixel(png, ox + 8, headY + 8, theme.accent); // glowing ring
    setPixel(png, ox + 23, headY + 8, theme.accent);
  }

  // 4. ARMS & ACTIONS
  if (action === 'type') {
    // Typing forward at desk - alternating rapid hands
    const handLeftBob = frame % 2 === 0 ? -1 : 1;
    const handRightBob = frame % 2 === 0 ? 1 : -1;
    // Left arm & hand
    fillRect(png, ox + 6, torsoY + 2, 3, 7, theme.primary);
    fillRect(png, ox + 6, torsoY + 9 + handLeftBob, 4, 3, theme.skin);
    // Right arm & hand
    fillRect(png, ox + 23, torsoY + 2, 3, 7, theme.primary);
    fillRect(png, ox + 22, torsoY + 9 + handRightBob, 4, 3, theme.skin);
  } else if (action === 'alert') {
    // Arms scratching head in confusion
    fillRect(png, ox + 5, torsoY - 2, 4, 8, theme.primary);
    fillRect(png, ox + 23, torsoY - 2, 4, 8, theme.primary);
    fillRect(png, ox + 6, headY + 2, 3, 3, theme.skin);
    fillRect(png, ox + 23, headY + 2, 3, 3, theme.skin);
  } else if (action === 'done') {
    // Arms raised in victory / celebration!
    fillRect(png, ox + 5, torsoY - 6, 3, 10, theme.primary);
    fillRect(png, ox + 24, torsoY - 6, 3, 10, theme.primary);
    fillRect(png, ox + 4, torsoY - 9, 4, 4, theme.skin);
    fillRect(png, ox + 24, torsoY - 9, 4, 4, theme.skin);
  } else {
    // Standard resting / walking arms
    const armSwing = action === 'walk' ? (frame % 2 === 0 ? 2 : -2) : 0;
    fillRect(png, ox + 6, torsoY + 2 + armSwing, 3, 8, theme.primary);
    fillRect(png, ox + 6, torsoY + 10 + armSwing, 3, 3, theme.skin);
    fillRect(png, ox + 23, torsoY + 2 - armSwing, 3, 8, theme.primary);
    fillRect(png, ox + 23, torsoY + 10 - armSwing, 3, 3, theme.skin);
  }
}

export function generateCharacterSpritesheet(theme: CharacterTheme): PNG {
  const png = createPNG(128, 384); // 4 frames x 8 rows

  // Row 0: Idle Down
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 0, theme, 'idle', 'down');
  // Row 1: Idle Up
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 1, theme, 'idle', 'up');
  // Row 2: Walk Down
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 2, theme, 'walk', 'down');
  // Row 3: Walk Up
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 3, theme, 'walk', 'up');
  // Row 4: Walk Side
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 4, theme, 'walk', 'side');
  // Row 5: Type / Working
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 5, theme, 'type', 'up');
  // Row 6: Alert / Blocked
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 6, theme, 'alert', 'down');
  // Row 7: Done / Celebratory
  for (let f = 0; f < 4; f++) drawRetroCharacterFrame(png, f, 7, theme, 'done', 'down');

  return png;
}

// ====================================================
// MAIN ASSET GENERATOR
// ====================================================
const clientAssets = path.resolve(process.cwd(), 'client/public/assets');

console.log('Generating 32-Bit High-Res Retro assets in:', clientAssets);

// 1. Generate High-Res Tileset
const tileset = generateOfficeTileset();
savePNG(tileset, path.join(clientAssets, 'tiles/office_tiles.png'));

// 2. Generate Character Variants
const themes: Record<string, CharacterTheme> = {
  pi: {
    primary: [40, 44, 52, 255],
    primaryLight: [55, 62, 74, 255],
    primaryDark: [28, 30, 36, 255],
    hair: [50, 40, 34, 255],
    hairLight: PALETTE.piGreenLight,
    skin: PALETTE.skinPale,
    skinShadow: PALETTE.skinShadow,
    pants: [35, 38, 46, 255],
    shoes: [24, 24, 27, 255],
    accent: PALETTE.piGreen,
    hasHeadphones: true,
  },
  claude: {
    primary: PALETTE.claudeOrange,
    primaryLight: PALETTE.claudeOrangeLight,
    primaryDark: PALETTE.claudeOrangeDark,
    hair: [42, 34, 30, 255],
    hairLight: [75, 55, 45, 255],
    skin: PALETTE.skinPale,
    skinShadow: PALETTE.skinShadow,
    pants: [45, 50, 60, 255],
    shoes: [60, 42, 30, 255],
    accent: PALETTE.ideString,
    hasGlasses: true,
  },
  codex: {
    primary: PALETTE.codexBlue,
    primaryLight: PALETTE.codexBlueLight,
    primaryDark: PALETTE.codexBlueDark,
    hair: [240, 210, 110, 255],
    hairLight: [255, 235, 150, 255],
    skin: PALETTE.skinPale,
    skinShadow: PALETTE.skinShadow,
    pants: [25, 30, 40, 255],
    shoes: [15, 20, 28, 255],
    accent: PALETTE.rgbLedCyan,
    hasHeadphones: true,
  },
};

for (const [name, theme] of Object.entries(themes)) {
  const charSheet = generateCharacterSpritesheet(theme);
  savePNG(charSheet, path.join(clientAssets, `characters/character_${name}.png`));
}

// 3. Asset Manifest JSON
const manifest = {
  name: 'herdr-office-32bit-retro-art',
  version: '2.0.0',
  tileSize: 32,
  tileset: {
    path: '/assets/tiles/office_tiles.png',
    width: 256,
    height: 256,
    tiles: {
      floor_wood: { x: 0, y: 0, w: 32, h: 32 },
      floor_carpet: { x: 32, y: 0, w: 32, h: 32 },
      floor_tile: { x: 64, y: 0, w: 32, h: 32 },
      wall_top: { x: 96, y: 0, w: 32, h: 48 },
      wall_window: { x: 128, y: 0, w: 32, h: 48 },
      wall_whiteboard: { x: 160, y: 0, w: 32, h: 48 },
      wall_server: { x: 192, y: 0, w: 32, h: 48 },
      desk: { x: 0, y: 64, w: 64, h: 48 },
      chair: { x: 64, y: 64, w: 32, h: 32 },
      plant: { x: 96, y: 64, w: 32, h: 48 },
      water_cooler: { x: 128, y: 64, w: 32, h: 48 },
      espresso_bar: { x: 160, y: 64, w: 32, h: 48 },
      bubble_blocked: { x: 192, y: 64, w: 32, h: 32 },
      bubble_done: { x: 224, y: 64, w: 32, h: 32 },
      bubble_working: { x: 0, y: 128, w: 32, h: 32 },
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
console.log('Saved 32-bit manifest:', path.join(clientAssets, 'manifest.json'));

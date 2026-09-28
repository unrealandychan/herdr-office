import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

type RGBA = [number, number, number, number];

// ====================================================
// AUTHENTIC 2.5D SIMULATION GAME COLOR PALETTE
// (High-detail 16/32-bit RPG & Sim: FF6 / Tactics / SimCity / Theme Hospital)
// ====================================================
const PALETTE = {
  transparent: [0, 0, 0, 0] as RGBA,

  // 1. Honey Oak Parquet Hardwood Floor
  woodTopLight: [238, 196, 142, 255] as RGBA,
  woodTopMid: [210, 160, 102, 255] as RGBA,
  woodTopDark: [178, 126, 74, 255] as RGBA,
  woodTopShadow: [142, 94, 52, 255] as RGBA,
  woodSeam: [98, 62, 32, 255] as RGBA,
  woodHighlight: [252, 222, 178, 255] as RGBA,

  // 2. Modern Navy / Slate Carpet Tiles
  carpetTopLight: [74, 94, 122, 255] as RGBA,
  carpetTopMid: [54, 70, 96, 255] as RGBA,
  carpetTopDark: [38, 50, 72, 255] as RGBA,
  carpetSeam: [24, 32, 48, 255] as RGBA,
  carpetHighlight: [92, 116, 148, 255] as RGBA,

  // 3. Breakroom Checkerboard Ceramic Tile
  tileWhiteLight: [250, 252, 255, 255] as RGBA,
  tileWhiteMid: [232, 238, 246, 255] as RGBA,
  tileWhiteDark: [204, 214, 226, 255] as RGBA,
  tileSlateLight: [168, 182, 202, 255] as RGBA,
  tileSlateMid: [132, 146, 168, 255] as RGBA,
  tileSlateDark: [100, 114, 136, 255] as RGBA,
  tileGrout: [72, 84, 102, 255] as RGBA,

  // 4. Executive Conference Walnut Parquet
  walnutLight: [164, 112, 72, 255] as RGBA,
  walnutMid: [136, 88, 52, 255] as RGBA,
  walnutDark: [106, 64, 34, 255] as RGBA,
  walnutShadow: [76, 44, 22, 255] as RGBA,
  walnutBorder: [214, 164, 114, 255] as RGBA,

  // 5. Foundation / Diorama 3D Cutaway Base
  foundationTop: [60, 68, 82, 255] as RGBA,
  foundationLeftLight: [44, 50, 62, 255] as RGBA,
  foundationLeftDark: [30, 34, 44, 255] as RGBA,
  foundationRightLight: [52, 60, 74, 255] as RGBA,
  foundationRightDark: [38, 44, 56, 255] as RGBA,
  foundationBevel: [84, 96, 116, 255] as RGBA,
  foundationStrata: [22, 26, 34, 255] as RGBA,

  // 6. Modern Office Drywall Walls & Molding
  wallDrywallTop: [246, 248, 252, 255] as RGBA,
  wallDrywallMid: [224, 230, 240, 255] as RGBA,
  wallDrywallDark: [198, 206, 218, 255] as RGBA,
  wallDrywallShadow: [168, 178, 192, 255] as RGBA,
  wallTrimSilver: [156, 168, 184, 255] as RGBA,
  baseboardWoodMid: [116, 74, 42, 255] as RGBA,
  baseboardWoodDark: [82, 48, 24, 255] as RGBA,

  // 7. Panoramic Skyline Windows (Sunlight, Skyscraper, Clouds)
  skyTop: [76, 156, 242, 255] as RGBA,
  skyMid: [128, 190, 252, 255] as RGBA,
  skyHorizon: [196, 228, 255, 255] as RGBA,
  buildingFar: [148, 172, 204, 255] as RGBA,
  buildingMid: [106, 128, 162, 255] as RGBA,
  buildingNear: [72, 90, 122, 255] as RGBA,
  windowLitGold: [254, 240, 138, 255] as RGBA,
  windowLitCyan: [165, 243, 252, 255] as RGBA,
  windowFrame: [42, 48, 62, 255] as RGBA,
  windowFrameHighlight: [78, 88, 110, 255] as RGBA,
  glassGlare: [255, 255, 255, 70] as RGBA,

  // 8. Agile Sprint Whiteboard
  whiteboardFrame: [180, 188, 202, 255] as RGBA,
  whiteboardSurface: [250, 252, 255, 255] as RGBA,
  whiteboardShadow: [222, 228, 238, 255] as RGBA,
  stickyYellow: [254, 240, 138, 255] as RGBA,
  stickyCyan: [165, 243, 252, 255] as RGBA,
  stickyPink: [251, 207, 232, 255] as RGBA,
  stickyGreen: [187, 247, 208, 255] as RGBA,
  kanbanLine: [120, 132, 150, 255] as RGBA,

  // 9. Server Cabinets & Blinking Lights
  serverBlack: [20, 22, 28, 255] as RGBA,
  serverBlade: [32, 36, 46, 255] as RGBA,
  serverTrim: [68, 78, 96, 255] as RGBA,
  ledGreen: [34, 197, 94, 255] as RGBA,
  ledCyan: [34, 211, 238, 255] as RGBA,
  ledAmber: [245, 158, 11, 255] as RGBA,
  ledBlue: [59, 130, 246, 255] as RGBA,
  cableBlue: [37, 99, 235, 255] as RGBA,
  cableYellow: [234, 179, 8, 255] as RGBA,

  // 10. Modern Desk & High-Tech Workstation
  deskSurfaceTop: [226, 180, 128, 255] as RGBA,
  deskSurfaceHighlight: [246, 208, 164, 255] as RGBA,
  deskSurfaceSide: [178, 134, 88, 255] as RGBA,
  deskSurfaceShadow: [136, 96, 58, 255] as RGBA,
  deskLegSteel: [46, 52, 66, 255] as RGBA,
  deskLegHighlight: [78, 88, 108, 255] as RGBA,
  monitorFrame: [24, 26, 32, 255] as RGBA,
  monitorBezel: [44, 48, 58, 255] as RGBA,
  monitorScreenBg: [14, 18, 26, 255] as RGBA,
  syntaxCyan: [56, 189, 248, 255] as RGBA,
  syntaxGreen: [74, 222, 128, 255] as RGBA,
  syntaxPurple: [192, 132, 252, 255] as RGBA,
  syntaxYellow: [250, 204, 21, 255] as RGBA,
  syntaxOrange: [251, 146, 60, 255] as RGBA,
  keyboardDark: [28, 32, 40, 255] as RGBA,
  keyboardLight: [62, 72, 90, 255] as RGBA,
  rgbGlow: [56, 189, 248, 160] as RGBA,

  // 11. Ergonomic Mesh Chair
  chairMeshLight: [52, 60, 74, 255] as RGBA,
  chairMeshMid: [36, 42, 54, 255] as RGBA,
  chairMeshDark: [24, 28, 36, 255] as RGBA,
  chairChrome: [186, 196, 212, 255] as RGBA,
  chairChromeShadow: [116, 126, 142, 255] as RGBA,

  // Executive Cognac Leather Boardroom Chairs
  leatherCognacTop: [204, 138, 86, 255] as RGBA,
  leatherCognacMid: [168, 104, 58, 255] as RGBA,
  leatherCognacDark: [132, 78, 40, 255] as RGBA,
  leatherCognacShadow: [96, 52, 26, 255] as RGBA,

  // 12. Conference Room Props
  confWoodTop: [176, 120, 78, 255] as RGBA,
  confWoodSide: [132, 84, 50, 255] as RGBA,
  confWoodShadow: [98, 58, 32, 255] as RGBA,
  micPuck: [34, 38, 48, 255] as RGBA,
  micPuckGreen: [34, 197, 94, 255] as RGBA,
  laptopSilver: [210, 218, 230, 255] as RGBA,

  // 13. Breakroom Espresso Bar & Water Cooler
  counterQuartzTop: [244, 246, 250, 255] as RGBA,
  counterQuartzSide: [204, 212, 224, 255] as RGBA,
  counterWoodSide: [156, 110, 72, 255] as RGBA,
  espressoChrome: [228, 234, 244, 255] as RGBA,
  espressoShadow: [124, 134, 150, 255] as RGBA,
  steamWhite: [255, 255, 255, 180] as RGBA,
  coolerSteel: [194, 204, 218, 255] as RGBA,
  waterAqua: [96, 198, 246, 220] as RGBA,
  waterAquaDeep: [38, 148, 214, 240] as RGBA,
  waterTapRed: [239, 68, 68, 255] as RGBA,
  waterTapBlue: [59, 130, 246, 255] as RGBA,

  // 14. Potted Plants
  leafHighlight: [110, 231, 128, 255] as RGBA,
  leafMid: [34, 197, 94, 255] as RGBA,
  leafDark: [22, 128, 61, 255] as RGBA,
  leafShadow: [16, 84, 40, 255] as RGBA,
  potCeramicTop: [248, 250, 252, 255] as RGBA,
  potCeramicSide: [212, 220, 232, 255] as RGBA,
  potSoil: [74, 48, 30, 255] as RGBA,

  // 15. Lounge Sofa
  sofaTealTop: [36, 116, 132, 255] as RGBA,
  sofaTealSide: [22, 82, 96, 255] as RGBA,
  sofaTealShadow: [14, 56, 66, 255] as RGBA,
  pillowYellow: [250, 204, 21, 255] as RGBA,

  // Shadows, Highlights & UI
  floorShadow: [12, 16, 26, 130] as RGBA,
  white: [255, 255, 255, 255] as RGBA,
  black: [0, 0, 0, 255] as RGBA,
  uiDarkSlate: [15, 23, 42, 240] as RGBA,
  uiBorderSlate: [71, 85, 105, 255] as RGBA,
  goldStar: [251, 191, 36, 255] as RGBA,
};

// ====================================================
// CORE DRAWING PRIMITIVES
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

/**
 * Draws a classic 2:1 isometric diamond at (ox, oy) with width w and height h = w / 2.
 */
function fillIsoDiamond(
  png: PNG,
  ox: number,
  oy: number,
  w: number,
  h: number,
  fillColor: RGBA,
  strokeColor?: RGBA
) {
  const halfW = w / 2;
  const halfH = h / 2;
  const cx = ox + halfW;
  const cy = oy + halfH;

  for (let y = 0; y < h; y++) {
    // Distance from vertical center
    const dy = Math.abs(y - halfH);
    // Span width at this y line in 2:1 ratio
    const spanHalfW = Math.round((halfH - dy) * 2);
    if (spanHalfW <= 0) continue;

    const x1 = cx - spanHalfW;
    const x2 = cx + spanHalfW - 1;
    for (let x = x1; x <= x2; x++) {
      setPixel(png, x, oy + y, fillColor);
    }

    if (strokeColor) {
      setPixel(png, x1, oy + y, strokeColor);
      setPixel(png, x2, oy + y, strokeColor);
    }
  }

  if (strokeColor) {
    setPixel(png, cx, oy, strokeColor);
    setPixel(png, cx, oy + h - 1, strokeColor);
  }
}

/**
 * Draws a 3D isometric prism with shaded top, left, and right faces.
 */
function drawIsoPrism(
  png: PNG,
  cx: number,
  cy: number,
  w: number,
  d: number,
  h: number,
  topCol: RGBA,
  leftCol: RGBA,
  rightCol: RGBA,
  highlightCol?: RGBA
) {
  // Top face diamond
  fillIsoDiamond(png, cx - w / 2, cy - h - d / 4, w, d / 2, topCol);

  // Left face (facing SW)
  const halfW = w / 2;
  const topY = cy - h;
  const botY = cy;
  for (let y = 0; y < h; y++) {
    const curY = topY + y;
    for (let x = -halfW; x <= 0; x++) {
      const edgeY = curY + (x + halfW) * 0.5;
      setPixel(png, cx + x, Math.round(edgeY), leftCol);
    }
  }

  // Right face (facing SE)
  for (let y = 0; y < h; y++) {
    const curY = topY + y;
    for (let x = 0; x <= halfW; x++) {
      const edgeY = curY + (halfW - x) * 0.5;
      setPixel(png, cx + x, Math.round(edgeY), rightCol);
    }
  }

  // Highlights
  if (highlightCol) {
    for (let y = 0; y < h; y++) {
      setPixel(png, cx, topY + y + d / 4, highlightCol);
    }
  }
}

function savePNG(png: PNG, filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log(`Saved pixel art asset: ${filePath} (${png.width}x${png.height})`);
}

// ====================================================
// 1. GENERATE MODERN 2.5D ISOMETRIC OFFICE TILESET (512x512)
// ====================================================
export function generateModernOfficeTileset(): PNG {
  const png = createPNG(512, 512);

  // --------------------------------------------------
  // TILE 1: Honey Oak Parquet Floor (64x32) at [0, 0]
  // Authentic 2:1 isometric diamond with herringbone wooden planks
  // --------------------------------------------------
  fillIsoDiamond(png, 0, 0, 64, 32, PALETTE.woodTopMid);

  // Wood herringbone plank details & seam lines inside the diamond
  for (let py = 4; py < 28; py += 6) {
    for (let px = 8; px < 56; px++) {
      const dy = Math.abs(py - 16);
      if (Math.abs(px - 32) < (16 - dy) * 2 - 2) {
        if ((px + py) % 11 === 0) setPixel(png, px, py, PALETTE.woodTopDark);
        if ((px * 2 + py) % 17 === 0) setPixel(png, px, py, PALETTE.woodHighlight);
        if ((px - py) % 12 === 0) setPixel(png, px, py, PALETTE.woodTopLight);
      }
    }
  }
  // Isometric plank seams
  for (let i = -16; i <= 16; i += 8) {
    for (let x = 4; x < 60; x++) {
      const y = Math.round(16 + (x - 32) * 0.5 + i);
      if (y >= 1 && y < 31) {
        const dy = Math.abs(y - 16);
        if (Math.abs(x - 32) < (16 - dy) * 2 - 1) {
          setPixel(png, x, y, PALETTE.woodSeam);
        }
      }
    }
  }
  // Outer crisp highlight & seam
  fillIsoDiamond(png, 0, 0, 64, 32, PALETTE.transparent, PALETTE.woodSeam);
  setPixel(png, 32, 0, PALETTE.woodHighlight);
  setPixel(png, 33, 0, PALETTE.woodHighlight);

  // --------------------------------------------------
  // TILE 2: Navy / Slate Gray Carpet Diamond (64x32) at [64, 0]
  // Modern tech pod carpet tile with subtle micro-weave
  // --------------------------------------------------
  fillIsoDiamond(png, 64, 0, 64, 32, PALETTE.carpetTopMid);
  for (let y = 1; y < 31; y++) {
    const dy = Math.abs(y - 16);
    const span = (16 - dy) * 2;
    for (let x = 96 - span + 1; x < 96 + span - 1; x++) {
      if ((x + y) % 3 === 0) setPixel(png, x, y, PALETTE.carpetTopLight);
      if ((x * 2 + y * 3) % 7 === 0) setPixel(png, x, y, PALETTE.carpetTopDark);
    }
  }
  // Carpet module grid border
  fillIsoDiamond(png, 64, 0, 64, 32, PALETTE.transparent, PALETTE.carpetSeam);
  setPixel(png, 96, 0, PALETTE.carpetHighlight);

  // --------------------------------------------------
  // TILE 3: Breakroom Checkerboard Ceramic Tile (64x32) at [128, 0]
  // High-gloss porcelain & slate checker squares in isometric projection
  // --------------------------------------------------
  fillIsoDiamond(png, 128, 0, 64, 32, PALETTE.tileWhiteMid);
  // Quadrant checker pattern in isometric diamond
  for (let y = 1; y < 31; y++) {
    const dy = Math.abs(y - 16);
    const span = (16 - dy) * 2;
    for (let x = 160 - span + 1; x < 160 + span - 1; x++) {
      const u = (x - 160) * 0.5 + (y - 16);
      const v = (y - 16) - (x - 160) * 0.5;
      const checker = (Math.floor((u + 32) / 8) + Math.floor((v + 32) / 8)) % 2 === 0;
      if (checker) {
        setPixel(png, x, y, PALETTE.tileSlateMid);
        if ((x + y) % 5 === 0) setPixel(png, x, y, PALETTE.tileSlateLight);
      } else {
        if ((x + y) % 4 === 0) setPixel(png, x, y, PALETTE.tileWhiteLight);
      }
    }
  }
  // Grout lines
  fillIsoDiamond(png, 128, 0, 64, 32, PALETTE.transparent, PALETTE.tileGrout);

  // --------------------------------------------------
  // TILE 4: Executive Conference Walnut Parquet (64x32) at [192, 0]
  // Deep warm walnut wood with perimeter brass/boxwood inlay
  // --------------------------------------------------
  fillIsoDiamond(png, 192, 0, 64, 32, PALETTE.walnutMid);
  for (let y = 2; y < 30; y++) {
    const dy = Math.abs(y - 16);
    const span = (16 - dy) * 2;
    for (let x = 224 - span + 2; x < 224 + span - 2; x++) {
      if ((x + y * 2) % 6 === 0) setPixel(png, x, y, PALETTE.walnutDark);
      if ((x * 3 + y) % 9 === 0) setPixel(png, x, y, PALETTE.walnutLight);
    }
  }
  // Inlay border diamond (nested inside)
  fillIsoDiamond(png, 198, 3, 52, 26, PALETTE.transparent, PALETTE.walnutBorder);
  fillIsoDiamond(png, 192, 0, 64, 32, PALETTE.transparent, PALETTE.walnutShadow);

  // --------------------------------------------------
  // TILE 5: Foundation 3D Cutaway Rim - South-West Edge (64x48) at [256, 0]
  // Simulation game 3D dioramas have thick cutaway foundation blocks!
  // --------------------------------------------------
  // Floor top diamond half
  for (let y = 0; y < 16; y++) {
    const span = y * 2;
    for (let x = 288 - span; x <= 288; x++) {
      setPixel(png, x, y, PALETTE.foundationTop);
    }
  }
  // Left vertical cutaway slab (facing viewer-left)
  for (let y = 0; y < 24; y++) {
    for (let x = 256; x <= 288; x++) {
      const topY = Math.round(16 + (x - 256) * 0.5 + y);
      const isStrata = (topY % 7 === 0);
      setPixel(png, x, topY, isStrata ? PALETTE.foundationStrata : PALETTE.foundationLeftLight);
    }
  }
  // Bevel edge highlight
  for (let x = 256; x <= 288; x++) {
    const topY = Math.round(16 + (x - 256) * 0.5);
    setPixel(png, x, topY, PALETTE.foundationBevel);
  }

  // --------------------------------------------------
  // TILE 6: Foundation 3D Cutaway Rim - South-East Edge (64x48) at [320, 0]
  // --------------------------------------------------
  for (let y = 0; y < 24; y++) {
    for (let x = 320; x <= 352; x++) {
      const topY = Math.round(16 + (352 - x) * 0.5 + y);
      const isStrata = (topY % 7 === 0);
      setPixel(png, x, topY, isStrata ? PALETTE.foundationStrata : PALETTE.foundationRightLight);
    }
  }
  for (let x = 320; x <= 352; x++) {
    const topY = Math.round(16 + (352 - x) * 0.5);
    setPixel(png, x, topY, PALETTE.foundationBevel);
  }

  // --------------------------------------------------
  // TILE 7: Grid Cell Hover Highlight (64x32) at [384, 0]
  // --------------------------------------------------
  fillIsoDiamond(png, 384, 0, 64, 32, [56, 189, 248, 45], [56, 189, 248, 180]);

  // --------------------------------------------------
  // TILE 8: Selection Ring / Aura (64x32) at [448, 0]
  // Glowing golden isometric halo
  // --------------------------------------------------
  fillIsoDiamond(png, 448, 0, 64, 32, [251, 191, 36, 40], [251, 191, 36, 220]);

  // ====================================================
  // ROW 1: 2.5D ISOMETRIC BACK WALLS (64x80 each, y = 64 to 144)
  // Back Wall NW runs from top-left (0, 0) down-right at +0.5 slope
  // ====================================================

  // Helper for drawing 2.5D Isometric Wall Segment
  function drawIsoWallBase(startX: number, startY: number, baseColor: RGBA) {
    // Wall height = 64px, sloping at 0.5 ratio down-right
    for (let x = 0; x < 64; x++) {
      const baseY = startY + 56 + Math.round(x * 0.5);
      const topY = baseY - 64;
      for (let y = topY; y <= baseY; y++) {
        setPixel(png, startX + x, y, baseColor);
      }
      // Top wall cap molding
      setPixel(png, startX + x, topY, PALETTE.wallTrimSilver);
      setPixel(png, startX + x, topY + 1, PALETTE.wallDrywallTop);
      // Baseboard trim at bottom
      setPixel(png, startX + x, baseY - 2, PALETTE.baseboardWoodMid);
      setPixel(png, startX + x, baseY - 1, PALETTE.baseboardWoodDark);
      setPixel(png, startX + x, baseY, PALETTE.floorShadow);
    }
  }

  // --------------------------------------------------
  // WALL 1: North-West Architectural Skyline Window (64x96) at [0, 64]
  // --------------------------------------------------
  drawIsoWallBase(0, 64, PALETTE.wallDrywallMid);

  const isNWWinAperture = (x: number, y: number) => {
    if (x < 6 || x > 58) return false;
    const baseY = 64 + 48 + Math.round(x * 0.5);
    const winTopY = baseY - 48;
    const winBotY = baseY - 8;
    return y >= winTopY && y <= winBotY;
  };

  // Full 4-sided architectural frame casing & sky
  for (let x = 4; x <= 60; x++) {
    const baseY = 64 + 48 + Math.round(x * 0.5);
    const winTopY = baseY - 48;
    const winBotY = baseY - 8;

    // Extruded outer frame (2px thick top and bottom)
    setPixel(png, x, winTopY - 2, PALETTE.windowFrame);
    setPixel(png, x, winTopY - 1, PALETTE.windowFrameHighlight);
    setPixel(png, x, winBotY + 1, PALETTE.windowFrame);
    setPixel(png, x, winBotY + 2, PALETTE.chairChromeShadow);

    // Left and right vertical frame headers
    if (x <= 6 || x >= 58) {
      for (let y = winTopY - 1; y <= winBotY + 1; y++) {
        setPixel(png, x, y, PALETTE.windowFrame);
      }
      continue;
    }

    // Sky gradient inside aperture
    for (let y = winTopY; y <= winBotY; y++) {
      const t = (y - winTopY) / (winBotY - winTopY);
      const skyCol: RGBA = [
        Math.round(PALETTE.skyTop[0] * (1 - t) + PALETTE.skyHorizon[0] * t),
        Math.round(PALETTE.skyTop[1] * (1 - t) + PALETTE.skyHorizon[1] * t),
        Math.round(PALETTE.skyTop[2] * (1 - t) + PALETTE.skyHorizon[2] * t),
        255,
      ];
      setPixel(png, x, y, skyCol);
    }
  }

  // Skyscrapers strictly contained within aperture
  for (let x = 12; x <= 22; x++) {
    for (let y = 84; y <= 118; y++) {
      if (isNWWinAperture(x, y)) setPixel(png, x, y, PALETTE.buildingFar);
    }
  }
  for (let x = 24; x <= 38; x++) {
    for (let y = 80; y <= 124; y++) {
      if (isNWWinAperture(x, y)) setPixel(png, x, y, PALETTE.buildingNear);
    }
  }
  for (let x = 40; x <= 52; x++) {
    for (let y = 88; y <= 130; y++) {
      if (isNWWinAperture(x, y)) setPixel(png, x, y, PALETTE.buildingMid);
    }
  }

  // Lit office windows
  for (let by = 84; by < 122; by += 4) {
    for (let bx = 26; bx <= 36; bx += 3) {
      if (isNWWinAperture(bx, by) && (bx + by) % 3 !== 0) {
        setPixel(png, bx, by, PALETTE.windowLitGold);
      }
    }
    for (let bx = 42; bx <= 50; bx += 3) {
      if (isNWWinAperture(bx, by) && (bx + by) % 2 === 0) {
        setPixel(png, bx, by, PALETTE.windowLitCyan);
      }
    }
  }

  // Vertical Architectural Mullions (Clean 3-pane division)
  for (let x = 7; x <= 57; x++) {
    const baseY = 64 + 48 + Math.round(x * 0.5);
    const winTopY = baseY - 48;
    const winBotY = baseY - 8;
    if (x === 24 || x === 40) {
      for (let y = winTopY; y <= winBotY; y++) {
        setPixel(png, x, y, PALETTE.windowFrameHighlight);
      }
    }
  }

  // --------------------------------------------------
  // WALL 2: North-West Agile Sprint Whiteboard (64x96) at [64, 64]
  // --------------------------------------------------
  drawIsoWallBase(64, 64, PALETTE.wallDrywallMid);
  // Whiteboard mounting frame
  for (let x = 70; x <= 122; x++) {
    const baseY = 64 + 48 + Math.round((x - 64) * 0.5);
    const topY = baseY - 44;
    const botY = baseY - 10;
    // Frame
    setPixel(png, x, topY - 1, PALETTE.whiteboardFrame);
    setPixel(png, x, botY + 1, PALETTE.whiteboardFrame);
    // Board surface
    for (let y = topY; y <= botY; y++) {
      setPixel(png, x, y, PALETTE.whiteboardSurface);
    }
  }
  // Kanban columns: To Do | In Progress | Done
  for (let x = 70; x <= 122; x++) {
    const baseY = 64 + 48 + Math.round((x - 64) * 0.5);
    const topY = baseY - 44;
    const botY = baseY - 10;
    if (x === 87 || x === 105) {
      for (let y = topY + 2; y <= botY - 2; y++) setPixel(png, x, y, PALETTE.kanbanLine);
    }
  }
  // Colorful Agile Sticky Notes & System Architecture diagram
  fillRect(png, 73, 86, 5, 5, PALETTE.stickyYellow);
  fillRect(png, 79, 90, 5, 5, PALETTE.stickyCyan);
  fillRect(png, 91, 92, 5, 5, PALETTE.stickyPink);
  fillRect(png, 97, 96, 5, 5, PALETTE.stickyYellow);
  fillRect(png, 109, 100, 5, 5, PALETTE.stickyGreen);
  fillRect(png, 115, 104, 5, 5, PALETTE.stickyGreen);

  // --------------------------------------------------
  // WALL 3: North-West Enterprise Server Wall (64x96) at [128, 64]
  // --------------------------------------------------
  drawIsoWallBase(128, 64, PALETTE.wallDrywallDark);
  // Inset high-density server rack units mounted into wall
  for (let x = 136; x <= 184; x++) {
    const baseY = 64 + 50 + Math.round((x - 128) * 0.5);
    const topY = baseY - 50;
    const botY = baseY - 8;
    for (let y = topY; y <= botY; y++) {
      setPixel(png, x, y, PALETTE.serverBlack);
    }
    setPixel(png, x, topY, PALETTE.serverTrim);
    setPixel(png, x, botY, PALETTE.serverTrim);
  }
  // Server rack blades, ventilation slits & status LEDs
  for (let by = 80; by < 122; by += 4) {
    fillRect(png, 140, by, 40, 3, PALETTE.serverBlade);
    // Activity LEDs
    setPixel(png, 142, by + 1, PALETTE.ledGreen);
    setPixel(png, 145, by + 1, PALETTE.ledCyan);
    setPixel(png, 148, by + 1, PALETTE.ledAmber);
    setPixel(png, 151, by + 1, PALETTE.ledBlue);
    // Ethernet patch cables
    setPixel(png, 168, by + 1, PALETTE.cableBlue);
    setPixel(png, 172, by + 1, PALETTE.cableYellow);
  }

  // --------------------------------------------------
  // WALL 4: North-West Modern Acoustic Wood Slat Wall (64x96) at [192, 64]
  // --------------------------------------------------
  drawIsoWallBase(192, 64, PALETTE.wallDrywallMid);
  // Vertical modern acoustic oak slats
  for (let x = 196; x < 252; x += 3) {
    const baseY = 64 + 52 + Math.round((x - 192) * 0.5);
    const topY = baseY - 48;
    for (let y = topY; y < baseY - 4; y++) {
      setPixel(png, x, y, PALETTE.woodTopLight);
      setPixel(png, x + 1, y, PALETTE.woodTopMid);
    }
  }

  // --------------------------------------------------
  // WALL 5: North-East Modern Tech Bookshelf Wall (64x96) at [256, 64]
  // (Sloping down-left for North-East wall)
  // --------------------------------------------------
  for (let x = 0; x < 64; x++) {
    const baseY = 64 + 88 - Math.round(x * 0.5);
    const topY = baseY - 64;
    for (let y = topY; y <= baseY; y++) {
      setPixel(png, 256 + x, y, PALETTE.wallDrywallMid);
    }
    setPixel(png, 256 + x, topY, PALETTE.wallTrimSilver);
    setPixel(png, 256 + x, baseY - 2, PALETTE.baseboardWoodMid);
    setPixel(png, 256 + x, baseY - 1, PALETTE.baseboardWoodDark);
    setPixel(png, 256 + x, baseY, PALETTE.floorShadow);
  }
  // Bookshelf shelves & colorful technical books
  fillRect(png, 266, 92, 44, 3, PALETTE.woodTopMid);
  fillRect(png, 266, 106, 44, 3, PALETTE.woodTopMid);
  fillRect(png, 266, 120, 44, 3, PALETTE.woodTopMid);
  // Books on shelves
  fillRect(png, 270, 83, 3, 9, [225, 29, 72, 255]); // Red book
  fillRect(png, 274, 84, 4, 8, [37, 99, 235, 255]); // Blue book
  fillRect(png, 279, 82, 3, 10, [22, 163, 74, 255]); // Green book
  fillRect(png, 290, 85, 8, 7, PALETTE.goldStar); // Golden Tech Trophy!
  fillRect(png, 272, 97, 4, 9, [234, 179, 8, 255]); // Yellow book
  fillRect(png, 277, 98, 5, 8, [147, 51, 234, 255]); // Purple book
  fillRect(png, 283, 96, 3, 10, [236, 72, 153, 255]); // Pink book

  // --------------------------------------------------
  // WALL 6: North-East Modern Telemetry Dashboard Wall (64x96) at [320, 64]
  // Large wall-mounted curved monitor displaying Herdr system metrics
  // --------------------------------------------------
  for (let x = 0; x < 64; x++) {
    const baseY = 64 + 88 - Math.round(x * 0.5);
    const topY = baseY - 64;
    for (let y = topY; y <= baseY; y++) {
      setPixel(png, 320 + x, y, PALETTE.wallDrywallMid);
    }
    setPixel(png, 320 + x, topY, PALETTE.wallTrimSilver);
    setPixel(png, 320 + x, baseY - 2, PALETTE.baseboardWoodMid);
    setPixel(png, 320 + x, baseY, PALETTE.floorShadow);
  }
  // Curved Wall Dashboard (36x24 at x=334, y=86)
  fillRect(png, 332, 84, 40, 26, PALETTE.monitorFrame);
  fillRect(png, 334, 86, 36, 22, PALETTE.monitorScreenBg);
  // Telemetry graphs & metrics
  fillRect(png, 337, 89, 14, 2, PALETTE.syntaxCyan);
  fillRect(png, 337, 93, 8, 6, [34, 197, 94, 200]); // mini bar chart
  fillRect(png, 347, 93, 8, 6, [59, 130, 246, 200]);
  fillRect(png, 357, 90, 10, 14, PALETTE.serverBlade);
  setPixel(png, 360, 93, PALETTE.ledGreen);
  setPixel(png, 363, 93, PALETTE.ledGreen);

  // --------------------------------------------------
  // WALL 7: North-East Plain Wall with Modern Art (64x96) at [384, 64]
  // --------------------------------------------------
  for (let x = 0; x < 64; x++) {
    const baseY = 64 + 88 - Math.round(x * 0.5);
    const topY = baseY - 64;
    for (let y = topY; y <= baseY; y++) {
      setPixel(png, 384 + x, y, PALETTE.wallDrywallMid);
    }
    setPixel(png, 384 + x, topY, PALETTE.wallTrimSilver);
    setPixel(png, 384 + x, baseY - 2, PALETTE.baseboardWoodMid);
    setPixel(png, 384 + x, baseY, PALETTE.floorShadow);
  }
  // Framed Canvas Modern Art
  fillRect(png, 398, 86, 36, 24, PALETTE.wallTrimSilver);
  fillRect(png, 400, 88, 32, 20, [30, 41, 59, 255]);
  // Elegant geometric gradient inside painting
  fillIsoDiamond(png, 406, 92, 20, 12, PALETTE.syntaxPurple, PALETTE.syntaxCyan);

  // --------------------------------------------------
  // WALL 8: North-East Panoramic Window with Skyline (64x96) at [448, 64]
  // (Sloping down-left for North-East wall)
  // --------------------------------------------------
  for (let x = 0; x < 64; x++) {
    const baseY = 64 + 88 - Math.round(x * 0.5);
    const topY = baseY - 64;
    for (let y = topY; y <= baseY; y++) {
      setPixel(png, 448 + x, y, PALETTE.wallDrywallMid);
    }
    setPixel(png, 448 + x, topY, PALETTE.wallTrimSilver);
    setPixel(png, 448 + x, baseY - 2, PALETTE.baseboardWoodMid);
    setPixel(png, 448 + x, baseY - 1, PALETTE.baseboardWoodDark);
    setPixel(png, 448 + x, baseY, PALETTE.floorShadow);
  }

  const isNEWinAperture = (px: number, y: number) => {
    const rx = px - 448;
    if (rx < 6 || rx > 58) return false;
    const baseY = 64 + 88 - Math.round(rx * 0.5);
    const winTopY = baseY - 48;
    const winBotY = baseY - 8;
    return y >= winTopY && y <= winBotY;
  };

  // Full 4-sided architectural frame casing & sky
  for (let rx = 4; rx <= 60; rx++) {
    const baseY = 64 + 88 - Math.round(rx * 0.5);
    const winTopY = baseY - 48;
    const winBotY = baseY - 8;
    const px = 448 + rx;

    // Extruded outer frame (2px thick)
    setPixel(png, px, winTopY - 2, PALETTE.windowFrame);
    setPixel(png, px, winTopY - 1, PALETTE.windowFrameHighlight);
    setPixel(png, px, winBotY + 1, PALETTE.windowFrame);
    setPixel(png, px, winBotY + 2, PALETTE.chairChromeShadow);

    // Left and right vertical frame headers
    if (rx <= 6 || rx >= 58) {
      for (let y = winTopY - 1; y <= winBotY + 1; y++) {
        setPixel(png, px, y, PALETTE.windowFrame);
      }
      continue;
    }

    for (let y = winTopY; y <= winBotY; y++) {
      const t = (y - winTopY) / (winBotY - winTopY);
      const skyCol: RGBA = [
        Math.round(PALETTE.skyTop[0] * (1 - t) + PALETTE.skyHorizon[0] * t),
        Math.round(PALETTE.skyTop[1] * (1 - t) + PALETTE.skyHorizon[1] * t),
        Math.round(PALETTE.skyTop[2] * (1 - t) + PALETTE.skyHorizon[2] * t),
        255,
      ];
      setPixel(png, px, y, skyCol);
    }
  }

  // Skyscrapers strictly inside window aperture
  for (let px = 448 + 12; px <= 448 + 24; px++) {
    for (let y = 88; y <= 130; y++) {
      if (isNEWinAperture(px, y)) setPixel(png, px, y, PALETTE.buildingMid);
    }
  }
  for (let px = 448 + 26; px <= 448 + 40; px++) {
    for (let y = 80; y <= 126; y++) {
      if (isNEWinAperture(px, y)) setPixel(png, px, y, PALETTE.buildingNear);
    }
  }
  for (let px = 448 + 42; px <= 448 + 52; px++) {
    for (let y = 84; y <= 120; y++) {
      if (isNEWinAperture(px, y)) setPixel(png, px, y, PALETTE.buildingFar);
    }
  }

  // Lit office windows
  for (let by = 84; by < 122; by += 4) {
    for (let bx = 448 + 28; bx <= 448 + 38; bx += 3) {
      if (isNEWinAperture(bx, by) && (bx + by) % 3 !== 0) {
        setPixel(png, bx, by, PALETTE.windowLitGold);
      }
    }
    for (let bx = 448 + 14; bx <= 448 + 22; bx += 3) {
      if (isNEWinAperture(bx, by) && (bx + by) % 2 === 0) {
        setPixel(png, bx, by, PALETTE.windowLitCyan);
      }
    }
  }

  // Architectural Window Mullions
  for (let rx = 7; rx <= 57; rx++) {
    const baseY = 64 + 88 - Math.round(rx * 0.5);
    const winTopY = baseY - 48;
    const winBotY = baseY - 8;
    const px = 448 + rx;
    if (rx === 24 || rx === 40) {
      for (let y = winTopY; y <= winBotY; y++) {
        setPixel(png, px, y, PALETTE.windowFrameHighlight);
      }
    }
  }

  // ====================================================
  // ROW 2: 2.5D ISOMETRIC FURNITURE & WORKSTATIONS (y = 160 to 255)
  // ====================================================

  // --------------------------------------------------
  // PROP 1: 2.5D Angled Workstation Desk with Dual Monitors (64x64) at [0, 160]
  // Angled along isometric grid, dual curved monitors, mechanical keyboard, PC tower
  // --------------------------------------------------
  // Floor drop shadow under desk
  fillIsoDiamond(png, 4, 186, 56, 28, PALETTE.floorShadow);

  // Steel Desk Legs (4 legs supporting the desk frame)
  fillRect(png, 10, 184, 3, 20, PALETTE.deskLegSteel);
  fillRect(png, 30, 194, 3, 20, PALETTE.deskLegSteel);
  fillRect(png, 34, 174, 3, 18, PALETTE.deskLegSteel);
  fillRect(png, 54, 184, 3, 20, PALETTE.deskLegSteel);

  // PC Tower on Floor under right side of desk (tempered glass + RGB glow)
  fillRect(png, 44, 182, 10, 18, PALETTE.serverBlack);
  fillRect(png, 45, 184, 8, 14, [24, 30, 42, 255]);
  fillRect(png, 47, 186, 4, 2, PALETTE.syntaxCyan); // internal RGB RAM stick
  fillRect(png, 47, 190, 4, 2, PALETTE.syntaxPurple); // RGB GPU

  // Chamfered Oak Desk Top Slab (isometric diamond 56x28 at y=172)
  fillIsoDiamond(png, 4, 168, 56, 28, PALETTE.deskSurfaceTop);
  // Bevel front-left & front-right edges
  for (let y = 0; y < 4; y++) {
    for (let x = 4; x <= 32; x++) {
      const edgeY = 168 + 14 + Math.round((x - 4) * 0.5) + y;
      setPixel(png, x, edgeY, PALETTE.deskSurfaceSide);
    }
    for (let x = 32; x <= 60; x++) {
      const edgeY = 168 + 28 - Math.round((x - 32) * 0.5) + y;
      setPixel(png, x, edgeY, PALETTE.deskSurfaceShadow);
    }
  }
  // Desk top surface highlight rim
  fillIsoDiamond(png, 4, 168, 56, 28, PALETTE.transparent, PALETTE.deskSurfaceHighlight);

  // Monitor 1: Left Ultrawide Curved Screen (angled towards chair)
  fillRect(png, 14, 172, 4, 4, PALETTE.monitorFrame);
  fillRect(png, 6, 158, 16, 16, PALETTE.monitorFrame);
  fillRect(png, 7, 159, 14, 14, PALETTE.monitorScreenBg);
  fillRect(png, 9, 161, 8, 1, PALETTE.syntaxPurple); // const / import
  fillRect(png, 9, 163, 10, 1, PALETTE.syntaxCyan); // function / class
  fillRect(png, 10, 165, 7, 1, PALETTE.syntaxYellow); // parameters
  fillRect(png, 10, 167, 9, 1, PALETTE.syntaxGreen); // return code

  // Monitor 2: Right Secondary Screen (Portrait / Documentation / Terminal)
  fillRect(png, 46, 172, 4, 4, PALETTE.monitorFrame);
  fillRect(png, 43, 155, 14, 18, PALETTE.monitorFrame);
  fillRect(png, 44, 156, 12, 16, PALETTE.monitorScreenBg);
  fillRect(png, 46, 158, 8, 1, PALETTE.syntaxGreen); // $ git commit
  fillRect(png, 46, 160, 7, 1, PALETTE.syntaxCyan);
  fillRect(png, 46, 162, 9, 1, PALETTE.syntaxOrange);

  // Backlit Mechanical Keyboard in Center (leaving center open for developer)
  fillRect(png, 24, 179, 16, 8, [30, 36, 48, 255]); // desk mat
  fillRect(png, 26, 180, 12, 5, PALETTE.keyboardDark);
  for (let kx = 27; kx < 37; kx += 2) {
    setPixel(png, kx, 181, PALETTE.keyboardLight);
    setPixel(png, kx, 183, PALETTE.syntaxCyan); // cyan underglow!
  }
  // Ergonomic mouse & ceramic coffee mug
  fillRect(png, 40, 181, 3, 4, PALETTE.keyboardDark);
  fillRect(png, 43, 175, 4, 4, PALETTE.white); // white coffee mug
  setPixel(png, 44, 176, PALETTE.baseboardWoodDark); // coffee inside

  // --------------------------------------------------
  // PROP 2: 2.5D Ergonomic Mesh Chair - South-East View (32x48) at [64, 160]
  // (View from back-left, looking toward desk)
  // --------------------------------------------------
  fillIsoDiamond(png, 68, 196, 24, 10, PALETTE.floorShadow);
  // Chrome 5-star caster base
  fillRect(png, 78, 194, 4, 6, PALETTE.chairChrome);
  fillRect(png, 72, 198, 16, 2, PALETTE.chairChrome);
  // Contoured Seat Cushion
  fillIsoDiamond(png, 70, 182, 20, 10, PALETTE.chairMeshLight);
  // Mesh High Backrest with Lumbar Support
  fillRect(png, 72, 166, 16, 18, PALETTE.chairMeshMid);
  fillRect(png, 74, 168, 12, 14, PALETTE.chairMeshLight);
  fillRect(png, 72, 166, 16, 1, PALETTE.chairChrome); // top rim
  // Lumbar support strap
  fillRect(png, 72, 175, 16, 2, PALETTE.chairMeshDark);

  // --------------------------------------------------
  // PROP 3: 2.5D Ergonomic Mesh Chair - Front Facing View (32x48) at [96, 160]
  // --------------------------------------------------
  fillIsoDiamond(png, 100, 196, 24, 10, PALETTE.floorShadow);
  fillRect(png, 110, 194, 4, 6, PALETTE.chairChrome);
  fillRect(png, 104, 198, 16, 2, PALETTE.chairChrome);
  // Seat cushion front
  fillIsoDiamond(png, 102, 184, 20, 10, PALETTE.chairMeshMid);
  // Backrest behind seat
  fillRect(png, 104, 166, 16, 18, PALETTE.chairMeshDark);
  fillRect(png, 106, 168, 12, 14, PALETTE.chairMeshMid);
  // Armrests
  fillRect(png, 101, 178, 3, 6, PALETTE.chairChrome);
  fillRect(png, 120, 178, 3, 6, PALETTE.chairChrome);

  // --------------------------------------------------
  // PROP 4: 2.5D Stainless Steel Water Cooler (32x64) at [128, 160]
  // Inverted aqua water bottle with bubbles, cold/hot taps, chrome drip tray
  // --------------------------------------------------
  fillIsoDiamond(png, 132, 210, 24, 10, PALETTE.floorShadow);
  // Dispenser Cabinet Prism
  drawIsoPrism(png, 144, 208, 18, 18, 26, PALETTE.counterQuartzTop, PALETTE.coolerSteel, PALETTE.counterQuartzSide);
  // Dispenser Alcove
  fillRect(png, 138, 190, 12, 10, PALETTE.serverBlack);
  setPixel(png, 140, 192, PALETTE.waterTapRed); // hot tap
  setPixel(png, 146, 192, PALETTE.waterTapBlue); // cold tap
  fillRect(png, 138, 198, 12, 2, PALETTE.chairChrome); // grill

  // Inverted Blue 5-Gallon Water Bottle
  fillRect(png, 137, 166, 14, 18, PALETTE.waterAqua);
  fillRect(png, 139, 164, 10, 3, PALETTE.waterAquaDeep);
  fillRect(png, 138, 167, 2, 16, PALETTE.white); // specular highlight
  // Air bubbles in bottle
  setPixel(png, 143, 172, PALETTE.white);
  setPixel(png, 144, 171, PALETTE.white);
  setPixel(png, 141, 178, PALETTE.white);

  // --------------------------------------------------
  // PROP 5: 2.5D Breakroom Quartz Counter with Espresso Machine (64x64) at [160, 160]
  // Modern coffee bar, espresso machine, steam wand, pressure dial, mugs
  // --------------------------------------------------
  fillIsoDiamond(png, 164, 210, 56, 22, PALETTE.floorShadow);
  // Quartz / Oak Counter Prism
  drawIsoPrism(png, 192, 206, 48, 22, 24, PALETTE.counterQuartzTop, PALETTE.counterWoodSide, PALETTE.counterQuartzSide);

  // Italian Espresso Machine Body
  fillRect(png, 182, 164, 20, 20, PALETTE.espressoChrome);
  fillRect(png, 182, 164, 20, 2, PALETTE.white); // top chrome highlight
  // Group head & portafilter handle
  fillRect(png, 188, 174, 8, 3, PALETTE.black);
  fillRect(png, 195, 176, 5, 2, PALETTE.baseboardWoodDark);
  // Round pressure gauge with red needle
  fillRect(png, 185, 168, 4, 4, PALETTE.white);
  setPixel(png, 187, 170, PALETTE.waterTapRed);
  // Ceramic coffee cups on warming rack & counter
  fillRect(png, 184, 161, 4, 3, PALETTE.white);
  fillRect(png, 190, 161, 4, 3, PALETTE.pillowYellow);
  fillRect(png, 190, 182, 4, 3, PALETTE.white);
  // Rising steam puffs
  setPixel(png, 191, 179, PALETTE.steamWhite);
  setPixel(png, 192, 177, PALETTE.steamWhite);
  setPixel(png, 190, 175, PALETTE.steamWhite);

  // --------------------------------------------------
  // PROP 6: 2.5D Lush Potted Monstera Deliciosa (48x64) at [224, 160]
  // Modern fluted white ceramic cylinder pot with large shaded leaves
  // --------------------------------------------------
  fillIsoDiamond(png, 228, 212, 40, 16, PALETTE.floorShadow);
  // Fluted white ceramic pot
  drawIsoPrism(png, 248, 210, 24, 16, 16, PALETTE.potSoil, PALETTE.potCeramicSide, PALETTE.potCeramicTop);

  // Lush multi-layered tropical leaves
  const drawLeaf = (lx: number, ly: number, lw: number, lh: number) => {
    fillIsoDiamond(png, lx, ly, lw, lh, PALETTE.leafMid);
    fillIsoDiamond(png, lx + 2, ly + 2, lw - 4, lh - 4, PALETTE.leafHighlight);
    fillRect(png, lx + Math.round(lw / 2), ly, 1, lh, PALETTE.leafDark); // center vein
  };
  drawLeaf(230, 166, 22, 14);
  drawLeaf(244, 160, 24, 16);
  drawLeaf(248, 172, 22, 14);
  drawLeaf(226, 176, 20, 12);
  drawLeaf(238, 180, 22, 14);

  // Stems down to soil
  fillRect(png, 246, 186, 2, 12, PALETTE.leafDark);
  fillRect(png, 242, 188, 1, 10, PALETTE.leafDark);
  fillRect(png, 250, 188, 1, 10, PALETTE.leafDark);

  // --------------------------------------------------
  // PROP 7: 2.5D Standalone Enterprise Server Rack 42U (48x80) at [288, 160]
  // Tall server tower, smoked glass door, blinky LEDs, ventilation
  // --------------------------------------------------
  fillIsoDiamond(png, 292, 224, 40, 16, PALETTE.floorShadow);
  drawIsoPrism(png, 312, 220, 32, 20, 48, PALETTE.serverTrim, PALETTE.serverBlack, PALETTE.serverBlade);
  // Server rack front glass & blades
  for (let sy = 176; sy < 216; sy += 5) {
    fillRect(png, 314, sy, 12, 3, PALETTE.serverBlade);
    setPixel(png, 316, sy + 1, PALETTE.ledGreen);
    setPixel(png, 319, sy + 1, PALETTE.ledCyan);
    setPixel(png, 322, sy + 1, PALETTE.ledAmber);
  }

  // ====================================================
  // ROW 3: 2.5D CONFERENCE ROOM & BREAKOUT LOUNGE (y = 256 to 351)
  // ====================================================

  // --------------------------------------------------
  // PROP 8: 2.5D Executive Conference Table (96x64) at [0, 256]
  // Large beveled walnut oval table, center conference phone, open laptops
  // --------------------------------------------------
  fillIsoDiamond(png, 4, 304, 88, 36, PALETTE.floorShadow);
  // Chrome pedestal legs
  fillRect(png, 24, 290, 6, 20, PALETTE.chairChromeShadow);
  fillRect(png, 20, 308, 14, 3, PALETTE.chairChrome);
  fillRect(png, 66, 290, 6, 20, PALETTE.chairChromeShadow);
  fillRect(png, 62, 308, 14, 3, PALETTE.chairChrome);

  // Walnut Table Surface (large 88x34 diamond at y=274)
  fillIsoDiamond(png, 4, 274, 88, 34, PALETTE.confWoodTop);
  // Bevel sides
  for (let y = 0; y < 4; y++) {
    for (let x = 4; x <= 48; x++) {
      const edgeY = 274 + 17 + Math.round((x - 4) * 0.38) + y;
      setPixel(png, x, edgeY, PALETTE.confWoodSide);
    }
    for (let x = 48; x <= 92; x++) {
      const edgeY = 274 + 34 - Math.round((x - 48) * 0.38) + y;
      setPixel(png, x, edgeY, PALETTE.confWoodShadow);
    }
  }
  fillIsoDiamond(png, 4, 274, 88, 34, PALETTE.transparent, PALETTE.woodHighlight);

  // Center Conference Spider Phone Puck
  fillIsoDiamond(png, 42, 287, 12, 6, PALETTE.micPuck);
  setPixel(png, 47, 289, PALETTE.micPuckGreen);
  setPixel(png, 48, 289, PALETTE.micPuckGreen);

  // Executive closed aluminum folders & water tumblers (No upright glowing computer monitors!)
  fillRect(png, 22, 284, 12, 6, PALETTE.laptopSilver);
  fillRect(png, 24, 285, 8, 4, [160, 174, 192, 255]);
  fillRect(png, 62, 284, 12, 6, PALETTE.laptopSilver);
  fillRect(png, 64, 285, 8, 4, [160, 174, 192, 255]);

  // Water tumblers & notebooks
  fillRect(png, 36, 288, 3, 4, [186, 230, 253, 200]);
  fillRect(png, 56, 288, 5, 4, [225, 29, 72, 255]); // red notebook

  // --------------------------------------------------
  // PROP 9: 2.5D Executive Cognac Leather Conference Chair - South-East View (32x48) at [96, 256]
  // Luxurious leather boardroom chair with curved armrests and 5-star chrome base
  // --------------------------------------------------
  fillIsoDiamond(png, 100, 292, 24, 10, PALETTE.floorShadow);
  // Chrome 5-star swivel base & caster wheels
  fillRect(png, 110, 292, 4, 6, PALETTE.chairChrome);
  fillRect(png, 104, 296, 16, 2, PALETTE.chairChrome);
  setPixel(png, 104, 298, PALETTE.chairMeshDark); // caster
  setPixel(png, 119, 298, PALETTE.chairMeshDark);

  // Contoured Cognac Leather Seat Cushion
  fillIsoDiamond(png, 102, 280, 20, 10, PALETTE.leatherCognacMid);
  fillIsoDiamond(png, 104, 281, 16, 8, PALETTE.leatherCognacTop);

  // Tailored Leather Backrest with curved headrest corners
  fillRect(png, 105, 264, 14, 16, PALETTE.leatherCognacMid);
  fillRect(png, 106, 265, 12, 14, PALETTE.leatherCognacTop);
  // Vertical stitching line
  fillRect(png, 111, 265, 1, 13, PALETTE.leatherCognacDark);
  // Chamfered top headrest corners (distinct from a monitor!)
  setPixel(png, 105, 264, PALETTE.transparent);
  setPixel(png, 118, 264, PALETTE.transparent);

  // Curved Chrome Armrests on sides
  fillRect(png, 101, 274, 3, 7, PALETTE.chairChrome);
  fillRect(png, 101, 274, 5, 2, PALETTE.chairChrome);
  fillRect(png, 120, 274, 3, 7, PALETTE.chairChrome);
  fillRect(png, 118, 274, 5, 2, PALETTE.chairChrome);

  // --------------------------------------------------
  // PROP 10: 2.5D Modern Breakout Lounge Sofa (64x64) at [128, 256]
  // Deep emerald/teal velvet sofa with mustard accent pillow & wooden peg legs
  // --------------------------------------------------
  fillIsoDiamond(png, 132, 302, 56, 22, PALETTE.floorShadow);
  // Peg wooden legs
  fillRect(png, 138, 300, 3, 8, PALETTE.woodTopDark);
  fillRect(png, 178, 300, 3, 8, PALETTE.woodTopDark);
  fillRect(png, 158, 310, 3, 8, PALETTE.woodTopDark);

  // Sofa Base Cushion
  drawIsoPrism(png, 160, 298, 48, 22, 12, PALETTE.sofaTealTop, PALETTE.sofaTealSide, PALETTE.sofaTealShadow);
  // Sofa Backrest
  drawIsoPrism(png, 152, 286, 44, 14, 16, PALETTE.sofaTealSide, PALETTE.sofaTealShadow, PALETTE.sofaTealTop);
  // Throw pillow (mustard yellow)
  fillRect(png, 166, 284, 8, 8, PALETTE.pillowYellow);
  fillRect(png, 167, 285, 6, 6, PALETTE.stickyYellow);

  // --------------------------------------------------
  // PROP 11: 2.5D Modern Low Coffee Table (48x32) at [192, 256]
  // --------------------------------------------------
  fillIsoDiamond(png, 196, 276, 40, 16, PALETTE.floorShadow);
  drawIsoPrism(png, 216, 272, 32, 16, 8, PALETTE.deskSurfaceTop, PALETTE.deskSurfaceSide, PALETTE.deskSurfaceShadow);
  // Tech magazine & coffee mug
  fillRect(png, 210, 262, 6, 4, PALETTE.syntaxCyan);
  fillRect(png, 220, 261, 3, 3, PALETTE.white);

  // --------------------------------------------------
  // PROP 12: Classic FF White Pointing Glove Cursor (24x24) at [240, 256]
  // --------------------------------------------------
  const cursorMap = [
    [0, 0], [1, 0], [2, 0],
    [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
    [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
    [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3],
    [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4],
    [3, 5], [4, 5], [5, 5], [6, 5], [7, 5],
  ];
  for (const [cx, cy] of cursorMap) {
    setPixel(png, 244 + cx * 2, 260 + cy * 2, PALETTE.white);
    setPixel(png, 245 + cx * 2, 260 + cy * 2, PALETTE.white);
    setPixel(png, 244 + cx * 2, 261 + cy * 2, PALETTE.white);
    setPixel(png, 245 + cx * 2, 261 + cy * 2, PALETTE.white);
  }
  // Crisp dark outline
  for (let x = 242; x < 262; x++) {
    for (let y = 258; y < 274; y++) {
      if (png.data[(png.width * y + x) * 4 + 3] === 255) {
        // check neighbors
        for (const [nx, ny] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nidx = (png.width * (y + ny) + (x + nx)) * 4;
          if (png.data[nidx + 3] === 0) {
            setPixel(png, x + nx, y + ny, PALETTE.black);
          }
        }
      }
    }
  }

  // --------------------------------------------------
  // PROP 13: Drop Dust / Landing Sparkle (32x32) at [264, 256]
  // Used when an agent is dropped back onto the floor
  // --------------------------------------------------
  fillIsoDiamond(png, 268, 272, 24, 10, [255, 255, 255, 120]);
  setPixel(png, 280, 268, PALETTE.goldStar);
  setPixel(png, 276, 274, PALETTE.goldStar);
  setPixel(png, 284, 274, PALETTE.goldStar);
  setPixel(png, 280, 278, PALETTE.goldStar);

  // --------------------------------------------------
  // PROP 14: 2.5D Executive Cognac Leather Conference Chair - Rear Facing View (32x48) at [304, 256]
  // (View from behind, for chairs on the front side of conference table)
  // --------------------------------------------------
  fillIsoDiamond(png, 308, 292, 24, 10, PALETTE.floorShadow);
  // Chrome 5-star swivel base & casters
  fillRect(png, 318, 292, 4, 6, PALETTE.chairChrome);
  fillRect(png, 312, 296, 16, 2, PALETTE.chairChrome);
  setPixel(png, 312, 298, PALETTE.chairMeshDark);
  setPixel(png, 327, 298, PALETTE.chairMeshDark);

  // Rear Cognac Leather Backrest with curved shoulders
  fillRect(png, 312, 266, 16, 18, PALETTE.leatherCognacMid);
  fillRect(png, 314, 268, 12, 14, PALETTE.leatherCognacDark);
  // Lumbar support strap
  fillRect(png, 312, 276, 16, 2, PALETTE.leatherCognacShadow);
  // Chamfered top shoulders
  setPixel(png, 312, 266, PALETTE.transparent);
  setPixel(png, 327, 266, PALETTE.transparent);

  // Curved chrome armrests extending forward
  fillRect(png, 309, 275, 3, 8, PALETTE.chairChrome);
  fillRect(png, 328, 275, 3, 8, PALETTE.chairChrome);

  return png;
}

// ====================================================
// 2. GENERATE MODERN 2.5D CHARACTER SPRITESHEETS (128x432)
// (4 frames wide x 32px, 9 rows high x 48px)
// Proportions & style: Modern Final Fantasy 6+ / Tactics simulation developer
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

function drawDeveloperFrame25D(
  png: PNG,
  frame: number,
  row: number,
  theme: TechAgentTheme,
  action: 'idle' | 'walk' | 'type' | 'think' | 'celebrate' | 'dragged',
  dir: 'se' | 'ne' | 'sw'
) {
  const ox = frame * 32;
  const oy = row * 48;

  // Stride bounce & breathing
  const idleBob = (action === 'idle' || action === 'type') && frame % 2 === 1 ? 1 : 0;
  const walkBob = action === 'walk' ? (frame % 2 === 1 ? -1 : 1) : 0;
  const dragFloat = action === 'dragged' ? -12 : 0; // Float 12px in the air while dragged!
  const yOffset = idleBob + walkBob + dragFloat;

  // Floor Shadow beneath sneakers (remains on floor even when dragged!)
  if (action === 'dragged') {
    // Faint smaller shadow on floor beneath picked-up hero
    fillIsoDiamond(png, ox + 6, oy + 40, 20, 8, [12, 16, 26, 80]);
  } else {
    fillIsoDiamond(png, ox + 6, oy + 40, 20, 8, PALETTE.floorShadow);
  }

  // 1. PANTS & SNEAKERS (y = 32 to 44)
  const legSwing = action === 'walk' ? (frame % 2 === 0 ? 2 : -2) : 0;
  const dangleLeg = action === 'dragged' ? (frame % 2 === 0 ? 2 : -1) : 0;

  if (dir === 'se') {
    // South-East 3/4 Isometric View:
    // Left leg (far leg)
    fillRect(png, ox + 11, oy + 32 + yOffset, 4, 8 - legSwing + dangleLeg, theme.pantsColor);
    fillRect(png, ox + 10, oy + 40 + yOffset - legSwing + dangleLeg, 5, 3, theme.shoesColor);
    fillRect(png, ox + 10, oy + 42 + yOffset - legSwing + dangleLeg, 5, 1, PALETTE.white);
    // Right leg (near leg)
    fillRect(png, ox + 17, oy + 32 + yOffset, 5, 9 + legSwing - dangleLeg, theme.pantsColor);
    fillRect(png, ox + 17, oy + 41 + yOffset + legSwing - dangleLeg, 6, 3, theme.shoesColor);
    fillRect(png, ox + 17, oy + 43 + yOffset + legSwing - dangleLeg, 6, 1, PALETTE.white);
  } else if (dir === 'sw') {
    // South-West 3/4 Isometric View:
    fillRect(png, ox + 10, oy + 32 + yOffset, 5, 9 + legSwing - dangleLeg, theme.pantsColor);
    fillRect(png, ox + 9, oy + 41 + yOffset + legSwing - dangleLeg, 6, 3, theme.shoesColor);
    fillRect(png, ox + 9, oy + 43 + yOffset + legSwing - dangleLeg, 6, 1, PALETTE.white);
    fillRect(png, ox + 17, oy + 32 + yOffset, 4, 8 - legSwing + dangleLeg, theme.pantsColor);
    fillRect(png, ox + 17, oy + 40 + yOffset - legSwing + dangleLeg, 5, 3, theme.shoesColor);
    fillRect(png, ox + 17, oy + 42 + yOffset - legSwing + dangleLeg, 5, 1, PALETTE.white);
  } else {
    // North-East Isometric View (facing desk/away):
    fillRect(png, ox + 11, oy + 32 + yOffset, 4, 8 + legSwing, theme.pantsColor);
    fillRect(png, ox + 11, oy + 40 + yOffset + legSwing, 5, 3, theme.shoesColor);
    fillRect(png, ox + 17, oy + 32 + yOffset, 4, 8 - legSwing, theme.pantsColor);
    fillRect(png, ox + 17, oy + 40 + yOffset - legSwing, 5, 3, theme.shoesColor);
  }

  // 2. TORSO / HOODIE / CLOTHING (y = 18 to 32)
  const torsoY = oy + 18 + yOffset;
  fillRect(png, ox + 9, torsoY, 14, 14, theme.hoodieColor);
  fillRect(png, ox + 9, torsoY + 12, 14, 2, theme.hoodieDark); // hem
  fillRect(png, ox + 9, torsoY, 14, 1, theme.hoodieLight); // shoulder highlight

  // Brand Chest Emblem or Logo (Front/Side 3/4 view)
  if (dir === 'se' || dir === 'sw') {
    const lx = dir === 'se' ? ox + 14 : ox + 12;
    if (theme.chestLogo === 'pi') {
      fillRect(png, lx, torsoY + 4, 4, 1, theme.brandAccent);
      fillRect(png, lx, torsoY + 5, 1, 3, theme.brandAccent);
      fillRect(png, lx + 3, torsoY + 5, 1, 3, theme.brandAccent);
    } else if (theme.chestLogo === 'c') {
      fillRect(png, lx, torsoY + 4, 4, 1, theme.brandAccent);
      fillRect(png, lx, torsoY + 5, 1, 2, theme.brandAccent);
      fillRect(png, lx, torsoY + 7, 4, 1, theme.brandAccent);
    } else if (theme.chestLogo === 'code') {
      setPixel(png, lx, torsoY + 5, theme.brandAccent);
      setPixel(png, lx + 3, torsoY + 5, theme.brandAccent);
    } else if (theme.chestLogo === 'gemini') {
      fillRect(png, lx + 1, torsoY + 4, 2, 3, theme.brandAccent);
      fillRect(png, lx, torsoY + 5, 4, 1, theme.brandAccent);
    }
  }

  // 3. HEAD, EXPRESSIVE FACE & STYLISH HAIR (y = 5 to 19)
  const headY = oy + 5 + yOffset;

  if (dir === 'se' || dir === 'sw') {
    // 3/4 View Head & Face
    fillRect(png, ox + 10, headY + 4, 12, 10, theme.skinColor);
    fillRect(png, ox + 11, headY + 12, 10, 2, theme.skinShadow);

    // Expressive Eyes
    if (action === 'celebrate') {
      // Cheerful anime curved eyes (^_^)
      fillRect(png, ox + 12, headY + 6, 3, 1, PALETTE.black);
      fillRect(png, ox + 17, headY + 6, 3, 1, PALETTE.black);
      setPixel(png, ox + 11, headY + 7, PALETTE.black);
      setPixel(png, ox + 14, headY + 7, PALETTE.black);
      setPixel(png, ox + 16, headY + 7, PALETTE.black);
      setPixel(png, ox + 19, headY + 7, PALETTE.black);
    } else if (action === 'dragged') {
      // Surprised cute wide eyes (o_o) while being dragged!
      fillRect(png, ox + 12, headY + 6, 3, 4, PALETTE.white);
      fillRect(png, ox + 17, headY + 6, 3, 4, PALETTE.white);
      fillRect(png, ox + 13, headY + 7, 2, 2, PALETTE.black);
      fillRect(png, ox + 18, headY + 7, 2, 2, PALETTE.black);
      setPixel(png, ox + 13, headY + 7, PALETTE.white); // shine
      setPixel(png, ox + 18, headY + 7, PALETTE.white);
      // Small open mouth :o
      fillRect(png, ox + 15, headY + 11, 2, 2, theme.skinShadow);
    } else if (action === 'think') {
      // Quizzical look
      fillRect(png, ox + 12, headY + 6, 3, 3, PALETTE.white);
      fillRect(png, ox + 17, headY + 6, 3, 3, PALETTE.white);
      setPixel(png, ox + 13, headY + 6, PALETTE.black);
      setPixel(png, ox + 18, headY + 6, PALETTE.black);
      fillRect(png, ox + 12, headY + 5, 3, 1, theme.hairColor);
      fillRect(png, ox + 17, headY + 4, 3, 1, theme.hairColor);
    } else {
      // Focused intelligent eyes
      fillRect(png, ox + 12, headY + 7, 3, 2, PALETTE.white);
      fillRect(png, ox + 17, headY + 7, 3, 2, PALETTE.white);
      setPixel(png, ox + 13, headY + 7, PALETTE.black);
      setPixel(png, ox + 18, headY + 7, PALETTE.black);
      setPixel(png, ox + 12, headY + 7, PALETTE.white);
      setPixel(png, ox + 17, headY + 7, PALETTE.white);
      fillRect(png, ox + 12, headY + 5, 3, 1, theme.hairColor);
      fillRect(png, ox + 17, headY + 5, 3, 1, theme.hairColor);
    }

    // Modern Stylish Glasses
    if (theme.hasGlasses) {
      fillRect(png, ox + 11, headY + 6, 4, 3, PALETTE.black);
      fillRect(png, ox + 17, headY + 6, 4, 3, PALETTE.black);
      fillRect(png, ox + 15, headY + 7, 2, 1, PALETTE.black);
      setPixel(png, ox + 12, headY + 6, PALETTE.glassGlare);
      setPixel(png, ox + 18, headY + 6, PALETTE.glassGlare);
    }

    // Layered Textured Hair
    fillRect(png, ox + 9, headY, 14, 6, theme.hairColor);
    fillRect(png, ox + 10, headY - 1, 12, 2, theme.hairHighlight);
    fillRect(png, ox + 8, headY + 2, 2, 6, theme.hairColor);
    fillRect(png, ox + 22, headY + 2, 2, 6, theme.hairColor);
    fillRect(png, ox + 11, headY + 4, 2, 2, theme.hairColor);
    fillRect(png, ox + 15, headY + 4, 3, 2, theme.hairColor);
  } else {
    // Back View (NE): Hair volume and back collar
    fillRect(png, ox + 9, headY, 14, 14, theme.hairColor);
    fillRect(png, ox + 10, headY - 1, 12, 3, theme.hairHighlight);
    fillRect(png, ox + 8, headY + 3, 2, 10, theme.hairColor);
    fillRect(png, ox + 22, headY + 3, 2, 10, theme.hairColor);
    fillRect(png, ox + 10, headY + 12, 12, 2, theme.hoodieDark);
  }

  // 4. TECH ACCESSORIES (Headsets, Earbuds)
  if (theme.hasHeadset) {
    fillRect(png, ox + 8, headY + 5, 2, 6, PALETTE.serverBlack);
    fillRect(png, ox + 22, headY + 5, 2, 6, PALETTE.serverBlack);
    setPixel(png, ox + 8, headY + 7, theme.brandAccent);
    setPixel(png, ox + 23, headY + 7, theme.brandAccent);
    if (dir === 'se') {
      fillRect(png, ox + 10, headY + 10, 3, 1, PALETTE.serverBlack);
      setPixel(png, ox + 13, headY + 10, theme.brandAccent);
    }
  }

  // 5. ARMS, HANDS & ACTION POSES
  if (action === 'type') {
    // Rapid typing at mechanical keyboard
    const handLeftY = frame % 2 === 0 ? -1 : 1;
    const handRightY = frame % 2 === 0 ? 1 : -1;
    fillRect(png, ox + 6, torsoY + 2, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 6, torsoY + 9 + handLeftY, 4, 3, theme.skinColor);
    fillRect(png, ox + 23, torsoY + 2, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 22, torsoY + 9 + handRightY, 4, 3, theme.skinColor);
    // Cyan monitor light reflection on chest & hands!
    fillRect(png, ox + 11, torsoY + 8, 10, 1, PALETTE.syntaxCyan);
  } else if (action === 'dragged') {
    // Arms flailing out slightly in surprise while being held!
    fillRect(png, ox + 4, torsoY - 2, 4, 8, theme.hoodieColor);
    fillRect(png, ox + 24, torsoY - 2, 4, 8, theme.hoodieColor);
    fillRect(png, ox + 3, torsoY + 5, 3, 3, theme.skinColor);
    fillRect(png, ox + 26, torsoY + 5, 3, 3, theme.skinColor);
  } else if (action === 'celebrate') {
    // Arms raised high in victory!
    fillRect(png, ox + 5, torsoY - 6, 3, 10, theme.hoodieColor);
    fillRect(png, ox + 24, torsoY - 6, 3, 10, theme.hoodieColor);
    fillRect(png, ox + 4, torsoY - 9, 4, 4, theme.skinColor);
    fillRect(png, ox + 24, torsoY - 9, 4, 4, theme.skinColor);
    // Sparkle stars
    setPixel(png, ox + 2, torsoY - 10, PALETTE.goldStar);
    setPixel(png, ox + 28, torsoY - 10, PALETTE.goldStar);
  } else if (action === 'think') {
    fillRect(png, ox + 5, torsoY + 2, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 4, torsoY + 7, 5, 6, PALETTE.laptopSilver); // tablet
    fillRect(png, ox + 23, torsoY - 1, 3, 7, theme.hoodieColor);
    fillRect(png, ox + 21, headY + 8, 4, 3, theme.skinColor);
  } else {
    // Normal resting / walking arms
    const armSwing = action === 'walk' ? (frame % 2 === 0 ? 2 : -2) : 0;
    fillRect(png, ox + 6, torsoY + 2 + armSwing, 3, 8, theme.hoodieColor);
    fillRect(png, ox + 6, torsoY + 10 + armSwing, 3, 3, theme.skinColor);
    fillRect(png, ox + 23, torsoY + 2 - armSwing, 3, 8, theme.hoodieColor);
    fillRect(png, ox + 23, torsoY + 10 - armSwing, 3, 3, theme.skinColor);
  }
}

export function generateTechDeveloperSpritesheet25D(theme: TechAgentTheme): PNG {
  const png = createPNG(128, 432); // 4 frames x 9 rows (32x48 each)

  // Row 0: Idle South-East (Breathing, facing forward-right)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 0, theme, 'idle', 'se');
  // Row 1: Idle North-East (Sitting/facing away towards workstation desk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 1, theme, 'idle', 'ne');
  // Row 2: Walk South-East (Smooth 4-frame isometric walk)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 2, theme, 'walk', 'se');
  // Row 3: Walk North-East (Smooth 4-frame isometric walk away)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 3, theme, 'walk', 'ne');
  // Row 4: Walk South-West (Smooth 4-frame isometric walk forward-left)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 4, theme, 'walk', 'sw');
  // Row 5: Typing on Mechanical Keyboard (Hands tapping, monitor glow)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 5, theme, 'type', 'ne');
  // Row 6: Reading / Thinking / Reviewing PR
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 6, theme, 'think', 'se');
  // Row 7: Done / Celebratory Fanfare (Arms up, sparkles)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 7, theme, 'celebrate', 'se');
  // Row 8: Dragged / Picked Up (Floating, surprised face, dangling legs!)
  for (let f = 0; f < 4; f++) drawDeveloperFrame25D(png, f, 8, theme, 'dragged', 'se');

  return png;
}

// ====================================================
// 3. MAIN PIPELINE EXECUTION
// ====================================================
const clientAssets = path.resolve(process.cwd(), 'client/public/assets');
console.log('Generating 2.5D Isometric Simulation Game assets in:', clientAssets);

// 1. Generate Modern 2.5D Office Tileset (512x512)
const tileset = generateModernOfficeTileset();
savePNG(tileset, path.join(clientAssets, 'tiles/office_tiles.png'));

// 2. Generate Developer Character Spritesheets (128x432)
const agentThemes: Record<string, TechAgentTheme> = {
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
    brandAccent: [34, 197, 94, 255],
    hasHeadset: true,
    chestLogo: 'pi',
  },
  claude: {
    name: 'Claude',
    hoodieColor: [217, 83, 30, 255],
    hoodieLight: [244, 114, 62, 255],
    hoodieDark: [168, 58, 18, 255],
    pantsColor: [72, 64, 54, 255],
    shoesColor: [88, 52, 28, 255],
    hairColor: [64, 36, 24, 255],
    hairHighlight: [118, 68, 38, 255],
    skinColor: [255, 228, 204, 255],
    skinShadow: [220, 168, 138, 255],
    brandAccent: [250, 204, 21, 255],
    hasGlasses: true,
    chestLogo: 'c',
  },
  codex: {
    name: 'Codex',
    hoodieColor: [30, 78, 200, 255],
    hoodieLight: [59, 130, 246, 255],
    hoodieDark: [22, 58, 150, 255],
    pantsColor: [24, 28, 36, 255],
    shoesColor: [44, 64, 98, 255],
    hairColor: [232, 190, 80, 255],
    hairHighlight: [254, 230, 136, 255],
    skinColor: [255, 230, 208, 255],
    skinShadow: [222, 170, 140, 255],
    brandAccent: [34, 211, 238, 255],
    hasHeadset: true,
    chestLogo: 'code',
  },
  gemini: {
    name: 'Gemini',
    hoodieColor: [90, 40, 180, 255],
    hoodieLight: [147, 51, 234, 255],
    hoodieDark: [60, 20, 130, 255],
    pantsColor: [24, 24, 36, 255],
    shoesColor: [220, 226, 240, 255],
    hairColor: [180, 120, 240, 255],
    hairHighlight: [220, 180, 255, 255],
    skinColor: [255, 228, 206, 255],
    skinShadow: [220, 168, 140, 255],
    brandAccent: [192, 132, 252, 255],
    hasEarbuds: true,
    chestLogo: 'gemini',
  },
};

for (const [key, theme] of Object.entries(agentThemes)) {
  const sprite = generateTechDeveloperSpritesheet25D(theme);
  savePNG(sprite, path.join(clientAssets, `characters/character_${key}.png`));
}

// 3. Generate Asset Manifest JSON
const manifest = {
  name: 'herdr-office-2.5d-isometric',
  version: '5.0.0',
  tileSize: 32, // nominal grid cell
  isoTileWidth: 64,
  isoTileHeight: 32,
  tileset: {
    path: '/assets/tiles/office_tiles.png',
    width: 512,
    height: 512,
    tiles: {
      floor_wood: { x: 0, y: 0, w: 64, h: 32 },
      floor_carpet: { x: 64, y: 0, w: 64, h: 32 },
      floor_tile: { x: 128, y: 0, w: 64, h: 32 },
      floor_stone: { x: 128, y: 0, w: 64, h: 32 },
      floor_conference: { x: 192, y: 0, w: 64, h: 32 },
      foundation_edge_sw: { x: 256, y: 0, w: 64, h: 48 },
      foundation_edge_se: { x: 320, y: 0, w: 64, h: 48 },
      grid_cell_hover: { x: 384, y: 0, w: 64, h: 32 },
      selection_halo: { x: 448, y: 0, w: 64, h: 32 },

      // Walls
      wall_top: { x: 192, y: 64, w: 64, h: 96 },
      wall_window: { x: 0, y: 64, w: 64, h: 96 },
      wall_whiteboard: { x: 64, y: 64, w: 64, h: 96 },
      wall_server: { x: 128, y: 64, w: 64, h: 96 },
      wall_bookshelf: { x: 256, y: 64, w: 64, h: 96 },
      wall_dashboard: { x: 320, y: 64, w: 64, h: 96 },
      wall_art: { x: 384, y: 64, w: 64, h: 96 },
      wall_window_ne: { x: 448, y: 64, w: 64, h: 96 },

      // Furniture & Props
      desk: { x: 0, y: 160, w: 64, h: 64 },
      chair: { x: 64, y: 160, w: 32, h: 48 },
      chair_front: { x: 96, y: 160, w: 32, h: 48 },
      water_cooler: { x: 128, y: 160, w: 32, h: 64 },
      espresso_bar: { x: 160, y: 160, w: 64, h: 64 },
      coffee_bar: { x: 160, y: 160, w: 64, h: 64 },
      plant: { x: 224, y: 160, w: 48, h: 64 },
      server_rack: { x: 288, y: 160, w: 48, h: 80 },

      conference_table: { x: 0, y: 256, w: 96, h: 64 },
      conference_chair: { x: 96, y: 256, w: 32, h: 48 },
      conf_chair_back: { x: 304, y: 256, w: 32, h: 48 },
      lounge_sofa: { x: 128, y: 256, w: 64, h: 64 },
      coffee_table: { x: 192, y: 256, w: 48, h: 32 },
      cursor_hand: { x: 240, y: 256, w: 24, h: 24 },
      drop_dust: { x: 264, y: 256, w: 32, h: 32 },
    },
  },
  characters: {
    frameWidth: 32,
    frameHeight: 48,
    variants: {
      default: '/assets/characters/character_pi.png',
      pi: '/assets/characters/character_pi.png',
      claude: '/assets/characters/character_claude.png',
      codex: '/assets/characters/character_codex.png',
      gemini: '/assets/characters/character_gemini.png',
    },
    animations: {
      idle_se: { row: 0, frames: [0, 1, 2, 3], frameRate: 3 },
      idle_ne: { row: 1, frames: [0, 1, 2, 3], frameRate: 3 },
      walk_se: { row: 2, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_ne: { row: 3, frames: [0, 1, 2, 3], frameRate: 6 },
      walk_sw: { row: 4, frames: [0, 1, 2, 3], frameRate: 6 },
      type: { row: 5, frames: [0, 1, 2, 3], frameRate: 8 },
      think: { row: 6, frames: [0, 1, 2, 3], frameRate: 4 },
      celebrate: { row: 7, frames: [0, 1, 2, 3], frameRate: 4 },
      dragged: { row: 8, frames: [0, 1, 2, 3], frameRate: 4 },
    },
  },
};

fs.writeFileSync(path.join(clientAssets, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Saved 2.5D pixel art asset manifest:', path.join(clientAssets, 'manifest.json'));

export interface DeskStation {
  id: string;
  name?: string;
  deskCol: number;
  deskRow: number;
}

export const OFFICE_COLS = 16;
export const OFFICE_ROWS = 14;

export const ISO_TILE_WIDTH = 64;
export const ISO_TILE_HEIGHT = 32;

/**
 * Transforms simulation grid coordinates (col, row) to screen 2.5D isometric coordinates (x, y)
 */
export function gridToIso(col: number, row: number, originX: number, originY: number): { x: number; y: number } {
  return {
    x: originX + (col - row) * (ISO_TILE_WIDTH / 2),
    y: originY + (col + row) * (ISO_TILE_HEIGHT / 2),
  };
}

/**
 * Transforms screen 2.5D isometric coordinates (x, y) back to simulation grid coordinates (col, row)
 */
export function isoToGrid(screenX: number, screenY: number, originX: number, originY: number): { col: number; row: number } {
  const dx = screenX - originX;
  const dy = screenY - originY;
  const col = (dx / (ISO_TILE_WIDTH / 2) + dy / (ISO_TILE_HEIGHT / 2)) / 2;
  const row = (dy / (ISO_TILE_HEIGHT / 2) - dx / (ISO_TILE_WIDTH / 2)) / 2;
  return { col, row };
}

// 8 Spacious Modern Workstation Pods (Organized in 2 collaborative 4-person team benches)
export const DESK_STATIONS: DeskStation[] = [
  // Team Alpha (AI & Core Eng - North Pod)
  { id: 'desk-1', name: 'Core Eng 1', deskCol: 3.5, deskRow: 3.5 },
  { id: 'desk-2', name: 'Core Eng 2', deskCol: 5.0, deskRow: 3.5 },
  { id: 'desk-3', name: 'AI Research 1', deskCol: 7.5, deskRow: 3.5 },
  { id: 'desk-4', name: 'AI Research 2', deskCol: 9.0, deskRow: 3.5 },

  // Team Beta (Fullstack & Design - Mid Pod)
  { id: 'desk-5', name: 'Fullstack 1', deskCol: 3.5, deskRow: 6.5 },
  { id: 'desk-6', name: 'Fullstack 2', deskCol: 5.0, deskRow: 6.5 },
  { id: 'desk-7', name: 'Design & UI 1', deskCol: 7.5, deskRow: 6.5 },
  { id: 'desk-8', name: 'Design & UI 2', deskCol: 9.0, deskRow: 6.5 },
];

/**
 * Returns a guaranteed unique desk station for any agent index without overlapping!
 */
export function getStationForIndex(index: number): DeskStation {
  if (index < DESK_STATIONS.length) {
    return DESK_STATIONS[index];
  }
  // Safely generate extra desk spots if more than 8 agents
  const extraIndex = index - DESK_STATIONS.length;
  const extraCol = 3.5 + (extraIndex % 4) * 1.8;
  const extraRow = 9.5 + Math.floor(extraIndex / 4) * 1.5;
  return {
    id: `desk-extra-${index + 1}`,
    name: `Aux Station ${index + 1}`,
    deskCol: Math.min(extraCol, OFFICE_COLS - 2),
    deskRow: Math.min(extraRow, OFFICE_ROWS - 2),
  };
}

export interface PointOfInterest {
  id: string;
  name: string;
  col: number;
  row: number;
  slots: { col: number; row: number }[];
}

export const OFFICE_POIS: PointOfInterest[] = [
  {
    id: 'coffee',
    name: 'Espresso Bar',
    col: 13.8,
    row: 2.0,
    slots: [
      { col: 13.0, row: 2.8 },
      { col: 14.2, row: 2.8 },
    ],
  },
  {
    id: 'water_cooler',
    name: 'Water Cooler',
    col: 14.8,
    row: 3.2,
    slots: [
      { col: 14.2, row: 3.8 },
    ],
  },
  {
    id: 'whiteboard',
    name: 'Sprint Kanban Whiteboard',
    col: 5.5,
    row: 1.0,
    slots: [
      { col: 4.8, row: 1.6 },
      { col: 5.8, row: 1.6 },
    ],
  },
  {
    id: 'server',
    name: 'Server Rack Wall',
    col: 10.5,
    row: 1.0,
    slots: [
      { col: 10.0, row: 1.6 },
      { col: 11.0, row: 1.6 },
    ],
  },
  {
    id: 'conference',
    name: 'Executive Conference Room',
    col: 13.0,
    row: 9.5,
    slots: [
      { col: 12.2, row: 8.7 },
      { col: 13.0, row: 8.7 },
      { col: 13.8, row: 8.7 },
      { col: 12.2, row: 10.3 },
      { col: 13.0, row: 10.3 },
      { col: 13.8, row: 10.3 },
    ],
  },
  {
    id: 'lounge',
    name: 'Breakout Lounge',
    col: 13.0,
    row: 5.0,
    slots: [
      { col: 12.5, row: 5.2 },
      { col: 13.5, row: 5.2 },
    ],
  },
];

export const GUILD_POIS = OFFICE_POIS;

export type OfficeTileType =
  | 'floor_wood'
  | 'floor_carpet'
  | 'floor_tile'
  | 'floor_stone'
  | 'floor_conference'
  | 'wall_top'
  | 'wall_window'
  | 'wall_whiteboard'
  | 'wall_server'
  | 'wall_bookshelf'
  | 'wall_dashboard'
  | 'wall_art';

export interface OfficeTile {
  type: OfficeTileType;
}

export function createOfficeMap(): OfficeTile[][] {
  const map: OfficeTile[][] = [];

  for (let r = 0; r < OFFICE_ROWS; r++) {
    const row: OfficeTile[] = [];
    for (let c = 0; c < OFFICE_COLS; c++) {
      if (c >= 11 && r <= 5) {
        // Breakroom Ceramic Checkerboard Floor
        row.push({ type: 'floor_tile' });
      } else if (c >= 11 && r >= 7) {
        // Executive Conference Walnut Parquet Floor
        row.push({ type: 'floor_conference' });
      } else if (c >= 2 && c <= 10 && r >= 2 && r <= 8) {
        // Modern Navy Slate Carpet under Workstation Pods
        row.push({ type: 'floor_carpet' });
      } else {
        // Polished Honey Oak Parquet Hardwood Floor
        row.push({ type: 'floor_wood' });
      }
    }
    map.push(row);
  }

  return map;
}

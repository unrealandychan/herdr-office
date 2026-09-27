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

// 12 Spacious Modern Workstation Pods
export const DESK_STATIONS: DeskStation[] = [
  // Pod 1 (West Pod - North)
  { id: 'desk-1', name: 'Dev Station 1', deskCol: 3, deskRow: 3 },
  { id: 'desk-2', name: 'Dev Station 2', deskCol: 6, deskRow: 3 },

  // Pod 2 (West Pod - Mid)
  { id: 'desk-3', name: 'Dev Station 3', deskCol: 3, deskRow: 6.5 },
  { id: 'desk-4', name: 'Dev Station 4', deskCol: 6, deskRow: 6.5 },

  // Pod 3 (West Pod - South)
  { id: 'desk-5', name: 'Dev Station 5', deskCol: 3, deskRow: 10 },
  { id: 'desk-6', name: 'Dev Station 6', deskCol: 6, deskRow: 10 },

  // Pod 4 (Central Pod)
  { id: 'desk-7', name: 'Dev Station 7', deskCol: 9, deskRow: 3 },
  { id: 'desk-8', name: 'Dev Station 8', deskCol: 9, deskRow: 6.5 },
  { id: 'desk-9', name: 'Dev Station 9', deskCol: 9, deskRow: 10 },

  // Pod 5 (East Pod)
  { id: 'desk-10', name: 'Dev Station 10', deskCol: 11.5, deskRow: 3 },
  { id: 'desk-11', name: 'Dev Station 11', deskCol: 11.5, deskRow: 5.5 },
  { id: 'desk-12', name: 'Dev Station 12', deskCol: 1.5, deskRow: 6.5 },
];

/**
 * Returns a guaranteed unique desk station for any agent index without overlapping!
 */
export function getStationForIndex(index: number): DeskStation {
  if (index < DESK_STATIONS.length) {
    return DESK_STATIONS[index];
  }
  // Safely generate extra desk spots if more than 12 agents
  const extraIndex = index - DESK_STATIONS.length;
  const extraCol = 1.5 + (extraIndex % 3) * 1.5;
  const extraRow = 9.5 + Math.floor(extraIndex / 3) * 1.5;
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
    col: 14.0,
    row: 2.0,
    slots: [
      { col: 13.2, row: 2.8 },
      { col: 14.0, row: 3.2 },
      { col: 13.0, row: 3.6 },
    ],
  },
  {
    id: 'water_cooler',
    name: 'Water Cooler',
    col: 15.0,
    row: 3.0,
    slots: [
      { col: 14.6, row: 3.8 },
      { col: 15.2, row: 3.5 },
    ],
  },
  {
    id: 'whiteboard',
    name: 'Sprint Kanban Whiteboard',
    col: 5.5,
    row: 1.2,
    slots: [
      { col: 4.8, row: 1.8 },
      { col: 5.8, row: 1.8 },
      { col: 6.8, row: 1.8 },
    ],
  },
  {
    id: 'server',
    name: 'Server Rack Wall',
    col: 11.0,
    row: 1.2,
    slots: [
      { col: 10.6, row: 1.8 },
      { col: 11.4, row: 1.8 },
    ],
  },
  {
    id: 'conference',
    name: 'Executive Conference Room',
    col: 13.0,
    row: 9.0,
    slots: [
      { col: 12.2, row: 7.8 },
      { col: 13.0, row: 7.8 },
      { col: 13.8, row: 7.8 },
      { col: 12.2, row: 10.2 },
      { col: 13.0, row: 10.2 },
      { col: 13.8, row: 10.2 },
      { col: 11.4, row: 9.0 },
      { col: 14.6, row: 9.0 },
    ],
  },
  {
    id: 'lounge',
    name: 'Breakout Lounge',
    col: 13.0,
    row: 5.0,
    slots: [
      { col: 12.6, row: 5.0 },
      { col: 13.5, row: 5.2 },
      { col: 12.2, row: 5.6 },
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
      if (r === 0) {
        // Back Wall North-West (sloping down-right)
        if (c >= 1 && c <= 3) {
          row.push({ type: 'wall_window' });
        } else if (c >= 4 && c <= 6) {
          row.push({ type: 'wall_whiteboard' });
        } else if (c >= 7 && c <= 9) {
          row.push({ type: 'wall_window' });
        } else if (c >= 10 && c <= 12) {
          row.push({ type: 'wall_server' });
        } else {
          row.push({ type: 'wall_top' });
        }
      } else if (c === 0) {
        // Back Wall North-East (sloping down-left)
        if (r >= 1 && r <= 3) {
          row.push({ type: 'wall_bookshelf' });
        } else if (r >= 4 && r <= 6) {
          row.push({ type: 'wall_window' });
        } else if (r >= 7 && r <= 9) {
          row.push({ type: 'wall_dashboard' });
        } else {
          row.push({ type: 'wall_art' });
        }
      } else if (c >= 11 && r <= 5) {
        // Breakroom Ceramic Checkerboard Floor
        row.push({ type: 'floor_tile' });
      } else if (c >= 11 && r >= 7) {
        // Executive Conference Walnut Parquet Floor
        row.push({ type: 'floor_conference' });
      } else if (
        (c >= 2 && c <= 7 && r >= 2 && r <= 4) ||
        (c >= 2 && c <= 7 && r >= 5 && r <= 8) ||
        (c >= 2 && c <= 7 && r >= 9 && r <= 12) ||
        (c >= 8 && c <= 10 && r >= 2 && r <= 11)
      ) {
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

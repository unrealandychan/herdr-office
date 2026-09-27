export interface DeskStation {
  id: string;
  deskCol: number;
  deskRow: number;
}

export const OFFICE_COLS = 20;
export const OFFICE_ROWS = 14;

export const DESK_STATIONS: DeskStation[] = [
  { id: 'desk-1', deskCol: 2, deskRow: 3 },
  { id: 'desk-2', deskCol: 8, deskRow: 3 },
  { id: 'desk-3', deskCol: 2, deskRow: 6.8 },
  { id: 'desk-4', deskCol: 8, deskRow: 6.8 },
  { id: 'desk-5', deskCol: 2, deskRow: 10.2 },
  { id: 'desk-6', deskCol: 8, deskRow: 10.2 },
];

export interface PointOfInterest {
  id: string;
  name: string;
  col: number;
  row: number;
}

export const OFFICE_POIS: PointOfInterest[] = [
  { id: 'water_cooler', name: 'Water Cooler', col: 18.2, row: 4.2 },
  { id: 'coffee', name: 'Espresso Bar', col: 16.5, row: 3.2 },
  { id: 'whiteboard', name: 'Sprint Whiteboard', col: 5.5, row: 1.6 },
  { id: 'server', name: 'Server Rack', col: 13.5, row: 1.6 },
  { id: 'conference', name: 'Conference Table', col: 15.5, row: 9.0 },
  { id: 'lounge', name: 'Breakout Lounge', col: 6, row: 5.5 },
];

// Compatibility alias for any existing code
export const GUILD_POIS = OFFICE_POIS;

export type OfficeTileType =
  | 'floor_wood'
  | 'floor_carpet'
  | 'floor_stone'
  | 'floor_tile'
  | 'wall_top'
  | 'wall_window'
  | 'wall_whiteboard'
  | 'wall_server'
  | 'wall_bookshelf';

export interface OfficeTile {
  type: OfficeTileType;
}

export function createOfficeMap(): OfficeTile[][] {
  const map: OfficeTile[][] = [];

  for (let r = 0; r < OFFICE_ROWS; r++) {
    const row: OfficeTile[] = [];
    for (let c = 0; c < OFFICE_COLS; c++) {
      if (r === 0) {
        // Back wall of Modern Tech Office
        if (c >= 2 && c <= 4) {
          row.push({ type: 'wall_window' }); // Panoramic city skyline window
        } else if (c === 5 || c === 6) {
          row.push({ type: 'wall_whiteboard' }); // Agile sprint whiteboard
        } else if (c >= 9 && c <= 11) {
          row.push({ type: 'wall_window' }); // Panoramic window
        } else if (c === 13 || c === 14) {
          row.push({ type: 'wall_server' }); // Modern server rack
        } else if (c === 15 || c === 16) {
          row.push({ type: 'wall_bookshelf' }); // Tech bookshelf
        } else if (c >= 18 && c <= 19) {
          row.push({ type: 'wall_window' }); // Corner window
        } else {
          row.push({ type: 'wall_top' }); // Modern off-white drywall with molding
        }
      } else if (c >= 14 && r <= 5) {
        // Breakroom / kitchen ceramic checkerboard floor
        row.push({ type: 'floor_tile' });
      } else if (
        (c >= 1 && c <= 12 && r >= 3 && r <= 5) ||
        (c >= 1 && c <= 12 && r >= 6 && r <= 8) ||
        (c >= 1 && c <= 12 && r >= 10 && r <= 12)
      ) {
        // Modern navy / slate gray carpet tiles under workstation pods
        row.push({ type: 'floor_carpet' });
      } else {
        // Honey oak parquet hardwood floor
        row.push({ type: 'floor_wood' });
      }
    }
    map.push(row);
  }

  return map;
}

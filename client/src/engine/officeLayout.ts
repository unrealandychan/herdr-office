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

export type OfficeTileType =
  | 'floor_wood'
  | 'floor_carpet'
  | 'floor_tile'
  | 'wall_top'
  | 'wall_window'
  | 'wall_whiteboard'
  | 'wall_server';

export interface OfficeTile {
  type: OfficeTileType;
}

export function createOfficeMap(): OfficeTile[][] {
  const map: OfficeTile[][] = [];

  for (let r = 0; r < OFFICE_ROWS; r++) {
    const row: OfficeTile[] = [];
    for (let c = 0; c < OFFICE_COLS; c++) {
      if (r === 0) {
        // Back wall feature alignment
        if (c === 2 || c === 3 || c === 9 || c === 10 || c === 16 || c === 17) {
          row.push({ type: 'wall_window' });
        } else if (c === 5 || c === 6) {
          row.push({ type: 'wall_whiteboard' });
        } else if (c === 13) {
          row.push({ type: 'wall_server' });
        } else {
          row.push({ type: 'wall_top' });
        }
      } else if (c >= 14 && r <= 5) {
        // Breakroom corner
        row.push({ type: 'floor_tile' });
      } else if (
        (c >= 1 && c <= 12 && r >= 3 && r <= 5) ||
        (c >= 1 && c <= 12 && r >= 6 && r <= 8) ||
        (c >= 1 && c <= 12 && r >= 10 && r <= 12)
      ) {
        // Carpet rug under work areas
        row.push({ type: 'floor_carpet' });
      } else {
        // Parquet hardwood floor
        row.push({ type: 'floor_wood' });
      }
    }
    map.push(row);
  }

  return map;
}

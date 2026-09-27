export interface DeskStation {
  id: string;
  deskCol: number;
  deskRow: number;
  chairCol: number;
  chairRow: number;
}

export const OFFICE_COLS = 20;
export const OFFICE_ROWS = 14;

export const DESK_STATIONS: DeskStation[] = [
  { id: 'desk-1', deskCol: 3, deskRow: 3, chairCol: 4, chairRow: 4 },
  { id: 'desk-2', deskCol: 9, deskRow: 3, chairCol: 10, chairRow: 4 },
  { id: 'desk-3', deskCol: 3, deskRow: 7, chairCol: 4, chairRow: 8 },
  { id: 'desk-4', deskCol: 9, deskRow: 7, chairCol: 10, chairRow: 8 },
  { id: 'desk-5', deskCol: 3, deskRow: 10, chairCol: 4, chairRow: 11 },
  { id: 'desk-6', deskCol: 9, deskRow: 10, chairCol: 10, chairRow: 11 },
];

export interface OfficeTile {
  type: 'floor_wood' | 'floor_carpet' | 'floor_tile' | 'wall_top' | 'wall_window';
}

export function createOfficeMap(): OfficeTile[][] {
  const map: OfficeTile[][] = [];

  for (let r = 0; r < OFFICE_ROWS; r++) {
    const row: OfficeTile[] = [];
    for (let c = 0; c < OFFICE_COLS; c++) {
      if (r === 0 || r === 1) {
        // Back wall with windows
        if (c % 4 === 2) {
          row.push({ type: 'wall_window' });
        } else {
          row.push({ type: 'wall_top' });
        }
      } else if (c >= 14 && r <= 6) {
        // Breakroom corner
        row.push({ type: 'floor_tile' });
      } else if (
        (c >= 2 && c <= 12 && r >= 3 && r <= 5) ||
        (c >= 2 && c <= 12 && r >= 7 && r <= 9) ||
        (c >= 2 && c <= 12 && r >= 10 && r <= 12)
      ) {
        // Carpet rug under work areas
        row.push({ type: 'floor_carpet' });
      } else {
        // Wood floor bullpen
        row.push({ type: 'floor_wood' });
      }
    }
    map.push(row);
  }

  return map;
}

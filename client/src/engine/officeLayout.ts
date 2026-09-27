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

export const GUILD_POIS: PointOfInterest[] = [
  { id: 'crystal', name: 'Mana Save Crystal', col: 14.5, row: 1.6 },
  { id: 'bookshelf', name: 'Ancient Library Tomes', col: 6.5, row: 1.6 },
  { id: 'potions', name: 'Alchemist Table', col: 16.5, row: 3.2 },
  { id: 'chest', name: 'Guild Treasure Chest', col: 18, row: 4.5 },
  { id: 'hall_center', name: 'Guild Hall Center', col: 6, row: 5.5 },
];

export type OfficeTileType =
  | 'floor_wood'
  | 'floor_carpet'
  | 'floor_stone'
  | 'floor_tile'
  | 'wall_top'
  | 'wall_window'
  | 'wall_bookshelf'
  | 'crystal';

export interface OfficeTile {
  type: OfficeTileType;
}

export function createOfficeMap(): OfficeTile[][] {
  const map: OfficeTile[][] = [];

  for (let r = 0; r < OFFICE_ROWS; r++) {
    const row: OfficeTile[] = [];
    for (let c = 0; c < OFFICE_COLS; c++) {
      if (r === 0) {
        // Back wall of Final Fantasy Guild Castle
        if (c === 2 || c === 3 || c === 9 || c === 10 || c === 17 || c === 18) {
          row.push({ type: 'wall_window' }); // Gothic Stained Glass
        } else if (c === 6 || c === 7) {
          row.push({ type: 'wall_bookshelf' }); // Ancient Library
        } else if (c === 14 || c === 15) {
          row.push({ type: 'crystal' }); // Floating Save Crystal
        } else {
          row.push({ type: 'wall_top' }); // Castle Stone Wall with Wall Torch
        }
      } else if (c >= 14 && r <= 5) {
        // Alchemist & Treasury flagstone area
        row.push({ type: 'floor_stone' });
      } else if (
        (c >= 1 && c <= 12 && r >= 3 && r <= 5) ||
        (c >= 1 && c <= 12 && r >= 6 && r <= 8) ||
        (c >= 1 && c <= 12 && r >= 10 && r <= 12)
      ) {
        // Royal crimson velvet carpet with gold filigree under workstations
        row.push({ type: 'floor_carpet' });
      } else {
        // Castle tavern hardwood planks
        row.push({ type: 'floor_wood' });
      }
    }
    map.push(row);
  }

  return map;
}

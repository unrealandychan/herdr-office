import { DESK_STATIONS, OFFICE_COLS, OFFICE_ROWS } from './officeLayout';

export interface PathNode {
  col: number;
  row: number;
}

export interface ObstacleBox {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  id?: string;
}

// Fixed furniture obstacle boundaries in simulation grid coordinates
export const OFFICE_OBSTACLES: ObstacleBox[] = [
  // 1. Executive Conference Table (col 13.0, row 9.5)
  { minCol: 12.1, maxCol: 13.9, minRow: 8.9, maxRow: 10.1, id: 'conference_table' },

  // 2. Breakroom Furniture
  { minCol: 13.2, maxCol: 14.5, minRow: 1.4, maxRow: 2.5, id: 'espresso_bar' },
  { minCol: 14.3, maxCol: 15.3, minRow: 2.7, maxRow: 3.7, id: 'water_cooler' },
  { minCol: 12.2, maxCol: 13.8, minRow: 4.4, maxRow: 5.6, id: 'lounge_sofa' },
  { minCol: 13.4, maxCol: 14.6, minRow: 4.8, maxRow: 5.6, id: 'coffee_table' },

  // 3. Reception Lounge (South-West)
  { minCol: 2.8, maxCol: 4.8, minRow: 9.8, maxRow: 11.2, id: 'reception_lounge' },

  // 4. Server Tower
  { minCol: 10.0, maxCol: 11.0, minRow: 0.8, maxRow: 1.6, id: 'server_tower' },

  // 5. Large Planters
  { minCol: 0.8, maxCol: 1.6, minRow: 1.0, maxRow: 1.9, id: 'plant_nw' },
  { minCol: 14.2, maxCol: 15.2, minRow: 5.2, maxRow: 6.2, id: 'plant_breakroom' },
  { minCol: 0.8, maxCol: 1.6, minRow: 11.0, maxRow: 12.0, id: 'plant_sw' },
];

/**
 * Checks if a given (col, row) position is blocked by office walls or furniture.
 * ignoreDeskId allows agents to walk to their own desk without being blocked by it.
 */
export function isPositionBlocked(col: number, row: number, ignoreDeskId?: string): boolean {
  // Boundary walls
  if (col < 1.0 || col > OFFICE_COLS - 1.2 || row < 1.0 || row > OFFICE_ROWS - 1.2) {
    return true;
  }

  // Check furniture obstacles
  for (const obs of OFFICE_OBSTACLES) {
    if (col >= obs.minCol && col <= obs.maxCol && row >= obs.minRow && row <= obs.maxRow) {
      return true;
    }
  }

  // Check desk slabs
  for (const station of DESK_STATIONS) {
    if (ignoreDeskId && station.id === ignoreDeskId) continue;
    // Desk footprint
    if (
      col >= station.deskCol - 0.45 &&
      col <= station.deskCol + 0.45 &&
      row >= station.deskRow - 0.45 &&
      row <= station.deskRow + 0.45
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Tests if a direct line of sight between two positions is free of obstacles.
 */
export function hasLineOfSight(c1: number, r1: number, c2: number, r2: number, ignoreDeskId?: string): boolean {
  const dist = Math.hypot(c2 - c1, r2 - r1);
  const steps = Math.ceil(dist / 0.25);
  if (steps <= 1) return !isPositionBlocked(c2, r2, ignoreDeskId);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const c = c1 + (c2 - c1) * t;
    const r = r1 + (r2 - r1) * t;
    if (isPositionBlocked(c, r, ignoreDeskId)) {
      return false;
    }
  }
  return true;
}

const GRID_STEP = 0.5;

function toGridKey(c: number, r: number): string {
  return `${Math.round(c / GRID_STEP)},${Math.round(r / GRID_STEP)}`;
}

/**
 * A* Pathfinding across the office navigation grid.
 * Guarantees agents walk around conference tables, desks, and furniture!
 */
export function findOfficePath(
  startCol: number,
  startRow: number,
  targetCol: number,
  targetRow: number,
  ignoreDeskId?: string
): PathNode[] {
  // Direct line of sight optimization: if no obstacles in between, walk straight!
  if (hasLineOfSight(startCol, startRow, targetCol, targetRow, ignoreDeskId)) {
    return [{ col: targetCol, row: targetRow }];
  }

  const startC = Math.round(startCol / GRID_STEP) * GRID_STEP;
  const startR = Math.round(startRow / GRID_STEP) * GRID_STEP;
  const targetC = Math.round(targetCol / GRID_STEP) * GRID_STEP;
  const targetR = Math.round(targetRow / GRID_STEP) * GRID_STEP;

  interface AStarNode {
    c: number;
    r: number;
    g: number;
    h: number;
    f: number;
    parent?: AStarNode;
  }

  const openSet = new Map<string, AStarNode>();
  const closedSet = new Set<string>();

  const startKey = toGridKey(startC, startR);
  const targetKey = toGridKey(targetC, targetR);

  const startNode: AStarNode = {
    c: startC,
    r: startR,
    g: 0,
    h: Math.hypot(targetC - startC, targetR - startR),
    f: Math.hypot(targetC - startC, targetR - startR),
  };
  openSet.set(startKey, startNode);

  // 8 Directions for natural isometric diagonal and straight walking
  const NEIGHBORS = [
    { dc: 0, dr: -GRID_STEP, cost: GRID_STEP },
    { dc: 0, dr: GRID_STEP, cost: GRID_STEP },
    { dc: -GRID_STEP, dr: 0, cost: GRID_STEP },
    { dc: GRID_STEP, dr: 0, cost: GRID_STEP },
    { dc: -GRID_STEP, dr: -GRID_STEP, cost: GRID_STEP * 1.414 },
    { dc: GRID_STEP, dr: -GRID_STEP, cost: GRID_STEP * 1.414 },
    { dc: -GRID_STEP, dr: GRID_STEP, cost: GRID_STEP * 1.414 },
    { dc: GRID_STEP, dr: GRID_STEP, cost: GRID_STEP * 1.414 },
  ];

  let closestNode: AStarNode = startNode;
  let iterations = 0;
  const MAX_ITERATIONS = 600;

  while (openSet.size > 0 && iterations++ < MAX_ITERATIONS) {
    // Find node in openSet with lowest f
    let current: AStarNode | null = null;
    let currentKey = '';
    for (const [key, node] of openSet) {
      if (!current || node.f < current.f) {
        current = node;
        currentKey = key;
      }
    }

    if (!current) break;

    // Track closest node in case exact target is enclosed
    if (current.h < closestNode.h) {
      closestNode = current;
    }

    // Reached destination
    if (currentKey === targetKey || Math.hypot(current.c - targetC, current.r - targetR) < GRID_STEP * 0.8) {
      closestNode = current;
      break;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    for (const n of NEIGHBORS) {
      const nextC = Math.round((current.c + n.dc) * 100) / 100;
      const nextR = Math.round((current.r + n.dr) * 100) / 100;
      const nextKey = toGridKey(nextC, nextR);

      if (closedSet.has(nextKey)) continue;

      // Allow destination tile even if near furniture edge
      const isTarget = Math.hypot(nextC - targetCol, nextR - targetRow) < 0.35;
      if (!isTarget && isPositionBlocked(nextC, nextR, ignoreDeskId)) {
        continue;
      }

      const tentativeG = current.g + n.cost;
      const existing = openSet.get(nextKey);

      if (!existing || tentativeG < existing.g) {
        const h = Math.hypot(targetC - nextC, targetR - nextR);
        const neighborNode: AStarNode = {
          c: nextC,
          r: nextR,
          g: tentativeG,
          h,
          f: tentativeG + h * 1.1, // Slight greedy bias for speed
          parent: current,
        };
        openSet.set(nextKey, neighborNode);
      }
    }
  }

  // Reconstruct path
  const rawPath: PathNode[] = [];
  let curr: AStarNode | undefined = closestNode;
  while (curr) {
    rawPath.push({ col: curr.c, row: curr.r });
    curr = curr.parent;
  }
  rawPath.reverse();

  // Ensure exact target is final point
  rawPath.push({ col: targetCol, row: targetRow });

  // Path smoothing (string pulling) to remove unnecessary intermediate waypoints
  if (rawPath.length <= 2) {
    return [{ col: targetCol, row: targetRow }];
  }

  const smoothed: PathNode[] = [rawPath[0]];
  let anchorIdx = 0;

  while (anchorIdx < rawPath.length - 1) {
    let furthestIdx = anchorIdx + 1;
    for (let testIdx = rawPath.length - 1; testIdx > anchorIdx + 1; testIdx--) {
      if (
        hasLineOfSight(
          rawPath[anchorIdx].col,
          rawPath[anchorIdx].row,
          rawPath[testIdx].col,
          rawPath[testIdx].row,
          ignoreDeskId
        )
      ) {
        furthestIdx = testIdx;
        break;
      }
    }
    smoothed.push(rawPath[furthestIdx]);
    anchorIdx = furthestIdx;
  }

  // Drop starting position from waypoints list
  if (smoothed.length > 1) {
    smoothed.shift();
  }

  return smoothed;
}

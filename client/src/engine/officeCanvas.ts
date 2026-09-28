import type { LoadedAssets } from './assetLoader';
import {
  createOfficeMap,
  DESK_STATIONS,
  OFFICE_POIS,
  OFFICE_COLS,
  OFFICE_ROWS,
  gridToIso,
  isoToGrid,
  getStationForIndex,
  type DeskStation,
} from './officeLayout';
import { findOfficePath, type PathNode } from './officePathfinding';
import type { HerdrAgent } from '../types';

export interface CanvasEngineOptions {
  canvas: HTMLCanvasElement;
  assets: LoadedAssets;
  scale?: number;
  onSelectAgent?: (agent: HerdrAgent | null) => void;
  onAgentSpoke?: (fromName: string, toName: string, text: string) => void;
}

export interface ActiveConversation {
  fromPaneId: string;
  toPaneId: string;
  fromName: string;
  toName: string;
  fromText: string;
  replyText?: string;
  stage: 'walking_to' | 'speaking_from' | 'speaking_reply' | 'returning';
  stageTimer: number;
  meetCol: number;
  meetRow: number;
}

export interface AgentEntity {
  agent: HerdrAgent;
  station: DeskStation;
  col: number;
  row: number;
  targetCol: number;
  targetRow: number;
  waypoints?: PathNode[];
  waypointIndex?: number;
  homeCol: number;
  homeRow: number;
  screenX: number;
  screenY: number;
  direction: 'se' | 'sw' | 'ne';
  state: 'sitting' | 'walking' | 'talking' | 'visiting_poi' | 'dragged';
  walkSpeed: number; // grid units per sec
  bubbleText?: string;
  bubbleSpeaker?: string;
  bubbleDuration: number;
  dropDustTimer?: number;
  nextAutonomousActionTime: number;
  assignedPoiSlot?: { poiId: string; col: number; row: number };
}

// 8 Distinct Executive Boardroom Seats around Conference Table (Neatly tucked, not cluttered)
const CONF_MEETING_SEATS = [
  // Far side (NW) - tucked under table, facing into meeting
  { col: 12.3, row: 8.8, dir: 'se' as const },
  { col: 13.0, row: 8.8, dir: 'se' as const },
  { col: 13.7, row: 8.8, dir: 'se' as const },

  // Near side (SE) - tucked under table, facing into meeting
  { col: 12.3, row: 10.2, dir: 'ne' as const },
  { col: 13.0, row: 10.2, dir: 'ne' as const },
  { col: 13.7, row: 10.2, dir: 'ne' as const },

  // Head and foot of table
  { col: 11.6, row: 9.5, dir: 'se' as const },
  { col: 14.4, row: 9.5, dir: 'sw' as const },
];

export class OfficeCanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private assets: LoadedAssets;
  private scale: number;
  private agents: HerdrAgent[] = [];
  private entities = new Map<string, AgentEntity>();
  private map = createOfficeMap();
  private animationFrameId: number | null = null;
  private lastTime = performance.now();
  private startTime = Date.now();
  private selectedPaneId: string | null = null;
  private hoveredPaneId: string | null = null;
  private onSelectAgent?: (agent: HerdrAgent | null) => void;
  private onAgentSpoke?: (fromName: string, toName: string, text: string) => void;
  private activeConversation: ActiveConversation | null = null;
  private meetingActive = false;

  // Virtual Canvas Dimensions & Origin
  private baseWidth = 1120;
  private baseHeight = 640;
  private originX = 560;
  private originY = 96;

  // Drag and Drop state
  private isDragging = false;
  private draggedPaneId: string | null = null;
  private dragStartMouse = { x: 0, y: 0 };
  private hasDragged = false;
  private hoveredTile: { col: number; row: number } | null = null;

  constructor(options: CanvasEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    this.ctx = ctx;
    this.assets = options.assets;
    this.scale = options.scale ?? 1.25;
    this.onSelectAgent = options.onSelectAgent;
    this.onAgentSpoke = options.onAgentSpoke;

    this.resizeCanvas();
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
  }

  public setScale(scale: number) {
    this.scale = scale;
    this.resizeCanvas();
  }

  public setAgents(agents: HerdrAgent[]) {
    this.agents = agents;
    this.syncEntities();
  }

  public setSelectedPaneId(paneId: string | null) {
    this.selectedPaneId = paneId;
  }

  /**
   * Plans collision-free path around tables, desks, and office obstacles
   */
  private setAgentDestination(
    entity: AgentEntity,
    targetCol: number,
    targetRow: number,
    _nextState: 'sitting' | 'talking' | 'visiting_poi' | 'walking' = 'sitting'
  ) {
    entity.targetCol = targetCol;
    entity.targetRow = targetRow;
    entity.waypoints = findOfficePath(entity.col, entity.row, targetCol, targetRow, entity.station.id);
    entity.waypointIndex = 0;
    entity.state = 'walking';
  }

  /**
   * Real message exchange between agents.
   * fromAgent walks over to toAgent, displays message, and returns to desk.
   */
  public sendAgentMessage(fromPaneId: string, toPaneId: string, customText?: string) {
    const fromEntity = this.entities.get(fromPaneId);
    const toEntity = this.entities.get(toPaneId);
    if (!fromEntity || !toEntity) return;

    const fromText = customText || 'Coordinating workspace synchronization.';
    const replyText = `Acknowledged. Received from @${fromEntity.agent.name || fromEntity.agent.agent}`;

    // Meet beside recipient's desk with clear spacing
    const meetCol = toEntity.homeCol + 0.8;
    const meetRow = toEntity.homeRow - 0.2;

    this.activeConversation = {
      fromPaneId,
      toPaneId,
      fromName: fromEntity.agent.name || fromEntity.agent.agent,
      toName: toEntity.agent.name || toEntity.agent.agent,
      fromText,
      replyText,
      stage: 'walking_to',
      stageTimer: 0,
      meetCol,
      meetRow,
    };

    this.setAgentDestination(fromEntity, meetCol, meetRow, 'walking');

    this.onAgentSpoke?.(fromEntity.agent.name || fromEntity.agent.agent, toEntity.agent.name || toEntity.agent.agent, fromText);
  }

  /**
   * Put office into Standup Meeting mode: agents assemble at conference table in unique chairs.
   */
  public setMeetingActive(active: boolean) {
    this.meetingActive = active;
    const entityList = Array.from(this.entities.values());

    if (active) {
      entityList.forEach((entity, index) => {
        const seat = CONF_MEETING_SEATS[index % CONF_MEETING_SEATS.length];
        this.setAgentDestination(entity, seat.col, seat.row, 'sitting');
      });
    } else {
      entityList.forEach((entity) => {
        this.setAgentDestination(entity, entity.homeCol, entity.homeRow, 'sitting');
      });
    }
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.update(dt);
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public destroy() {
    this.stop();
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  private resizeCanvas() {
    this.canvas.width = Math.round(this.baseWidth * this.scale);
    this.canvas.height = Math.round(this.baseHeight * this.scale);
    this.ctx.imageSmoothingEnabled = false;
  }

  private syncEntities() {
    const currentPaneIds = new Set(this.agents.map((a) => a.paneId));

    // Remove defunct entities
    for (const [paneId] of this.entities) {
      if (!currentPaneIds.has(paneId)) {
        this.entities.delete(paneId);
      }
    }

    // Add or update entities with guaranteed unique desk stations
    this.agents.forEach((agent, i) => {
      const station = getStationForIndex(i);
      // Sitting position is the chair at the desk station
      const homeCol = station.deskCol - 0.25;
      const homeRow = station.deskRow - 0.25;
      const screen = gridToIso(homeCol, homeRow, this.originX, this.originY);

      let entity = this.entities.get(agent.paneId);
      if (!entity) {
        entity = {
          agent,
          station,
          col: homeCol,
          row: homeRow,
          targetCol: homeCol,
          targetRow: homeRow,
          homeCol,
          homeRow,
          screenX: screen.x,
          screenY: screen.y,
          direction: 'se', // Facing forward into the room towards player
          state: 'sitting',
          walkSpeed: 2.6, // grid units per sec
          bubbleDuration: 0,
          nextAutonomousActionTime: Date.now() + 6000 + Math.random() * 8000,
        };
        this.entities.set(agent.paneId, entity);
      } else {
        entity.agent = agent;
        entity.station = station;
        entity.homeCol = homeCol;
        entity.homeRow = homeRow;
        if (entity.state === 'sitting') {
          entity.col = homeCol;
          entity.row = homeRow;
          entity.screenX = screen.x;
          entity.screenY = screen.y;
        }
      }
    });
  }

  private update(dt: number) {
    const now = Date.now();

    // 1. Update Autonomous Agents Walking & Visiting
    for (const [, entity] of this.entities) {
      // Manage bubble timer
      if (entity.bubbleDuration > 0) {
        entity.bubbleDuration -= dt;
        if (entity.bubbleDuration <= 0) {
          entity.bubbleText = undefined;
          entity.bubbleSpeaker = undefined;
        }
      }

      // Manage drop dust timer
      if (entity.dropDustTimer && entity.dropDustTimer > 0) {
        entity.dropDustTimer -= dt;
        if (entity.dropDustTimer <= 0) {
          entity.dropDustTimer = undefined;
        }
      }

      // Movement step with obstacle avoidance pathfinding
      if (entity.state === 'walking') {
        const waypoints = entity.waypoints && entity.waypoints.length > 0
          ? entity.waypoints
          : [{ col: entity.targetCol, row: entity.targetRow }];
        const currentWaypoint = waypoints[entity.waypointIndex || 0] || { col: entity.targetCol, row: entity.targetRow };

        const dCol = currentWaypoint.col - entity.col;
        const dRow = currentWaypoint.row - entity.row;
        const dist = Math.hypot(dCol, dRow);

        if (dist <= entity.walkSpeed * dt || dist < 0.08) {
          entity.col = currentWaypoint.col;
          entity.row = currentWaypoint.row;

          if (entity.waypointIndex !== undefined && entity.waypointIndex < waypoints.length - 1) {
            entity.waypointIndex++;
          } else {
            // Arrived at final destination!
            entity.waypoints = undefined;
            entity.waypointIndex = 0;

            if (
              Math.abs(entity.col - entity.homeCol) < 0.15 &&
              Math.abs(entity.row - entity.homeRow) < 0.15
            ) {
              entity.col = entity.homeCol;
              entity.row = entity.homeRow;
              entity.state = 'sitting';
              entity.direction = 'se';
              entity.assignedPoiSlot = undefined;
            } else {
              entity.state = 'talking';
            }
          }
        } else {
          entity.col += (dCol / dist) * entity.walkSpeed * dt;
          entity.row += (dRow / dist) * entity.walkSpeed * dt;

          // Compute isometric direction
          if (Math.abs(dCol) > Math.abs(dRow)) {
            entity.direction = dCol > 0 ? 'se' : 'sw';
          } else {
            entity.direction = dRow > 0 ? 'sw' : 'ne';
          }
        }
      }

      // Update screen coordinates
      const screen = gridToIso(entity.col, entity.row, this.originX, this.originY);
      entity.screenX = screen.x;
      entity.screenY = screen.y;

      // Autonomous occasional coffee/water break (ONLY when idle and not in a meeting or dragging)
      if (
        !this.meetingActive &&
        entity.agent.status === 'idle' &&
        entity.state === 'sitting' &&
        !this.activeConversation &&
        !this.isDragging &&
        now >= entity.nextAutonomousActionTime
      ) {
        entity.nextAutonomousActionTime = now + 24000 + Math.random() * 26000;

        // 35% chance for an idle agent to take a break
        if (Math.random() < 0.35) {
          const breakPOIs = OFFICE_POIS.filter(
            (p) => p.id === 'coffee' || p.id === 'water_cooler' || p.id === 'lounge' || p.id === 'whiteboard'
          );
          const poi = breakPOIs[Math.floor(Math.random() * breakPOIs.length)];

          // Pick an unoccupied slot at this POI to avoid overlapping!
          const occupiedSlots = new Set<string>();
          for (const [, other] of this.entities) {
            if (other.assignedPoiSlot) {
              occupiedSlots.add(`${other.assignedPoiSlot.col.toFixed(1)},${other.assignedPoiSlot.row.toFixed(1)}`);
            }
          }

          const freeSlot = poi.slots.find(
            (s) => !occupiedSlots.has(`${s.col.toFixed(1)},${s.row.toFixed(1)}`)
          ) || poi.slots[0];

          entity.assignedPoiSlot = { poiId: poi.id, col: freeSlot.col, row: freeSlot.row };
          this.setAgentDestination(entity, freeSlot.col, freeSlot.row, 'visiting_poi');

          // Return timer after break
          setTimeout(() => {
            if (entity.state !== 'dragged') {
              this.setAgentDestination(entity, entity.homeCol, entity.homeRow, 'sitting');
            }
          }, 4500);
        }
      }
    }

    // 2. Anti-Overlap Continuous Separation Force
    // Mathematically guarantees agents never clip or superimpose into a single blob!
    const entityList = Array.from(this.entities.values());
    for (let i = 0; i < entityList.length; i++) {
      for (let j = i + 1; j < entityList.length; j++) {
        const a = entityList[i];
        const b = entityList[j];

        // Do not push agents sitting at their assigned desks or currently dragged
        if (a.state === 'dragged' || b.state === 'dragged') continue;
        if (a.state === 'sitting' && b.state === 'sitting') continue;

        const dCol = b.col - a.col;
        const dRow = b.row - a.row;
        const dist = Math.hypot(dCol, dRow);
        const MIN_DIST = 0.85; // 0.85 grid units personal radius

        if (dist < MIN_DIST && dist > 0.0001) {
          const overlap = (MIN_DIST - dist) / 2;
          const push = overlap * Math.min(dt * 7, 1);
          const nx = (dCol / dist) * push;
          const ny = (dRow / dist) * push;

          if (a.state !== 'sitting') {
            a.col -= nx;
            a.row -= ny;
          }
          if (b.state !== 'sitting') {
            b.col += nx;
            b.row += ny;
          }
        }
      }
    }

    // 3. Update Active Inter-Agent Conversation
    if (this.activeConversation) {
      const conv = this.activeConversation;
      const fromEntity = this.entities.get(conv.fromPaneId);
      const toEntity = this.entities.get(conv.toPaneId);

      if (!fromEntity || !toEntity) {
        this.activeConversation = null;
        return;
      }

      conv.stageTimer += dt;

      if (conv.stage === 'walking_to') {
        if (fromEntity.state !== 'walking') {
          conv.stage = 'speaking_from';
          conv.stageTimer = 0;
          fromEntity.direction = 'se';
          toEntity.direction = 'sw';

          fromEntity.bubbleText = conv.fromText;
          fromEntity.bubbleSpeaker = conv.fromName;
          fromEntity.bubbleDuration = 4.5;
        }
      } else if (conv.stage === 'speaking_from') {
        if (conv.stageTimer >= 4.0 && conv.replyText) {
          conv.stage = 'speaking_reply';
          conv.stageTimer = 0;
          fromEntity.bubbleText = undefined;
          toEntity.bubbleText = conv.replyText;
          toEntity.bubbleSpeaker = conv.toName;
          toEntity.bubbleDuration = 4.0;
        }
      } else if (conv.stage === 'speaking_reply') {
        if (conv.stageTimer >= 3.8) {
          conv.stage = 'returning';
          toEntity.bubbleText = undefined;
          toEntity.direction = 'se';

          this.setAgentDestination(fromEntity, fromEntity.homeCol, fromEntity.homeRow, 'sitting');
        }
      } else if (conv.stage === 'returning') {
        if (fromEntity.state === 'sitting') {
          this.activeConversation = null;
        }
      }
    }
  }

  // ====================================================
  // MOUSE INTERACTIONS: DRAG & DROP + SELECTION
  // ====================================================
  private getAgentUnderMouse(mx: number, my: number): { agent: HerdrAgent; entity: AgentEntity } | null {
    for (const [, entity] of this.entities) {
      const deskIso = gridToIso(entity.station.deskCol, entity.station.deskRow, this.originX, this.originY);
      const headTopY = entity.state === 'sitting' ? deskIso.y - 48 : entity.screenY - 44;
      const dx = mx - entity.screenX;
      const dy = my - (headTopY + 8);
      // Generous, natural clickable hitbox covering character, nameplate, and task bubble
      if ((dx * dx) / (24 * 24) + (dy * dy) / (34 * 34) <= 1) {
        return { agent: entity.agent, entity };
      }
    }
    return null;
  }

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = ((e.clientX - rect.left) * scaleX) / this.scale;
    const my = ((e.clientY - rect.top) * scaleY) / this.scale;

    const hit = this.getAgentUnderMouse(mx, my);
    if (hit) {
      this.isDragging = true;
      this.draggedPaneId = hit.agent.paneId;
      this.dragStartMouse = { x: mx, y: my };
      this.hasDragged = false;

      // Cancel any ongoing walk and switch to dragged floating pose
      hit.entity.state = 'dragged';
      hit.entity.assignedPoiSlot = undefined;
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = ((e.clientX - rect.left) * scaleX) / this.scale;
    const my = ((e.clientY - rect.top) * scaleY) / this.scale;

    // Track hovered floor tile in simulation game coordinates
    const gridPos = isoToGrid(mx, my, this.originX, this.originY);
    if (
      gridPos.col >= 0 &&
      gridPos.col < OFFICE_COLS &&
      gridPos.row >= 0 &&
      gridPos.row < OFFICE_ROWS
    ) {
      this.hoveredTile = { col: Math.floor(gridPos.col), row: Math.floor(gridPos.row) };
    } else {
      this.hoveredTile = null;
    }

    if (this.isDragging && this.draggedPaneId) {
      const entity = this.entities.get(this.draggedPaneId);
      if (!entity) return;

      const dist = Math.hypot(mx - this.dragStartMouse.x, my - this.dragStartMouse.y);
      if (dist > 4) {
        this.hasDragged = true;
      }

      // Convert dragged mouse position to office floor coordinates
      const targetGrid = isoToGrid(mx, my + 14, this.originX, this.originY);
      // Clamp within playable office bounds
      entity.col = Math.max(1.2, Math.min(OFFICE_COLS - 1.8, targetGrid.col));
      entity.row = Math.max(1.2, Math.min(OFFICE_ROWS - 1.8, targetGrid.row));

      const screen = gridToIso(entity.col, entity.row, this.originX, this.originY);
      entity.screenX = screen.x;
      entity.screenY = screen.y;

      this.canvas.style.cursor = 'grabbing';
    } else {
      // Hover feedback
      const hit = this.getAgentUnderMouse(mx, my);
      if (hit) {
        this.hoveredPaneId = hit.agent.paneId;
        this.canvas.style.cursor = 'grab';
      } else {
        this.hoveredPaneId = null;
        this.canvas.style.cursor = 'default';
      }
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (this.isDragging && this.draggedPaneId) {
      const entity = this.entities.get(this.draggedPaneId);

      if (entity) {
        if (this.hasDragged) {
          // Agent was dragged and dropped!
          entity.dropDustTimer = 0.9;
          entity.bubbleText = 'Whoa! Heading back to my seat...';
          entity.bubbleDuration = 2.5;

          // Walk back along safe corridors to their assigned desk station!
          this.setAgentDestination(entity, entity.homeCol, entity.homeRow, 'sitting');
        } else {
          // It was a simple click: select agent in sidebar!
          this.selectedPaneId = entity.agent.paneId;
          this.onSelectAgent?.(entity.agent);

          if (entity.state === 'dragged') {
            entity.state = 'sitting';
            entity.direction = 'se';
          }
        }
      }

      this.isDragging = false;
      this.draggedPaneId = null;
      this.hasDragged = false;
      this.canvas.style.cursor = 'default';
    } else {
      // Clicked on empty space: deselect
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = ((e.clientX - rect.left) * scaleX) / this.scale;
      const my = ((e.clientY - rect.top) * scaleY) / this.scale;
      const hit = this.getAgentUnderMouse(mx, my);
      if (!hit) {
        this.selectedPaneId = null;
        this.onSelectAgent?.(null);
      }
    }
  };

  private handleMouseLeave = () => {
    if (this.isDragging && this.draggedPaneId) {
      const entity = this.entities.get(this.draggedPaneId);
      if (entity) {
        this.setAgentDestination(entity, entity.homeCol, entity.homeRow, 'sitting');
      }
      this.isDragging = false;
      this.draggedPaneId = null;
      this.hasDragged = false;
    }
    this.hoveredPaneId = null;
    this.hoveredTile = null;
    this.canvas.style.cursor = 'default';
  };

  // ====================================================
  // 2.5D ISOMETRIC RENDERING PIPELINE
  // ====================================================
  private render() {
    const { ctx, scale, map, assets, originX, originY } = this;
    const tileset = assets.tilesetImage;
    const tiles = assets.manifest.tileset.tiles;
    const elapsed = Date.now() - this.startTime;

    ctx.save();
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    // 1. Rich Atmospheric Twilight City Backdrop (High-end Simulation Game aesthetic)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.baseHeight);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(0.35, '#081022');
    bgGrad.addColorStop(0.7, '#0f1a34');
    bgGrad.addColorStop(1, '#070c18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Distant Starfield in upper night sky
    ctx.save();
    const starCoords = [
      [120, 35], [260, 20], [380, 48], [510, 22], [640, 40], [780, 18], [910, 38], [1030, 25],
      [180, 70], [320, 60], [450, 75], [710, 65], [850, 80], [990, 60], [70, 95]
    ];
    for (let i = 0; i < starCoords.length; i++) {
      const [sx, sy] = starCoords[i];
      const starTwinkle = Math.sin((elapsed + i * 400) / 350) * 0.3 + 0.6;
      ctx.fillStyle = `rgba(224, 242, 254, ${starTwinkle})`;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Distant City Skyline Silhouettes (behind building diorama)
    const skylineBuildings = [
      { x: 30, w: 55, h: 110, lit: true },
      { x: 95, w: 40, h: 85, lit: false },
      { x: 145, w: 65, h: 140, lit: true, antenna: true },
      { x: 220, w: 50, h: 95, lit: false },
      { x: 280, w: 70, h: 125, lit: true },
      { x: 360, w: 45, h: 75, lit: false },
      { x: 740, w: 50, h: 80, lit: false },
      { x: 800, w: 65, h: 135, lit: true, antenna: true },
      { x: 875, w: 45, h: 90, lit: false },
      { x: 930, w: 75, h: 150, lit: true },
      { x: 1015, w: 55, h: 105, lit: false },
      { x: 1080, w: 35, h: 70, lit: false },
    ];

    for (const b of skylineBuildings) {
      const by = 180 - b.h;
      // Dark skyscraper body
      ctx.fillStyle = '#0a1324';
      ctx.fillRect(b.x, by, b.w, b.h);
      ctx.strokeStyle = '#152542';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, by + 0.5, b.w - 1, b.h - 1);

      // Lit micro windows on towers
      if (b.lit) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
        for (let wy = by + 12; wy < by + b.h - 15; wy += 8) {
          for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 7) {
            if ((wx + wy) % 5 !== 0) {
              ctx.fillRect(wx, wy, 2, 3);
            }
          }
        }
      }

      // Blinking red aircraft hazard beacon at tower spires
      if (b.antenna) {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, by);
        ctx.lineTo(b.x + b.w / 2, by - 16);
        ctx.stroke();

        const beaconFlash = Math.sin((elapsed + b.x) / 250) > 0.2 ? 1 : 0.15;
        ctx.fillStyle = `rgba(239, 68, 68, ${beaconFlash})`;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, by - 16, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // High-Tech Ambient Diorama Spotlight under the office foundation
    const centerFloor = gridToIso(8, 7, originX, originY);
    const dioramaGlow = ctx.createRadialGradient(centerFloor.x, centerFloor.y, 40, centerFloor.x, centerFloor.y, 480);
    dioramaGlow.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
    dioramaGlow.addColorStop(0.5, 'rgba(30, 41, 59, 0.25)');
    dioramaGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dioramaGlow;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // 2. Render Seamless 2.5D Architectural Back Walls
    // North-West Wall (runs row 0, col 0..15 down-right)
    const nwEnd = gridToIso(OFFICE_COLS, 0, originX, originY);
    const wallHeight = 64;

    // Solid North-West wall polygon
    ctx.fillStyle = '#e2e8f0'; // Clean modern off-white drywall
    ctx.beginPath();
    ctx.moveTo(originX, originY - wallHeight);
    ctx.lineTo(nwEnd.x, nwEnd.y - wallHeight);
    ctx.lineTo(nwEnd.x, nwEnd.y);
    ctx.lineTo(originX, originY);
    ctx.closePath();
    ctx.fill();

    // North-West Wall Top Molding & Baseboard
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY - wallHeight);
    ctx.lineTo(nwEnd.x, nwEnd.y - wallHeight);
    ctx.stroke();

    ctx.strokeStyle = '#78350f'; // Warm oak baseboard
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(nwEnd.x, nwEnd.y);
    ctx.stroke();

    // North-East Wall (runs col 0, row 0..13 down-left)
    const neEnd = gridToIso(0, OFFICE_ROWS, originX, originY);
    ctx.fillStyle = '#cbd5e1'; // Slightly shaded side drywall
    ctx.beginPath();
    ctx.moveTo(originX, originY - wallHeight);
    ctx.lineTo(neEnd.x, neEnd.y - wallHeight);
    ctx.lineTo(neEnd.x, neEnd.y);
    ctx.lineTo(originX, originY);
    ctx.closePath();
    ctx.fill();

    // North-East Wall Top Molding & Baseboard
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY - wallHeight);
    ctx.lineTo(neEnd.x, neEnd.y - wallHeight);
    ctx.stroke();

    ctx.strokeStyle = '#5c2b09';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(neEnd.x, neEnd.y);
    ctx.stroke();

    // Vertical Corner Seam where both walls meet in 3D
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY - wallHeight);
    ctx.lineTo(originX, originY);
    ctx.stroke();

    // Render Architectural Wall Inset Props on NW Wall (Sloping down-right, clean 1-window design)
    const nwWallProps: Array<{ col: number; tile: string }> = [
      { col: 2.0, tile: 'wall_window' },
      { col: 6.0, tile: 'wall_whiteboard' },
      { col: 10.0, tile: 'wall_server' },
      { col: 13.0, tile: 'wall_top' },
    ];
    for (const p of nwWallProps) {
      const tileMeta = tiles[p.tile];
      if (tileMeta) {
        const iso = gridToIso(p.col, 0, originX, originY);
        ctx.drawImage(tileset, tileMeta.x, tileMeta.y, tileMeta.w, tileMeta.h, iso.x, iso.y - 56, tileMeta.w, tileMeta.h);
      }
    }

    // Render Architectural Wall Inset Props on NE Wall (Sloping down-left, clean 1-window design)
    const neWallProps: Array<{ row: number; tile: string }> = [
      { row: 2.0, tile: 'wall_bookshelf' },
      { row: 6.0, tile: 'wall_window_ne' },
      { row: 10.0, tile: 'wall_dashboard' },
    ];
    for (const p of neWallProps) {
      const tileMeta = tiles[p.tile] || tiles.wall_art;
      if (tileMeta) {
        const iso = gridToIso(0, p.row, originX, originY);
        ctx.drawImage(tileset, tileMeta.x, tileMeta.y, tileMeta.w, tileMeta.h, iso.x - 64, iso.y - 56, tileMeta.w, tileMeta.h);
      }
    }

    // 3. Render 2.5D Isometric Floor Tiles (Complete seamless coverage)
    for (let r = 0; r < OFFICE_ROWS; r++) {
      for (let c = 0; c < OFFICE_COLS; c++) {
        const cell = map[r][c];
        let tileType = cell.type;
        if (tileType.startsWith('wall_')) {
          tileType = (c >= 11 && r <= 5) ? 'floor_tile' : ((c >= 2 && c <= 10) ? 'floor_carpet' : 'floor_wood');
        }
        const tileMeta = tiles[tileType] || tiles.floor_wood;
        if (tileMeta) {
          const iso = gridToIso(c, r, originX, originY);
          ctx.drawImage(tileset, tileMeta.x, tileMeta.y, tileMeta.w, tileMeta.h, iso.x - 32, iso.y, tileMeta.w, tileMeta.h);

          // Simulation Game: Hover Grid Highlight
          if (this.hoveredTile && this.hoveredTile.col === c && this.hoveredTile.row === r) {
            const hoverTile = tiles.grid_cell_hover;
            if (hoverTile) {
              ctx.drawImage(tileset, hoverTile.x, hoverTile.y, hoverTile.w, hoverTile.h, iso.x - 32, iso.y, hoverTile.w, hoverTile.h);
            }
          }
        }
      }
    }

    // 4. Render Seamless 3D Foundation Slab (Diorama Edge)
    const swCorner = gridToIso(0, OFFICE_ROWS, originX, originY);
    const bottomCorner = gridToIso(OFFICE_COLS, OFFICE_ROWS, originX, originY);
    const seCorner = gridToIso(OFFICE_COLS, 0, originX, originY);
    const foundationDepth = 22;

    // South-West Foundation Face (Viewer-Left)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(swCorner.x, swCorner.y);
    ctx.lineTo(bottomCorner.x, bottomCorner.y);
    ctx.lineTo(bottomCorner.x, bottomCorner.y + foundationDepth);
    ctx.lineTo(swCorner.x, swCorner.y + foundationDepth);
    ctx.closePath();
    ctx.fill();

    // Strata accent line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(swCorner.x, swCorner.y + 10);
    ctx.lineTo(bottomCorner.x, bottomCorner.y + 10);
    ctx.stroke();

    // Top bevel highlight
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(swCorner.x, swCorner.y);
    ctx.lineTo(bottomCorner.x, bottomCorner.y);
    ctx.stroke();

    // South-East Foundation Face (Viewer-Right)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(bottomCorner.x, bottomCorner.y);
    ctx.lineTo(seCorner.x, seCorner.y);
    ctx.lineTo(seCorner.x, seCorner.y + foundationDepth);
    ctx.lineTo(bottomCorner.x, bottomCorner.y + foundationDepth);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(bottomCorner.x, bottomCorner.y + 10);
    ctx.lineTo(seCorner.x, seCorner.y + 10);
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bottomCorner.x, bottomCorner.y);
    ctx.lineTo(seCorner.x, seCorner.y);
    ctx.stroke();

    // 5. Build Unified Depth-Sorted Render List (Painters Algorithm)
    interface RenderableItem {
      depth: number;
      draw: () => void;
    }

    const renderables: RenderableItem[] = [];

    // Floor Selection Halo (Rendered flat on floor before furniture)
    for (const entity of this.entities.values()) {
      const isSelected = entity.agent.paneId === this.selectedPaneId;
      const isHovered = entity.agent.paneId === this.hoveredPaneId;
      if (isSelected || isHovered) {
        const ringTile = tiles.selection_halo;
        if (ringTile) {
          const iso = gridToIso(entity.col, entity.row, originX, originY);
          const pulse = Math.sin(elapsed / 200) * 0.2 + 0.8;
          renderables.push({
            depth: entity.col + entity.row - 0.45,
            draw: () => {
              ctx.save();
              ctx.globalAlpha = isSelected ? pulse : 0.6;
              ctx.drawImage(tileset, ringTile.x, ringTile.y, ringTile.w, ringTile.h, iso.x - 32, iso.y - 16, ringTile.w, ringTile.h);
              ctx.restore();
            },
          });
        }
      }
    }

    // A. Workstations (Chairs & Desks)
    for (const station of DESK_STATIONS) {
      const deskTile = tiles.desk;
      const chairTile = tiles.chair;

      // Chair positioned behind desk
      const chairCol = station.deskCol - 0.25;
      const chairRow = station.deskRow - 0.25;
      const chairIso = gridToIso(chairCol, chairRow, originX, originY);

      renderables.push({
        depth: station.deskCol + station.deskRow - 0.35,
        draw: () => {
          if (chairTile) {
            ctx.drawImage(tileset, chairTile.x, chairTile.y, chairTile.w, chairTile.h, chairIso.x - 16, chairIso.y - 28, chairTile.w, chairTile.h);
          }
        },
      });

      // Desk with flanking dual monitors and keyboard
      const deskIso = gridToIso(station.deskCol, station.deskRow, originX, originY);
      renderables.push({
        depth: station.deskCol + station.deskRow + 0.1,
        draw: () => {
          if (deskTile) {
            ctx.drawImage(tileset, deskTile.x, deskTile.y, deskTile.w, deskTile.h, deskIso.x - 32, deskIso.y - 34, deskTile.w, deskTile.h);
          }
        },
      });
    }

    // B. Breakroom Espresso Bar & Water Cooler
    const espressoTile = tiles.espresso_bar;
    if (espressoTile) {
      const iso = gridToIso(13.8, 2.0, originX, originY);
      renderables.push({
        depth: 13.8 + 2.0,
        draw: () => {
          ctx.drawImage(tileset, espressoTile.x, espressoTile.y, espressoTile.w, espressoTile.h, iso.x - 32, iso.y - 42, espressoTile.w, espressoTile.h);
        },
      });
    }

    const waterCoolerTile = tiles.water_cooler;
    if (waterCoolerTile) {
      const iso = gridToIso(14.8, 3.2, originX, originY);
      renderables.push({
        depth: 14.8 + 3.2,
        draw: () => {
          ctx.drawImage(tileset, waterCoolerTile.x, waterCoolerTile.y, waterCoolerTile.w, waterCoolerTile.h, iso.x - 16, iso.y - 42, waterCoolerTile.w, waterCoolerTile.h);
        },
      });
    }

    // C. Potted Monstera Plants
    const plantTile = tiles.plant;
    if (plantTile) {
      const plantPositions = [
        { col: 11.5, row: 1.5 },
        { col: 14.8, row: 5.8 },
        { col: 1.2, row: 1.5 },
        { col: 1.2, row: 11.5 },
      ];
      for (const pos of plantPositions) {
        const iso = gridToIso(pos.col, pos.row, originX, originY);
        renderables.push({
          depth: pos.col + pos.row,
          draw: () => {
            ctx.drawImage(tileset, plantTile.x, plantTile.y, plantTile.w, plantTile.h, iso.x - 24, iso.y - 42, plantTile.w, plantTile.h);
          },
        });
      }
    }

    // D. Executive Conference Room (Large Table & Chairs)
    const confTableTile = tiles.conference_table;
    if (confTableTile) {
      const iso = gridToIso(13.0, 9.5, originX, originY);
      renderables.push({
        depth: 13.0 + 9.5,
        draw: () => {
          ctx.drawImage(tileset, confTableTile.x, confTableTile.y, confTableTile.w, confTableTile.h, iso.x - 48, iso.y - 32, confTableTile.w, confTableTile.h);
        },
      });
    }

    for (const seat of CONF_MEETING_SEATS) {
      const iso = gridToIso(seat.col, seat.row, originX, originY);
      const isFront = seat.row > 9.5;
      const confChairTile = isFront
        ? (tiles.conf_chair_back || tiles.chair)
        : (tiles.conference_chair || tiles.chair);

      renderables.push({
        depth: isFront ? seat.col + seat.row + 0.15 : seat.col + seat.row - 0.15,
        draw: () => {
          if (confChairTile) {
            ctx.drawImage(tileset, confChairTile.x, confChairTile.y, confChairTile.w, confChairTile.h, iso.x - 16, iso.y - 28, confChairTile.w, confChairTile.h);
          }
        },
      });
    }

    // E. Breakout Lounge Sofa & Coffee Table (Kitchenette)
    const sofaTile = tiles.lounge_sofa;
    if (sofaTile) {
      const iso = gridToIso(13.0, 5.0, originX, originY);
      renderables.push({
        depth: 13.0 + 5.0,
        draw: () => {
          ctx.drawImage(tileset, sofaTile.x, sofaTile.y, sofaTile.w, sofaTile.h, iso.x - 32, iso.y - 42, sofaTile.w, sofaTile.h);
        },
      });
    }
    const coffeeTableTile = tiles.coffee_table;
    if (coffeeTableTile) {
      const iso = gridToIso(14.0, 5.2, originX, originY);
      renderables.push({
        depth: 14.0 + 5.2,
        draw: () => {
          ctx.drawImage(tileset, coffeeTableTile.x, coffeeTableTile.y, coffeeTableTile.w, coffeeTableTile.h, iso.x - 24, iso.y - 20, coffeeTableTile.w, coffeeTableTile.h);
        },
      });
    }

    // E2. Executive Reception Lounge (South-West Entrance Area)
    if (sofaTile) {
      const iso = gridToIso(3.5, 10.5, originX, originY);
      renderables.push({
        depth: 3.5 + 10.5,
        draw: () => {
          ctx.drawImage(tileset, sofaTile.x, sofaTile.y, sofaTile.w, sofaTile.h, iso.x - 32, iso.y - 42, sofaTile.w, sofaTile.h);
        },
      });
    }
    if (coffeeTableTile) {
      const iso = gridToIso(4.5, 10.5, originX, originY);
      renderables.push({
        depth: 4.5 + 10.5,
        draw: () => {
          ctx.drawImage(tileset, coffeeTableTile.x, coffeeTableTile.y, coffeeTableTile.w, coffeeTableTile.h, iso.x - 24, iso.y - 20, coffeeTableTile.w, coffeeTableTile.h);
        },
      });
    }

    // F. Standalone Server Rack Tower
    const serverRackTile = tiles.server_rack;
    if (serverRackTile) {
      const iso = gridToIso(10.5, 1.2, originX, originY);
      renderables.push({
        depth: 10.5 + 1.2,
        draw: () => {
          ctx.drawImage(tileset, serverRackTile.x, serverRackTile.y, serverRackTile.w, serverRackTile.h, iso.x - 24, iso.y - 56, serverRackTile.w, serverRackTile.h);
        },
      });
    }

    // G. Agent Entities
    for (const entity of this.entities.values()) {
      let entityDepth = entity.col + entity.row;
      if (entity.state === 'sitting') {
        // Seated comfortably in chair behind the desk slab
        entityDepth = entity.station.deskCol + entity.station.deskRow - 0.15;
      } else if (entity.state === 'dragged') {
        entityDepth = 9999;
      }

      renderables.push({
        depth: entityDepth,
        draw: () => {
          this.renderEntity(entity, elapsed);
        },
      });
    }

    // Sort strictly by 2.5D depth from back to front!
    renderables.sort((a, b) => a.depth - b.depth);

    // Execute sorted draw calls
    for (const item of renderables) {
      item.draw();
    }

    // 6. Atmospheric Lighting & Window Sunlight Beams
    this.renderAtmosphericLighting(elapsed);

    // 7. Overhead Overlays: Stacked Cleanly Above Characters (Never covering face or desk)
    for (const entity of this.entities.values()) {
      const deskIso = gridToIso(entity.station.deskCol, entity.station.deskRow, originX, originY);
      const headTopY = entity.state === 'sitting' ? deskIso.y - 48 : entity.screenY - 44;
      const isSelected = entity.agent.paneId === this.selectedPaneId;

      // A. Agent Nameplate (always visible right above head)
      this.renderEntityNameplate(entity, entity.screenX, headTopY - 18);

      // B. Mini Task Bubble (for coding agents, placed above nameplate)
      if (entity.agent.status === 'working' && !entity.bubbleText) {
        const taskSnippet = entity.agent.currentTask || entity.agent.currentPrompt || 'Coding...';
        this.renderModernMiniTaskBubble(entity.agent.name || entity.agent.agent, taskSnippet, entity.screenX, headTopY - 40, elapsed);
      }

      // C. Active Dialogue Card (for speaking agents, placed above)
      if (entity.bubbleText) {
        this.renderModernDialogueBox(entity.bubbleSpeaker || entity.agent.agent, entity.bubbleText, entity.screenX, headTopY - 60, elapsed);
      }

      // D. Selection Glove Cursor
      if (isSelected) {
        const handBob = Math.sin(elapsed / 180) * 3;
        const cursorTile = assets.manifest.tileset.tiles.cursor_hand;
        if (cursorTile) {
          const cursorY = entity.bubbleText
            ? headTopY - 118 + handBob
            : (entity.agent.status === 'working' ? headTopY - 66 : headTopY - 44) + handBob;
          ctx.drawImage(
            assets.tilesetImage,
            cursorTile.x,
            cursorTile.y,
            cursorTile.w,
            cursorTile.h,
            entity.screenX - 12,
            cursorY,
            cursorTile.w,
            cursorTile.h
          );
        }
      }
    }

    ctx.restore();
  }

  private renderEntity(entity: AgentEntity, elapsed: number) {
    const { ctx, assets, originX, originY } = this;
    const charW = assets.manifest.characters.frameWidth; // 32
    const charH = assets.manifest.characters.frameHeight; // 48

    let charImg = assets.characterImages.get(entity.agent.agent.toLowerCase());
    if (!charImg) {
      charImg = assets.characterImages.get('default') ?? assets.characterImages.values().next().value;
    }
    if (!charImg) return;

    // Pick animation row & frame rate
    let row = 0;
    const frameCount = 4;
    let frameRate = 3;

    if (entity.state === 'dragged') {
      row = 8; // Surprised floating pose with dangling legs!
      frameRate = 4;
    } else if (entity.state === 'walking') {
      if (entity.direction === 'se') row = 2;
      else if (entity.direction === 'ne') row = 3;
      else row = 4; // sw
      frameRate = 6;
    } else if (entity.state === 'talking') {
      row = entity.direction === 'ne' ? 1 : 0;
      frameRate = 3;
    } else {
      // Sitting at workstation
      if (entity.agent.status === 'working') {
        row = 5; // Fast mechanical keyboard typing with monitor glow
        frameRate = 8;
      } else if (entity.agent.status === 'blocked') {
        row = 6; // Thinking / alert / distressed
        frameRate = 4;
      } else if (entity.agent.status === 'done') {
        row = 7; // Victory fanfare
        frameRate = 4;
      } else {
        row = 0; // Relaxed idle facing front into room
        frameRate = 3;
      }
    }

    const currentFrame = Math.floor((elapsed / 1000) * frameRate) % frameCount;

    // Landing Dust Sparkle Effect
    if (entity.dropDustTimer) {
      const dustTile = assets.manifest.tileset.tiles.drop_dust;
      if (dustTile) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, entity.dropDustTimer);
        ctx.drawImage(assets.tilesetImage, dustTile.x, dustTile.y, dustTile.w, dustTile.h, entity.screenX - 16, entity.screenY - 8, dustTile.w, dustTile.h);
        ctx.restore();
      }
    }

    // Draw Character Sprite
    const deskIso = gridToIso(entity.station.deskCol, entity.station.deskRow, originX, originY);
    const drawX = entity.screenX - charW / 2;
    // When sitting, hips rest on chair cushion and upper body is visible behind desk
    const drawY = entity.state === 'sitting' ? deskIso.y - 48 : entity.screenY - 44;

    ctx.drawImage(charImg, currentFrame * charW, row * charH, charW, charH, drawX, drawY, charW, charH);
  }

  private renderEntityNameplate(entity: AgentEntity, anchorX: number, badgeY: number) {
    const { ctx } = this;
    ctx.save();
    ctx.font = 'bold 8px monospace';
    const name = entity.agent.name || entity.agent.agent;
    const textW = ctx.measureText(name).width;
    const badgeW = textW + 16;
    const badgeX = anchorX - badgeW / 2;

    // Modern Dark Slate Card styling
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, 13, 3);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Status Gem
    const gemColor =
      entity.agent.status === 'working'
        ? '#34d399'
        : entity.agent.status === 'blocked'
          ? '#ef4444'
          : entity.agent.status === 'done'
            ? '#fbbf24'
            : '#60a5fa';

    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.arc(badgeX + 5, badgeY + 6.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, badgeX + 11, badgeY + 9.5);
    ctx.restore();
  }

  /**
   * Renders sleek glassmorphic dialogue card
   */
  private renderModernDialogueBox(speaker: string, text: string, anchorX: number, anchorY: number, elapsed: number) {
    const { ctx } = this;
    const bob = Math.sin(elapsed / 240) * 2;

    ctx.save();
    ctx.font = 'bold 8px monospace';

    const title = speaker.toUpperCase();
    let body = text;
    if (body.length > 58) body = body.slice(0, 56) + '…';

    const titleW = ctx.measureText(title).width;
    const bodyW = ctx.measureText(body).width;
    const boxW = Math.min(Math.max(titleW, bodyW) + 24, 240);
    const boxH = 34;

    const boxX = Math.max(16, Math.min(this.baseWidth - boxW - 16, anchorX - boxW / 2));
    const boxY = Math.max(16, anchorY - boxH + bob);

    // Glassmorphic Dark Slate Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 4);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Downward Pointer
    const pointerX = Math.max(boxX + 10, Math.min(boxX + boxW - 10, anchorX));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.moveTo(pointerX - 5, boxY + boxH);
    ctx.lineTo(pointerX + 5, boxY + boxH);
    ctx.lineTo(pointerX, boxY + boxH + 6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(pointerX - 5, boxY + boxH);
    ctx.lineTo(pointerX, boxY + boxH + 6);
    ctx.lineTo(pointerX + 5, boxY + boxH);
    ctx.stroke();

    // Content
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`💬 ${title}`, boxX + 8, boxY + 12);

    ctx.font = '8px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(body, boxX + 8, boxY + 24);

    ctx.restore();
  }

  /**
   * Renders subtle mini task bubble above coding agents
   */
  private renderModernMiniTaskBubble(_speaker: string, task: string, anchorX: number, anchorY: number, elapsed: number) {
    const { ctx } = this;
    const bob = Math.sin(elapsed / 300) * 1.5;

    ctx.save();
    ctx.font = '7.5px monospace';

    let snippet = task.replace(/[\r\n]+/g, ' ').trim();
    if (snippet.length > 24) snippet = snippet.slice(0, 22) + '…';

    const textW = ctx.measureText(snippet).width;
    const boxW = Math.max(textW + 18, 64);
    const boxH = 16;
    const boxX = Math.max(10, Math.min(this.baseWidth - boxW - 10, anchorX - boxW / 2));
    const boxY = Math.max(8, anchorY + bob);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 3);
    ctx.fill();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Active Green Pulse
    const pulse = Math.sin(elapsed / 150) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(52, 211, 153, ${pulse})`;
    ctx.beginPath();
    ctx.arc(boxX + 6, boxY + 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(snippet, boxX + 12, boxY + 11);

    ctx.restore();
  }

  /**
   * Natural Daylight & Warm Recessed Lighting
   */
  private renderAtmosphericLighting(elapsed: number) {
    const { ctx, originX, originY } = this;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Window daylight beam streaming across the office
    const beam = ctx.createLinearGradient(originX - 100, originY, originX + 200, originY + 400);
    beam.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    beam.addColorStop(0.5, 'rgba(219, 234, 254, 0.03)');
    beam.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(originX - 160, originY + 20);
    ctx.lineTo(originX + 160, originY + 20);
    ctx.lineTo(originX + 380, originY + 450);
    ctx.lineTo(originX - 60, originY + 450);
    ctx.closePath();
    ctx.fill();

    // Ambient server rack LED flicker in the distance
    const flicker = Math.sin(elapsed / 120) * 0.02 + 0.04;
    ctx.fillStyle = `rgba(56, 189, 248, ${flicker})`;
    ctx.beginPath();
    ctx.arc(originX + 180, originY + 100, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================
// Shared Drill Renderer - Single source of truth for all drill drawing
// Used by: DrillAnimationPlayer, DrillCanvasRenderer, DiagramCanvas
// ============================================================

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Position {
  x: number;
  y: number;
}

export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface RenderPlayer {
  id: string;
  role: string;
  position: Position;
}

export interface RenderCone {
  position: Position;
}

export interface RenderConeLine {
  from_cone: number;
  to_cone: number;
}

export interface RenderBall {
  position: Position;
}

export interface RenderGoal {
  position: Position;
  rotation?: number;
  size?: 'full' | 'small';
}

export interface RenderMiniGoal {
  position: Position;
  rotation?: number;
}

export interface RenderAction {
  type: 'PASS' | 'RUN' | 'DRIBBLE' | 'SHOT';
  fromPlayer?: string;
  toPlayer?: string;
  player?: string;
  toPosition?: Position;
}

export interface RenderFieldConfig {
  type?: 'FULL' | 'HALF';
  markings?: boolean;
  show_markings?: boolean;
  goals?: number;
  attacking_direction?: 'NORTH' | 'SOUTH';
}

export interface RenderDrillData {
  field?: RenderFieldConfig;
  players?: RenderPlayer[];
  cones?: RenderCone[];
  cone_lines?: RenderConeLine[];
  balls?: RenderBall[];
  goals?: RenderGoal[];
  mini_goals?: RenderMiniGoal[];
  actions?: RenderAction[];
}

/** All dimensions needed for rendering */
export interface RenderContext {
  bounds: Bounds;
  canvasWidth: number;
  canvasHeight: number;
  fieldWidth: number;
  fieldHeight: number;
  padding: number;
  toCanvas: (x: number, y: number) => Position;
}

// ─── Colors - Must match Python renderer.py ──────────────────────────────────

export const COLORS = {
  GRASS_LIGHT: '#6fbf4a',
  GRASS_DARK: '#63b043',
  CONE_COLOR: '#f4a261',
  CONE_LINE_COLOR: '#f4a261',
  GOAL_COLOR: '#ffffff',
  LINE_COLOR: '#ffffff',
} as const;

export const PLAYER_COLORS: Record<string, string> = {
  attacker: '#e63946',
  defender: '#457b9d',
  goalkeeper: '#f1fa3c',
  neutral: '#f4a261',
  // Also support uppercase keys
  ATTACKER: '#e63946',
  DEFENDER: '#457b9d',
  GOALKEEPER: '#f1fa3c',
  NEUTRAL: '#f4a261',
};

export const ACTION_COLORS: Record<string, string> = {
  PASS: '#ffffff',
  RUN: '#ffffff',
  DRIBBLE: '#ffffff',
  SHOT: '#ff6b6b',
};

// ─── Pixel sizes at CW=900 scale ─────────────────────────────────────────────

const PLAYER_RADIUS = 14;
const LABEL_OFFSET = 18;
const LABEL_FONT = 'bold 11px sans-serif';
const BALL_RADIUS = 11;
const CONE_SIZE = 9;
const ARROW_OFFSET = 15;

// ─── Canvas base width ──────────────────────────────────────────────────────

export const CW = 900;
export const CANVAS_PADDING = 15;

// ─── Bounds Calculation ─────────────────────────────────────────────────────

export function calculateDrillBounds(drill: RenderDrillData, padding = 8): Bounds {
  const xCoords: number[] = [];
  const yCoords: number[] = [];

  drill.players?.forEach(p => {
    xCoords.push(p.position.x);
    yCoords.push(p.position.y);
  });
  drill.cones?.forEach(c => {
    xCoords.push(c.position.x);
    yCoords.push(c.position.y);
  });
  drill.balls?.forEach(b => {
    xCoords.push(b.position.x);
    yCoords.push(b.position.y);
  });
  drill.goals?.forEach(g => {
    xCoords.push(g.position.x - 4, g.position.x + 4);
    yCoords.push(g.position.y - 3, g.position.y + 3);
  });
  drill.mini_goals?.forEach(g => {
    xCoords.push(g.position.x - 2, g.position.x + 2);
    yCoords.push(g.position.y - 2, g.position.y + 2);
  });

  if (xCoords.length === 0) xCoords.push(25, 75);
  if (yCoords.length === 0) yCoords.push(25, 75);

  let xMin = Math.max(0, Math.min(...xCoords) - padding);
  let xMax = Math.min(100, Math.max(...xCoords) + padding);
  let yMin = Math.max(0, Math.min(...yCoords) - padding);
  let yMax = Math.min(100, Math.max(...yCoords) + padding);

  const minSize = 30;
  if (xMax - xMin < minSize) {
    const cx = (xMin + xMax) / 2;
    xMin = Math.max(0, cx - minSize / 2);
    xMax = Math.min(100, cx + minSize / 2);
  }
  if (yMax - yMin < minSize) {
    const cy = (yMin + yMax) / 2;
    yMin = Math.max(0, cy - minSize / 2);
    yMax = Math.min(100, cy + minSize / 2);
  }

  return { xMin, xMax, yMin, yMax };
}

// Full field bounds (for editor)
export const FULL_FIELD_BOUNDS: Bounds = { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };

// ─── Render Context Factory ─────────────────────────────────────────────────

export function createRenderContext(
  bounds: Bounds,
  canvasWidth: number,
  padding: number
): RenderContext {
  const boundsWidth = bounds.xMax - bounds.xMin;
  const boundsHeight = bounds.yMax - bounds.yMin;
  const fieldWidth = canvasWidth - padding * 2;
  const canvasHeight = Math.round((boundsHeight / boundsWidth) * fieldWidth + padding * 2);
  const fieldHeight = canvasHeight - padding * 2;

  const toCanvas = (x: number, y: number): Position => ({
    x: padding + ((x - bounds.xMin) / boundsWidth) * fieldWidth,
    y: padding + ((bounds.yMax - y) / boundsHeight) * fieldHeight,
  });

  return { bounds, canvasWidth, canvasHeight, fieldWidth, fieldHeight, padding, toCanvas };
}

/** Create a render context for fixed 0-100 bounds (editor) */
export function createFixedRenderContext(
  canvasWidth: number,
  canvasHeight: number,
  padding = 0
): RenderContext {
  const bounds = FULL_FIELD_BOUNDS;
  const fieldWidth = canvasWidth - padding * 2;
  const fieldHeight = canvasHeight - padding * 2;

  const toCanvas = (x: number, y: number): Position => ({
    x: padding + (x / 100) * fieldWidth,
    y: padding + ((100 - y) / 100) * fieldHeight,
  });

  return { bounds, canvasWidth, canvasHeight, fieldWidth, fieldHeight, padding, toCanvas };
}

// ─── Drawing Functions ──────────────────────────────────────────────────────

export function drawField(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  field?: RenderFieldConfig
) {
  const { bounds, canvasWidth, canvasHeight, fieldWidth, fieldHeight, padding, toCanvas } = rc;

  // Grass stripes filling entire canvas, aligned to field coordinates
  const stripeWidthUnits = 10;
  const boundsWidth = bounds.xMax - bounds.xMin;
  const pixelsPerUnitX = fieldWidth / boundsWidth;
  const stripeWidthPx = stripeWidthUnits * pixelsPerUnitX;

  const leftEdgeFieldX = bounds.xMin - (padding / pixelsPerUnitX);
  const startStripeIdx = Math.floor(leftEdgeFieldX / stripeWidthUnits);
  const numStripes = Math.ceil(canvasWidth / stripeWidthPx) + 2;

  for (let i = 0; i < numStripes; i++) {
    const stripeIndex = startStripeIdx + i;
    const stripeFieldX = stripeIndex * stripeWidthUnits;
    const canvasX = padding + ((stripeFieldX - bounds.xMin) / boundsWidth) * fieldWidth;
    ctx.fillStyle = stripeIndex % 2 === 0 ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK;
    ctx.fillRect(canvasX, 0, stripeWidthPx, canvasHeight);
  }

  // Field outline removed for cleaner look

  // Field markings
  const showMarkings = field?.markings !== false && field?.show_markings !== false;
  if (!showMarkings) return;

  ctx.strokeStyle = COLORS.LINE_COLOR;
  ctx.lineWidth = 1.5;

  // Halfway line
  const cy = toCanvas(50, 50).y;
  ctx.beginPath();
  ctx.moveTo(padding, cy);
  ctx.lineTo(padding + fieldWidth, cy);
  ctx.stroke();

  // Center circle
  const c = toCanvas(50, 50);
  ctx.beginPath();
  ctx.arc(c.x, c.y, (10 / 100) * fieldWidth, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = COLORS.LINE_COLOR;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
  ctx.fill();

  const fg = field?.goals || 0;
  drawGoalArea(ctx, rc, 100, fg >= 1);
  if (field?.type === 'FULL' || field?.type === undefined) {
    drawGoalArea(ctx, rc, 0, fg >= 2);
  }
}

function drawGoalArea(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  goalY: number,
  drawGoalPost: boolean
) {
  const { toCanvas, fieldWidth, fieldHeight } = rc;
  const into = goalY === 100 ? -1 : 1;

  ctx.strokeStyle = COLORS.LINE_COLOR;
  ctx.lineWidth = 1.5;

  // 18-yard box
  const bt = toCanvas(30, goalY + into * 18);
  const bb = toCanvas(70, goalY);
  ctx.strokeRect(bt.x, Math.min(bt.y, bb.y), toCanvas(70, 0).x - toCanvas(30, 0).x, Math.abs(bt.y - bb.y));

  // 6-yard box
  const st = toCanvas(42, goalY + into * 6);
  const sb = toCanvas(58, goalY);
  ctx.strokeRect(st.x, Math.min(st.y, sb.y), toCanvas(58, 0).x - toCanvas(42, 0).x, Math.abs(st.y - sb.y));

  // Penalty spot
  const ps = toCanvas(50, goalY + into * 12);
  ctx.fillStyle = COLORS.LINE_COLOR;
  ctx.beginPath();
  ctx.arc(ps.x, ps.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Built-in goal
  if (drawGoalPost) {
    const boundsWidth = rc.bounds.xMax - rc.bounds.xMin;
    const boundsHeight = rc.bounds.yMax - rc.bounds.yMin;
    const pos = toCanvas(50, goalY);
    const gw = (8 / boundsWidth) * fieldWidth;
    const gd = (3 / boundsHeight) * fieldHeight;

    ctx.strokeStyle = COLORS.GOAL_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (goalY === 100) {
      ctx.beginPath(); ctx.moveTo(pos.x - gw / 2, pos.y); ctx.lineTo(pos.x - gw / 2, pos.y - gd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x + gw / 2, pos.y); ctx.lineTo(pos.x + gw / 2, pos.y - gd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x - gw / 2, pos.y - gd); ctx.lineTo(pos.x + gw / 2, pos.y - gd); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(pos.x - gw / 2, pos.y); ctx.lineTo(pos.x - gw / 2, pos.y + gd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x + gw / 2, pos.y); ctx.lineTo(pos.x + gw / 2, pos.y + gd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x - gw / 2, pos.y + gd); ctx.lineTo(pos.x + gw / 2, pos.y + gd); ctx.stroke();
    }
  }
}

export function drawConeLines(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  cones?: RenderCone[],
  coneLines?: RenderConeLine[]
) {
  if (!coneLines || !cones) return;

  ctx.strokeStyle = COLORS.CONE_LINE_COLOR;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;

  coneLines.forEach(l => {
    if (l.from_cone < cones.length && l.to_cone < cones.length) {
      const f = rc.toCanvas(cones[l.from_cone].position.x, cones[l.from_cone].position.y);
      const t = rc.toCanvas(cones[l.to_cone].position.x, cones[l.to_cone].position.y);
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 1.0;
}

export function drawCones(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  cones?: RenderCone[]
) {
  if (!cones) return;

  cones.forEach(c => {
    const pos = rc.toCanvas(c.position.x, c.position.y);
    ctx.fillStyle = COLORS.CONE_COLOR;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - CONE_SIZE);
    ctx.lineTo(pos.x - CONE_SIZE * 0.75, pos.y + CONE_SIZE * 0.6);
    ctx.lineTo(pos.x + CONE_SIZE * 0.75, pos.y + CONE_SIZE * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

export function drawGoals(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  goals?: RenderGoal[]
) {
  if (!goals) return;

  const boundsWidth = rc.bounds.xMax - rc.bounds.xMin;
  const boundsHeight = rc.bounds.yMax - rc.bounds.yMin;

  goals.forEach(g => {
    const pos = rc.toCanvas(g.position.x, g.position.y);
    const rot = g.rotation || 0;
    const gw = (8 / boundsWidth) * rc.fieldWidth;
    const gd = (3 / boundsHeight) * rc.fieldHeight;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((rot * Math.PI) / 180);

    ctx.strokeStyle = COLORS.GOAL_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Posts and crossbar
    ctx.beginPath(); ctx.moveTo(-gw / 2, gd / 2); ctx.lineTo(-gw / 2, -gd / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gw / 2, gd / 2); ctx.lineTo(gw / 2, -gd / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-gw / 2, -gd / 2); ctx.lineTo(gw / 2, -gd / 2); ctx.stroke();

    // Net lines
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i <= 8; i++) {
      const x = -gw / 2 + i * (gw / 8);
      ctx.beginPath(); ctx.moveTo(x, -gd / 2); ctx.lineTo(x, gd / 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  });
}

export function drawMiniGoals(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  miniGoals?: RenderMiniGoal[]
) {
  if (!miniGoals) return;

  const boundsWidth = rc.bounds.xMax - rc.bounds.xMin;
  const boundsHeight = rc.bounds.yMax - rc.bounds.yMin;
  const GOAL_WIDTH_UNITS = 4;
  const GOAL_DEPTH_UNITS = 2;

  miniGoals.forEach(g => {
    const pos = rc.toCanvas(g.position.x, g.position.y);
    const inputRotation = g.rotation || 0;
    const rotation = (inputRotation + 180) % 360;
    const goalWidth = (GOAL_WIDTH_UNITS / boundsWidth) * rc.fieldWidth;
    const goalDepth = (GOAL_DEPTH_UNITS / boundsHeight) * rc.fieldHeight;

    ctx.strokeStyle = COLORS.GOAL_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (rotation === 0) {
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y); ctx.lineTo(pos.x - goalWidth / 2, pos.y - goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x + goalWidth / 2, pos.y); ctx.lineTo(pos.x + goalWidth / 2, pos.y - goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y); ctx.lineTo(pos.x + goalWidth / 2, pos.y); ctx.stroke();
    } else if (rotation === 90) {
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth / 2); ctx.lineTo(pos.x + goalDepth, pos.y - goalWidth / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y + goalWidth / 2); ctx.lineTo(pos.x + goalDepth, pos.y + goalWidth / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth / 2); ctx.lineTo(pos.x, pos.y + goalWidth / 2); ctx.stroke();
    } else if (rotation === 180) {
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y); ctx.lineTo(pos.x - goalWidth / 2, pos.y + goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x + goalWidth / 2, pos.y); ctx.lineTo(pos.x + goalWidth / 2, pos.y + goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y); ctx.lineTo(pos.x + goalWidth / 2, pos.y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth / 2); ctx.lineTo(pos.x - goalDepth, pos.y - goalWidth / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y + goalWidth / 2); ctx.lineTo(pos.x - goalDepth, pos.y + goalWidth / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth / 2); ctx.lineTo(pos.x, pos.y + goalWidth / 2); ctx.stroke();
    }
  });
}

export function drawPlayers(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  players?: RenderPlayer[],
  /** Override positions (for animation) */
  positions?: Record<string, Position>
) {
  if (!players) return;

  players.forEach(p => {
    const pd = positions?.[p.id] || p.position;
    const pos = rc.toCanvas(pd.x, pd.y);

    ctx.fillStyle = PLAYER_COLORS[p.role.toLowerCase()] || PLAYER_COLORS[p.role] || '#888';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(p.id, pos.x, pos.y + LABEL_OFFSET);
  });
}

export function drawBalls(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  balls?: RenderBall[],
  positions?: Record<string, Position>
) {
  if (!balls) return;

  balls.forEach((b, i) => {
    const pd = positions?.[`ball_${i}`] || b.position;
    const pos = rc.toCanvas(pd.x, pd.y);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pentagon pattern
    ctx.fillStyle = '#000';
    ctx.beginPath();
    const pentRadius = BALL_RADIUS * 0.45;
    for (let j = 0; j < 5; j++) {
      const a = ((j * 72 - 90) * Math.PI) / 180;
      const px = pos.x + pentRadius * Math.cos(a);
      const py = pos.y + pentRadius * Math.sin(a);
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  });
}

// ─── Arrow / Action Drawing ─────────────────────────────────────────────────

export function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  size = 10
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export function drawActions(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  actions?: RenderAction[],
  players?: RenderPlayer[],
  positions?: Record<string, Position>
) {
  if (!actions || !players) return;

  // Build current positions map for chaining
  const currentPositions: Record<string, Position> = {};
  players.forEach(p => {
    const pd = positions?.[p.id] || p.position;
    currentPositions[p.id] = { x: pd.x, y: pd.y };
  });

  actions.forEach(action => {
    let fromFieldPos: Position | null = null;
    let toFieldPos: Position | null = null;

    if (action.type === 'PASS') {
      fromFieldPos = currentPositions[action.fromPlayer!] || null;
      toFieldPos = currentPositions[action.toPlayer!] || null;
    } else {
      fromFieldPos = currentPositions[action.player!] || null;
      toFieldPos = action.toPosition || (action.type === 'SHOT' ? { x: 50, y: 100 } : null);
    }

    if (!fromFieldPos || !toFieldPos) return;

    const fromPos = rc.toCanvas(fromFieldPos.x, fromFieldPos.y);
    const toPos = rc.toCanvas(toFieldPos.x, toFieldPos.y);

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const startX = fromPos.x + (dx / dist) * ARROW_OFFSET;
    const startY = fromPos.y + (dy / dist) * ARROW_OFFSET;
    const color = ACTION_COLORS[action.type] || '#fff';

    if (action.type === 'PASS') {
      const endX = toPos.x - (dx / dist) * ARROW_OFFSET;
      const endY = toPos.y - (dy / dist) * ARROW_OFFSET;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      drawArrowHead(ctx, endX, endY, Math.atan2(endY - startY, endX - startX), color);
    } else if (action.type === 'RUN') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrowHead(ctx, toPos.x, toPos.y, Math.atan2(toPos.y - startY, toPos.x - startX), color);
      currentPositions[action.player!] = { x: toFieldPos.x, y: toFieldPos.y };
    } else if (action.type === 'DRIBBLE') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      const amplitude = 5;
      const frequency = 8;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.02) {
        const x = startX + (toPos.x - startX) * t;
        const y = startY + (toPos.y - startY) * t;
        const perpX = -(toPos.y - startY) / dist;
        const perpY = (toPos.x - startX) / dist;
        const wave = amplitude * Math.sin(frequency * Math.PI * t);
        const finalX = x + perpX * wave;
        const finalY = y + perpY * wave;
        if (t === 0) ctx.moveTo(finalX, finalY);
        else ctx.lineTo(finalX, finalY);
      }
      ctx.stroke();
      drawArrowHead(ctx, toPos.x, toPos.y, Math.atan2(toPos.y - startY, toPos.x - startX), color);
      currentPositions[action.player!] = { x: toFieldPos.x, y: toFieldPos.y };
    } else if (action.type === 'SHOT') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
      drawArrowHead(ctx, toPos.x, toPos.y, Math.atan2(toPos.y - startY, toPos.x - startX), color, 12);
    }
  });
}

// ─── Full Static Render ─────────────────────────────────────────────────────

/** Render a complete static drill frame */
export function renderDrillFrame(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  drill: RenderDrillData,
  positions?: Record<string, Position>
) {
  ctx.clearRect(0, 0, rc.canvasWidth, rc.canvasHeight);
  drawField(ctx, rc, drill.field);
  drawConeLines(ctx, rc, drill.cones, drill.cone_lines);
  drawCones(ctx, rc, drill.cones);
  drawGoals(ctx, rc, drill.goals);
  drawMiniGoals(ctx, rc, drill.mini_goals);
  drawActions(ctx, rc, drill.actions, drill.players, positions);
  drawPlayers(ctx, rc, drill.players, positions);
  drawBalls(ctx, rc, drill.balls, positions);
}

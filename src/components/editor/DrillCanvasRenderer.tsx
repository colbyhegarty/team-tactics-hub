import React, { useRef, useEffect, useCallback } from 'react';

// Colors - MUST match Python renderer.py
const COLORS = {
  GRASS_LIGHT: '#6fbf4a',
  GRASS_DARK: '#63b043',
  LINE_COLOR: 'white',
  CONE_COLOR: '#f4a261',
  CONE_LINE_COLOR: '#f4a261',
  GOAL_COLOR: 'white',

  // Player roles
  ATTACKER: '#e63946',
  DEFENDER: '#457b9d',
  GOALKEEPER: '#f1fa3c',
  NEUTRAL: '#f4a261',

  // Actions
  PASS: 'white',
  RUN: 'white',
  DRIBBLE: 'white',
  SHOT: '#ff6b6b',
} as const;

// Sizes (in field coordinate units, 0-100 scale)
const SIZES = {
  PLAYER_RADIUS: 2.5,
  CONE_SIZE: 1.5,
  BALL_RADIUS: 1.8,
  GOAL_WIDTH: 8,
  GOAL_DEPTH: 3,
  MINI_GOAL_WIDTH: 4,
  MINI_GOAL_DEPTH: 2,
  ARROW_HEAD_WIDTH: 2.0,
  ARROW_HEAD_LENGTH: 1.5,
  LINE_WIDTH: 1.5,
  PLAYER_OFFSET: 3.0,
} as const;

interface DrillField {
  type: 'FULL' | 'HALF';
  markings: boolean;
  goals: number;
  attacking_direction?: 'NORTH' | 'SOUTH';
}

interface DrillPlayer {
  id: string;
  role: string;
  position: { x: number; y: number };
}

interface DrillCone {
  position: { x: number; y: number };
}

interface DrillConeLine {
  from_cone: number;
  to_cone: number;
}

interface DrillBall {
  position: { x: number; y: number };
}

interface DrillGoal {
  position: { x: number; y: number };
  rotation: number;
}

interface DrillAction {
  type: 'PASS' | 'RUN' | 'DRIBBLE' | 'SHOT';
  from_player?: string;
  to_player?: string;
  player?: string;
  to_position?: { x: number; y: number };
}

export interface DrillData {
  field: DrillField;
  players: DrillPlayer[];
  cones: DrillCone[];
  cone_lines: DrillConeLine[];
  balls: DrillBall[];
  goals: DrillGoal[];
  mini_goals: DrillGoal[];
  actions: DrillAction[];
}

interface DrillCanvasRendererProps {
  drill: DrillData;
  width?: number;
  height?: number;
  padding?: number;
  className?: string;
}

export const DrillCanvasRenderer: React.FC<DrillCanvasRendererProps> = ({
  drill,
  width = 800,
  height = 600,
  padding = 50,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fieldWidth = width - padding * 2;
  const fieldHeight = height - padding * 2;

  const toCanvas = useCallback(
    (x: number, y: number) => ({
      x: padding + (x / 100) * fieldWidth,
      y: padding + ((100 - y) / 100) * fieldHeight,
    }),
    [padding, fieldWidth, fieldHeight]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw in correct order (back to front)
    drawField(ctx, drill.field, padding, fieldWidth, fieldHeight, toCanvas);
    drawConeLines(ctx, drill.cones, drill.cone_lines, toCanvas);
    drawCones(ctx, drill.cones, toCanvas);
    drawGoals(ctx, drill.goals, SIZES.GOAL_WIDTH, SIZES.GOAL_DEPTH, fieldWidth, fieldHeight, toCanvas);
    drawMiniGoals(ctx, drill.mini_goals, SIZES.MINI_GOAL_WIDTH, SIZES.MINI_GOAL_DEPTH, fieldWidth, fieldHeight, toCanvas);
    drawActions(ctx, drill.actions, drill.players, toCanvas);
    drawPlayers(ctx, drill.players, toCanvas);
    drawBalls(ctx, drill.balls, toCanvas);
  }, [drill, width, height, padding, fieldWidth, fieldHeight, toCanvas]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className ?? 'rounded-lg'}
    />
  );
};

// ─── Drawing Functions ───────────────────────────────────────────────────────

function drawField(
  ctx: CanvasRenderingContext2D,
  field: DrillField,
  padding: number,
  fieldWidth: number,
  fieldHeight: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  // Vertical grass stripes
  const stripeCount = 10;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK;
    ctx.fillRect(
      padding + i * (fieldWidth / stripeCount),
      padding,
      fieldWidth / stripeCount,
      fieldHeight
    );
  }

  // Field outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padding, padding, fieldWidth, fieldHeight);

  if (!field.markings) return;

  ctx.strokeStyle = COLORS.LINE_COLOR;
  ctx.lineWidth = 1.5;

  // Halfway line
  const centerY = toCanvas(50, 50).y;
  ctx.beginPath();
  ctx.moveTo(padding, centerY);
  ctx.lineTo(padding + fieldWidth, centerY);
  ctx.stroke();

  // Center circle (FULL field only)
  if (field.type === 'FULL') {
    const center = toCanvas(50, 50);
    const circleRadius = (10 / 100) * fieldWidth;
    ctx.beginPath();
    ctx.arc(center.x, center.y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = COLORS.LINE_COLOR;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Goal areas
  const attackingDir = field.attacking_direction || 'NORTH';

  if (attackingDir === 'NORTH') {
    drawGoalArea(ctx, 100, field.goals >= 1, padding, fieldWidth, fieldHeight, toCanvas);
    if (field.type === 'FULL') {
      drawGoalArea(ctx, 0, field.goals >= 2, padding, fieldWidth, fieldHeight, toCanvas);
    }
  } else {
    drawGoalArea(ctx, 0, field.goals >= 1, padding, fieldWidth, fieldHeight, toCanvas);
    if (field.type === 'FULL') {
      drawGoalArea(ctx, 100, field.goals >= 2, padding, fieldWidth, fieldHeight, toCanvas);
    }
  }
}

function drawGoalArea(
  ctx: CanvasRenderingContext2D,
  goalY: number,
  showGoal: boolean,
  padding: number,
  fieldWidth: number,
  fieldHeight: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const into = goalY === 100 ? -1 : 1;

  ctx.strokeStyle = COLORS.LINE_COLOR;
  ctx.lineWidth = 1.5;

  // 18-yard box (penalty area)
  const penTop = toCanvas(30, goalY + into * 18);
  const penBottom = toCanvas(70, goalY);
  const penWidth = toCanvas(70, 0).x - toCanvas(30, 0).x;
  const penHeight = Math.abs(penTop.y - penBottom.y);

  ctx.strokeRect(
    penTop.x,
    Math.min(penTop.y, penBottom.y),
    penWidth,
    penHeight
  );

  // 6-yard box
  const sixTop = toCanvas(42, goalY + into * 6);
  const sixBottom = toCanvas(58, goalY);
  const sixWidth = toCanvas(58, 0).x - toCanvas(42, 0).x;
  const sixHeight = Math.abs(sixTop.y - sixBottom.y);

  ctx.strokeRect(
    sixTop.x,
    Math.min(sixTop.y, sixBottom.y),
    sixWidth,
    sixHeight
  );

  // Penalty spot
  const penSpot = toCanvas(50, goalY + into * 12);
  ctx.fillStyle = COLORS.LINE_COLOR;
  ctx.beginPath();
  ctx.arc(penSpot.x, penSpot.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Built-in goal
  if (showGoal) {
    drawBuiltInGoal(ctx, goalY, padding, fieldWidth, fieldHeight, toCanvas);
  }
}

function drawBuiltInGoal(
  ctx: CanvasRenderingContext2D,
  goalY: number,
  _padding: number,
  fieldWidth: number,
  fieldHeight: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const pos = toCanvas(50, goalY);
  const goalWidth = (SIZES.GOAL_WIDTH / 100) * fieldWidth;
  const goalDepth = (SIZES.GOAL_DEPTH / 100) * fieldHeight;

  ctx.strokeStyle = COLORS.GOAL_COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  if (goalY === 100) {
    // Goal at top - opening faces down
    ctx.beginPath();
    ctx.moveTo(pos.x - goalWidth / 2, pos.y);
    ctx.lineTo(pos.x - goalWidth / 2, pos.y - goalDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x + goalWidth / 2, pos.y);
    ctx.lineTo(pos.x + goalWidth / 2, pos.y - goalDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x - goalWidth / 2, pos.y - goalDepth);
    ctx.lineTo(pos.x + goalWidth / 2, pos.y - goalDepth);
    ctx.stroke();
  } else {
    // Goal at bottom - opening faces up
    ctx.beginPath();
    ctx.moveTo(pos.x - goalWidth / 2, pos.y);
    ctx.lineTo(pos.x - goalWidth / 2, pos.y + goalDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x + goalWidth / 2, pos.y);
    ctx.lineTo(pos.x + goalWidth / 2, pos.y + goalDepth);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x - goalWidth / 2, pos.y + goalDepth);
    ctx.lineTo(pos.x + goalWidth / 2, pos.y + goalDepth);
    ctx.stroke();
  }
}

function drawConeLines(
  ctx: CanvasRenderingContext2D,
  cones: DrillCone[],
  coneLines: DrillConeLine[],
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!coneLines || !cones) return;

  ctx.strokeStyle = COLORS.CONE_LINE_COLOR;
  ctx.lineWidth = 2;

  coneLines.forEach((line) => {
    if (line.from_cone < cones.length && line.to_cone < cones.length) {
      const from = toCanvas(cones[line.from_cone].position.x, cones[line.from_cone].position.y);
      const to = toCanvas(cones[line.to_cone].position.x, cones[line.to_cone].position.y);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  });
}

function drawCones(
  ctx: CanvasRenderingContext2D,
  cones: DrillCone[],
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!cones) return;

  cones.forEach((cone) => {
    const pos = toCanvas(cone.position.x, cone.position.y);
    const size = 8;

    ctx.fillStyle = COLORS.CONE_COLOR;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - size);
    ctx.lineTo(pos.x - size * 0.75, pos.y + size * 0.6);
    ctx.lineTo(pos.x + size * 0.75, pos.y + size * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
}

function drawPlayers(
  ctx: CanvasRenderingContext2D,
  players: DrillPlayer[],
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!players) return;

  players.forEach((player) => {
    const pos = toCanvas(player.position.x, player.position.y);
    const radius = 12;

    const color = COLORS[player.role as keyof typeof COLORS] || '#888';

    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Player ID label below
    ctx.fillStyle = 'white';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(player.id, pos.x, pos.y + radius + 4);
  });
}

function drawBalls(
  ctx: CanvasRenderingContext2D,
  balls: DrillBall[],
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!balls) return;

  balls.forEach((ball) => {
    const pos = toCanvas(ball.position.x, ball.position.y);
    const radius = 10;

    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pentagon pattern
    ctx.fillStyle = 'black';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      const px = pos.x + 5 * Math.cos(angle);
      const py = pos.y + 5 * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  });
}

function drawGoals(
  ctx: CanvasRenderingContext2D,
  goals: DrillGoal[],
  goalWidthUnits: number,
  goalDepthUnits: number,
  fieldWidth: number,
  fieldHeight: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!goals) return;

  goals.forEach((goal) => {
    const pos = toCanvas(goal.position.x, goal.position.y);
    const rotation = goal.rotation || 0;
    const goalWidth = (goalWidthUnits / 100) * fieldWidth;
    const goalDepth = (goalDepthUnits / 100) * fieldHeight;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.strokeStyle = COLORS.GOAL_COLOR;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Posts and crossbar
    ctx.beginPath();
    ctx.moveTo(-goalWidth / 2, goalDepth / 2);
    ctx.lineTo(-goalWidth / 2, -goalDepth / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(goalWidth / 2, goalDepth / 2);
    ctx.lineTo(goalWidth / 2, -goalDepth / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-goalWidth / 2, -goalDepth / 2);
    ctx.lineTo(goalWidth / 2, -goalDepth / 2);
    ctx.stroke();

    // Net lines
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i <= 8; i++) {
      const x = -goalWidth / 2 + i * (goalWidth / 8);
      ctx.beginPath();
      ctx.moveTo(x, -goalDepth / 2);
      ctx.lineTo(x, goalDepth / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  });
}

function drawMiniGoals(
  ctx: CanvasRenderingContext2D,
  miniGoals: DrillGoal[],
  goalWidthUnits: number,
  goalDepthUnits: number,
  fieldWidth: number,
  fieldHeight: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!miniGoals) return;

  miniGoals.forEach((goal) => {
    const pos = toCanvas(goal.position.x, goal.position.y);
    // Flip rotation by 180 (matching Python renderer)
    const rotation = ((goal.rotation || 0) + 180) % 360;
    const goalWidth = (goalWidthUnits / 100) * fieldWidth;
    const goalDepth = (goalDepthUnits / 100) * fieldHeight;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.strokeStyle = COLORS.GOAL_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // U-shape
    ctx.beginPath();
    ctx.moveTo(-goalWidth / 2, goalDepth / 2);
    ctx.lineTo(-goalWidth / 2, -goalDepth / 2);
    ctx.lineTo(goalWidth / 2, -goalDepth / 2);
    ctx.lineTo(goalWidth / 2, goalDepth / 2);
    ctx.stroke();

    ctx.restore();
  });
}

function drawActions(
  ctx: CanvasRenderingContext2D,
  actions: DrillAction[],
  players: DrillPlayer[],
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  if (!actions || !players) return;

  const playerPositions: Record<string, { x: number; y: number }> = {};
  players.forEach((p) => {
    playerPositions[p.id] = { x: p.position.x, y: p.position.y };
  });

  // Track current positions (players may move during actions)
  const currentPositions: Record<string, { x: number; y: number }> = {};
  Object.keys(playerPositions).forEach((k) => {
    currentPositions[k] = { ...playerPositions[k] };
  });

  actions.forEach((action) => {
    if (action.type === 'PASS') {
      const from = currentPositions[action.from_player!];
      const to = currentPositions[action.to_player!];
      if (from && to) {
        drawPassArrow(ctx, from.x, from.y, to.x, to.y, toCanvas);
      }
    } else if (action.type === 'RUN') {
      const from = currentPositions[action.player!];
      const to = action.to_position;
      if (from && to) {
        drawRunArrow(ctx, from.x, from.y, to.x, to.y, toCanvas);
        currentPositions[action.player!] = { x: to.x, y: to.y };
      }
    } else if (action.type === 'DRIBBLE') {
      const from = currentPositions[action.player!];
      const to = action.to_position;
      if (from && to) {
        drawDribbleArrow(ctx, from.x, from.y, to.x, to.y, toCanvas);
        currentPositions[action.player!] = { x: to.x, y: to.y };
      }
    } else if (action.type === 'SHOT') {
      const from = currentPositions[action.player!];
      const to = action.to_position || { x: 50, y: 100 };
      if (from) {
        drawShotArrow(ctx, from.x, from.y, to.x, to.y, toCanvas);
      }
    }
  });
}

// ─── Arrow drawing helpers ───────────────────────────────────────────────────

function drawArrowHead(
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
  ctx.lineTo(
    x - size * Math.cos(angle - Math.PI / 6),
    y - size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x - size * Math.cos(angle + Math.PI / 6),
    y - size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function getOffsetEndpoints(
  startCanvas: { x: number; y: number },
  endCanvas: { x: number; y: number },
  offset: number
) {
  const dx = endCanvas.x - startCanvas.x;
  const dy = endCanvas.y - startCanvas.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return null;
  return {
    startX: startCanvas.x + (dx / dist) * offset,
    startY: startCanvas.y + (dy / dist) * offset,
    endX: endCanvas.x - (dx / dist) * offset,
    endY: endCanvas.y - (dy / dist) * offset,
    dx,
    dy,
    dist,
  };
}

function drawPassArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const start = toCanvas(x1, y1);
  const end = toCanvas(x2, y2);
  const ep = getOffsetEndpoints(start, end, 15);
  if (!ep) return;

  ctx.strokeStyle = COLORS.PASS;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(ep.startX, ep.startY);
  ctx.lineTo(ep.endX, ep.endY);
  ctx.stroke();

  drawArrowHead(ctx, ep.endX, ep.endY, Math.atan2(ep.endY - ep.startY, ep.endX - ep.startX), COLORS.PASS);
}

function drawRunArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const start = toCanvas(x1, y1);
  const end = toCanvas(x2, y2);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const offset = 15;
  const startX = start.x + (dx / dist) * offset;
  const startY = start.y + (dy / dist) * offset;

  ctx.strokeStyle = COLORS.RUN;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.setLineDash([]);

  drawArrowHead(ctx, end.x, end.y, Math.atan2(end.y - startY, end.x - startX), COLORS.RUN);
}

function drawDribbleArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const start = toCanvas(x1, y1);
  const end = toCanvas(x2, y2);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const offset = 15;
  const startX = start.x + (dx / dist) * offset;
  const startY = start.y + (dy / dist) * offset;

  // Wavy line
  ctx.strokeStyle = COLORS.DRIBBLE;
  ctx.lineWidth = 2;

  const amplitude = 5;
  const frequency = 8;

  ctx.beginPath();
  for (let t = 0; t <= 1; t += 0.02) {
    const x = startX + (end.x - startX) * t;
    const y = startY + (end.y - startY) * t;

    const perpX = -(end.y - startY) / dist;
    const perpY = (end.x - startX) / dist;
    const wave = amplitude * Math.sin(frequency * Math.PI * t);

    const finalX = x + perpX * wave;
    const finalY = y + perpY * wave;

    if (t === 0) ctx.moveTo(finalX, finalY);
    else ctx.lineTo(finalX, finalY);
  }
  ctx.stroke();

  drawArrowHead(ctx, end.x, end.y, Math.atan2(end.y - startY, end.x - startX), COLORS.DRIBBLE);
}

function drawShotArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const start = toCanvas(x1, y1);
  const end = toCanvas(x2, y2);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const offset = 15;
  const startX = start.x + (dx / dist) * offset;
  const startY = start.y + (dy / dist) * offset;

  ctx.strokeStyle = COLORS.SHOT;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  drawArrowHead(ctx, end.x, end.y, Math.atan2(end.y - startY, end.x - startX), COLORS.SHOT, 12);
}

export default DrillCanvasRenderer;

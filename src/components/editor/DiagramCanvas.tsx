import React, { useRef, useEffect, useCallback } from 'react';
import {
  EditorState,
  DiagramData,
  FieldPosition,
  CustomPlayer,
  CustomCone,
  CustomBall,
  CustomGoal,
  CustomConeLine,
  CustomAction,
  PLAYER_COLORS,
  FIELD_COLORS,
  ACTION_COLORS,
} from '@/types/customDrill';
import { generateId } from '@/lib/customDrillStorage';

interface DiagramCanvasProps {
  diagram: DiagramData;
  tool: EditorState['tool'];
  selectedEntity: EditorState['selectedEntity'];
  pendingActionFrom: string | null;
  onDiagramChange: (diagram: DiagramData) => void;
  onSelectEntity: (entity: EditorState['selectedEntity']) => void;
  onPendingActionChange: (id: string | null) => void;
}

const PADDING = 50;

// Sizes matching Python renderer (field coordinate units, 0-100 scale)
const SIZES = {
  GOAL_WIDTH: 8,
  GOAL_DEPTH: 3,
  MINI_GOAL_WIDTH: 4,
  MINI_GOAL_DEPTH: 2,
};

export function DiagramCanvas({
  diagram,
  tool,
  selectedEntity,
  pendingActionFrom,
  onDiagramChange,
  onSelectEntity,
  onPendingActionChange,
}: DiagramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const fieldWidth = dimensions.width - PADDING * 2;
  const fieldHeight = dimensions.height - PADDING * 2;

  // Coordinate conversion
  const toCanvas = useCallback((fieldPos: FieldPosition) => ({
    x: PADDING + (fieldPos.x / 100) * fieldWidth,
    y: PADDING + ((100 - fieldPos.y) / 100) * fieldHeight,
  }), [fieldWidth, fieldHeight]);

  const toField = useCallback((canvasX: number, canvasY: number): FieldPosition => ({
    x: Math.max(0, Math.min(100, ((canvasX - PADDING) / fieldWidth) * 100)),
    y: Math.max(0, Math.min(100, 100 - ((canvasY - PADDING) / fieldHeight) * 100)),
  }), [fieldWidth, fieldHeight]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const height = width * 0.75; // 4:3 aspect ratio
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Helper: toCanvas with raw x,y numbers
  const toCanvasXY = useCallback((x: number, y: number) => ({
    x: PADDING + (x / 100) * fieldWidth,
    y: PADDING + ((100 - y) / 100) * fieldHeight,
  }), [fieldWidth, fieldHeight]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // 1. Field (vertical stripes matching Python renderer)
    drawField(ctx, width, height, diagram.field);

    // 2. Cone lines
    diagram.coneLines.forEach((line) => {
      const fromCone = diagram.cones.find(c => c.id === line.fromConeId);
      const toCone = diagram.cones.find(c => c.id === line.toConeId);
      if (fromCone && toCone) {
        drawConeLine(ctx, toCanvas(fromCone.position), toCanvas(toCone.position),
          selectedEntity?.type === 'coneline' && selectedEntity.id === line.id);
      }
    });

    // 3. Cones
    diagram.cones.forEach((cone) => {
      drawCone(ctx, toCanvas(cone.position),
        selectedEntity?.type === 'cone' && selectedEntity.id === cone.id);
    });

    // 4. Goals (custom positioned)
    diagram.goals.forEach((goal) => {
      drawGoal(ctx, toCanvas(goal.position), goal.size, goal.rotation,
        selectedEntity?.type === 'goal' && selectedEntity.id === goal.id);
    });

    // 5. Actions
    diagram.actions.forEach((action) => {
      drawAction(ctx, action, diagram.players, toCanvasXY,
        selectedEntity?.type === 'action' && selectedEntity.id === action.id);
    });

    // 6. Players
    diagram.players.forEach((player) => {
      drawPlayer(ctx, toCanvas(player.position), player.role, player.id,
        selectedEntity?.type === 'player' && selectedEntity.id === player.id,
        pendingActionFrom === player.id);
    });

    // 7. Balls
    diagram.balls.forEach((ball) => {
      drawBall(ctx, toCanvas(ball.position),
        selectedEntity?.type === 'ball' && selectedEntity.id === ball.id);
    });

  }, [diagram, dimensions, selectedEntity, pendingActionFrom, toCanvas, toCanvasXY]);

  // ─── Interaction handlers ──────────────────────────────────────────────────

  const findEntityAt = useCallback((fieldPos: FieldPosition): EditorState['selectedEntity'] | null => {
    const threshold = 5;
    for (const player of diagram.players) {
      if (Math.hypot(player.position.x - fieldPos.x, player.position.y - fieldPos.y) < threshold)
        return { type: 'player', id: player.id };
    }
    for (const ball of diagram.balls) {
      if (Math.hypot(ball.position.x - fieldPos.x, ball.position.y - fieldPos.y) < threshold)
        return { type: 'ball', id: ball.id };
    }
    for (const cone of diagram.cones) {
      if (Math.hypot(cone.position.x - fieldPos.x, cone.position.y - fieldPos.y) < threshold)
        return { type: 'cone', id: cone.id };
    }
    for (const goal of diagram.goals) {
      if (Math.hypot(goal.position.x - fieldPos.x, goal.position.y - fieldPos.y) < 8)
        return { type: 'goal', id: goal.id };
    }
    return null;
  }, [diagram]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const fieldPos = toField(canvasX, canvasY);

    if (tool === 'select') {
      onSelectEntity(findEntityAt(fieldPos));
      onPendingActionChange(null);
      return;
    }

    if (['attacker', 'defender', 'goalkeeper', 'neutral'].includes(tool)) {
      const role = tool.toUpperCase() as CustomPlayer['role'];
      const prefix = role[0];
      const count = diagram.players.filter(p => p.role === role).length + 1;
      const newPlayer: CustomPlayer = { id: `${prefix}${count}`, role, position: fieldPos };
      onDiagramChange({ ...diagram, players: [...diagram.players, newPlayer] });
      return;
    }

    if (tool === 'cone') {
      const newCone: CustomCone = { id: generateId(), position: fieldPos };
      onDiagramChange({ ...diagram, cones: [...diagram.cones, newCone] });
      return;
    }

    if (tool === 'ball') {
      const newBall: CustomBall = { id: generateId(), position: fieldPos };
      onDiagramChange({ ...diagram, balls: [...diagram.balls, newBall] });
      return;
    }

    if (tool === 'goal' || tool === 'minigoal') {
      const newGoal: CustomGoal = { id: generateId(), position: fieldPos, rotation: 0, size: tool === 'goal' ? 'full' : 'mini' };
      onDiagramChange({ ...diagram, goals: [...diagram.goals, newGoal] });
      return;
    }

    if (tool === 'coneline') {
      const clickedCone = diagram.cones.find(c => Math.hypot(c.position.x - fieldPos.x, c.position.y - fieldPos.y) < 5);
      if (!clickedCone) return;
      if (!pendingActionFrom) {
        onPendingActionChange(clickedCone.id);
      } else {
        if (pendingActionFrom !== clickedCone.id) {
          const newLine: CustomConeLine = { id: generateId(), fromConeId: pendingActionFrom, toConeId: clickedCone.id };
          onDiagramChange({ ...diagram, coneLines: [...diagram.coneLines, newLine] });
        }
        onPendingActionChange(null);
      }
      return;
    }

    if (tool === 'pass') {
      const clickedPlayer = diagram.players.find(p => Math.hypot(p.position.x - fieldPos.x, p.position.y - fieldPos.y) < 5);
      if (!clickedPlayer) return;
      if (!pendingActionFrom) {
        onPendingActionChange(clickedPlayer.id);
      } else {
        if (pendingActionFrom !== clickedPlayer.id) {
          const newAction: CustomAction = { id: generateId(), type: 'PASS', fromPlayerId: pendingActionFrom, toPlayerId: clickedPlayer.id };
          onDiagramChange({ ...diagram, actions: [...diagram.actions, newAction] });
        }
        onPendingActionChange(null);
      }
      return;
    }

    if (['run', 'dribble', 'shot'].includes(tool)) {
      if (!pendingActionFrom) {
        const clickedPlayer = diagram.players.find(p => Math.hypot(p.position.x - fieldPos.x, p.position.y - fieldPos.y) < 5);
        if (clickedPlayer) onPendingActionChange(clickedPlayer.id);
      } else {
        const actionType = tool.toUpperCase() as 'RUN' | 'DRIBBLE' | 'SHOT';
        const newAction: CustomAction = { id: generateId(), type: actionType, playerId: pendingActionFrom, toPosition: fieldPos };
        onDiagramChange({ ...diagram, actions: [...diagram.actions, newAction] });
        onPendingActionChange(null);
      }
      return;
    }
  }, [tool, diagram, pendingActionFrom, toField, findEntityAt, onDiagramChange, onSelectEntity, onPendingActionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'select') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const fieldPos = toField(canvasX, canvasY);

    const entity = findEntityAt(fieldPos);
    if (entity) {
      onSelectEntity(entity);
      setIsDragging(true);
      let entityPos: FieldPosition | null = null;
      if (entity.type === 'player') entityPos = diagram.players.find(p => p.id === entity.id)?.position || null;
      else if (entity.type === 'cone') entityPos = diagram.cones.find(c => c.id === entity.id)?.position || null;
      else if (entity.type === 'ball') entityPos = diagram.balls.find(b => b.id === entity.id)?.position || null;
      else if (entity.type === 'goal') entityPos = diagram.goals.find(g => g.id === entity.id)?.position || null;
      if (entityPos) {
        dragOffsetRef.current = { x: fieldPos.x - entityPos.x, y: fieldPos.y - entityPos.y };
      }
    }
  }, [tool, toField, findEntityAt, diagram, onSelectEntity]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedEntity) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    const fieldPos = toField(canvasX, canvasY);
    const newPos = {
      x: Math.max(0, Math.min(100, fieldPos.x - dragOffsetRef.current.x)),
      y: Math.max(0, Math.min(100, fieldPos.y - dragOffsetRef.current.y)),
    };

    if (selectedEntity.type === 'player') {
      onDiagramChange({ ...diagram, players: diagram.players.map(p => p.id === selectedEntity.id ? { ...p, position: newPos } : p) });
    } else if (selectedEntity.type === 'cone') {
      onDiagramChange({ ...diagram, cones: diagram.cones.map(c => c.id === selectedEntity.id ? { ...c, position: newPos } : c) });
    } else if (selectedEntity.type === 'ball') {
      onDiagramChange({ ...diagram, balls: diagram.balls.map(b => b.id === selectedEntity.id ? { ...b, position: newPos } : b) });
    } else if (selectedEntity.type === 'goal') {
      onDiagramChange({ ...diagram, goals: diagram.goals.map(g => g.id === selectedEntity.id ? { ...g, position: newPos } : g) });
    }
  }, [isDragging, selectedEntity, toField, diagram, onDiagramChange]);

  const handleMouseUp = useCallback(() => { setIsDragging(false); }, []);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair rounded-lg border border-border"
        style={{ height: dimensions.height }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}

// ─── Drawing functions (matching Python renderer.py) ─────────────────────────

function drawField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  field: DiagramData['field']
) {
  const fw = width - PADDING * 2;
  const fh = height - PADDING * 2;

  // Vertical grass stripes (matching Python renderer)
  const stripeCount = 10;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? FIELD_COLORS.GRASS_LIGHT : FIELD_COLORS.GRASS_DARK;
    ctx.fillRect(PADDING + i * (fw / stripeCount), PADDING, fw / stripeCount, fh);
  }

  // Field outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(PADDING, PADDING, fw, fh);

  if (!field.markings) return;

  ctx.strokeStyle = FIELD_COLORS.LINES;
  ctx.lineWidth = 1.5;

  // Halfway line
  const centerY = PADDING + fh / 2;
  ctx.beginPath();
  ctx.moveTo(PADDING, centerY);
  ctx.lineTo(PADDING + fw, centerY);
  ctx.stroke();

  // Center circle (FULL field only)
  if (field.type === 'FULL') {
    const circleRadius = (10 / 100) * fw;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = FIELD_COLORS.LINES;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Goal areas with penalty boxes
  const toCanvasLocal = (x: number, y: number) => ({
    x: PADDING + (x / 100) * fw,
    y: PADDING + ((100 - y) / 100) * fh,
  });

  // Top goal area (y=100)
  drawGoalArea(ctx, 100, field.goals >= 1, fw, fh, toCanvasLocal);

  // Bottom goal area (y=0) for FULL field
  if (field.type === 'FULL') {
    drawGoalArea(ctx, 0, field.goals >= 2, fw, fh, toCanvasLocal);
  }
}

function drawGoalArea(
  ctx: CanvasRenderingContext2D,
  goalY: number,
  showGoal: boolean,
  fw: number,
  fh: number,
  toCanvas: (x: number, y: number) => { x: number; y: number }
) {
  const into = goalY === 100 ? -1 : 1;

  ctx.strokeStyle = FIELD_COLORS.LINES;
  ctx.lineWidth = 1.5;

  // 18-yard box
  const penTop = toCanvas(30, goalY + into * 18);
  const penBottom = toCanvas(70, goalY);
  const penWidth = toCanvas(70, 0).x - toCanvas(30, 0).x;
  const penHeight = Math.abs(penTop.y - penBottom.y);
  ctx.strokeRect(penTop.x, Math.min(penTop.y, penBottom.y), penWidth, penHeight);

  // 6-yard box
  const sixTop = toCanvas(42, goalY + into * 6);
  const sixBottom = toCanvas(58, goalY);
  const sixWidth = toCanvas(58, 0).x - toCanvas(42, 0).x;
  const sixHeight = Math.abs(sixTop.y - sixBottom.y);
  ctx.strokeRect(sixTop.x, Math.min(sixTop.y, sixBottom.y), sixWidth, sixHeight);

  // Penalty spot
  const penSpot = toCanvas(50, goalY + into * 12);
  ctx.fillStyle = FIELD_COLORS.LINES;
  ctx.beginPath();
  ctx.arc(penSpot.x, penSpot.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Built-in goal
  if (showGoal) {
    const pos = toCanvas(50, goalY);
    const goalWidth = (SIZES.GOAL_WIDTH / 100) * fw;
    const goalDepth = (SIZES.GOAL_DEPTH / 100) * fh;

    ctx.strokeStyle = FIELD_COLORS.LINES;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (goalY === 100) {
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y); ctx.lineTo(pos.x - goalWidth / 2, pos.y - goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x + goalWidth / 2, pos.y); ctx.lineTo(pos.x + goalWidth / 2, pos.y - goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y - goalDepth); ctx.lineTo(pos.x + goalWidth / 2, pos.y - goalDepth); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y); ctx.lineTo(pos.x - goalWidth / 2, pos.y + goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x + goalWidth / 2, pos.y); ctx.lineTo(pos.x + goalWidth / 2, pos.y + goalDepth); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pos.x - goalWidth / 2, pos.y + goalDepth); ctx.lineTo(pos.x + goalWidth / 2, pos.y + goalDepth); ctx.stroke();
    }
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  role: CustomPlayer['role'],
  id: string,
  isSelected: boolean,
  isPending: boolean
) {
  const radius = 12;

  // Selection/pending indicator
  if (isSelected || isPending) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = isPending ? '#facc15' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Player circle
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = PLAYER_COLORS[role];
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Player ID label below (matching Python renderer)
  ctx.fillStyle = 'white';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(id, pos.x, pos.y + radius + 4);
}

function drawCone(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  isSelected: boolean
) {
  const size = 8;

  if (isSelected) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Triangle cone (matching Python renderer)
  ctx.fillStyle = FIELD_COLORS.CONE;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y - size);
  ctx.lineTo(pos.x - size * 0.75, pos.y + size * 0.6);
  ctx.lineTo(pos.x + size * 0.75, pos.y + size * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  isSelected: boolean
) {
  const radius = 10;

  if (isSelected) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pentagon pattern (matching Python renderer)
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
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  size: 'full' | 'mini',
  rotation: number,
  isSelected: boolean
) {
  const isMini = size === 'mini';
  const goalWidth = isMini ? 30 : 60;
  const goalDepth = isMini ? 8 : 15;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  if (isMini) {
    ctx.rotate((((rotation || 0) + 180) % 360 * Math.PI) / 180);
  } else {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(-goalWidth / 2 - 3, -goalDepth / 2 - 3, goalWidth + 6, goalDepth + 6);
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = isMini ? 2 : 3;
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

  if (!isMini) {
    // Net lines for full goals
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
  }

  ctx.restore();
}

function drawConeLine(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  isSelected: boolean
) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = isSelected ? '#facc15' : FIELD_COLORS.CONE;
  ctx.lineWidth = isSelected ? 4 : 2;
  ctx.stroke();
}

// ─── Action drawing (matching Python renderer) ──────────────────────────────

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
  ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawAction(
  ctx: CanvasRenderingContext2D,
  action: CustomAction,
  players: CustomPlayer[],
  toCanvas: (x: number, y: number) => { x: number; y: number },
  isSelected: boolean
) {
  let fromFieldPos: FieldPosition | null = null;
  let toFieldPos: FieldPosition | null = null;

  if (action.type === 'PASS') {
    const fromPlayer = players.find(p => p.id === action.fromPlayerId);
    const toPlayer = players.find(p => p.id === action.toPlayerId);
    if (fromPlayer && toPlayer) {
      fromFieldPos = fromPlayer.position;
      toFieldPos = toPlayer.position;
    }
  } else {
    const player = players.find(p => p.id === action.playerId);
    if (player) {
      fromFieldPos = player.position;
      toFieldPos = action.toPosition;
    }
  }

  if (!fromFieldPos || !toFieldPos) return;

  const fromPos = toCanvas(fromFieldPos.x, fromFieldPos.y);
  const toPos = toCanvas(toFieldPos.x, toFieldPos.y);

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  const offset = 15;
  const startX = fromPos.x + (dx / dist) * offset;
  const startY = fromPos.y + (dy / dist) * offset;

  const color = ACTION_COLORS[action.type];

  if (action.type === 'PASS') {
    // Solid line
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.lineCap = 'round';
    const endX = toPos.x - (dx / dist) * offset;
    const endY = toPos.y - (dy / dist) * offset;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    drawArrowHead(ctx, endX, endY, Math.atan2(endY - startY, endX - startX), color);
  } else if (action.type === 'RUN') {
    // Dashed line
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrowHead(ctx, toPos.x, toPos.y, Math.atan2(toPos.y - startY, toPos.x - startX), color);
  } else if (action.type === 'DRIBBLE') {
    // Wavy line
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
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
  } else if (action.type === 'SHOT') {
    // Thick line
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 5 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();
    drawArrowHead(ctx, toPos.x, toPos.y, Math.atan2(toPos.y - startY, toPos.x - startX), color, 12);
  }
}

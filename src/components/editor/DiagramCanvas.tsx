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

const PADDING = 20;

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

  // Coordinate conversion
  const toCanvas = useCallback((fieldPos: FieldPosition) => {
    const fieldWidth = dimensions.width - PADDING * 2;
    const fieldHeight = dimensions.height - PADDING * 2;
    return {
      x: PADDING + (fieldPos.x / 100) * fieldWidth,
      y: PADDING + ((100 - fieldPos.y) / 100) * fieldHeight,
    };
  }, [dimensions]);

  const toField = useCallback((canvasX: number, canvasY: number): FieldPosition => {
    const fieldWidth = dimensions.width - PADDING * 2;
    const fieldHeight = dimensions.height - PADDING * 2;
    return {
      x: Math.max(0, Math.min(100, ((canvasX - PADDING) / fieldWidth) * 100)),
      y: Math.max(0, Math.min(100, 100 - ((canvasY - PADDING) / fieldHeight) * 100)),
    };
  }, [dimensions]);

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

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw field
    drawField(ctx, width, height, diagram.field.markings, diagram.field.type);

    // Draw cone lines
    diagram.coneLines.forEach((line) => {
      const fromCone = diagram.cones.find(c => c.id === line.fromConeId);
      const toCone = diagram.cones.find(c => c.id === line.toConeId);
      if (fromCone && toCone) {
        drawConeLine(ctx, toCanvas(fromCone.position), toCanvas(toCone.position), 
          selectedEntity?.type === 'coneline' && selectedEntity.id === line.id);
      }
    });

    // Draw goals
    diagram.goals.forEach((goal) => {
      drawGoal(ctx, toCanvas(goal.position), goal.size, goal.rotation,
        selectedEntity?.type === 'goal' && selectedEntity.id === goal.id);
    });

    // Draw cones
    diagram.cones.forEach((cone) => {
      drawCone(ctx, toCanvas(cone.position),
        selectedEntity?.type === 'cone' && selectedEntity.id === cone.id);
    });

    // Draw balls
    diagram.balls.forEach((ball) => {
      drawBall(ctx, toCanvas(ball.position),
        selectedEntity?.type === 'ball' && selectedEntity.id === ball.id);
    });

    // Draw players
    diagram.players.forEach((player) => {
      drawPlayer(ctx, toCanvas(player.position), player.role, player.id,
        selectedEntity?.type === 'player' && selectedEntity.id === player.id,
        pendingActionFrom === player.id);
    });

    // Draw actions
    diagram.actions.forEach((action) => {
      drawAction(ctx, action, diagram.players, toCanvas,
        selectedEntity?.type === 'action' && selectedEntity.id === action.id);
    });

  }, [diagram, dimensions, selectedEntity, pendingActionFrom, toCanvas]);

  // Find entity at position
  const findEntityAt = useCallback((fieldPos: FieldPosition): EditorState['selectedEntity'] | null => {
    const threshold = 5; // Field units

    // Check players first (highest priority)
    for (const player of diagram.players) {
      const dist = Math.hypot(player.position.x - fieldPos.x, player.position.y - fieldPos.y);
      if (dist < threshold) {
        return { type: 'player', id: player.id };
      }
    }

    // Check balls
    for (const ball of diagram.balls) {
      const dist = Math.hypot(ball.position.x - fieldPos.x, ball.position.y - fieldPos.y);
      if (dist < threshold) {
        return { type: 'ball', id: ball.id };
      }
    }

    // Check cones
    for (const cone of diagram.cones) {
      const dist = Math.hypot(cone.position.x - fieldPos.x, cone.position.y - fieldPos.y);
      if (dist < threshold) {
        return { type: 'cone', id: cone.id };
      }
    }

    // Check goals
    for (const goal of diagram.goals) {
      const dist = Math.hypot(goal.position.x - fieldPos.x, goal.position.y - fieldPos.y);
      if (dist < 8) {
        return { type: 'goal', id: goal.id };
      }
    }

    return null;
  }, [diagram]);

  // Handle canvas click
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const fieldPos = toField(canvasX, canvasY);

    if (tool === 'select') {
      const entity = findEntityAt(fieldPos);
      onSelectEntity(entity);
      onPendingActionChange(null);
      return;
    }

    // Handle player placement
    if (['attacker', 'defender', 'goalkeeper', 'neutral'].includes(tool)) {
      const role = tool.toUpperCase() as CustomPlayer['role'];
      const prefix = role[0];
      const count = diagram.players.filter(p => p.role === role).length + 1;
      const newPlayer: CustomPlayer = {
        id: `${prefix}${count}`,
        role,
        position: fieldPos,
      };
      onDiagramChange({
        ...diagram,
        players: [...diagram.players, newPlayer],
      });
      return;
    }

    // Handle cone placement
    if (tool === 'cone') {
      const newCone: CustomCone = {
        id: generateId(),
        position: fieldPos,
      };
      onDiagramChange({
        ...diagram,
        cones: [...diagram.cones, newCone],
      });
      return;
    }

    // Handle ball placement
    if (tool === 'ball') {
      const newBall: CustomBall = {
        id: generateId(),
        position: fieldPos,
      };
      onDiagramChange({
        ...diagram,
        balls: [...diagram.balls, newBall],
      });
      return;
    }

    // Handle goal placement
    if (tool === 'goal' || tool === 'minigoal') {
      const newGoal: CustomGoal = {
        id: generateId(),
        position: fieldPos,
        rotation: 0,
        size: tool === 'goal' ? 'full' : 'mini',
      };
      onDiagramChange({
        ...diagram,
        goals: [...diagram.goals, newGoal],
      });
      return;
    }

    // Handle cone line (two-step)
    if (tool === 'coneline') {
      const clickedCone = diagram.cones.find(c => {
        const dist = Math.hypot(c.position.x - fieldPos.x, c.position.y - fieldPos.y);
        return dist < 5;
      });
      
      if (!clickedCone) return;

      if (!pendingActionFrom) {
        onPendingActionChange(clickedCone.id);
      } else {
        if (pendingActionFrom !== clickedCone.id) {
          const newLine: CustomConeLine = {
            id: generateId(),
            fromConeId: pendingActionFrom,
            toConeId: clickedCone.id,
          };
          onDiagramChange({
            ...diagram,
            coneLines: [...diagram.coneLines, newLine],
          });
        }
        onPendingActionChange(null);
      }
      return;
    }

    // Handle pass action (two-step)
    if (tool === 'pass') {
      const clickedPlayer = diagram.players.find(p => {
        const dist = Math.hypot(p.position.x - fieldPos.x, p.position.y - fieldPos.y);
        return dist < 5;
      });
      
      if (!clickedPlayer) return;

      if (!pendingActionFrom) {
        onPendingActionChange(clickedPlayer.id);
      } else {
        if (pendingActionFrom !== clickedPlayer.id) {
          const newAction: CustomAction = {
            id: generateId(),
            type: 'PASS',
            fromPlayerId: pendingActionFrom,
            toPlayerId: clickedPlayer.id,
          };
          onDiagramChange({
            ...diagram,
            actions: [...diagram.actions, newAction],
          });
        }
        onPendingActionChange(null);
      }
      return;
    }

    // Handle run/dribble/shot (player then position)
    if (['run', 'dribble', 'shot'].includes(tool)) {
      if (!pendingActionFrom) {
        const clickedPlayer = diagram.players.find(p => {
          const dist = Math.hypot(p.position.x - fieldPos.x, p.position.y - fieldPos.y);
          return dist < 5;
        });
        if (clickedPlayer) {
          onPendingActionChange(clickedPlayer.id);
        }
      } else {
        const actionType = tool.toUpperCase() as 'RUN' | 'DRIBBLE' | 'SHOT';
        const newAction: CustomAction = {
          id: generateId(),
          type: actionType,
          playerId: pendingActionFrom,
          toPosition: fieldPos,
        };
        onDiagramChange({
          ...diagram,
          actions: [...diagram.actions, newAction],
        });
        onPendingActionChange(null);
      }
      return;
    }
  }, [tool, diagram, pendingActionFrom, toField, findEntityAt, onDiagramChange, onSelectEntity, onPendingActionChange]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const fieldPos = toField(canvasX, canvasY);

    const entity = findEntityAt(fieldPos);
    if (entity) {
      onSelectEntity(entity);
      setIsDragging(true);

      // Calculate offset from entity center
      let entityPos: FieldPosition | null = null;
      if (entity.type === 'player') {
        entityPos = diagram.players.find(p => p.id === entity.id)?.position || null;
      } else if (entity.type === 'cone') {
        entityPos = diagram.cones.find(c => c.id === entity.id)?.position || null;
      } else if (entity.type === 'ball') {
        entityPos = diagram.balls.find(b => b.id === entity.id)?.position || null;
      } else if (entity.type === 'goal') {
        entityPos = diagram.goals.find(g => g.id === entity.id)?.position || null;
      }

      if (entityPos) {
        dragOffsetRef.current = {
          x: fieldPos.x - entityPos.x,
          y: fieldPos.y - entityPos.y,
        };
      }
    }
  }, [tool, toField, findEntityAt, diagram, onSelectEntity]);

  // Handle drag move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedEntity) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const fieldPos = toField(canvasX, canvasY);

    const newPos = {
      x: Math.max(0, Math.min(100, fieldPos.x - dragOffsetRef.current.x)),
      y: Math.max(0, Math.min(100, fieldPos.y - dragOffsetRef.current.y)),
    };

    if (selectedEntity.type === 'player') {
      onDiagramChange({
        ...diagram,
        players: diagram.players.map(p =>
          p.id === selectedEntity.id ? { ...p, position: newPos } : p
        ),
      });
    } else if (selectedEntity.type === 'cone') {
      onDiagramChange({
        ...diagram,
        cones: diagram.cones.map(c =>
          c.id === selectedEntity.id ? { ...c, position: newPos } : c
        ),
      });
    } else if (selectedEntity.type === 'ball') {
      onDiagramChange({
        ...diagram,
        balls: diagram.balls.map(b =>
          b.id === selectedEntity.id ? { ...b, position: newPos } : b
        ),
      });
    } else if (selectedEntity.type === 'goal') {
      onDiagramChange({
        ...diagram,
        goals: diagram.goals.map(g =>
          g.id === selectedEntity.id ? { ...g, position: newPos } : g
        ),
      });
    }
  }, [isDragging, selectedEntity, toField, diagram, onDiagramChange]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

// Drawing helper functions
function drawField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showMarkings: boolean,
  fieldType: 'FULL' | 'HALF'
) {
  const stripeCount = 10;
  const stripeHeight = (height - PADDING * 2) / stripeCount;

  // Draw grass stripes
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? FIELD_COLORS.GRASS_LIGHT : FIELD_COLORS.GRASS_DARK;
    ctx.fillRect(PADDING, PADDING + i * stripeHeight, width - PADDING * 2, stripeHeight);
  }

  if (!showMarkings) return;

  ctx.strokeStyle = FIELD_COLORS.LINES;
  ctx.lineWidth = 2;

  const fieldWidth = width - PADDING * 2;
  const fieldHeight = height - PADDING * 2;

  // Outer boundary
  ctx.strokeRect(PADDING, PADDING, fieldWidth, fieldHeight);

  if (fieldType === 'FULL') {
    // Center line
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING + fieldHeight / 2);
    ctx.lineTo(width - PADDING, PADDING + fieldHeight / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, fieldHeight * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = FIELD_COLORS.LINES;
    ctx.fill();
  }

  // Penalty areas (simplified)
  const penaltyWidth = fieldWidth * 0.4;
  const penaltyHeight = fieldHeight * 0.15;

  // Top penalty area
  ctx.strokeRect(
    PADDING + (fieldWidth - penaltyWidth) / 2,
    PADDING,
    penaltyWidth,
    penaltyHeight
  );

  // Bottom penalty area
  ctx.strokeRect(
    PADDING + (fieldWidth - penaltyWidth) / 2,
    height - PADDING - penaltyHeight,
    penaltyWidth,
    penaltyHeight
  );
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  role: CustomPlayer['role'],
  id: string,
  isSelected: boolean,
  isPending: boolean
) {
  const radius = 14;

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
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Player ID
  ctx.fillStyle = role === 'GOALKEEPER' ? '#000000' : '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id, pos.x, pos.y);
}

function drawCone(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  isSelected: boolean
) {
  const size = 10;

  if (isSelected) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Triangle cone
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y - size);
  ctx.lineTo(pos.x - size, pos.y + size);
  ctx.lineTo(pos.x + size, pos.y + size);
  ctx.closePath();
  ctx.fillStyle = FIELD_COLORS.CONE;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  isSelected: boolean
) {
  const radius = 8;

  if (isSelected) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Ball
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Pentagon pattern (simplified)
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  size: 'full' | 'mini',
  rotation: number,
  isSelected: boolean
) {
  const goalWidth = size === 'full' ? 60 : 30;
  const goalDepth = size === 'full' ? 15 : 8;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate((rotation * Math.PI) / 180);

  if (isSelected) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(-goalWidth / 2 - 3, -goalDepth - 3, goalWidth + 6, goalDepth + 6);
  }

  // Goal frame
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-goalWidth / 2, 0);
  ctx.lineTo(-goalWidth / 2, -goalDepth);
  ctx.lineTo(goalWidth / 2, -goalDepth);
  ctx.lineTo(goalWidth / 2, 0);
  ctx.stroke();

  // Net lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-goalWidth / 2 + (goalWidth / 4) * i, 0);
    ctx.lineTo(-goalWidth / 2 + (goalWidth / 4) * i, -goalDepth);
    ctx.stroke();
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

function drawAction(
  ctx: CanvasRenderingContext2D,
  action: CustomAction,
  players: CustomPlayer[],
  toCanvas: (pos: FieldPosition) => { x: number; y: number },
  isSelected: boolean
) {
  let fromPos: { x: number; y: number } | null = null;
  let toPos: { x: number; y: number } | null = null;

  if (action.type === 'PASS') {
    const fromPlayer = players.find(p => p.id === action.fromPlayerId);
    const toPlayer = players.find(p => p.id === action.toPlayerId);
    if (fromPlayer && toPlayer) {
      fromPos = toCanvas(fromPlayer.position);
      toPos = toCanvas(toPlayer.position);
    }
  } else {
    const player = players.find(p => p.id === action.playerId);
    if (player) {
      fromPos = toCanvas(player.position);
      toPos = toCanvas(action.toPosition);
    }
  }

  if (!fromPos || !toPos) return;

  const color = ACTION_COLORS[action.type];

  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 4 : 2;

  if (action.type === 'PASS' || action.type === 'DRIBBLE') {
    ctx.setLineDash([8, 4]);
  } else {
    ctx.setLineDash([]);
  }

  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromPos.x, fromPos.y);
  ctx.lineTo(toPos.x, toPos.y);
  ctx.stroke();

  // Reset dash
  ctx.setLineDash([]);

  // Draw arrow head
  const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
  const headLength = 12;

  ctx.beginPath();
  ctx.moveTo(toPos.x, toPos.y);
  ctx.lineTo(
    toPos.x - headLength * Math.cos(angle - Math.PI / 6),
    toPos.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toPos.x, toPos.y);
  ctx.lineTo(
    toPos.x - headLength * Math.cos(angle + Math.PI / 6),
    toPos.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

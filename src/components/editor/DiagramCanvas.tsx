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
  ACTION_COLORS,
} from '@/types/customDrill';
import { generateId } from '@/lib/customDrillStorage';
import {
  createFixedRenderContext,
  drawField,
  drawConeLines as drawSharedConeLines,
  drawCones as drawSharedCones,
  drawGoals as drawSharedGoals,
  drawMiniGoals,
  drawPlayers as drawSharedPlayers,
  drawBalls as drawSharedBalls,
  drawActions as drawSharedActions,
  drawArrowHead,
  COLORS,
  PLAYER_COLORS as SHARED_PLAYER_COLORS,
  ACTION_COLORS as SHARED_ACTION_COLORS,
  RenderContext,
  CANVAS_PADDING,
  CW,
} from '@/utils/drillRenderer';

interface DiagramCanvasProps {
  diagram: DiagramData;
  tool: EditorState['tool'];
  selectedEntity: EditorState['selectedEntity'];
  pendingActionFrom: string | null;
  goalRotation: number;
  onDiagramChange: (diagram: DiagramData) => void;
  onSelectEntity: (entity: EditorState['selectedEntity']) => void;
  onPendingActionChange: (id: string | null) => void;
}

export function DiagramCanvas({
  diagram,
  tool,
  selectedEntity,
  pendingActionFrom,
  goalRotation,
  onDiagramChange,
  onSelectEntity,
  onPendingActionChange,
}: DiagramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Use CW as internal canvas resolution (same as library renderer)
  // Full field bounds: 100x100 → square canvas
  const rc = React.useMemo(
    () => createFixedRenderContext(CW, CW, CANVAS_PADDING),
    []
  );

  const canvasWidth = CW;
  const canvasHeight = CW;

  const toField = useCallback((canvasX: number, canvasY: number): FieldPosition => {
    const p = CANVAS_PADDING;
    const fw = canvasWidth - p * 2;
    const fh = canvasHeight - p * 2;
    return {
      x: Math.max(0, Math.min(100, ((canvasX - p) / fw) * 100)),
      y: Math.max(0, Math.min(100, 100 - ((canvasY - p) / fh) * 100)),
    };
  }, [canvasWidth, canvasHeight]);

  // Convert editor diagram data to shared renderer format
  const toRenderData = useCallback(() => {
    // Convert cone lines from ID-based to index-based
    const coneIndexMap: Record<string, number> = {};
    diagram.cones.forEach((c, i) => { coneIndexMap[c.id] = i; });

    const renderConeLines = diagram.coneLines
      .map(cl => ({
        from_cone: coneIndexMap[cl.fromConeId] ?? -1,
        to_cone: coneIndexMap[cl.toConeId] ?? -1,
      }))
      .filter(cl => cl.from_cone >= 0 && cl.to_cone >= 0);

    // Convert goals: separate full and mini goals
    const fullGoals = diagram.goals
      .filter(g => g.size === 'full')
      .map(g => ({ position: g.position, rotation: g.rotation }));
    const miniGoalsList = diagram.goals
      .filter(g => g.size === 'mini')
      .map(g => ({ position: g.position, rotation: g.rotation }));

    // Convert actions
    const renderActions = diagram.actions.map(a => {
      if (a.type === 'PASS') {
        return { type: 'PASS' as const, fromPlayer: a.fromPlayerId, toPlayer: a.toPlayerId };
      } else {
        return { type: a.type, player: a.playerId, toPosition: a.toPosition };
      }
    });

    // Convert players (lowercase role for shared renderer)
    const renderPlayers = diagram.players.map(p => ({
      id: p.id,
      role: p.role.toLowerCase(),
      position: p.position,
    }));

    return {
      field: {
        type: diagram.field.type,
        markings: diagram.field.markings,
        goals: diagram.field.goals,
      },
      players: renderPlayers,
      cones: diagram.cones.map(c => ({ position: c.position })),
      cone_lines: renderConeLines,
      balls: diagram.balls.map(b => ({ position: b.position })),
      goals: fullGoals,
      mini_goals: miniGoalsList,
      actions: renderActions,
    };
  }, [diagram]);

  // Draw the canvas using shared renderer + editor-specific overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const renderData = toRenderData();

    // Use shared renderer for the base drawing
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawField(ctx, rc, renderData.field);
    drawSharedConeLines(ctx, rc, renderData.cones, renderData.cone_lines);

    // Draw cones with selection indicators
    renderData.cones.forEach((cone, i) => {
      const pos = rc.toCanvas(cone.position.x, cone.position.y);
      const coneId = diagram.cones[i]?.id;
      const isSelected = selectedEntity?.type === 'cone' && selectedEntity.id === coneId;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    drawSharedCones(ctx, rc, renderData.cones);

    // Draw goals with selection indicators
    diagram.goals.forEach(goal => {
      const pos = rc.toCanvas(goal.position.x, goal.position.y);
      const isSelected = selectedEntity?.type === 'goal' && selectedEntity.id === goal.id;
      if (isSelected) {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(-33, -10, 66, 20);
        ctx.restore();
      }
    });
    drawSharedGoals(ctx, rc, renderData.goals);
    drawMiniGoals(ctx, rc, renderData.mini_goals);

    // Draw actions using shared renderer
    drawSharedActions(ctx, rc, renderData.actions, renderData.players);

    // Draw players with selection/pending indicators
    diagram.players.forEach(player => {
      const pos = rc.toCanvas(player.position.x, player.position.y);
      const isSelected = selectedEntity?.type === 'player' && selectedEntity.id === player.id;
      const isPending = pendingActionFrom === player.id;

      if (isSelected || isPending) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
        ctx.strokeStyle = isPending ? '#facc15' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
    drawSharedPlayers(ctx, rc, renderData.players);

    // Draw balls with selection indicators
    diagram.balls.forEach((ball, i) => {
      const pos = rc.toCanvas(ball.position.x, ball.position.y);
      const isSelected = selectedEntity?.type === 'ball' && selectedEntity.id === ball.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    drawSharedBalls(ctx, rc, renderData.balls);

  }, [diagram, canvasWidth, canvasHeight, selectedEntity, pendingActionFrom, rc, toRenderData]);

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
      const newGoal: CustomGoal = { id: generateId(), position: fieldPos, rotation: goalRotation, size: tool === 'goal' ? 'full' : 'mini' };
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
  }, [tool, diagram, pendingActionFrom, toField, findEntityAt, onDiagramChange, onSelectEntity, onPendingActionChange, goalRotation]);

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

  // Touch handlers for mobile drag support
  const getTouchFieldPos = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const touch = e.touches[0];
    if (!touch) return null;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    return toField(canvasX, canvasY);
  }, [toField]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (tool !== 'select') return;
    const fieldPos = getTouchFieldPos(e);
    if (!fieldPos) return;

    const entity = findEntityAt(fieldPos);
    if (entity) {
      e.preventDefault();
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
  }, [tool, getTouchFieldPos, findEntityAt, diagram, onSelectEntity]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedEntity) return;
    e.preventDefault();
    const fieldPos = getTouchFieldPos(e);
    if (!fieldPos) return;
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
  }, [isDragging, selectedEntity, getTouchFieldPos, diagram, onDiagramChange]);

  const handleTouchEnd = useCallback(() => { setIsDragging(false); }, []);

  return (
    <div className="w-full rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-auto cursor-crosshair block touch-none"
        style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}`, borderRadius: '12px' }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
}

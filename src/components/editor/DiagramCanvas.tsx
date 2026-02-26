import React, { useRef, useEffect, useCallback, useState } from 'react';
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
import { RotateCw } from 'lucide-react';

interface DiagramCanvasProps {
  diagram: DiagramData;
  tool: EditorState['tool'];
  selectedEntity: EditorState['selectedEntity'];
  pendingActionFrom: string | null;
  onDiagramChange: (diagram: DiagramData) => void;
  onSelectEntity: (entity: EditorState['selectedEntity']) => void;
  onPendingActionChange: (id: string | null) => void;
}

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
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Pinch-to-zoom + pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{
    startDist: number;
    startZoom: number;
    startPan: { x: number; y: number };
    startMidX: number;
    startMidY: number;
  } | null>(null);
  // Single-finger pan when zoomed (no entity hit)
  const panDragRef = useRef<{
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
  } | null>(null);

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
    const coneIndexMap: Record<string, number> = {};
    diagram.cones.forEach((c, i) => { coneIndexMap[c.id] = i; });

    const renderConeLines = diagram.coneLines
      .map(cl => ({
        from_cone: coneIndexMap[cl.fromConeId] ?? -1,
        to_cone: coneIndexMap[cl.toConeId] ?? -1,
      }))
      .filter(cl => cl.from_cone >= 0 && cl.to_cone >= 0);

    const fullGoals = diagram.goals
      .filter(g => g.size === 'full')
      .map(g => ({ position: g.position, rotation: g.rotation }));
    const miniGoalsList = diagram.goals
      .filter(g => g.size === 'mini')
      .map(g => ({ position: g.position, rotation: g.rotation }));

    const renderActions = diagram.actions.map(a => {
      if (a.type === 'PASS') {
        return { type: 'PASS' as const, fromPlayer: a.fromPlayerId, toPlayer: a.toPlayerId };
      } else {
        return { type: a.type, player: a.playerId, toPosition: a.toPosition };
      }
    });

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

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const renderData = toRenderData();

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

    // Draw goals with rotated selection indicators
    diagram.goals.forEach(goal => {
      const pos = rc.toCanvas(goal.position.x, goal.position.y);
      const isSelected = selectedEntity?.type === 'goal' && selectedEntity.id === goal.id;
      if (isSelected) {
        const boundsWidth = rc.bounds.xMax - rc.bounds.xMin;
        const boundsHeight = rc.bounds.yMax - rc.bounds.yMin;
        const isMini = goal.size === 'mini';
        const gwUnits = isMini ? 4 : 8;
        const gdUnits = isMini ? 2 : 3;
        const gw = (gwUnits / boundsWidth) * rc.fieldWidth;
        const gd = (gdUnits / boundsHeight) * rc.fieldHeight;
        const rot = goal.rotation || 0;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 3]);
        const pad = 5;
        ctx.strokeRect(-gw / 2 - pad, -gd / 2 - pad, gw + pad * 2, gd + pad * 2);
        ctx.setLineDash([]);
        ctx.restore();
      }
    });
    drawSharedGoals(ctx, rc, renderData.goals);
    drawMiniGoals(ctx, rc, renderData.mini_goals);

    // Draw actions
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
    diagram.balls.forEach((ball) => {
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

  // ─── Touch handlers ──────────────────────────────────────────────────

  const getTouchDist = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchFieldPos = useCallback((touch: React.Touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Account for zoom & pan: the canvas container is transformed
    const canvasX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    return toField(canvasX, canvasY);
  }, [toField]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // Two-finger: start pinch zoom
    if (e.touches.length >= 2) {
      e.preventDefault();
      setIsDragging(false);
      panDragRef.current = null;
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchRef.current = {
        startDist: dist,
        startZoom: zoom,
        startPan: { ...pan },
        startMidX: midX,
        startMidY: midY,
      };
      return;
    }

    // Single-finger
    const touch = e.touches[0];
    if (!touch) return;
    const fieldPos = getTouchFieldPos(touch);
    if (!fieldPos) return;

    if (tool === 'select') {
      const entity = findEntityAt(fieldPos);
      if (entity) {
        e.preventDefault();
        onSelectEntity(entity);
        setIsDragging(true);
        panDragRef.current = null;
        let entityPos: FieldPosition | null = null;
        if (entity.type === 'player') entityPos = diagram.players.find(p => p.id === entity.id)?.position || null;
        else if (entity.type === 'cone') entityPos = diagram.cones.find(c => c.id === entity.id)?.position || null;
        else if (entity.type === 'ball') entityPos = diagram.balls.find(b => b.id === entity.id)?.position || null;
        else if (entity.type === 'goal') entityPos = diagram.goals.find(g => g.id === entity.id)?.position || null;
        if (entityPos) {
          dragOffsetRef.current = { x: fieldPos.x - entityPos.x, y: fieldPos.y - entityPos.y };
        }
      } else if (zoom > 1.05) {
        // No entity hit + zoomed in → start panning
        e.preventDefault();
        panDragRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startPan: { ...pan },
        };
      }
    }
  }, [tool, getTouchFieldPos, findEntityAt, diagram, onSelectEntity, zoom, pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // Two-finger: pinch zoom + pan
    if (e.touches.length >= 2 && pinchRef.current) {
      e.preventDefault();
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const newZoom = Math.min(3, Math.max(1, pinchRef.current.startZoom * dist / pinchRef.current.startDist));
      const dx = midX - pinchRef.current.startMidX;
      const dy = midY - pinchRef.current.startMidY;
      setZoom(newZoom);
      setPan({
        x: pinchRef.current.startPan.x + dx,
        y: pinchRef.current.startPan.y + dy,
      });
      return;
    }

    // Single-finger pan (when zoomed, no entity drag)
    if (panDragRef.current && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - panDragRef.current.startX;
      const dy = touch.clientY - panDragRef.current.startY;
      setPan({
        x: panDragRef.current.startPan.x + dx,
        y: panDragRef.current.startPan.y + dy,
      });
      return;
    }

    // Single-finger entity drag
    if (!isDragging || !selectedEntity) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const fieldPos = getTouchFieldPos(touch);
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
  }, [isDragging, selectedEntity, getTouchFieldPos, diagram, onDiagramChange, zoom, pan]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    panDragRef.current = null;
    if (pinchRef.current) {
      pinchRef.current = null;
      if (zoom <= 1.05) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    }
  }, [zoom]);

  // Rotate selected goal handler
  const handleRotateGoal = useCallback(() => {
    if (!selectedEntity || selectedEntity.type !== 'goal') return;
    onDiagramChange({
      ...diagram,
      goals: diagram.goals.map(g =>
        g.id === selectedEntity.id
          ? { ...g, rotation: (g.rotation + 90) % 360 }
          : g
      ),
    });
  }, [selectedEntity, diagram, onDiagramChange]);

  // Calculate rotate button position for selected goal
  const getRotateButtonPosition = () => {
    if (!selectedEntity || selectedEntity.type !== 'goal') return null;
    const goal = diagram.goals.find(g => g.id === selectedEntity.id);
    if (!goal) return null;
    const cp = rc.toCanvas(goal.position.x, goal.position.y);
    return {
      left: `${(cp.x / canvasWidth) * 100}%`,
      top: `${(cp.y / canvasHeight) * 100}%`,
    };
  };

  const rotateBtnPos = getRotateButtonPosition();

  return (
    <div className="w-full rounded-xl overflow-hidden relative">
      <div
        className="relative"
        style={{
          transform: zoom > 1 ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-auto cursor-crosshair block touch-none"
          style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}`, borderRadius: zoom === 1 ? '12px' : '0' }}
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

        {/* Rotate button overlay for selected goal/minigoal */}
        {rotateBtnPos && (
          <button
            className="absolute z-10 bg-editor-surface/90 border border-editor-border rounded-full p-1.5 hover:bg-editor/80 transition-colors shadow-lg"
            style={{
              left: rotateBtnPos.left,
              top: rotateBtnPos.top,
              transform: 'translate(-50%, calc(-100% - 16px))',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleRotateGoal();
            }}
          >
            <RotateCw className="h-3.5 w-3.5 text-primary" />
          </button>
        )}
      </div>

      {/* Zoom reset button */}
      {zoom > 1.05 && (
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="absolute top-2 right-2 z-20 bg-editor-surface/90 border border-editor-border text-editor-text text-xs px-2.5 py-1.5 rounded-lg hover:bg-editor/80 transition-colors shadow-lg"
        >
          Reset Zoom ({Math.round(zoom * 100)}%)
        </button>
      )}
    </div>
  );
}

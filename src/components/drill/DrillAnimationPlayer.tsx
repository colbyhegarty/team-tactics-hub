import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  role: 'ATTACKER' | 'DEFENDER' | 'GOALKEEPER' | 'NEUTRAL';
  position: Position;
  label?: string;
}

interface Cone {
  position: Position;
}

interface ConeLine {
  from_cone: number;
  to_cone: number;
}

interface Ball {
  position: Position;
}

interface Goal {
  position: Position;
  rotation?: number;
}

interface MiniGoal {
  position: Position;
  rotation?: number;
}

interface FieldConfig {
  type?: 'FULL' | 'HALF';
  markings?: boolean;
  goals?: number;
  attacking_direction?: 'NORTH' | 'SOUTH';
}

interface Keyframe {
  label?: string;
  duration?: number; // milliseconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  positions?: Record<string, Position>;
}

interface AnimationData {
  keyframes: Keyframe[];
}

interface DrillData {
  name?: string;
  field?: FieldConfig;
  players?: Player[];
  cones?: Cone[];
  cone_lines?: ConeLine[];
  balls?: Ball[];
  goals?: Goal[];
  mini_goals?: MiniGoal[];
}

interface DrillAnimationPlayerProps {
  drill: DrillData;
  animation: AnimationData;
  width?: number;
  height?: number;
  className?: string;
  showStepButtons?: boolean; // Default false - no step buttons
}

// ============================================================
// COLORS - Must match Python renderer.py EXACTLY
// ============================================================

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
};

const PLAYER_COLORS: Record<string, string> = {
  'ATTACKER': '#e63946',
  'DEFENDER': '#457b9d',
  'GOALKEEPER': '#f1fa3c',
  'NEUTRAL': '#f4a261',
};

// ============================================================
// PORTRAIT ROTATION UTILITIES
// ============================================================

/**
 * Detect if the drill is in portrait orientation.
 * Portrait = goals at top/bottom (y near 0 or 100)
 * Landscape = goals at left/right (x near 0 or 100)
 */
function isPortraitDrill(drill: DrillData): boolean {
  // Check explicit goals - if any goal has y near 0 or 100, it's portrait
  if (drill.goals && drill.goals.length > 0) {
    const hasVerticalGoal = drill.goals.some(g => 
      g.position.y <= 10 || g.position.y >= 90
    );
    const hasHorizontalGoal = drill.goals.some(g => 
      g.position.x <= 10 || g.position.x >= 90
    );
    
    if (hasVerticalGoal && !hasHorizontalGoal) return true;
    if (hasHorizontalGoal && !hasVerticalGoal) return false;
  }
  
  // Check mini goals
  if (drill.mini_goals && drill.mini_goals.length > 0) {
    const hasVerticalGoal = drill.mini_goals.some(g => 
      g.position.y <= 10 || g.position.y >= 90
    );
    const hasHorizontalGoal = drill.mini_goals.some(g => 
      g.position.x <= 10 || g.position.x >= 90
    );
    
    if (hasVerticalGoal && !hasHorizontalGoal) return true;
    if (hasHorizontalGoal && !hasVerticalGoal) return false;
  }
  
  // Check field config - if field.goals > 0, the built-in goals are at y=0/100
  if (drill.field?.goals && drill.field.goals > 0) {
    return true;
  }
  
  return false;
}

/**
 * Transform position: (x, y) → (y, 100 - x) for 90° clockwise rotation
 */
function transformPosition(pos: Position, isPortrait: boolean): Position {
  if (!isPortrait) return pos;
  return { x: pos.y, y: 100 - pos.x };
}

/**
 * Transform rotation angle: add 90° for portrait drills
 */
function transformRotation(rotation: number | undefined, isPortrait: boolean): number {
  const rot = rotation || 0;
  if (!isPortrait) return rot;
  return (rot + 90) % 360;
}

// ============================================================
// COMPONENT
// ============================================================

const DrillAnimationPlayer: React.FC<DrillAnimationPlayerProps> = ({
  drill,
  animation,
  width = 800,
  height = 600,
  className = '',
  showStepButtons = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [looping, setLooping] = useState(true);
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState(0);
  
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Detect portrait orientation once
  const isPortrait = useMemo(() => isPortraitDrill(drill), [drill]);

  // Canvas constants
  const FIELD_PADDING = 50;
  const FIELD_WIDTH = width - FIELD_PADDING * 2;
  const FIELD_HEIGHT = height - FIELD_PADDING * 2;

  const keyframes = animation?.keyframes || [];
  
  // Calculate total duration (sum of durations from keyframe 1 onwards)
  const totalDuration = keyframes.reduce((sum, kf, i) => {
    if (i === 0) return sum;
    return sum + (kf.duration || 1000);
  }, 0);

  // ============================================================
  // COORDINATE CONVERSION
  // ============================================================

  const toCanvas = useCallback((x: number, y: number) => ({
    x: FIELD_PADDING + (x / 100) * FIELD_WIDTH,
    y: FIELD_PADDING + ((100 - y) / 100) * FIELD_HEIGHT,
  }), [FIELD_WIDTH, FIELD_HEIGHT]);

  // Transform position with portrait rotation if needed
  const toCanvasTransformed = useCallback((x: number, y: number) => {
    const transformed = transformPosition({ x, y }, isPortrait);
    return toCanvas(transformed.x, transformed.y);
  }, [toCanvas, isPortrait]);

  // ============================================================
  // POSITION CALCULATIONS
  // ============================================================

  const getStartingPositions = useCallback((): Record<string, Position> => {
    const pos: Record<string, Position> = {};
    drill.players?.forEach(p => {
      pos[p.id] = { x: p.position.x, y: p.position.y };
    });
    drill.balls?.forEach((b, i) => {
      pos[`ball_${i}`] = { x: b.position.x, y: b.position.y };
    });
    return pos;
  }, [drill.players, drill.balls]);

  const getPositionsAtKeyframe = useCallback((idx: number): Record<string, Position> => {
    let pos = getStartingPositions();
    for (let i = 0; i <= idx && i < keyframes.length; i++) {
      const kf = keyframes[i];
      if (kf.positions) {
        Object.entries(kf.positions).forEach(([id, p]) => {
          pos[id] = { ...p };
        });
      }
    }
    return pos;
  }, [keyframes, getStartingPositions]);

  const getPositionsAtTime = useCallback((time: number): Record<string, Position> => {
    if (keyframes.length === 0) return getStartingPositions();
    
    // Build cumulative times
    const times: number[] = [];
    let cum = 0;
    for (let i = 0; i < keyframes.length; i++) {
      times.push(cum);
      if (i < keyframes.length - 1) {
        cum += keyframes[i + 1].duration || 1000;
      }
    }

    // Find which segment we're in
    let from = 0;
    for (let i = 0; i < times.length; i++) {
      if (time >= times[i]) from = i;
    }
    
    let to = Math.min(from + 1, keyframes.length - 1);
    
    if (from >= keyframes.length - 1 || from === to) {
      return getPositionsAtKeyframe(keyframes.length - 1);
    }

    const segDur = times[to] - times[from];
    if (segDur <= 0) return getPositionsAtKeyframe(from);

    const prog = Math.min(1, Math.max(0, (time - times[from]) / segDur));
    const fromPos = getPositionsAtKeyframe(from);
    const toPos = getPositionsAtKeyframe(to);
    
    // Apply easing
    const ease = keyframes[to]?.easing || 'linear';
    let e: number;
    switch (ease) {
      case 'ease-in':
        e = prog * prog;
        break;
      case 'ease-out':
        e = 1 - (1 - prog) * (1 - prog);
        break;
      case 'ease-in-out':
        e = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
        break;
      default:
        e = prog;
    }

    // Interpolate positions
    const interp: Record<string, Position> = {};
    Object.keys(fromPos).forEach(id => {
      const f = fromPos[id];
      const t = toPos[id] || f;
      interp[id] = {
        x: f.x + (t.x - f.x) * e,
        y: f.y + (t.y - f.y) * e,
      };
    });

    return interp;
  }, [keyframes, getStartingPositions, getPositionsAtKeyframe]);

  // ============================================================
  // DRAWING FUNCTIONS
  // ============================================================

  // Draw goal area rotated (for portrait→landscape conversion)
  // goalX: 0 = left side, 100 = right side
  const drawGoalAreaRotated = useCallback((ctx: CanvasRenderingContext2D, goalX: number) => {
    const into = goalX === 100 ? -1 : 1;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    // After rotation: x becomes the goal line position
    // 18-yard box (now extends horizontally from goal line)
    const pen18 = toCanvas(goalX + into * 18, 30);
    const penGoalTop = toCanvas(goalX, 30);
    const penGoalBottom = toCanvas(goalX, 70);
    const pen18Bottom = toCanvas(goalX + into * 18, 70);

    ctx.beginPath();
    ctx.moveTo(penGoalTop.x, penGoalTop.y);
    ctx.lineTo(pen18.x, pen18.y);
    ctx.lineTo(pen18Bottom.x, pen18Bottom.y);
    ctx.lineTo(penGoalBottom.x, penGoalBottom.y);
    ctx.stroke();

    // 6-yard box
    const six6 = toCanvas(goalX + into * 6, 42);
    const sixGoalTop = toCanvas(goalX, 42);
    const sixGoalBottom = toCanvas(goalX, 58);
    const six6Bottom = toCanvas(goalX + into * 6, 58);

    ctx.beginPath();
    ctx.moveTo(sixGoalTop.x, sixGoalTop.y);
    ctx.lineTo(six6.x, six6.y);
    ctx.lineTo(six6Bottom.x, six6Bottom.y);
    ctx.lineTo(sixGoalBottom.x, sixGoalBottom.y);
    ctx.stroke();

    // Penalty spot
    const ps = toCanvas(goalX + into * 12, 50);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Built-in goal
    const gPos = toCanvas(goalX, 50);
    const gw = (8 / 100) * FIELD_HEIGHT; // Width is now vertical
    const gd = (3 / 100) * FIELD_WIDTH;  // Depth is now horizontal
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (goalX === 100) {
      // Right side goal (opens left)
      ctx.beginPath(); ctx.moveTo(gPos.x, gPos.y - gw / 2); ctx.lineTo(gPos.x - gd, gPos.y - gw / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gPos.x, gPos.y + gw / 2); ctx.lineTo(gPos.x - gd, gPos.y + gw / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gPos.x - gd, gPos.y - gw / 2); ctx.lineTo(gPos.x - gd, gPos.y + gw / 2); ctx.stroke();
    } else {
      // Left side goal (opens right)
      ctx.beginPath(); ctx.moveTo(gPos.x, gPos.y - gw / 2); ctx.lineTo(gPos.x + gd, gPos.y - gw / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gPos.x, gPos.y + gw / 2); ctx.lineTo(gPos.x + gd, gPos.y + gw / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gPos.x + gd, gPos.y - gw / 2); ctx.lineTo(gPos.x + gd, gPos.y + gw / 2); ctx.stroke();
    }
  }, [toCanvas, FIELD_WIDTH, FIELD_HEIGHT]);

  const drawGoalArea = useCallback((ctx: CanvasRenderingContext2D, goalY: number, drawGoal: boolean) => {
    const into = goalY === 100 ? -1 : 1;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    // 18-yard box
    const bt = toCanvas(30, goalY + into * 18);
    const bb = toCanvas(70, goalY);
    ctx.strokeRect(
      bt.x,
      Math.min(bt.y, bb.y),
      toCanvas(70, 0).x - toCanvas(30, 0).x,
      Math.abs(bt.y - bb.y)
    );

    // 6-yard box
    const st = toCanvas(42, goalY + into * 6);
    const sb = toCanvas(58, goalY);
    ctx.strokeRect(
      st.x,
      Math.min(st.y, sb.y),
      toCanvas(58, 0).x - toCanvas(42, 0).x,
      Math.abs(st.y - sb.y)
    );

    // Penalty spot
    const ps = toCanvas(50, goalY + into * 12);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Built-in goal
    if (drawGoal) {
      const pos = toCanvas(50, goalY);
      const gw = (8 / 100) * FIELD_WIDTH;
      const gd = (3 / 100) * FIELD_HEIGHT;
      ctx.strokeStyle = '#fff';
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
  }, [toCanvas, FIELD_WIDTH, FIELD_HEIGHT]);

  const drawField = useCallback((ctx: CanvasRenderingContext2D) => {
    const p = FIELD_PADDING;
    const w = FIELD_WIDTH;
    const h = FIELD_HEIGHT;

    // Grass stripes (10 vertical) - ALWAYS vertical regardless of rotation
    ctx.fillStyle = COLORS.GRASS_DARK;
    ctx.fillRect(p, p, w, h);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK;
      ctx.fillRect(p + i * (w / 10), p, w / 10, h);
    }

    // Field outline
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p, p, w, h);

    // Field markings (rotated if portrait)
    if (drill.field?.markings !== false) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;

      if (isPortrait) {
        // PORTRAIT → LANDSCAPE: Draw markings rotated 90°
        // Halfway line becomes vertical (at x=50 after transform)
        const cx = toCanvas(50, 50).x;
        ctx.beginPath();
        ctx.moveTo(cx, p);
        ctx.lineTo(cx, p + h);
        ctx.stroke();

        // Center circle stays at center
        const c = toCanvas(50, 50);
        ctx.beginPath();
        ctx.arc(c.x, c.y, (10 / 100) * Math.min(w, h), 0, Math.PI * 2);
        ctx.stroke();

        // Center spot
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Goal areas on left/right (rotated from top/bottom)
        const fg = drill.field?.goals || 0;
        if (fg >= 1) {
          drawGoalAreaRotated(ctx, 100); // Right side (was top)
        }
        if (drill.field?.type === 'FULL' && fg >= 2) {
          drawGoalAreaRotated(ctx, 0); // Left side (was bottom)
        }
      } else {
        // LANDSCAPE: Draw markings normally (horizontal halfway line)
        const cy = toCanvas(50, 50).y;
        ctx.beginPath();
        ctx.moveTo(p, cy);
        ctx.lineTo(p + w, cy);
        ctx.stroke();

        // Center circle
        const c = toCanvas(50, 50);
        ctx.beginPath();
        ctx.arc(c.x, c.y, (10 / 100) * w, 0, Math.PI * 2);
        ctx.stroke();

        // Center spot
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Goal areas on top/bottom
        const fg = drill.field?.goals || 0;
        drawGoalArea(ctx, 100, fg >= 1);
        if (drill.field?.type === 'FULL') {
          drawGoalArea(ctx, 0, fg >= 2);
        }
      }
    }
  }, [drill.field, FIELD_WIDTH, FIELD_HEIGHT, toCanvas, isPortrait, drawGoalArea, drawGoalAreaRotated]);



  const drawConeLines = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drill.cone_lines || !drill.cones) return;
    
    ctx.strokeStyle = COLORS.CONE_LINE_COLOR;
    ctx.lineWidth = 2;

    drill.cone_lines.forEach(l => {
      if (l.from_cone < drill.cones!.length && l.to_cone < drill.cones!.length) {
        const f = toCanvasTransformed(drill.cones![l.from_cone].position.x, drill.cones![l.from_cone].position.y);
        const t = toCanvasTransformed(drill.cones![l.to_cone].position.x, drill.cones![l.to_cone].position.y);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }
    });
  }, [drill.cone_lines, drill.cones, toCanvas]);

  const drawCones = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drill.cones) return;

    drill.cones.forEach(c => {
      const pos = toCanvasTransformed(c.position.x, c.position.y);
      ctx.fillStyle = COLORS.CONE_COLOR;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 8);
      ctx.lineTo(pos.x - 6, pos.y + 5);
      ctx.lineTo(pos.x + 6, pos.y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }, [drill.cones, toCanvas]);

  const drawGoals = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drill.goals) return;

    drill.goals.forEach(g => {
      const pos = toCanvasTransformed(g.position.x, g.position.y);
      const rot = transformRotation(g.rotation, isPortrait);
      const gw = (8 / 100) * FIELD_WIDTH;
      const gd = (3 / 100) * FIELD_HEIGHT;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-gw / 2, gd / 2); ctx.lineTo(-gw / 2, -gd / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gw / 2, gd / 2); ctx.lineTo(gw / 2, -gd / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-gw / 2, -gd / 2); ctx.lineTo(gw / 2, -gd / 2); ctx.stroke();
      ctx.restore();
    });
  }, [drill.goals, toCanvasTransformed, isPortrait, FIELD_WIDTH, FIELD_HEIGHT]);

  const drawMiniGoals = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!drill.mini_goals) return;

    drill.mini_goals.forEach(g => {
      const pos = toCanvasTransformed(g.position.x, g.position.y);
      const rot = (transformRotation(g.rotation, isPortrait) + 180) % 360;
      const gw = (4 / 100) * FIELD_WIDTH;
      const gd = (2 / 100) * FIELD_HEIGHT;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-gw / 2, gd / 2);
      ctx.lineTo(-gw / 2, -gd / 2);
      ctx.lineTo(gw / 2, -gd / 2);
      ctx.lineTo(gw / 2, gd / 2);
      ctx.stroke();
      ctx.restore();
    });
  }, [drill.mini_goals, toCanvasTransformed, isPortrait, FIELD_WIDTH, FIELD_HEIGHT]);

  const drawPlayers = useCallback((ctx: CanvasRenderingContext2D, positions: Record<string, Position>) => {
    if (!drill.players) return;

    drill.players.forEach(p => {
      const pd = positions[p.id] || p.position;
      const pos = toCanvasTransformed(pd.x, pd.y);
      
      ctx.fillStyle = PLAYER_COLORS[p.role] || '#888';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Player ID label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(p.id, pos.x, pos.y + 16);
    });
  }, [drill.players, toCanvas]);

  const drawBalls = useCallback((ctx: CanvasRenderingContext2D, positions: Record<string, Position>) => {
    if (!drill.balls) return;

    drill.balls.forEach((b, i) => {
      const pd = positions[`ball_${i}`] || b.position;
      const pos = toCanvasTransformed(pd.x, pd.y);

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pentagon pattern
      ctx.fillStyle = '#000';
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j * 72 - 90) * Math.PI / 180;
        const px = pos.x + 5 * Math.cos(a);
        const py = pos.y + 5 * Math.sin(a);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    });
  }, [drill.balls, toCanvas]);

  const draw = useCallback((positions?: Record<string, Position>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get positions
    const pos = positions || (isPlaying 
      ? getPositionsAtTime(currentTime) 
      : getPositionsAtKeyframe(selectedKeyframeIndex));

    ctx.clearRect(0, 0, width, height);
    drawField(ctx);
    drawConeLines(ctx);
    drawCones(ctx);
    drawGoals(ctx);
    drawMiniGoals(ctx);
    drawPlayers(ctx, pos);
    drawBalls(ctx, pos);
  }, [
    width, height, isPlaying, currentTime, selectedKeyframeIndex,
    drawField, drawConeLines, drawCones, drawGoals, drawMiniGoals,
    drawPlayers, drawBalls, getPositionsAtTime, getPositionsAtKeyframe
  ]);

  // ============================================================
  // ANIMATION LOOP
  // ============================================================

  const animationLoop = useCallback((timestamp: number) => {
    if (!isPlaying) return;

    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp;
    }

    const delta = (timestamp - lastTimestampRef.current) * playbackSpeed;
    lastTimestampRef.current = timestamp;

    setCurrentTime(prev => {
      let newTime = prev + delta;
      if (newTime >= totalDuration) {
        if (looping) {
          newTime = 0;
        } else {
          setIsPlaying(false);
          return totalDuration;
        }
      }
      return newTime;
    });

    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, [isPlaying, playbackSpeed, totalDuration, looping]);

  // Start/stop animation loop
  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animationLoop]);

  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw, currentTime, selectedKeyframeIndex, isPlaying]);

  // ============================================================
  // PLAYBACK CONTROLS
  // ============================================================

  const togglePlay = () => {
    if (keyframes.length < 2) return;
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const goToStart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setSelectedKeyframeIndex(0);
  };

  const goToEnd = () => {
    setIsPlaying(false);
    setCurrentTime(totalDuration);
    setSelectedKeyframeIndex(keyframes.length - 1);
  };

  const prevKeyframe = () => {
    setIsPlaying(false);
    const newIdx = Math.max(0, selectedKeyframeIndex - 1);
    setSelectedKeyframeIndex(newIdx);
    // Calculate time at this keyframe
    let t = 0;
    for (let i = 1; i <= newIdx; i++) {
      t += keyframes[i].duration || 1000;
    }
    setCurrentTime(t);
  };

  const nextKeyframe = () => {
    setIsPlaying(false);
    const newIdx = Math.min(keyframes.length - 1, selectedKeyframeIndex + 1);
    setSelectedKeyframeIndex(newIdx);
    let t = 0;
    for (let i = 1; i <= newIdx; i++) {
      t += keyframes[i].duration || 1000;
    }
    setCurrentTime(t);
  };

  const jumpToKeyframe = (idx: number) => {
    setIsPlaying(false);
    setSelectedKeyframeIndex(idx);
    let t = 0;
    for (let i = 1; i <= idx; i++) {
      t += keyframes[i].duration || 1000;
    }
    setCurrentTime(t);
  };

  const seekProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPlaying(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * totalDuration;
    setCurrentTime(newTime);
  };

  const toggleLoop = () => setLooping(!looping);

  // ============================================================
  // TIME DISPLAY
  // ============================================================

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={className}>
      {/* Canvas */}
      <div className="bg-[#2d4a2d] rounded-xl p-4 mb-4">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-auto rounded-lg"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {/* Playback row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={goToStart}
            className="w-10 h-10 border-2 border-[#3d5a3d] rounded-lg bg-white text-[#3d5a3d] flex items-center justify-center hover:bg-green-50 transition"
            title="Go to start"
          >
            ⏮
          </button>
          <button
            onClick={prevKeyframe}
            className="w-10 h-10 border-2 border-[#3d5a3d] rounded-lg bg-white text-[#3d5a3d] flex items-center justify-center hover:bg-green-50 transition"
            title="Previous step"
          >
            ⏪
          </button>
          <button
            onClick={togglePlay}
            className="w-12 h-12 border-2 border-[#3d5a3d] rounded-full bg-[#3d5a3d] text-white flex items-center justify-center hover:bg-[#2d4a2d] transition"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={nextKeyframe}
            className="w-10 h-10 border-2 border-[#3d5a3d] rounded-lg bg-white text-[#3d5a3d] flex items-center justify-center hover:bg-green-50 transition"
            title="Next step"
          >
            ⏩
          </button>
          <button
            onClick={goToEnd}
            className="w-10 h-10 border-2 border-[#3d5a3d] rounded-lg bg-white text-[#3d5a3d] flex items-center justify-center hover:bg-green-50 transition"
            title="Go to end"
          >
            ⏭
          </button>

          {/* Progress bar */}
          <div className="flex-1 min-w-[150px] flex items-center gap-2">
            <div
              className="flex-1 h-2 bg-gray-200 rounded cursor-pointer relative"
              onClick={seekProgress}
            >
              <div
                className="h-full bg-[#3d5a3d] rounded transition-all duration-50"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 min-w-[80px] text-right font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* Options row */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="px-3 py-2 border-2 border-[#3d5a3d] rounded-lg bg-white text-[#3d5a3d] text-sm cursor-pointer"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
          <button
            onClick={toggleLoop}
            className={`px-4 py-2 border-2 border-[#3d5a3d] rounded-lg text-sm flex items-center gap-2 transition ${
              looping ? 'bg-[#3d5a3d] text-white' : 'bg-white text-[#3d5a3d]'
            }`}
          >
            🔄 Loop {looping ? 'On' : 'Off'}
          </button>
        </div>

        {/* Step buttons (optional) */}
        {showStepButtons && keyframes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {keyframes.map((kf, i) => (
              <button
                key={i}
                onClick={() => jumpToKeyframe(i)}
                className={`px-4 py-2 border-2 border-[#3d5a3d] rounded-full text-sm whitespace-nowrap transition ${
                  selectedKeyframeIndex === i && !isPlaying
                    ? 'bg-[#3d5a3d] text-white'
                    : 'bg-white text-[#3d5a3d] hover:bg-green-50'
                }`}
              >
                {kf.label || `Step ${i}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrillAnimationPlayer;

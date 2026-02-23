import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================
// TYPES
// ============================================================

interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  role: string;
  position: Position;
  label?: string;
}

interface Cone {
  position: Position;
  color?: string;
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
  size?: "full" | "small";
}

interface MiniGoal {
  position: Position;
  rotation?: number;
}

interface FieldConfig {
  type?: "FULL" | "HALF";
  markings?: boolean;
  show_markings?: boolean;
  goals?: number;
  attacking_direction?: "NORTH" | "SOUTH";
}

interface Keyframe {
  id?: string;
  label?: string;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  positions?: Record<string, Position>;
}

interface AnimationData {
  duration?: number;
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
  className?: string;
}

// ============================================================
// COLORS - Must match Python renderer.py
// ============================================================

const COLORS = {
  GRASS_LIGHT: "#6fbf4a",
  GRASS_DARK: "#63b043",
  CONE_COLOR: "#f4a261",
  CONE_LINE_COLOR: "#f4a261",
};

const PLAYER_COLORS: Record<string, string> = {
  attacker: "#e63946",
  defender: "#457b9d",
  goalkeeper: "#f1fa3c",
  neutral: "#f4a261",
};

// Canvas base width
const CW = 900;
const CANVAS_PADDING = 15;

// ============================================================
// BOUNDS CALCULATION - matches Python renderer
// ============================================================

interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function calculateDrillBounds(drill: DrillData, padding: number = 8): Bounds {
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

// ============================================================
// COMPONENT
// ============================================================

const DrillAnimationPlayer: React.FC<DrillAnimationPlayerProps> = ({ drill, animation, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic bounds calculation
  const bounds = useMemo(() => calculateDrillBounds(drill), [drill]);
  const boundsWidth = bounds.xMax - bounds.xMin;
  const boundsHeight = bounds.yMax - bounds.yMin;

  const FIELD_WIDTH = CW - CANVAS_PADDING * 2;
  const CH = Math.round((boundsHeight / boundsWidth) * FIELD_WIDTH + CANVAS_PADDING * 2);
  const FIELD_HEIGHT = CH - CANVAS_PADDING * 2;

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [looping, setLooping] = useState(true);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const keyframes = animation?.keyframes || [];

  const totalDuration = keyframes.reduce((sum, kf, i) => {
    if (i === 0) return sum;
    return sum + (kf.duration || 1000);
  }, 0);

  // ============================================================
  // COORDINATE CONVERSION - maps from field coords to canvas via bounds
  // ============================================================

  const toCanvas = useCallback(
    (x: number, y: number) => ({
      x: CANVAS_PADDING + ((x - bounds.xMin) / boundsWidth) * FIELD_WIDTH,
      y: CANVAS_PADDING + ((bounds.yMax - y) / boundsHeight) * FIELD_HEIGHT,
    }),
    [bounds, boundsWidth, boundsHeight, FIELD_WIDTH, FIELD_HEIGHT],
  );

  // ============================================================
  // POSITION CALCULATIONS
  // ============================================================

  const getStartingPositions = useCallback((): Record<string, Position> => {
    const pos: Record<string, Position> = {};
    drill.players?.forEach((p) => {
      pos[p.id] = { x: p.position.x, y: p.position.y };
    });
    drill.balls?.forEach((b, i) => {
      pos[`ball_${i}`] = { x: b.position.x, y: b.position.y };
    });
    return pos;
  }, [drill.players, drill.balls]);

  const getPositionsAtKeyframe = useCallback(
    (idx: number): Record<string, Position> => {
      const pos = getStartingPositions();
      for (let i = 0; i <= idx && i < keyframes.length; i++) {
        const kf = keyframes[i];
        if (kf.positions) {
          Object.entries(kf.positions).forEach(([id, p]) => {
            pos[id] = { ...p };
          });
        }
      }
      return pos;
    },
    [keyframes, getStartingPositions],
  );

  const getPositionsAtTime = useCallback(
    (time: number): Record<string, Position> => {
      if (keyframes.length === 0) return getStartingPositions();

      const times: number[] = [];
      let cum = 0;
      for (let i = 0; i < keyframes.length; i++) {
        times.push(cum);
        if (i < keyframes.length - 1) {
          cum += keyframes[i + 1].duration || 1000;
        }
      }

      let from = 0;
      for (let i = 0; i < times.length; i++) {
        if (time >= times[i]) from = i;
      }

      const to = Math.min(from + 1, keyframes.length - 1);

      if (from >= keyframes.length - 1 || from === to) {
        return getPositionsAtKeyframe(keyframes.length - 1);
      }

      const segDur = times[to] - times[from];
      if (segDur <= 0) return getPositionsAtKeyframe(from);

      const prog = Math.min(1, Math.max(0, (time - times[from]) / segDur));
      const fromPos = getPositionsAtKeyframe(from);
      const toPos = getPositionsAtKeyframe(to);

      const ease = keyframes[to]?.easing || "linear";
      let e: number;
      switch (ease) {
        case "ease-in":
          e = prog * prog;
          break;
        case "ease-out":
          e = 1 - (1 - prog) * (1 - prog);
          break;
        case "ease-in-out":
          e = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
          break;
        default:
          e = prog;
      }

      const interp: Record<string, Position> = {};
      Object.keys(fromPos).forEach((id) => {
        const f = fromPos[id];
        const t = toPos[id] || f;
        interp[id] = {
          x: f.x + (t.x - f.x) * e,
          y: f.y + (t.y - f.y) * e,
        };
      });

      return interp;
    },
    [keyframes, getStartingPositions, getPositionsAtKeyframe],
  );

  // ============================================================
  // DRAWING
  // ============================================================

  const drawGoalArea = useCallback(
    (ctx: CanvasRenderingContext2D, goalY: number, drawGoal: boolean) => {
      const into = goalY === 100 ? -1 : 1;
      ctx.strokeStyle = "white";
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
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Built-in goal
      if (drawGoal) {
        const pos = toCanvas(50, goalY);
        const gw = (8 / boundsWidth) * FIELD_WIDTH;
        const gd = (3 / boundsHeight) * FIELD_HEIGHT;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        if (goalY === 100) {
          ctx.beginPath();
          ctx.moveTo(pos.x - gw / 2, pos.y);
          ctx.lineTo(pos.x - gw / 2, pos.y - gd);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x + gw / 2, pos.y);
          ctx.lineTo(pos.x + gw / 2, pos.y - gd);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x - gw / 2, pos.y - gd);
          ctx.lineTo(pos.x + gw / 2, pos.y - gd);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(pos.x - gw / 2, pos.y);
          ctx.lineTo(pos.x - gw / 2, pos.y + gd);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x + gw / 2, pos.y);
          ctx.lineTo(pos.x + gw / 2, pos.y + gd);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x - gw / 2, pos.y + gd);
          ctx.lineTo(pos.x + gw / 2, pos.y + gd);
          ctx.stroke();
        }
      }
    },
    [toCanvas],
  );

  const drawField = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const p = CANVAS_PADDING;
      const w = FIELD_WIDTH;
      const h = FIELD_HEIGHT;

      // Dark green background
      ctx.fillStyle = '#2d4a2d';
      ctx.fillRect(0, 0, CW, CH);

      // Grass stripes aligned to field coordinates (10-unit wide stripes)
      const stripeWidth = 10;
      const startStripe = Math.floor(bounds.xMin / stripeWidth);
      const endStripe = Math.ceil(bounds.xMax / stripeWidth);
      for (let i = startStripe; i <= endStripe; i++) {
        const stripeLeft = Math.max(i * stripeWidth, bounds.xMin);
        const stripeRight = Math.min((i + 1) * stripeWidth, bounds.xMax);
        if (stripeRight <= stripeLeft) continue;
        const left = toCanvas(stripeLeft, bounds.yMax);
        const right = toCanvas(stripeRight, bounds.yMin);
        ctx.fillStyle = i % 2 === 0 ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK;
        ctx.fillRect(left.x, left.y, right.x - left.x, right.y - left.y);
      }

      // Field outline
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p, p, w, h);

      // Field markings
      const showMarkings = drill.field?.markings !== false && drill.field?.show_markings !== false;
      if (showMarkings) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;

        // Halfway line
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
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();

        const fg = drill.field?.goals || 0;
        drawGoalArea(ctx, 100, fg >= 1);
        if (drill.field?.type === "FULL") {
          drawGoalArea(ctx, 0, fg >= 2);
        }
      }
    },
    [drill.field, toCanvas, drawGoalArea, bounds, FIELD_WIDTH, FIELD_HEIGHT, CH],
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const positions = isPlaying || currentTime > 0 ? getPositionsAtTime(currentTime) : getPositionsAtKeyframe(0);

    ctx.clearRect(0, 0, CW, CH);

    drawField(ctx);

    // Cone lines
    if (drill.cone_lines && drill.cones) {
      ctx.strokeStyle = COLORS.CONE_LINE_COLOR;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      drill.cone_lines.forEach((l) => {
        if (l.from_cone < drill.cones!.length && l.to_cone < drill.cones!.length) {
          const f = toCanvas(drill.cones![l.from_cone].position.x, drill.cones![l.from_cone].position.y);
          const t = toCanvas(drill.cones![l.to_cone].position.x, drill.cones![l.to_cone].position.y);
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1.0;
    }

    // Cones
    const CONE_SIZE = 9;
    drill.cones?.forEach((c) => {
      const pos = toCanvas(c.position.x, c.position.y);
      ctx.fillStyle = COLORS.CONE_COLOR;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - CONE_SIZE);
      ctx.lineTo(pos.x - CONE_SIZE * 0.75, pos.y + CONE_SIZE * 0.6);
      ctx.lineTo(pos.x + CONE_SIZE * 0.75, pos.y + CONE_SIZE * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Goals
    drill.goals?.forEach((g) => {
      const pos = toCanvas(g.position.x, g.position.y);
      const rot = g.rotation || 0;
      const gw = (8 / boundsWidth) * FIELD_WIDTH;
      const gd = (3 / boundsHeight) * FIELD_HEIGHT;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-gw / 2, gd / 2);
      ctx.lineTo(-gw / 2, -gd / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gw / 2, gd / 2);
      ctx.lineTo(gw / 2, -gd / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-gw / 2, -gd / 2);
      ctx.lineTo(gw / 2, -gd / 2);
      ctx.stroke();
      ctx.restore();
    });

    // Mini goals
    if (drill.mini_goals) {
      const GOAL_WIDTH_UNITS = 4;
      const GOAL_DEPTH_UNITS = 2;

      drill.mini_goals.forEach((g) => {
        const pos = toCanvas(g.position.x, g.position.y);
        const inputRotation = g.rotation || 0;
        const rotation = (inputRotation + 180) % 360;
        const goalWidth = (GOAL_WIDTH_UNITS / boundsWidth) * FIELD_WIDTH;
        const goalDepth = (GOAL_DEPTH_UNITS / boundsHeight) * FIELD_HEIGHT;

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        if (rotation === 0) {
          ctx.beginPath(); ctx.moveTo(pos.x - goalWidth/2, pos.y); ctx.lineTo(pos.x - goalWidth/2, pos.y - goalDepth); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x + goalWidth/2, pos.y); ctx.lineTo(pos.x + goalWidth/2, pos.y - goalDepth); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x - goalWidth/2, pos.y); ctx.lineTo(pos.x + goalWidth/2, pos.y); ctx.stroke();
        } else if (rotation === 90) {
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth/2); ctx.lineTo(pos.x + goalDepth, pos.y - goalWidth/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y + goalWidth/2); ctx.lineTo(pos.x + goalDepth, pos.y + goalWidth/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth/2); ctx.lineTo(pos.x, pos.y + goalWidth/2); ctx.stroke();
        } else if (rotation === 180) {
          ctx.beginPath(); ctx.moveTo(pos.x - goalWidth/2, pos.y); ctx.lineTo(pos.x - goalWidth/2, pos.y + goalDepth); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x + goalWidth/2, pos.y); ctx.lineTo(pos.x + goalWidth/2, pos.y + goalDepth); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x - goalWidth/2, pos.y); ctx.lineTo(pos.x + goalWidth/2, pos.y); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth/2); ctx.lineTo(pos.x - goalDepth, pos.y - goalWidth/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y + goalWidth/2); ctx.lineTo(pos.x - goalDepth, pos.y + goalWidth/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos.x, pos.y - goalWidth/2); ctx.lineTo(pos.x, pos.y + goalWidth/2); ctx.stroke();
        }
      });
    }

    // Players
    const PLAYER_RADIUS = 14;
    const LABEL_OFFSET = 18;
    drill.players?.forEach((p) => {
      const pd = positions[p.id] || p.position;
      const pos = toCanvas(pd.x, pd.y);
      ctx.fillStyle = PLAYER_COLORS[p.role.toLowerCase()] || "#888";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(p.id, pos.x, pos.y + LABEL_OFFSET);
    });

    // Balls
    const BALL_RADIUS = 11;
    drill.balls?.forEach((b, i) => {
      const pd = positions[`ball_${i}`] || b.position;
      const pos = toCanvas(pd.x, pd.y);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#000";
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
  }, [drill, isPlaying, currentTime, drawField, toCanvas, getPositionsAtTime, getPositionsAtKeyframe]);

  // ============================================================
  // ANIMATION LOOP
  // ============================================================

  const animationLoop = useCallback(
    (timestamp: number) => {
      if (!isPlaying) return;

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const delta = (timestamp - lastTimestampRef.current) * playbackSpeed;
      lastTimestampRef.current = timestamp;

      setCurrentTime((prev) => {
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
    },
    [isPlaying, playbackSpeed, totalDuration, looping],
  );

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

  useEffect(() => {
    draw();
  }, [draw]);

  // ============================================================
  // CONTROLS
  // ============================================================

  const togglePlay = () => {
    if (keyframes.length < 2) return;
    if (currentTime >= totalDuration) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  const goToStart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };
  const goToEnd = () => {
    setIsPlaying(false);
    setCurrentTime(totalDuration);
  };

  const prevKeyframe = () => {
    setIsPlaying(false);
    // Find keyframe before current time
    let t = 0;
    let prevT = 0;
    for (let i = 1; i < keyframes.length; i++) {
      t += keyframes[i].duration || 1000;
      if (t >= currentTime - 50) break;
      prevT = t;
    }
    setCurrentTime(currentTime <= 50 ? 0 : prevT);
  };

  const nextKeyframe = () => {
    setIsPlaying(false);
    let t = 0;
    for (let i = 1; i < keyframes.length; i++) {
      t += keyframes[i].duration || 1000;
      if (t > currentTime + 50) {
        setCurrentTime(t);
        return;
      }
    }
    setCurrentTime(totalDuration);
  };

  const seekProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPlaying(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(ratio * totalDuration);
  };

  const formatTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={className}>
      {/* Canvas with field background */}
      <div className="bg-field rounded-xl overflow-hidden inline-flex justify-center w-full">
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="max-w-full max-h-96 block rounded-lg"
          style={{ aspectRatio: `${CW} / ${CH}` }}
        />
      </div>

      {/* Controls - outside the field background */}
      <div className="mt-3 space-y-3">
        {/* Playback row */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={goToStart} title="Go to start" className="h-9 w-9">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={prevKeyframe} title="Previous step" className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
            className="h-11 w-11 rounded-full"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={nextKeyframe} title="Next step" className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToEnd} title="Go to end" className="h-9 w-9">
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Progress bar */}
          <div className="flex-1 min-w-[120px] flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded cursor-pointer relative" onClick={seekProgress}>
              <div
                className="h-full bg-primary rounded transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[70px] text-right font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* Options row */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-sm cursor-pointer"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
          <Button
            variant={looping ? "default" : "outline"}
            size="sm"
            onClick={() => setLooping(!looping)}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Loop {looping ? "On" : "Off"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DrillAnimationPlayer;

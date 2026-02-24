import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Position,
  RenderDrillData,
  calculateDrillBounds,
  createRenderContext,
  renderDrillFrame,
  CW,
  CANVAS_PADDING,
} from "@/utils/drillRenderer";

// ============================================================
// TYPES (animation-specific)
// ============================================================

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

interface DrillAnimationPlayerProps {
  drill: RenderDrillData;
  animation: AnimationData;
  className?: string;
}

// ============================================================
// COMPONENT
// ============================================================

const DrillAnimationPlayer: React.FC<DrillAnimationPlayerProps> = ({ drill, animation, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic bounds & render context
  const bounds = useMemo(() => calculateDrillBounds(drill), [drill]);
  const rc = useMemo(() => createRenderContext(bounds, CW, CANVAS_PADDING), [bounds]);

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
  // DRAWING - delegates to shared renderer
  // ============================================================

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const positions = isPlaying || currentTime > 0 ? getPositionsAtTime(currentTime) : getPositionsAtKeyframe(0);
    renderDrillFrame(ctx, rc, drill, positions);
  }, [drill, isPlaying, currentTime, rc, getPositionsAtTime, getPositionsAtKeyframe]);

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

  const goToStart = () => { setIsPlaying(false); setCurrentTime(0); };
  const goToEnd = () => { setIsPlaying(false); setCurrentTime(totalDuration); };

  const prevKeyframe = () => {
    setIsPlaying(false);
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
      <div className="bg-field rounded-xl overflow-hidden inline-flex justify-center w-full">
        <canvas
          ref={canvasRef}
          width={CW}
          height={rc.canvasHeight}
          className="max-w-full max-h-96 block rounded-lg"
          style={{ aspectRatio: `${CW} / ${rc.canvasHeight}` }}
        />
      </div>

      <div className="mt-3 space-y-3">
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

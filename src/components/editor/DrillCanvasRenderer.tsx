import React, { useRef, useEffect, useMemo } from 'react';
import {
  RenderDrillData,
  RenderAction,
  calculateDrillBounds,
  createRenderContext,
  renderDrillFrame,
  CW,
  CANVAS_PADDING,
} from '@/utils/drillRenderer';

// Re-export types for consumers
export type { RenderDrillData as DrillData } from '@/utils/drillRenderer';

interface DrillCanvasRendererProps {
  drill: RenderDrillData;
  className?: string;
}

export const DrillCanvasRenderer: React.FC<DrillCanvasRendererProps> = ({
  drill,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bounds = useMemo(() => calculateDrillBounds(drill), [drill]);
  const rc = useMemo(() => createRenderContext(bounds, CW, CANVAS_PADDING), [bounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderDrillFrame(ctx, rc, drill);
  }, [drill, rc]);

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={rc.canvasHeight}
      className={className ?? 'rounded-lg max-w-full max-h-96 block'}
      style={{ aspectRatio: `${CW} / ${rc.canvasHeight}` }}
    />
  );
};

export default DrillCanvasRenderer;

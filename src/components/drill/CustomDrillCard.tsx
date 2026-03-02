import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomDrill } from '@/types/customDrill';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Eye, ArrowRight, Clock, Users, Target } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  calculateDrillBounds,
  createRenderContext,
  renderDrillFrame,
  CW,
  CANVAS_PADDING,
  RenderDrillData,
} from '@/utils/drillRenderer';

interface CustomDrillCardProps {
  drill: CustomDrill;
  onDelete: (id: string) => void;
  onView: (drill: CustomDrill) => void;
  compactOverlay?: boolean;
  isOverlayActive?: boolean;
  onOverlayToggle?: (id: string) => void;
}

function toRenderData(drill: CustomDrill): RenderDrillData {
  const d = drill.diagramData;
  const coneIndexMap: Record<string, number> = {};
  d.cones.forEach((c, i) => { coneIndexMap[c.id] = i; });

  const renderConeLines = d.coneLines
    .map(cl => ({
      from_cone: coneIndexMap[cl.fromConeId] ?? -1,
      to_cone: coneIndexMap[cl.toConeId] ?? -1,
    }))
    .filter(cl => cl.from_cone >= 0 && cl.to_cone >= 0);

  const fullGoals = d.goals
    .filter(g => g.size === 'full')
    .map(g => ({ position: g.position, rotation: g.rotation }));
  const miniGoalsList = d.goals
    .filter(g => g.size === 'mini')
    .map(g => ({ position: g.position, rotation: g.rotation }));

  const renderActions = d.actions.map(a => {
    if (a.type === 'PASS') {
      return { type: 'PASS' as const, fromPlayer: a.fromPlayerId, toPlayer: a.toPlayerId };
    } else {
      return { type: a.type, player: a.playerId, toPosition: a.toPosition };
    }
  });

  return {
    field: { type: d.field.type, markings: d.field.markings, goals: d.field.goals },
    players: d.players.map(p => ({ id: p.id, role: p.role.toLowerCase(), position: p.position })),
    cones: d.cones.map(c => ({ position: c.position })),
    cone_lines: renderConeLines,
    balls: d.balls.map(b => ({ position: b.position })),
    goals: fullGoals,
    mini_goals: miniGoalsList,
    actions: renderActions,
  };
}

export function CustomDrillCard({ drill, onDelete, onView, compactOverlay, isOverlayActive, onOverlayToggle }: CustomDrillCardProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const showOverlay = isOverlayActive ?? false;

  // Render diagram using shared renderer with dynamic bounds (same as library)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderData = toRenderData(drill);
    const bounds = calculateDrillBounds(renderData);
    const rc = createRenderContext(bounds, CW, CANVAS_PADDING);

    canvas.width = rc.canvasWidth;
    canvas.height = rc.canvasHeight;

    renderDrillFrame(ctx, rc, renderData);
  }, [drill.diagramData]);

  const handleEdit = () => {
    navigate(`/?edit=${drill.id}`);
  };

  const handleDiagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      if (onOverlayToggle) {
        onOverlayToggle(drill.id);
      } else {
        onView(drill);
      }
    } else {
      onView(drill);
    }
  };

  const handleViewFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(drill);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY': return 'bg-emerald-500/10 text-emerald-600';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-600';
      case 'HARD': return 'bg-red-500/10 text-red-600';
      default: return '';
    }
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col h-full cursor-pointer',
        'hover:shadow-card-lg hover:border-primary/30 transition-all duration-300'
      )}
    >
      {/* Diagram - fixed aspect ratio matching library style */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-xl" onClick={handleDiagramClick}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />

        {/* Hover/tap overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/40 transition-all duration-300 flex items-center justify-center",
          isMobile
            ? (showOverlay ? "opacity-100" : "opacity-0 pointer-events-none")
            : "opacity-0 group-hover:opacity-100"
        )}>
          {compactOverlay ? (
            <Button size="icon" className="shadow-lg h-9 w-9" onClick={handleViewFull}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" className="shadow-lg" onClick={handleViewFull}>
              View Drill
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1" onClick={() => onView(drill)}>
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {drill.formData.name || 'Untitled Drill'}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {drill.formData.difficulty && (
            <span className={cn('badge-pill text-xs font-medium', getDifficultyColor(drill.formData.difficulty))}>
              {drill.formData.difficulty.charAt(0) + drill.formData.difficulty.slice(1).toLowerCase()}
            </span>
          )}
        </div>

        {/* Description */}
        {drill.formData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
            {drill.formData.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {drill.formData.playerCount && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {drill.formData.playerCount}
            </span>
          )}
          {drill.formData.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {drill.formData.duration}
            </span>
          )}
          {drill.formData.ageGroup && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {drill.formData.ageGroup}
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {new Date(drill.updatedAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleEdit}>
            <Edit className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Drill</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{drill.formData.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(drill.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

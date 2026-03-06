import { X, Users, Clock, Target, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { DrillCanvasRenderer } from '@/components/editor/DrillCanvasRenderer';
import { cn } from '@/lib/utils';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';
import { getDrillCardZoom } from '@/lib/drillCardZoom';

interface QuickPreviewModalProps {
  drill: Drill | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFull: (drill: Drill) => void;
  isSaved?: boolean;
  onSave?: (drill: Drill) => void;
}

export function QuickPreviewModal({ 
  drill, 
  isOpen, 
  onClose, 
  onViewFull,
  isSaved,
  onSave 
}: QuickPreviewModalProps) {
  if (!isOpen || !drill) return null;

  const zoom = getDrillCardZoom(drill.name);

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{drill.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Large diagram */}
        <div className="aspect-[4/3] overflow-hidden">
          {drill.drillJson ? (() => {
            const renderData = {
              field: drill.drillJson.field ? { type: drill.drillJson.field.type, markings: drill.drillJson.field.markings, goals: drill.drillJson.field.goals } : undefined,
              players: drill.drillJson.players?.map(p => ({ id: p.id, role: p.role as string, position: p.position })) || [],
              cones: drill.drillJson.cones?.map(c => ({ position: c.position })) || [],
              cone_lines: drill.drillJson.cone_lines || [],
              balls: drill.drillJson.balls?.map(b => ({ position: b.position })) || [],
              goals: drill.drillJson.goals?.filter(g => g.size !== 'small').map(g => ({ position: g.position, rotation: g.rotation })) || [],
              mini_goals: drill.drillJson.mini_goals || [],
              actions: drill.drillJson.actions?.map(a => {
                if (a.type === 'PASS') return { type: 'PASS' as const, fromPlayer: a.from_player!, toPlayer: a.to_player! };
                return { type: a.type, player: a.player!, toPosition: a.to_position! };
              }) || [],
            };
            return (
              <div style={{ transform: `scale(${zoom.base})` }} className="w-full h-full">
                <DrillCanvasRenderer
                  drill={renderData}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })() : drill.svgUrl ? (
            <img 
              src={drill.svgUrl} 
              alt={drill.name}
              className="w-full h-full object-cover"
              style={{ transform: `scale(${zoom.base})` }}
            />
          ) : drill.svg ? (
            <img
              src={`data:image/svg+xml;base64,${drill.svg}`}
              alt={drill.name}
              className="w-full h-full object-cover"
              style={{ transform: `scale(${zoom.base})` }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No diagram available
            </div>
          )}
        </div>
        
        {/* Quick info */}
        <div className="p-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={cn('badge-pill font-medium', getCategoryColor(drill.category))}>
              {drill.category}
            </span>
            {drill.difficulty && (
              <span className={cn('badge-pill font-medium', getDifficultyColor(drill.difficulty))}>
                {drill.difficulty}
              </span>
            )}
            {drill.hasAnimation && (
              <span className="badge-pill bg-accent/20 text-accent-foreground flex items-center gap-1">
                <Play className="h-3 w-3" />
                Animated
              </span>
            )}
            {drill.playerCount && (
              <span className="badge-pill badge-muted">
                <Users className="h-3 w-3" />
                {drill.playerCountDisplay || drill.playerCount}
              </span>
            )}
            {drill.duration && (
              <span className="badge-pill badge-muted">
                <Clock className="h-3 w-3" />
                {drill.duration} min
              </span>
            )}
            {drill.ageGroup && (
              <span className="badge-pill badge-muted">
                <Target className="h-3 w-3" />
                {drill.ageGroup}
              </span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground mb-4 line-clamp-3">{drill.description}</p>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onViewFull(drill)}
              className="flex-1"
              size="lg"
            >
              View Full Drill →
            </Button>
            {onSave && (
              <Button 
                variant={isSaved ? 'secondary' : 'outline'}
                size="lg"
                className="px-4"
                onClick={() => onSave(drill)}
              >
                {isSaved ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

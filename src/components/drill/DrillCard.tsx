import { Clock, Users, Bookmark, BookmarkCheck, Target, Play, Eye, ArrowRight } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';

interface DrillCardProps {
  drill: Drill;
  isSaved?: boolean;
  onView: (drill: Drill) => void;
  onSave: (drill: Drill) => void;
  onQuickView?: (drill: Drill) => void;
  className?: string;
}

export function DrillCard({ drill, isSaved, onView, onSave, onQuickView, className }: DrillCardProps) {
  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(drill);
    }
  };

  const handleViewFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(drill);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(drill);
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col h-full cursor-pointer',
        'hover:shadow-card-lg hover:border-primary/30 transition-all duration-300',
        className
      )}
      onClick={() => onQuickView ? onQuickView(drill) : onView(drill)}
    >
      {/* Diagram - fixed aspect ratio with field background */}
      <div className="relative w-full aspect-[4/3] bg-field overflow-hidden">
        {drill.svgUrl ? (
          <img
            src={drill.svgUrl}
            alt={drill.name}
            className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : drill.svg ? (
          <img
            src={`data:image/svg+xml;base64,${drill.svg}`}
            alt={drill.name}
            className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-field-lines/60">
            <span className="text-sm">No diagram</span>
          </div>
        )}

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            {onQuickView && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
                onClick={handleQuickView}
              >
                <Eye className="h-4 w-4 mr-1" />
                Quick View
              </Button>
            )}
            <Button
              size="sm"
              className="shadow-lg"
              onClick={handleViewFull}
            >
              View Drill
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Animated badge */}
        {drill.hasAnimation && (
          <div className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <span className="animate-pulse">●</span>
            Animated
          </div>
        )}

        {/* Save button */}
        <button
          className={cn(
            'absolute top-2 left-2 p-2 rounded-full transition-all shadow-md',
            isSaved 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-primary'
          )}
          onClick={handleSave}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {drill.name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={cn('badge-pill text-xs font-medium', getCategoryColor(drill.category))}>
            {drill.category}
          </span>
          {drill.difficulty && (
            <span className={cn('badge-pill text-xs font-medium', getDifficultyColor(drill.difficulty))}>
              {drill.difficulty}
            </span>
          )}
        </div>

        {/* Description - truncated to 2 lines */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
          {drill.description}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {drill.playerCount && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {drill.playerCountDisplay || drill.playerCount}
            </span>
          )}
          {drill.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {drill.duration} min
            </span>
          )}
          {drill.ageGroup && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {drill.ageGroup}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

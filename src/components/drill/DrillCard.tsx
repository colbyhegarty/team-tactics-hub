import { useState } from 'react';
import { Clock, Users, Bookmark, BookmarkCheck, Target, Play, Eye, ArrowRight } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface DrillCardProps {
  drill: Drill;
  isSaved?: boolean;
  onView: (drill: Drill) => void;
  onSave: (drill: Drill) => void;
  onQuickView?: (drill: Drill) => void;
  className?: string;
  compactOverlay?: boolean;
  isOverlayActive?: boolean;
  onOverlayToggle?: (drillId: string) => void;
}

export function DrillCard({ drill, isSaved, onView, onSave, onQuickView, className, compactOverlay, isOverlayActive, onOverlayToggle }: DrillCardProps) {
  const isMobile = useIsMobile();

  // Use external overlay state if provided, otherwise internal
  const showOverlay = isOverlayActive ?? false;

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

  const handleDiagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      if (onOverlayToggle) {
        onOverlayToggle(drill.id);
      }
    } else {
      if (onQuickView) onQuickView(drill);
      else onView(drill);
    }
  };

  const handleContentClick = () => {
    onView(drill);
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col h-full cursor-pointer',
        'hover:shadow-card-lg hover:border-primary/30 transition-all duration-300',
        className
      )}
    >
      {/* Diagram - consistent aspect ratio with grass background */}
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-t-xl"
        onClick={handleDiagramClick}
      >
        {drill.svgUrl ? (
          <img
            src={drill.svgUrl}
            alt={drill.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : drill.svg ? (
          <img
            src={`data:image/svg+xml;base64,${drill.svg}`}
            alt={drill.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-field-lines/60">
            <span className="text-sm">No diagram</span>
          </div>
        )}

        {/* Hover/tap overlay with quick actions */}
        <div className={cn(
          "absolute inset-0 bg-black/40 transition-all duration-300 flex items-center justify-center",
          isMobile
            ? (showOverlay ? "opacity-100" : "opacity-0 pointer-events-none")
            : "opacity-0 group-hover:opacity-100"
        )}>
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
      <div className="p-4 flex flex-col flex-1" onClick={handleContentClick}>
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {drill.name}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {drill.category?.split(',').map((cat, index) => (
            <span key={index} className={cn('badge-pill text-xs font-medium', getCategoryColor(cat.trim()))}>
              {cat.trim()}
            </span>
          ))}
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

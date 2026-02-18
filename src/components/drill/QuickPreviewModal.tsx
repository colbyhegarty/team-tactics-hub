import { X, Users, Clock, Target, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';

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

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-foreground">{drill.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Single scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Diagram — consistent with DrillCard */}
          <div className="p-4">
            <div className="bg-field rounded-xl overflow-hidden">
              {drill.svgUrl ? (
                <div className="aspect-[4/3] flex items-center justify-center p-4">
                  <img 
                    src={drill.svgUrl} 
                    alt={drill.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : drill.svg ? (
                <div className="aspect-[4/3] flex items-center justify-center p-4">
                  <img
                    src={`data:image/svg+xml;base64,${drill.svg}`}
                    alt={drill.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center text-field-lines/60">
                  No diagram available
                </div>
              )}
            </div>
          </div>
          
          {/* Quick info */}
          <div className="px-4 pb-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className={cn('badge-pill text-xs font-medium', getCategoryColor(drill.category))}>
                {drill.category}
              </span>
              {drill.difficulty && (
                <span className={cn('badge-pill text-xs font-medium', getDifficultyColor(drill.difficulty))}>
                  {drill.difficulty}
                </span>
              )}
              {drill.hasAnimation && (
                <span className="badge-pill bg-accent/20 text-accent-foreground text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Animated
                </span>
              )}
              {drill.playerCount && (
                <span className="badge-pill badge-muted text-xs">
                  <Users className="h-3 w-3" />
                  {drill.playerCountDisplay || drill.playerCount}
                </span>
              )}
              {drill.duration && (
                <span className="badge-pill badge-muted text-xs">
                  <Clock className="h-3 w-3" />
                  {drill.duration} min
                </span>
              )}
              {drill.ageGroup && (
                <span className="badge-pill badge-muted text-xs">
                  <Target className="h-3 w-3" />
                  {drill.ageGroup}
                </span>
              )}
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{drill.description}</p>
            
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
    </div>
  );
}

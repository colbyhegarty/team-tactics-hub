import { Clock, Users, Bookmark, BookmarkCheck, GraduationCap } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryColor, getDifficultyColor } from '@/lib/api';

interface DrillCardProps {
  drill: Drill;
  isSaved?: boolean;
  onView: (drill: Drill) => void;
  onSave: (drill: Drill) => void;
  className?: string;
}

export function DrillCard({ drill, isSaved, onView, onSave, className }: DrillCardProps) {
  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-card-lg hover:border-primary/20 cursor-pointer overflow-hidden',
        className
      )}
      onClick={() => onView(drill)}
    >
      {/* Diagram Preview */}
      <div className="w-full h-48 bg-muted/50 flex items-center justify-center border-b border-border/50">
        {drill.svg ? (
          <img
            src={`data:image/svg+xml;base64,${drill.svg}`}
            alt={drill.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-sm">No diagram</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-foreground text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {drill.name}
        </h3>

        {/* Category & Difficulty Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={cn('badge-pill font-medium', getCategoryColor(drill.category))}>
            {drill.category}
          </span>
          {drill.difficulty && (
            <span className={cn('badge-pill font-medium', getDifficultyColor(drill.difficulty))}>
              {drill.difficulty}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {drill.description}
        </p>

        {/* Meta Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="badge-pill badge-muted">
            <Users className="h-3 w-3" />
            {drill.playerCountDisplay || drill.playerCount}
          </span>
          <span className="badge-pill badge-muted">
            <Clock className="h-3 w-3" />
            {drill.duration} min
          </span>
          {drill.ageGroup && (
            <span className="badge-pill badge-muted">
              <GraduationCap className="h-3 w-3" />
              {drill.ageGroup}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onView(drill)}
          >
            View Drill
          </Button>
          <Button
            variant={isSaved ? 'secondary' : 'outline'}
            size="icon"
            className="shrink-0"
            onClick={() => onSave(drill)}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
import { Clock, Users, Zap, Bookmark, BookmarkCheck } from 'lucide-react';
import { Drill } from '@/types/drill';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
        'group rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-lg hover:border-primary/20',
        className
      )}
    >
      {/* Diagram Preview */}
      <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-field/10 flex items-center justify-center">
        {drill.svg ? (
          <img
            src={`data:image/svg+xml;base64,${drill.svg}`}
            alt={drill.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs">{drill.category}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {drill.name}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {drill.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="badge-pill badge-primary">
            <Users className="h-3 w-3" />
            {drill.playerCount}
          </span>
          <span className="badge-pill badge-muted">
            <Clock className="h-3 w-3" />
            {drill.duration} min
          </span>
          <span className={cn(
            'badge-pill',
            drill.intensity === 'High' ? 'bg-destructive/10 text-destructive' :
            drill.intensity === 'Medium' ? 'bg-accent/20 text-accent-foreground' :
            'badge-muted'
          )}>
            {drill.intensity}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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

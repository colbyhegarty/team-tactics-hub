import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { SessionActivity } from '@/types/session';
import { Button } from '@/components/ui/button';

interface ActivityCardProps {
  activity: SessionActivity;
  index: number;
  startTime: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, '0')}`;
}

export function ActivityCard({
  activity,
  index,
  startTime,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  isFirst,
  isLast,
}: ActivityCardProps) {
  const displayTitle = activity.title || activity.drill_name || 'Untitled';
  const svgUrl = activity.drill_svg_url;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
      <div className="flex gap-3">
        {/* Timeline */}
        <div className="flex flex-col items-center pt-1">
          <span className="text-xs font-mono text-muted-foreground mb-1">
            {formatTime(startTime)}
          </span>
          <div className="h-3 w-3 rounded-full bg-primary" />
          {!isLast && <div className="mt-1 flex-1 w-0.5 bg-border" />}
        </div>

        {/* Thumbnail */}
        {svgUrl && (
          <div className="w-20 h-14 bg-field rounded overflow-hidden flex-shrink-0">
            <img
              src={svgUrl}
              alt={displayTitle}
              className="w-full h-full object-contain p-1"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground line-clamp-1">{displayTitle}</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                <span>⏱ {activity.duration_minutes} min</span>
                {activity.drill_difficulty && (
                  <span className="badge-pill badge-muted">{activity.drill_difficulty}</span>
                )}
                {activity.drill_player_count && (
                  <span>👥 {activity.drill_player_count}</span>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-primary whitespace-nowrap">
              {activity.duration_minutes} min
            </span>
          </div>

          {activity.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {activity.description}
            </p>
          )}

          {activity.activity_notes && (
            <div className="mt-2 rounded bg-accent/20 px-2 py-1.5 text-xs text-accent-foreground">
              📝 {activity.activity_notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={isFirst}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={isLast}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

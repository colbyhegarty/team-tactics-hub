import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, X, Clock, Users, ListChecks, StickyNote, Eye, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session, SessionActivity } from '@/types/session';
import { Drill } from '@/types/drill';
import { Progress } from '@/components/ui/progress';

function formatBulletPoints(text: string): string[] {
  return text
    .split(/\n|(?:\d+\.\s)/)
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
}

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

interface SessionModeProps {
  session: Session;
  drillDetails: Record<string, Drill>;
  onExit: () => void;
  onViewDrill: (activity: SessionActivity) => void;
  loadingDrillId: string | null;
}

export function SessionMode({ session, drillDetails, onExit, onViewDrill, loadingDrillId }: SessionModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const activities = session.activities;
  const activity = activities[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === activities.length - 1;
  const progress = ((currentIndex + 1) / activities.length) * 100;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Only trigger if horizontal swipe is dominant and > 50px
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && !isLast) {
        setCurrentIndex(i => i + 1);
      } else if (dx > 0 && !isFirst) {
        setCurrentIndex(i => i - 1);
      }
    }
  }, [isFirst, isLast]);

  const title = activity.title || activity.drill_name || 'Activity';
  const drillData = activity.library_drill_id ? drillDetails[activity.library_drill_id] : null;
  const hasLibraryDrill = !!activity.library_drill_id;

  // Calculate start time
  let startMin = 0;
  for (let i = 0; i < currentIndex; i++) {
    startMin += activities[i].duration_minutes;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium truncate">{session.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-foreground">
                Activity {currentIndex + 1} of {activities.length}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={onExit}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {/* Activity title & meta */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-pill bg-primary/10 text-primary text-xs font-semibold">
                {formatTime(startMin)} – {formatTime(startMin + activity.duration_minutes)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {activity.duration_minutes} min
              </span>
              {(activity.drill_difficulty || drillData?.difficulty) && (
                <span className="badge-pill badge-muted text-xs">
                  {activity.drill_difficulty || drillData?.difficulty}
                </span>
              )}
              {(activity.drill_player_count || drillData?.playerCount) && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {activity.drill_player_count || drillData?.playerCount}
                </span>
              )}
            </div>
          </div>

          {/* Description for non-drill activities */}
          {activity.description && !drillData && (
            <p className="text-foreground/80 leading-relaxed">{activity.description}</p>
          )}

          {/* Drill diagram */}
          {activity.drill_svg_url && (
            <div className="rounded-2xl overflow-hidden bg-field shadow-card">
              <img
                src={activity.drill_svg_url}
                alt={title}
                className="w-full object-contain"
                style={{ background: 'transparent' }}
              />
            </div>
          )}

          {/* View full drill button */}
          {hasLibraryDrill && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onViewDrill(activity)}
              disabled={loadingDrillId === activity.id}
            >
              <Eye className="h-4 w-4 mr-2" />
              {loadingDrillId === activity.id ? 'Loading...' : 'View Full Drill Details'}
            </Button>
          )}

          {/* Setup */}
          {(drillData?.setup || activity.drill_setup) && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Setup</h3>
              </div>
              <ul className="space-y-2">
                {formatBulletPoints(drillData?.setup || activity.drill_setup || '').map((point, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex gap-2.5 leading-relaxed">
                    <span className="text-primary/60 mt-0.5">▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {(drillData?.instructions || activity.drill_instructions) && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Instructions</h3>
              </div>
              <ul className="space-y-2">
                {formatBulletPoints(drillData?.instructions || activity.drill_instructions || '').map((point, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex gap-2.5 leading-relaxed">
                    <span className="text-primary/60 mt-0.5">▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {activity.activity_notes && (
            <div className="rounded-2xl border border-border bg-secondary p-4 flex items-start gap-2.5">
              <StickyNote className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Coach Notes</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{activity.activity_notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <footer className="border-t border-border bg-card/95 backdrop-blur-md px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(i => i - 1)}
            disabled={isFirst}
            className="flex-1 max-w-[160px]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-xs text-muted-foreground font-medium">
            {currentIndex + 1} / {activities.length}
          </span>

          {isLast ? (
            <Button
              onClick={onExit}
              className="flex-1 max-w-[160px]"
            >
              End Session
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="flex-1 max-w-[160px]"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

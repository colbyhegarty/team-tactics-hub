import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, Target, Clipboard, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session } from '@/types/session';
import { getSession } from '@/lib/sessionStorage';
import { exportSessionToPDF } from '@/lib/sessionPdf';

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

function formatSessionTime(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export default function SessionView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (id) {
      const s = getSession(id);
      if (s) setSession(s);
      else navigate('/sessions');
    }
  }, [id, navigate]);

  if (!session) return null;

  const totalDuration = session.activities.reduce((sum, a) => sum + a.duration_minutes, 0);
  let runningTime = 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sessions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground line-clamp-1">
              {session.title || 'Untitled Session'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportSessionToPDF(session)}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button size="sm" onClick={() => navigate(`/sessions/${session.id}/edit`)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-6 px-4 space-y-6">
        {/* Session Info Card */}
        <div className="form-section">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {session.session_date && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-medium text-foreground">{formatDate(session.session_date)}</p>
                </div>
              </div>
            )}
            {session.session_time && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Time</p>
                  <p className="font-medium text-foreground">{formatSessionTime(session.session_time)}</p>
                </div>
              </div>
            )}
            {session.team_name && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Team</p>
                  <p className="font-medium text-foreground">{session.team_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
                <Clock className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Duration</p>
                <p className="font-medium text-foreground">{formatTime(totalDuration)}</p>
              </div>
            </div>
          </div>

          {session.session_goals && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Goals</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{session.session_goals}</p>
            </div>
          )}
        </div>

        {/* Activities Timeline */}
        <div className="form-section">
          <h2 className="form-section-title">
            <Clipboard className="h-4 w-4" />
            Activities ({session.activities.length})
          </h2>

          {session.activities.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No activities in this session.</p>
          ) : (
            <div className="space-y-0">
              {session.activities.map((activity, index) => {
                const startMin = runningTime;
                runningTime += activity.duration_minutes;
                const title = activity.title || activity.drill_name || 'Activity';

                return (
                  <div key={activity.id} className="relative">
                    {/* Timeline connector */}
                    {index < session.activities.length - 1 && (
                      <div className="absolute left-[19px] top-[44px] bottom-0 w-0.5 bg-border" />
                    )}

                    <div className="flex gap-4 pb-5">
                      {/* Time badge */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold border-2 border-primary/20">
                          {formatTime(startMin).replace(' min', 'm')}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{title}</h3>
                          <span className="badge-pill badge-muted text-xs shrink-0 ml-2">
                            {activity.duration_minutes} min
                          </span>
                        </div>

                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {activity.description}
                          </p>
                        )}

                        {/* Drill diagram */}
                        {activity.drill_svg_url && (
                          <div className="mt-3 bg-field rounded-xl overflow-hidden">
                            <img
                              src={activity.drill_svg_url}
                              alt={title}
                              className="w-full max-h-48 object-contain"
                              style={{ background: 'transparent' }}
                            />
                          </div>
                        )}

                        {activity.activity_notes && (
                          <div className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-foreground">
                            <span className="font-medium text-muted-foreground">Notes: </span>
                            {activity.activity_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Equipment */}
        {session.equipment.length > 0 && (
          <div className="form-section">
            <h2 className="form-section-title">Equipment</h2>
            <div className="flex flex-wrap gap-2">
              {session.equipment.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  {item.name}
                  {item.quantity > 0 && (
                    <span className="text-muted-foreground">({item.quantity})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, Target, Clipboard, Edit, Eye, ArrowRight, ListChecks, Share, StickyNote, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Session, SessionActivity } from '@/types/session';
import { getSession } from '@/lib/sessionStorage';
import { exportSessionToPDF } from '@/lib/sessionPdf';
import { fetchDrillById } from '@/lib/api';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { SessionMode } from '@/components/session/SessionMode';
import { Drill } from '@/types/drill';

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
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);
  const [loadingDrillId, setLoadingDrillId] = useState<string | null>(null);
  const [isSessionMode, setIsSessionMode] = useState(false);

  const [drillDetails, setDrillDetails] = useState<Record<string, Drill>>({});

  useEffect(() => {
    if (id) {
      const s = getSession(id);
      if (s) {
        setSession(s);
        s.activities.forEach(async (activity) => {
          if (activity.library_drill_id) {
            try {
              const drill = await fetchDrillById(activity.library_drill_id);
              if (drill) {
                setDrillDetails(prev => ({ ...prev, [activity.library_drill_id!]: drill }));
              }
            } catch (e) {
              console.error('Failed to fetch drill:', e);
            }
          }
        });
      } else {
        navigate('/sessions');
      }
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

  const handleViewDrill = async (activity: SessionActivity) => {
    if (!activity.library_drill_id) return;
    setLoadingDrillId(activity.id);
    try {
      const drill = await fetchDrillById(activity.library_drill_id);
      if (drill) {
        setSelectedDrill(drill);
        setIsDrillModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to fetch drill details:', e);
    } finally {
      setLoadingDrillId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between max-w-3xl mx-auto gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => navigate('/sessions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">
                {session.title || 'Untitled Session'}
              </h1>
              {session.session_date && (
                <p className="text-[11px] text-muted-foreground">{formatDate(session.session_date)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => exportSessionToPDF(session, drillDetails)}>
              <Share className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => navigate(`/sessions/${session.id}/edit`)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
        {/* Session Overview */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {session.session_date && (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-primary/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Date</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
            {session.session_time && (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-primary/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Time</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{formatSessionTime(session.session_time)}</p>
                </div>
              </div>
            )}
            {session.team_name && (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-primary/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Team</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{session.team_name}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-2 rounded-xl bg-accent/10 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent text-accent-foreground">
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Duration</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{formatTime(totalDuration)}</p>
              </div>
            </div>
          </div>

          {session.session_goals && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Goals</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed pl-6">{session.session_goals}</p>
            </div>
          )}
        </div>

        {/* Activities */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
              <Clipboard className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Activities
            </h2>
            <span className="badge-pill badge-primary text-[10px]">{session.activities.length}</span>
          </div>

          {session.activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-muted-foreground text-sm">No activities in this session.</p>
            </div>
          ) : (
            <div className="space-y-0 relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/30 via-primary/15 to-transparent" />

              {session.activities.map((activity, index) => {
                const startMin = runningTime;
                runningTime += activity.duration_minutes;
                const title = activity.title || activity.drill_name || 'Activity';
                const hasLibraryDrill = !!activity.library_drill_id;
                const drillData = activity.library_drill_id ? drillDetails[activity.library_drill_id] : null;

                return (
                  <div key={activity.id} className="relative flex gap-4 pb-4">
                    {/* Time node */}
                    <div className="flex flex-col items-center shrink-0 z-10">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary text-[10px] font-bold border-2 border-primary/30 shadow-sm">
                        {formatTime(startMin).replace(' min', 'm')}
                      </div>
                    </div>

                    {/* Activity card */}
                    <div className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-card-lg transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                        <span className="badge-pill bg-primary/10 text-primary text-[10px] font-semibold shrink-0 ml-2">
                          {activity.duration_minutes} min
                        </span>
                      </div>

                      {activity.description && !drillData && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {activity.description}
                        </p>
                      )}

                      {/* Drill diagram + instructions */}
                      {(activity.drill_svg_url || drillData) && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-4">
                          {/* Diagram */}
                          {activity.drill_svg_url && (
                            <div className="group/diagram relative shrink-0 rounded-xl overflow-hidden bg-field self-start shadow-sm">
                              <img
                                src={activity.drill_svg_url}
                                alt={title}
                                className="block w-full sm:w-52 md:w-60 object-contain"
                                style={{ background: 'transparent' }}
                              />
                              {hasLibraryDrill && (
                                <div className="absolute inset-0 bg-black/0 group-hover/diagram:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover/diagram:opacity-100">
                                  <Button
                                    size="sm"
                                    className="shadow-lg rounded-lg"
                                    onClick={() => handleViewDrill(activity)}
                                    disabled={loadingDrillId === activity.id}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {loadingDrillId === activity.id ? 'Loading...' : 'View Drill'}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Instructions */}
                          {(drillData?.instructions || activity.drill_instructions) && (
                            <div className="flex-1 min-w-0">
                              {(drillData?.setup || activity.drill_setup) && (
                                <div className="mb-3">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <ListChecks className="h-3.5 w-3.5 text-primary" />
                                    <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Setup</h4>
                                  </div>
                                  <ul className="space-y-1.5">
                                    {formatBulletPoints(drillData?.setup || activity.drill_setup || '').map((point, i) => (
                                      <li key={i} className="text-sm text-foreground/80 flex gap-2 leading-relaxed">
                                        <span className="text-primary/60 mt-0.5 text-xs">▸</span>
                                        <span>{point}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mb-2">
                                <ListChecks className="h-3.5 w-3.5 text-primary" />
                                <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Instructions</h4>
                              </div>
                              <ul className="space-y-1.5">
                                {formatBulletPoints(drillData?.instructions || activity.drill_instructions || '').map((point, i) => (
                                  <li key={i} className="text-sm text-foreground/80 flex gap-2 leading-relaxed">
                                    <span className="text-primary/60 mt-0.5 text-xs">▸</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {activity.activity_notes && (
                        <div className="mt-3 rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm text-foreground/80 flex items-start gap-2">
                          <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                          <span>{activity.activity_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Equipment */}
        {session.equipment.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
                <Clipboard className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Equipment</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {session.equipment.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-secondary-foreground border border-border/50"
                >
                  {item.name}
                  {item.quantity > 0 && (
                    <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drill Detail Modal */}
      <DrillDetailModal
        drill={selectedDrill}
        isOpen={isDrillModalOpen}
        onClose={() => {
          setIsDrillModalOpen(false);
          setSelectedDrill(null);
        }}
        isSaved={false}
        onSave={() => {}}
      />
    </div>
  );
}

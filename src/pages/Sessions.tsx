import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CalendarDays, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionCard } from '@/components/session/SessionCard';
import { Session } from '@/types/session';
import { getSessions, deleteSession, duplicateSession } from '@/lib/sessionStorage';
import { useToast } from '@/hooks/use-toast';
import { exportSessionToPDF } from '@/lib/sessionPdf';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setSessions(getSessions().sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this session?')) return;
    deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Session deleted' });
  };

  const handleDuplicate = (id: string) => {
    const dup = duplicateSession(id);
    if (dup) {
      setSessions(prev => [dup, ...prev]);
      toast({ title: 'Session duplicated' });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary md:hidden">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Sessions</h1>
              <p className="text-sm text-muted-foreground hidden md:block">Plan and manage training sessions</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/sessions/new')} className="md:hidden rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
          <Button onClick={() => navigate('/sessions/new')} className="hidden md:inline-flex">
            <Plus className="h-4 w-4 mr-1" /> New Session
          </Button>
        </div>
      </header>

      <div className="container py-6 px-4">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">No sessions yet</h3>
            <p className="text-muted-foreground mb-6">Create your first training session</p>
            <Button onClick={() => navigate('/sessions/new')}>
              <Plus className="h-4 w-4 mr-1" /> Create Session
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onView={(id) => navigate(`/sessions/${id}`)}
                  onEdit={(id) => navigate(`/sessions/${id}/edit`)}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onExportPDF={exportSessionToPDF}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={() => navigate('/sessions/new')} className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> Create New Session
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { Calendar, Clock, Users, MoreVertical, Copy, Trash2, Share, Edit } from 'lucide-react';
import { Session } from '@/types/session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SessionCardProps {
  session: Session;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExportPDF: (session: Session) => void;
}

export function SessionCard({ session, onView, onEdit, onDuplicate, onDelete, onExportPDF }: SessionCardProps) {
  const totalDuration = session.activities.reduce((sum, a) => sum + a.duration_minutes, 0);
  const activityCount = session.activities.length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-card-lg hover:-translate-y-0.5"
      onClick={() => onView(session.id)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-foreground line-clamp-1 text-lg">
            {session.title || 'Untitled Session'}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(session.id)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(session.id)}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExportPDF(session)}>
                <Share className="h-4 w-4 mr-2" /> Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(session.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {session.session_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(session.session_date)}</span>
              {session.session_time && <span>at {session.session_time}</span>}
            </div>
          )}
          {session.team_name && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{session.team_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {activityCount} {activityCount === 1 ? 'activity' : 'activities'} · {totalDuration} min
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

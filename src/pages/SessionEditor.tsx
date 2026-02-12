import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivityCard } from '@/components/session/ActivityCard';
import { AddActivityModal } from '@/components/session/AddActivityModal';
import { Session, SessionActivity, EquipmentItem } from '@/types/session';
import { getSession, saveSession, updateSession } from '@/lib/sessionStorage';
import { exportSessionToPDF } from '@/lib/sessionPdf';
import { useToast } from '@/hooks/use-toast';

const emptySession = (): Omit<Session, 'id' | 'created_at' | 'updated_at'> => ({
  title: '',
  session_date: '',
  session_time: '',
  team_name: '',
  session_goals: '',
  coach_notes: '',
  equipment: [],
  activities: [],
});

export default function SessionEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === 'new';

  const [session, setSession] = useState(emptySession());
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<SessionActivity | null>(null);
  const [saving, setSaving] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipQty, setNewEquipQty] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      const existing = getSession(id);
      if (existing) {
        setSession(existing);
        setActivities(existing.activities || []);
        setEquipment(existing.equipment || []);
        setExistingId(existing.id);
      } else {
        navigate('/sessions');
      }
    }
  }, [id, isNew, navigate]);

  const totalDuration = useMemo(
    () => activities.reduce((sum, a) => sum + a.duration_minutes, 0),
    [activities]
  );

  const calculateStartTime = (index: number) =>
    activities.slice(0, index).reduce((sum, a) => sum + a.duration_minutes, 0);

  const moveActivity = (from: number, to: number) => {
    if (to < 0 || to >= activities.length) return;
    const updated = [...activities];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setActivities(updated.map((a, i) => ({ ...a, sort_order: i })));
  };

  const handleAddActivity = (activity: SessionActivity) => {
    if (editingActivity) {
      setActivities(prev =>
        prev.map(a => (a.id === editingActivity.id ? { ...activity, sort_order: a.sort_order } : a))
      );
      setEditingActivity(null);
    } else {
      setActivities(prev => [...prev, { ...activity, sort_order: prev.length }]);
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId).map((a, i) => ({ ...a, sort_order: i })));
  };

  const addEquipment = () => {
    if (!newEquipName.trim()) return;
    setEquipment(prev => [
      ...prev,
      { name: newEquipName.trim(), quantity: parseInt(newEquipQty) || 0, checked: false },
    ]);
    setNewEquipName('');
    setNewEquipQty('');
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const sessionData = {
        ...session,
        equipment,
        activities,
      };

      if (existingId) {
        updateSession(existingId, sessionData);
      } else {
        const created = saveSession(sessionData);
        setExistingId(created.id);
      }
      toast({ title: 'Session saved!' });
      navigate('/sessions');
    } catch {
      toast({ title: 'Failed to save session', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    exportSessionToPDF({
      ...session,
      id: existingId || '',
      equipment,
      activities,
      created_at: '',
      updated_at: '',
    } as Session);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sessions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {isNew ? 'New Session' : 'Edit Session'}
          </h1>
        </div>
      </header>

      <div className="container max-w-3xl py-6 px-4 space-y-6">
        {/* Session Details */}
        <div className="form-section">
          <h2 className="form-section-title">Session Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Session Title</Label>
              <Input
                value={session.title}
                onChange={(e) => setSession({ ...session, title: e.target.value })}
                placeholder="e.g., Tuesday U12 Training"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Team / Group</Label>
              <Input
                value={session.team_name}
                onChange={(e) => setSession({ ...session, team_name: e.target.value })}
                placeholder="e.g., U12 Boys"
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={session.session_date}
                onChange={(e) => setSession({ ...session, session_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Time</Label>
              <Input
                type="time"
                value={session.session_time}
                onChange={(e) => setSession({ ...session, session_time: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Session Goals</Label>
            <Textarea
              value={session.session_goals}
              onChange={(e) => setSession({ ...session, session_goals: e.target.value })}
              placeholder="What do you want to achieve in this session?"
              rows={2}
              className="mt-1"
            />
          </div>
        </div>

        {/* Activities */}
        <div className="form-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="form-section-title mb-0">Activities</h2>
            <span className="text-sm text-muted-foreground">Total: {totalDuration} min</span>
          </div>

          {activities.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No activities yet. Add your first activity below.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  startTime={calculateStartTime(index)}
                  onMoveUp={() => moveActivity(index, index - 1)}
                  onMoveDown={() => moveActivity(index, index + 1)}
                  onEdit={() => {
                    setEditingActivity(activity);
                    setShowAddModal(true);
                  }}
                  onDelete={() => handleDeleteActivity(activity.id)}
                  isFirst={index === 0}
                  isLast={index === activities.length - 1}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setEditingActivity(null);
              setShowAddModal(true);
            }}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-border py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="inline h-4 w-4 mr-1" /> Add Activity
          </button>
        </div>

        {/* Equipment */}
        <div className="form-section">
          <h2 className="form-section-title">Equipment Checklist</h2>
          {equipment.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {equipment.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() =>
                      setEquipment(prev =>
                        prev.map((e, i) => (i === index ? { ...e, checked: !e.checked } : e))
                      )
                    }
                  />
                  <span className="text-foreground">{item.name}</span>
                  {item.quantity > 0 && (
                    <span className="text-muted-foreground">({item.quantity})</span>
                  )}
                  <button
                    onClick={() => setEquipment(prev => prev.filter((_, i) => i !== index))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newEquipName}
              onChange={(e) => setNewEquipName(e.target.value)}
              placeholder="Add equipment..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && addEquipment()}
            />
            <Input
              type="number"
              value={newEquipQty}
              onChange={(e) => setNewEquipQty(e.target.value)}
              placeholder="Qty"
              className="w-20"
            />
            <Button variant="secondary" onClick={addEquipment}>
              Add
            </Button>
          </div>
        </div>

        {/* Coach Notes */}
        <div className="form-section">
          <h2 className="form-section-title">Coach Notes</h2>
          <p className="text-xs text-muted-foreground mb-2">
            Private notes — not included in PDF export
          </p>
          <Textarea
            value={session.coach_notes}
            onChange={(e) => setSession({ ...session, coach_notes: e.target.value })}
            placeholder="Notes about players, things to remember, etc."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={handleExport}>
            📄 Export PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Session'}
          </Button>
        </div>
      </div>

      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingActivity(null);
        }}
        onAdd={handleAddActivity}
        editingActivity={editingActivity}
      />
    </div>
  );
}

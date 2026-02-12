import { useState, useEffect } from 'react';
import { X, ArrowLeft, Library, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SessionActivity } from '@/types/session';
import { generateActivityId } from '@/lib/sessionStorage';
import { supabase } from '@/lib/supabase';
import { getCustomDrills } from '@/lib/customDrillStorage';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: SessionActivity) => void;
  editingActivity?: SessionActivity | null;
}

interface DrillOption {
  id: string;
  name: string;
  category?: string;
  difficulty?: string;
  duration?: string;
  player_count?: string;
  svg_url?: string;
}

type Step = 'choose' | 'library' | 'custom' | 'quick';

export function AddActivityModal({ isOpen, onClose, onAdd, editingActivity }: AddActivityModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [libraryDrills, setLibraryDrills] = useState<DrillOption[]>([]);
  const [customDrills, setCustomDrills] = useState<DrillOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState<DrillOption | null>(null);
  const [duration, setDuration] = useState(10);
  const [activityNotes, setActivityNotes] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      if (editingActivity) {
        setDuration(editingActivity.duration_minutes);
        setActivityNotes(editingActivity.activity_notes || '');
        if (editingActivity.activity_type === 'quick_activity') {
          setStep('quick');
          setQuickTitle(editingActivity.title);
          setQuickDescription(editingActivity.description);
        } else {
          setStep('choose');
        }
      } else {
        setStep('choose');
        setSelectedDrill(null);
        setDuration(10);
        setActivityNotes('');
        setQuickTitle('');
        setQuickDescription('');
        setSearch('');
      }
    }
  }, [isOpen, editingActivity]);

  // Fetch library drills
  useEffect(() => {
    if (step === 'library' && libraryDrills.length === 0) {
      setLoading(true);
      supabase
        .from('drill_list')
        .select('id, name, category, difficulty, duration, player_count, svg_url')
        .order('name')
        .then(({ data }) => {
          setLibraryDrills(
            (data || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              category: d.category,
              difficulty: d.difficulty,
              duration: d.duration,
              player_count: d.player_count,
              svg_url: d.svg_url,
            }))
          );
          setLoading(false);
        });
    }
  }, [step, libraryDrills.length]);

  // Load custom drills
  useEffect(() => {
    if (step === 'custom') {
      const drills = getCustomDrills();
      setCustomDrills(
        drills.map(d => ({
          id: d.id,
          name: d.formData.name || 'Untitled',
          category: d.formData.category,
          difficulty: d.formData.difficulty,
          duration: d.formData.duration,
          player_count: d.formData.playerCount,
        }))
      );
    }
  }, [step]);

  if (!isOpen) return null;

  const filteredDrills = (step === 'library' ? libraryDrills : customDrills).filter(
    d => !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (step === 'quick') {
      onAdd({
        id: editingActivity?.id || generateActivityId(),
        sort_order: 0,
        activity_type: 'quick_activity',
        library_drill_id: null,
        custom_drill_id: null,
        title: quickTitle,
        description: quickDescription,
        duration_minutes: duration,
        activity_notes: activityNotes,
      });
    } else if (selectedDrill) {
      const isLibrary = step === 'library';
      onAdd({
        id: editingActivity?.id || generateActivityId(),
        sort_order: 0,
        activity_type: isLibrary ? 'library_drill' : 'custom_drill',
        library_drill_id: isLibrary ? selectedDrill.id : null,
        custom_drill_id: !isLibrary ? selectedDrill.id : null,
        title: '',
        description: '',
        duration_minutes: duration,
        activity_notes: activityNotes,
        drill_name: selectedDrill.name,
        drill_svg_url: selectedDrill.svg_url,
        drill_category: selectedDrill.category,
        drill_difficulty: selectedDrill.difficulty,
        drill_player_count: selectedDrill.player_count,
      });
    }
    onClose();
  };

  const canSubmit =
    step === 'quick' ? !!quickTitle : step !== 'choose' && !!selectedDrill;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card rounded-xl border border-border shadow-card-lg max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">
            {editingActivity ? 'Edit Activity' : step === 'choose' ? 'Add Activity' : step === 'library' ? 'Drill Library' : step === 'custom' ? 'My Drills' : 'Quick Activity'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'choose' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setStep('library')}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Library className="h-8 w-8 text-primary" />
                <span className="font-medium text-foreground">Drill Library</span>
                <span className="text-xs text-muted-foreground">Browse existing drills</span>
              </button>
              <button
                onClick={() => setStep('custom')}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Pencil className="h-8 w-8 text-primary" />
                <span className="font-medium text-foreground">My Drills</span>
                <span className="text-xs text-muted-foreground">Drills you created</span>
              </button>
              <button
                onClick={() => setStep('quick')}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <FileText className="h-8 w-8 text-primary" />
                <span className="font-medium text-foreground">Quick Activity</span>
                <span className="text-xs text-muted-foreground">Simple text description</span>
              </button>
            </div>
          )}

          {(step === 'library' || step === 'custom') && (
            <>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drills..."
                className="mb-4"
              />
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : filteredDrills.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  {step === 'custom' ? 'No custom drills yet' : 'No drills found'}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[35vh] overflow-y-auto">
                  {filteredDrills.map(drill => (
                    <button
                      key={drill.id}
                      onClick={() => {
                        setSelectedDrill(drill);
                        setDuration(parseInt(drill.duration || '') || 15);
                      }}
                      className={`rounded-lg border-2 p-3 text-left transition-colors ${
                        selectedDrill?.id === drill.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      {drill.svg_url && (
                        <div className="w-full h-16 bg-field rounded mb-2 overflow-hidden">
                          <img src={drill.svg_url} alt={drill.name} className="w-full h-full object-contain p-1" />
                        </div>
                      )}
                      <div className="font-medium text-sm text-foreground line-clamp-1">{drill.name}</div>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        {drill.duration && <span>⏱ {drill.duration}</span>}
                        {drill.difficulty && <span>{drill.difficulty}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedDrill && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                      min={1}
                      max={120}
                      className="w-32 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Notes for this activity (optional)</Label>
                    <Textarea
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      placeholder="e.g., Increase tempo after 5 mins, Focus on weak foot"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'quick' && (
            <div className="space-y-4">
              <div>
                <Label>Activity Title</Label>
                <Input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="e.g., Warm-up, Cool-down, 4v4 Game"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  placeholder="Describe the activity..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  min={1}
                  max={120}
                  className="w-32 mt-1"
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  placeholder="Private coaching notes..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-4">
          {step !== 'choose' ? (
            <Button
              variant="ghost"
              onClick={() => {
                setStep('choose');
                setSelectedDrill(null);
                setSearch('');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <div />
          )}
          <Button onClick={handleAdd} disabled={!canSubmit}>
            {editingActivity ? 'Update Activity' : 'Add Activity'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DrillEditor } from '@/components/editor/DrillEditor';
import { DrillPickerModal } from '@/components/drill/DrillPickerModal';
import { 
  saveCustomDrill, 
  updateCustomDrill, 
  getCustomDrill,
  getEmptyDiagram,
  getEmptyFormData,
} from '@/lib/customDrillStorage';
import { CustomDrillFormData, DiagramData, CustomDrill } from '@/types/customDrill';
import { fetchDrillById } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, ArrowLeft, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StartMode = 'choose' | 'scratch' | 'existing' | 'editing';

export default function CreateDrill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const editId = searchParams.get('edit');
  
  const [startMode, setStartMode] = useState<StartMode>(editId ? 'editing' : 'choose');
  const [showDrillPicker, setShowDrillPicker] = useState(false);
  const [initialDrill, setInitialDrill] = useState<CustomDrill | null>(null);
  const [basedOnDrillId, setBasedOnDrillId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(!!editId);

  // Load existing drill if editing
  useEffect(() => {
    if (editId) {
      const drill = getCustomDrill(editId);
      if (drill) {
        setInitialDrill(drill);
        setStartMode('editing');
      } else {
        toast({
          title: 'Drill not found',
          description: 'The drill you are trying to edit was not found.',
          variant: 'destructive',
        });
        navigate('/');
      }
      setIsLoading(false);
    }
  }, [editId, navigate, toast]);

  const handleSelectExistingDrill = async (drillId: string) => {
    setShowDrillPicker(false);
    setIsLoading(true);

    try {
      const drill = await fetchDrillById(drillId);
      if (drill) {
        // Convert library drill to custom drill format
        const formData: CustomDrillFormData = {
          name: `${drill.name} (Copy)`,
          description: drill.description || '',
          category: drill.category || '',
          difficulty: (drill.difficulty?.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD') || '',
          ageGroup: drill.ageGroup || '',
          playerCount: drill.playerCountDisplay || '',
          duration: drill.duration ? `${drill.duration} min` : '',
          setupText: drill.setup || '',
          instructionsText: drill.instructions || '',
          coachingPointsText: drill.coachingPoints || '',
          variationsText: drill.variations || '',
        };

        // Extract diagram data from drillJson (Supabase uses actions, markings, etc.)
        let diagramData = getEmptyDiagram();
        const dj = drill.drillJson;
        if (dj) {
          // Map actions (Supabase format: from_player/to_player/player/to_position)
          const actions: DiagramData['actions'] = [];
          const djActions = dj.actions || dj.movements || [];
          djActions.forEach((a: any, i: number) => {
            const actionType = (a.type?.toUpperCase() || '') as 'PASS' | 'RUN' | 'DRIBBLE' | 'SHOT';
            if (actionType === 'PASS') {
              const fromPlayer = a.from_player || a.player_id;
              const toPlayer = a.to_player;
              if (fromPlayer && toPlayer) {
                actions.push({
                  id: `action-${i}`,
                  type: 'PASS',
                  fromPlayerId: fromPlayer,
                  toPlayerId: toPlayer,
                });
              }
            } else if (actionType === 'RUN' || actionType === 'DRIBBLE' || actionType === 'SHOT') {
              const playerId = a.player || a.player_id;
              const toPos = a.to_position || a.to;
              if (playerId && toPos) {
                actions.push({
                  id: `action-${i}`,
                  type: actionType,
                  playerId,
                  toPosition: toPos,
                });
              }
            }
          });

          // Field: support both markings and show_markings
          const fieldMarkings = dj.field?.markings ?? dj.field?.show_markings ?? true;
          const fieldGoals = dj.field?.goals ?? ((dj.goals?.length || 0) > 0 ? Math.min(dj.goals!.length, 2) as 0 | 1 | 2 : 0);

          diagramData = {
            field: {
              type: dj.field?.type || 'FULL',
              markings: fieldMarkings,
              goals: fieldGoals as 0 | 1 | 2,
            },
            players: (dj.players || []).map((p, i) => ({
              id: p.id || `P${i + 1}`,
              role: (p.role?.toUpperCase() as any) || 'NEUTRAL',
              position: p.position,
            })),
            cones: (dj.cones || []).map((c, i) => ({
              id: `cone-${i}`,
              position: c.position,
            })),
            balls: (dj.balls || []).map((b, i) => ({
              id: `ball-${i}`,
              position: b.position,
            })),
            goals: (dj.goals || []).map((g, i) => ({
              id: `goal-${i}`,
              position: g.position,
              rotation: g.rotation || 0,
              size: g.size === 'small' ? 'mini' : 'full',
            })),
            coneLines: (dj.cone_lines || []).map((l, i) => ({
              id: `line-${i}`,
              fromConeId: `cone-${l.from_cone}`,
              toConeId: `cone-${l.to_cone}`,
            })),
            actions,
          };
        }

        setInitialDrill({
          id: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          basedOnDrillId: drillId,
          formData,
          diagramData,
        });
        setBasedOnDrillId(drillId);
        setStartMode('scratch'); // Will use the editor with preloaded data
      }
    } catch (error) {
      toast({
        title: 'Error loading drill',
        description: 'Could not load the selected drill.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (formData: CustomDrillFormData, diagramData: DiagramData) => {
    if (editId && initialDrill?.id) {
      // Update existing
      updateCustomDrill(initialDrill.id, formData, diagramData);
      toast({
        title: 'Drill Updated',
        description: 'Your custom drill has been updated.',
      });
    } else {
      // Create new
      saveCustomDrill(formData, diagramData, basedOnDrillId);
      toast({
        title: 'Drill Saved',
        description: 'Your custom drill has been saved to your profile.',
      });
    }
    navigate('/profile');
  };

  const handleCancel = () => {
    if (editId) {
      navigate('/profile');
    } else {
      setStartMode('choose');
      setInitialDrill(null);
      setBasedOnDrillId(undefined);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading drill...</p>
        </div>
      </div>
    );
  }

  // Choose mode screen
  if (startMode === 'choose') {
    return (
      <div className="min-h-screen">
        <header className="border-b border-border bg-background">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary md:hidden">
                <PenTool className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">Create Drill</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Build your own training drill with our visual editor
              </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4 pt-6 md:pt-0">
          <div className="text-center max-w-lg">
            <h2 className="text-xl font-semibold text-foreground mb-2">How would you like to start?</h2>
            <p className="text-muted-foreground">
              Create a new drill from scratch or start with an existing drill from our library.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
            <button
              onClick={() => setStartMode('scratch')}
              className="group p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Start from Scratch</h3>
              <p className="text-sm text-muted-foreground">
                Create a new drill with a blank canvas
              </p>
            </button>

            <button
              onClick={() => setShowDrillPicker(true)}
              className="group p-6 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <Copy className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Start from Existing</h3>
              <p className="text-sm text-muted-foreground">
                Modify a drill from the library
              </p>
            </button>
          </div>
        </div>

        {/* Drill Picker Modal */}
        <DrillPickerModal
          isOpen={showDrillPicker}
          onClose={() => setShowDrillPicker(false)}
          onSelect={handleSelectExistingDrill}
        />
      </div>
    );
  }

  // Editor screen
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {editId ? 'Edit Drill' : 'Create Drill'}
              </h1>
              <p className="mt-1 text-muted-foreground hidden md:block">
                {basedOnDrillId ? 'Based on library drill' : 'Design your training drill'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-7xl py-6 px-4">
        <DrillEditor
          initialDrill={initialDrill}
          basedOnDrillId={basedOnDrillId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

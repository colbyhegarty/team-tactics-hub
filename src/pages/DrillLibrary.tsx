import { useState, useEffect, useCallback } from 'react';
import { Loader2, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { DrillFilters } from '@/components/drill/DrillFilters';
import { 
  fetchLibraryDrills, 
  fetchLibraryDrill, 
  fetchLibraryCategories,
  fetchFilteredDrills,
  mapLibraryDrillToDrill,
  LibraryDrillMeta,
  DrillFilterParams,
} from '@/lib/api';
import { saveDrill, removeDrill, isDrillSaved } from '@/lib/storage';
import { Drill } from '@/types/drill';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function DrillLibrary() {
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<DrillFilterParams>({});
  const [drillsMeta, setDrillsMeta] = useState<LibraryDrillMeta[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const categoriesRes = await fetchLibraryCategories();
        if (categoriesRes.success) {
          setCategories(categoriesRes.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch drills when filters change
  useEffect(() => {
    async function loadDrills() {
      setIsLoading(true);
      setError(null);
      
      try {
        const hasFilters = Object.keys(filters).length > 0;
        const drillsRes = hasFilters 
          ? await fetchFilteredDrills(filters)
          : await fetchLibraryDrills();
        
        if (drillsRes.success) {
          setDrillsMeta(drillsRes.drills);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load drills');
        toast({
          title: 'Error',
          description: 'Failed to load drill library. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDrills();
  }, [filters, toast]);

  // Convert meta to Drill for display
  const drillsForDisplay: Drill[] = drillsMeta.map(meta => mapLibraryDrillToDrill(meta));

  const handleViewDrill = async (drill: Drill) => {
    setIsLoadingDrill(true);
    
    try {
      const response = await fetchLibraryDrill(drill.id);
      
      if (response.success) {
        const fullDrill = mapLibraryDrillToDrill(
          { 
            id: response.drill.id, 
            name: response.drill.name, 
            category: response.drill.category,
            player_count: response.drill.player_count,
            duration: response.drill.duration,
            age_group: response.drill.age_group,
            difficulty: response.drill.difficulty,
            description: response.drill.description,
          },
          response.drill,
          response.svg
        );
        setSelectedDrill(fullDrill);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load drill details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDrill(false);
    }
  };

  const handleSaveDrill = (drill: Drill) => {
    const currentlySaved = savedState[drill.id] ?? isDrillSaved(drill.id);
    
    if (currentlySaved) {
      removeDrill(drill.id);
      setSavedState(prev => ({ ...prev, [drill.id]: false }));
      toast({
        title: 'Drill Removed',
        description: 'Removed from your saved drills.',
      });
    } else {
      saveDrill(drill);
      setSavedState(prev => ({ ...prev, [drill.id]: true }));
      toast({
        title: 'Drill Saved',
        description: 'Added to your saved drills.',
      });
    }
  };

  const handleUseAsTemplate = (drill: Drill) => {
    setSelectedDrill(null);
    navigate('/', { 
      state: { 
        templateDrill: {
          category: drill.category,
          playerCount: drill.playerCount,
          duration: drill.duration,
          ageGroup: drill.ageGroup,
        }
      }
    });
  };

  const isDrillCurrentlySaved = (drillId: string) => {
    return savedState[drillId] ?? isDrillSaved(drillId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary md:hidden">
              <Library className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">Drill Library</h1>
              <p className="text-sm text-muted-foreground">
                Browse and discover training drills
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <DrillFilters
            categories={categories}
            filters={filters}
            onFilterChange={setFilters}
            resultCount={drillsForDisplay.length}
            isLoading={isLoading}
          />
        </div>
      </header>

      {/* Content */}
      <div className="container py-6 px-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading drills...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : drillsForDisplay.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Library className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No drills found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or search criteria.</p>
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drillsForDisplay.map(drill => (
              <DrillCard
                key={drill.id}
                drill={drill}
                isSaved={isDrillCurrentlySaved(drill.id)}
                onView={handleViewDrill}
                onSave={handleSaveDrill}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading overlay for drill details */}
      {isLoadingDrill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading drill details...</p>
          </div>
        </div>
      )}

      {/* Drill Detail Modal */}
      <DrillDetailModal
        drill={selectedDrill}
        isOpen={selectedDrill !== null}
        onClose={() => setSelectedDrill(null)}
        isSaved={selectedDrill ? isDrillCurrentlySaved(selectedDrill.id) : false}
        onSave={handleSaveDrill}
        onUseAsTemplate={handleUseAsTemplate}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { 
  fetchLibraryDrills, 
  fetchLibraryDrill, 
  fetchLibraryCategories,
  mapLibraryDrillToDrill,
  LibraryDrillMeta 
} from '@/lib/api';
import { saveDrill, removeDrill, isDrillSaved } from '@/lib/storage';
import { Drill } from '@/types/drill';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function DrillLibrary() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [drillsMeta, setDrillsMeta] = useState<LibraryDrillMeta[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch drills and categories on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const [drillsRes, categoriesRes] = await Promise.all([
          fetchLibraryDrills(),
          fetchLibraryCategories()
        ]);
        
        if (drillsRes.success) {
          setDrillsMeta(drillsRes.drills);
        }
        
        if (categoriesRes.success) {
          setCategories(categoriesRes.categories);
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
    
    loadData();
  }, [toast]);

  // Convert meta to partial Drill for display
  const drillsForDisplay: Drill[] = drillsMeta.map(meta => mapLibraryDrillToDrill(meta));

  const filteredDrills = drillsForDisplay.filter(drill => {
    const matchesCategory = selectedCategory === 'All' || drill.category === selectedCategory;
    const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            duration: response.drill.duration
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
          drillType: drill.category,
          description: drill.description,
          totalPlayers: drill.playerCount,
          duration: drill.duration,
          intensity: drill.intensity,
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Drill Library</h1>
          <p className="mt-1 text-muted-foreground">
            Browse drills organized by category
          </p>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={selectedCategory === 'All' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory('All')}
              className="shrink-0"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
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
        ) : filteredDrills.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No drills found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDrills.map(drill => (
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

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Library, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrillCard } from '@/components/drill/DrillCard';
import { DrillDetailModal } from '@/components/drill/DrillDetailModal';
import { DrillFilters } from '@/components/drill/DrillFilters';
import { QuickPreviewModal } from '@/components/drill/QuickPreviewModal';
import { 
  fetchLibraryDrills, 
  fetchLibraryDrill, 
  fetchFilterOptions,
  fetchFilteredDrills,
  filterByPlayerCount,
  filterByDuration,
  mapLibraryDrillToDrill,
  LibraryDrillMeta,
  DrillFilterParams,
} from '@/lib/api';
import { saveDrill, removeDrill, isDrillSaved } from '@/lib/storage';
import { Drill } from '@/types/drill';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const DRILLS_PER_PAGE = 12;

export default function DrillLibrary() {
  const [categories, setCategories] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const durations = ["10 min.", "15 min.", "20 min.", "30 min."];
  const [filters, setFilters] = useState<DrillFilterParams>({});
  const [drillsMeta, setDrillsMeta] = useState<LibraryDrillMeta[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [quickPreviewDrill, setQuickPreviewDrill] = useState<Drill | null>(null);
  const [savedState, setSavedState] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDrill, setIsLoadingDrill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch filter options (categories, age groups, durations) on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const optionsRes = await fetchFilterOptions();
        if (optionsRes.success) {
          setCategories(optionsRes.categories);
          setAgeGroups(optionsRes.ageGroups);
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);

  // Fetch drills when filters change
  useEffect(() => {
    async function loadDrills() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Only use server-side filters for exact match fields
        const serverFilters: DrillFilterParams = {};
        if (filters.category) serverFilters.category = filters.category;
        if (filters.age_group) serverFilters.age_group = filters.age_group;
        if (filters.difficulty) serverFilters.difficulty = filters.difficulty;
        if (filters.search) serverFilters.search = filters.search;
        if (filters.has_animation !== undefined) serverFilters.has_animation = filters.has_animation;
        
        const hasServerFilters = Object.keys(serverFilters).length > 0;
        const drillsRes = hasServerFilters 
          ? await fetchFilteredDrills(serverFilters)
          : await fetchLibraryDrills();
        
        if (drillsRes.success) {
          // Apply client-side filters for player count and duration
          let filteredDrills = drillsRes.drills;
          
          // Filter by player count (client-side)
          filteredDrills = filterByPlayerCount(filteredDrills, filters.min_players, filters.max_players);
          
          // Filter by duration (client-side)
          filteredDrills = filterByDuration(filteredDrills, filters.duration);
          
          setDrillsMeta(filteredDrills);
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(drillsForDisplay.length / DRILLS_PER_PAGE));
  const paginatedDrills = useMemo(() => {
    const start = (currentPage - 1) * DRILLS_PER_PAGE;
    return drillsForDisplay.slice(start, start + DRILLS_PER_PAGE);
  }, [drillsForDisplay, currentPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filters]);

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
          response.svg_url
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
    setQuickPreviewDrill(null);
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

  const handleQuickPreview = (drill: Drill) => {
    setQuickPreviewDrill(drill);
  };

  const handleViewFullFromPreview = async (drill: Drill) => {
    setQuickPreviewDrill(null);
    await handleViewDrill(drill);
  };

  const isDrillCurrentlySaved = (drillId: string) => {
    return savedState[drillId] ?? isDrillSaved(drillId);
  };

  return (
    <div className="min-h-screen">
      {/* Header - not sticky on mobile so filters scroll away */}
      <header className="border-b border-border bg-background md:sticky md:top-0 md:z-40 md:bg-background/95 md:backdrop-blur-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary md:hidden">
              <Library className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">Drill Library</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Browse and discover training drills
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <DrillFilters
            categories={categories}
            ageGroups={ageGroups}
            durations={durations}
            filters={filters}
            onFilterChange={setFilters}
            resultCount={drillsForDisplay.length}
            isLoading={isLoading}
            showAdvanced={true}
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
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedDrills.map(drill => (
                <DrillCard
                  key={drill.id}
                  drill={drill}
                  isSaved={isDrillCurrentlySaved(drill.id)}
                  onView={handleViewDrill}
                  onSave={handleSaveDrill}
                  onQuickView={handleQuickPreview}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <span key={page} className="contents">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-1 text-muted-foreground">…</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-9"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </span>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
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

      {/* Quick Preview Modal */}
      <QuickPreviewModal
        drill={quickPreviewDrill}
        isOpen={quickPreviewDrill !== null}
        onClose={() => setQuickPreviewDrill(null)}
        onViewFull={handleViewFullFromPreview}
        isSaved={quickPreviewDrill ? isDrillCurrentlySaved(quickPreviewDrill.id) : false}
        onSave={handleSaveDrill}
      />

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

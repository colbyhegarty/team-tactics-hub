import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DrillFilterParams } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

// Difficulty values - uppercase to match database
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

// Grouped age categories for filtering
const AGE_GROUP_CATEGORIES = ['U6-U8', 'U10-U12', 'U14-U16', 'U17+'];

// Format difficulty for display (capitalize first letter)
function formatDifficulty(difficulty: string): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

interface DrillFiltersProps {
  categories: string[];
  ageGroups: string[];
  durations: string[];
  filters: DrillFilterParams;
  onFilterChange: (filters: DrillFilterParams) => void;
  resultCount?: number;
  isLoading?: boolean;
  showAdvanced?: boolean;
  rightSlot?: React.ReactNode;
}

export function DrillFilters({
  categories,
  ageGroups,
  durations,
  filters,
  onFilterChange,
  resultCount,
  isLoading,
  showAdvanced = true,
  rightSlot,
}: DrillFiltersProps) {
  const updateFilter = (key: keyof DrillFilterParams, value: string | number | boolean | undefined) => {
    const newFilters = { ...filters };
    if (value === '' || value === 'All' || value === 'all' || value === undefined) {
      delete newFilters[key];
    } else {
      (newFilters as Record<string, unknown>)[key] = value;
    }
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = Object.keys(filters).filter(k => k !== 'search').length;

  const filterControls = (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Row 1: Category, Age, Duration */}
      <Select
        value={filters.category || 'All'}
        onValueChange={(value) => updateFilter('category', value)}
      >
        <SelectTrigger className="w-[130px] md:w-[150px] h-9 text-xs md:text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showAdvanced && (
        <>
          <Select
            value={filters.age_group || 'All'}
            onValueChange={(value) => updateFilter('age_group', value)}
          >
            <SelectTrigger className="w-[105px] md:w-[120px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Ages</SelectItem>
              {AGE_GROUP_CATEGORIES.map((age) => (
                <SelectItem key={age} value={age}>
                  {age}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.duration || 'Any Duration'}
            onValueChange={(value) => updateFilter('duration', value !== 'Any Duration' ? value : undefined)}
          >
            <SelectTrigger className="w-[130px] md:w-[140px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any Duration">Any Duration</SelectItem>
              {durations.map((dur) => (
                <SelectItem key={dur} value={dur}>
                  {dur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Row 2: Difficulty, Players */}
          <Select
            value={filters.difficulty || 'All'}
            onValueChange={(value) => updateFilter('difficulty', value)}
          >
            <SelectTrigger className="w-[130px] md:w-[140px] h-9 text-xs md:text-sm">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Any Difficulty</SelectItem>
              {DIFFICULTIES.map((diff) => (
                <SelectItem key={diff} value={diff}>
                  {formatDifficulty(diff)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              placeholder="Min"
              value={filters.min_players || ''}
              onChange={(e) => updateFilter('min_players', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-16 h-9 text-xs md:text-sm"
              min={1}
            />
            <span className="text-muted-foreground text-xs">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.max_players || ''}
              onChange={(e) => updateFilter('max_players', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-16 h-9 text-xs md:text-sm"
              min={1}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">players</span>
          </div>

        </>
      )}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 text-xs">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search drills..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          className="pl-10"
        />
      </div>

      {/* Mobile: collapsible filters */}
      {isMobile ? (
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between gap-2 h-9 text-xs [&[data-state=open]>svg]:rotate-180">
              <span className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {filterControls}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        filterControls
      )}

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            <span>
              {isLoading ? 'Searching...' : `${resultCount} drills found`}
            </span>
          </div>
          {rightSlot}
        </div>
      )}
    </div>
  );
}

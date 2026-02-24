import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DrillFilterParams } from '@/lib/api';

// Difficulty values - uppercase to match database
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search drills by name or description..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          className="pl-10"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 md:gap-3 items-center">
        {/* Category - dynamic from database */}
        <Select
          value={filters.category || 'All'}
          onValueChange={(value) => updateFilter('category', value)}
        >
          <SelectTrigger className="w-[130px] md:w-[160px] h-9 text-xs md:text-sm">
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
            {/* Age Group - dynamic from database */}
            <Select
              value={filters.age_group || 'All'}
              onValueChange={(value) => updateFilter('age_group', value)}
            >
              <SelectTrigger className="w-[110px] md:w-[130px] h-9 text-xs md:text-sm">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Ages</SelectItem>
                {ageGroups.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty - uppercase values to match database */}
            <Select
              value={filters.difficulty || 'All'}
              onValueChange={(value) => updateFilter('difficulty', value)}
            >
              <SelectTrigger className="w-[110px] md:w-[130px] h-9 text-xs md:text-sm">
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

            {/* Player Count - min/max inputs */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.min_players || ''}
                onChange={(e) => updateFilter('min_players', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20 h-9 text-xs md:text-sm"
                min={1}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.max_players || ''}
                onChange={(e) => updateFilter('max_players', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20 h-9 text-xs md:text-sm"
                min={1}
              />
              <span className="text-sm text-muted-foreground">players</span>
            </div>

            {/* Duration - fixed options */}
            <Select
              value={filters.duration || 'Any Duration'}
              onValueChange={(value) => updateFilter('duration', value !== 'Any Duration' ? value : undefined)}
            >
              <SelectTrigger className="w-[120px] md:w-[140px] h-9 text-xs md:text-sm">
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

            {/* Animation Filter */}
            <Select
              value={filters.has_animation === undefined ? 'all' : filters.has_animation.toString()}
              onValueChange={(value) => {
                if (value === 'all') {
                  updateFilter('has_animation', undefined);
                } else {
                  updateFilter('has_animation', value === 'true');
                }
              }}
            >
              <SelectTrigger className="w-[120px] md:w-[140px] h-9 text-xs md:text-sm">
                <SelectValue placeholder="Animation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drills</SelectItem>
                <SelectItem value="true">Animated Only</SelectItem>
                <SelectItem value="false">Static Only</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 text-xs md:text-sm">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Results Count */}
      {resultCount !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            {isLoading ? 'Searching...' : `${resultCount} drills found`}
          </span>
        </div>
      )}
    </div>
  );
}

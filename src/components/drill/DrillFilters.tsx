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
import { DrillFilterParams, CategoryItem } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DrillFiltersProps {
  categories: CategoryItem[];
  filters: DrillFilterParams;
  onFilterChange: (filters: DrillFilterParams) => void;
  resultCount?: number;
  isLoading?: boolean;
  showAdvanced?: boolean;
}

const AGE_GROUPS = ['All', 'U8', 'U10', 'U12', 'U14', 'U16+'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const DURATIONS = [
  { value: 'any', label: 'Any Duration' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
];

export function DrillFilters({
  categories,
  filters,
  onFilterChange,
  resultCount,
  isLoading,
  showAdvanced = true,
}: DrillFiltersProps) {
  const updateFilter = (key: keyof DrillFilterParams, value: string | number | undefined) => {
    const newFilters = { ...filters };
    if (value === '' || value === 'All' || value === undefined) {
      delete newFilters[key];
    } else {
      (newFilters as any)[key] = value;
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
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category */}
        <Select
          value={filters.category || 'All'}
          onValueChange={(value) => updateFilter('category', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories
              .filter((cat) => cat.name && cat.name.trim() !== '')
              .map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {showAdvanced && (
          <>
            {/* Age Group */}
            <Select
              value={filters.age_group || 'All'}
              onValueChange={(value) => updateFilter('age_group', value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age === 'All' ? 'All Ages' : age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty */}
            <Select
              value={filters.difficulty || 'All'}
              onValueChange={(value) => updateFilter('difficulty', value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((diff) => (
                  <SelectItem key={diff} value={diff}>
                    {diff === 'All' ? 'Any Difficulty' : diff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Player Count */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.min_players || ''}
                onChange={(e) => updateFilter('min_players', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20"
                min={1}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.max_players || ''}
                onChange={(e) => updateFilter('max_players', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20"
                min={1}
              />
              <span className="text-sm text-muted-foreground">players</span>
            </div>

            {/* Duration */}
            <Select
              value={filters.duration?.toString() || 'any'}
              onValueChange={(value) => updateFilter('duration', value !== 'any' ? parseInt(value) : undefined)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((dur) => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
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

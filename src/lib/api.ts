import { DrillFormData, GenerateDrillResponse, SkillLevel, FieldSize, Drill, DrillCategory, IntensityLevel, AgeGroup } from '@/types/drill';

const API_URL = import.meta.env.VITE_API_URL || 'https://soccer-drill-api.onrender.com';

// Library API response types
export interface LibraryDrillMeta {
  id: string;
  name: string;
  category: string;
  player_count: string;
  duration: string;
  age_group?: string;
  difficulty?: string;
  description?: string;
  svg?: string;
}

export interface LibraryListResponse {
  success: boolean;
  count: number;
  drills: LibraryDrillMeta[];
}

export interface LibraryDrillDetail {
  id: string;
  name: string;
  category: string;
  player_count: string;
  duration: string;
  age_group?: string;
  difficulty?: string;
  description?: string;
  // API returns these with _text suffix
  setup_text?: string;
  instructions_text?: string;
  variations_text?: string;
  coaching_points_text?: string;
  source?: string;
}

export interface LibraryDrillResponse {
  success: boolean;
  drill: LibraryDrillDetail;
  svg: string;
}

export interface LibraryCategoriesResponse {
  success: boolean;
  categories: string[];
}

// Filter parameters for drill search
export interface DrillFilterParams {
  category?: string;
  age_group?: string;
  min_players?: number;
  max_players?: number;
  difficulty?: string;
  duration?: number;
  search?: string;
}

// Fetch all drills from library (metadata only)
export async function fetchLibraryDrills(): Promise<LibraryListResponse> {
  const response = await fetch(`${API_URL}/api/library`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch drills: ${errorText}`);
  }
  
  return response.json();
}

// Fetch single drill with full details and SVG
export async function fetchLibraryDrill(id: string): Promise<LibraryDrillResponse> {
  const response = await fetch(`${API_URL}/api/library/${id}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch drill: ${errorText}`);
  }
  
  return response.json();
}

// Fetch available categories - extracts from drill library since /categories/list endpoint doesn't exist
export async function fetchLibraryCategories(): Promise<LibraryCategoriesResponse> {
  try {
    // Try the categories endpoint first
    const response = await fetch(`${API_URL}/api/library/categories`);
    
    if (response.ok) {
      return response.json();
    }
  } catch (e) {
    // Fall through to fallback
  }
  
  // Fallback: extract categories from the drill library
  try {
    const libraryResponse = await fetchLibraryDrills();
    if (libraryResponse.success && libraryResponse.drills) {
      const categorySet = new Set<string>();
      libraryResponse.drills.forEach(drill => {
        if (drill.category && drill.category.trim()) {
          categorySet.add(drill.category);
        }
      });
      const categories = Array.from(categorySet).sort();
      return { success: true, categories };
    }
  } catch (e) {
    console.error('Failed to extract categories from library:', e);
  }
  
  // Return empty categories if all else fails
  return { success: true, categories: [] };
}

// Fetch filtered drills
export async function fetchFilteredDrills(filters: DrillFilterParams): Promise<LibraryListResponse> {
  const params = new URLSearchParams();
  
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category);
  }
  if (filters.age_group && filters.age_group !== 'All') {
    params.append('age_group', filters.age_group);
  }
  if (filters.min_players !== undefined) {
    params.append('min_players', filters.min_players.toString());
  }
  if (filters.max_players !== undefined) {
    params.append('max_players', filters.max_players.toString());
  }
  if (filters.difficulty && filters.difficulty !== 'All') {
    params.append('difficulty', filters.difficulty);
  }
  if (filters.duration) {
    params.append('duration', filters.duration.toString());
  }
  if (filters.search) {
    params.append('search', filters.search);
  }

  const queryString = params.toString();
  const url = queryString 
    ? `${API_URL}/api/library/filter?${queryString}`
    : `${API_URL}/api/library`;
    
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch filtered drills: ${errorText}`);
  }
  
  return response.json();
}

// Map difficulty to color
export function getDifficultyColor(difficulty?: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'medium':
      return 'bg-amber-500/10 text-amber-600';
    case 'hard':
      return 'bg-red-500/10 text-red-600';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// Map category to color
export function getCategoryColor(category?: string): string {
  switch (category?.toLowerCase()) {
    case 'possession':
      return 'bg-emerald-500/10 text-emerald-600';
    case 'finishing':
      return 'bg-red-500/10 text-red-600';
    case 'passing':
      return 'bg-blue-500/10 text-blue-600';
    case 'dribbling':
      return 'bg-purple-500/10 text-purple-600';
    case 'defending':
      return 'bg-orange-500/10 text-orange-600';
    case 'pressing & transitions':
      return 'bg-cyan-500/10 text-cyan-600';
    case 'conditioning':
      return 'bg-pink-500/10 text-pink-600';
    default:
      return 'bg-primary/10 text-primary';
  }
}

// Helper to convert API drill to app Drill type
export function mapLibraryDrillToDrill(
  meta: LibraryDrillMeta,
  detail?: LibraryDrillDetail,
  svg?: string
): Drill {
  // Handle player count - preserve original string for display
  const playerCountStr = meta.player_count || '10';
  const playerCount = parseInt(playerCountStr.replace(/[^\d]/g, '')) || 10;
  const duration = parseInt(meta.duration) || 15;
  
  // Map difficulty
  const difficulty = detail?.difficulty || meta.difficulty;
  let intensity: IntensityLevel = 'Medium';
  if (difficulty?.toLowerCase() === 'hard') intensity = 'High';
  if (difficulty?.toLowerCase() === 'easy') intensity = 'Low';
  
  let fullDescription = '';
  if (detail) {
    if (detail.setup_text) fullDescription += `## Setup\n${detail.setup_text}\n\n`;
    if (detail.instructions_text) fullDescription += `## Instructions\n${detail.instructions_text}\n\n`;
    if (detail.coaching_points_text) fullDescription += `## Coaching Points\n${detail.coaching_points_text}\n\n`;
    if (detail.variations_text) fullDescription += `## Progressions\n${detail.variations_text}\n\n`;
  }
  
  // Use description from detail if available, fall back to meta description
  const description = detail?.description || meta.description || `${meta.category} drill for ${playerCount} players`;
  
  return {
    id: meta.id,
    name: meta.name,
    category: (meta.category || 'Other') as DrillCategory,
    description,
    playerCount,
    playerCountDisplay: playerCountStr,
    duration,
    intensity,
    ageGroup: (detail?.age_group || meta.age_group) as AgeGroup | undefined,
    difficulty: difficulty,
    svg: svg || meta.svg,
    fullDescription: fullDescription || undefined,
    source: detail?.source,
    // Structured fields from library API (mapped from _text fields)
    setup: detail?.setup_text,
    instructions: detail?.instructions_text,
    coachingPoints: detail?.coaching_points_text,
    variations: detail?.variations_text,
  };
}

function buildPrompt(formData: DrillFormData): string {
  let prompt = `Create a ${formData.drillType} drill`;
  
  if (formData.description) {
    prompt += ` focused on: ${formData.description}`;
  }
  
  prompt += `. Players: ${formData.totalPlayers}`;
  
  if (formData.goalkeepers && formData.goalkeepers > 0) {
    prompt += ` (including ${formData.goalkeepers} goalkeeper(s))`;
  }
  
  if (formData.hasGoals && formData.goalCount > 0) {
    prompt += `. Use ${formData.goalCount} goal(s)`;
  }
  
  if (formData.hasMannequins) {
    prompt += `. Include mannequins/dummies`;
  }
  
  if (formData.ageGroup && formData.ageGroup !== 'Not Specified') {
    prompt += `. Age group: ${formData.ageGroup}`;
  }
  
  if (formData.intensity && formData.intensity !== 'Not Specified') {
    prompt += `. Intensity: ${formData.intensity}`;
  }
  
  if (formData.duration) {
    prompt += `. Duration: approximately ${formData.duration} minutes`;
  }
  
  if (formData.fieldSize && formData.fieldSize !== 'Any/Flexible') {
    prompt += `. Field size: ${formData.fieldSize}`;
  }
  
  if (formData.additionalNotes) {
    prompt += `. Additional notes: ${formData.additionalNotes}`;
  }
  
  return prompt;
}

function mapFieldType(fieldSize: FieldSize): 'FULL' | 'HALF' {
  return fieldSize === 'Full Field' ? 'FULL' : 'HALF';
}

function mapSkillLevel(skill: SkillLevel): 'beginner' | 'intermediate' | 'advanced' | null {
  switch (skill) {
    case 'Beginner':
      return 'beginner';
    case 'Intermediate':
      return 'intermediate';
    case 'Advanced':
    case 'Elite':
      return 'advanced';
    default:
      return null;
  }
}

export async function generateDrill(formData: DrillFormData): Promise<GenerateDrillResponse> {
  const prompt = buildPrompt(formData);
  const includeGoalkeeper = (formData.goalkeepers || 0) > 0;
  
  const requestBody = {
    prompt,
    num_players: formData.totalPlayers,
    include_goalkeeper: includeGoalkeeper,
    field_type: mapFieldType(formData.fieldSize),
    skill_level: mapSkillLevel(formData.skillLevel),
  };

  const response = await fetch(`${API_URL}/api/generate-drill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate drill: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate drill');
  }

  return data;
}

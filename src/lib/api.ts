import { supabase } from './supabase';
import { Drill, DrillCategory, IntensityLevel, AgeGroup, DrillFormData, GenerateDrillResponse, SkillLevel, FieldSize, DrillJsonData } from '@/types/drill';

const API_URL = import.meta.env.VITE_API_URL || 'https://soccer-drill-api.onrender.com';

// Supabase response types
export interface DrillListRow {
  id: string;
  name: string;
  category: string;
  player_count: string;
  duration: string;
  age_group?: string;
  difficulty?: string;
  description?: string;
  svg_url?: string;
  has_animation?: boolean;
}

export interface DrillDetailRow {
  id: string;
  name: string;
  category: string;
  player_count: string;
  duration: string;
  age_group?: string;
  difficulty?: string;
  description?: string;
  svg_url?: string;
  setup_text?: string;
  instructions_text?: string;
  variations_text?: string;
  coaching_points_text?: string;
  source?: string;
  has_animation?: boolean;
  animation_html_url?: string;
  diagram_json?: DrillJsonData;
  animation_json?: { duration: number; keyframes: any[] };
}

// Legacy types for backward compatibility
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
  svg_url?: string;
  has_animation?: boolean;
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
  setup_text?: string;
  instructions_text?: string;
  variations_text?: string;
  coaching_points_text?: string;
  source?: string;
  has_animation?: boolean;
  animation_html_url?: string;
  diagram_json?: DrillJsonData;
  animation_json?: { duration: number; keyframes: any[] };
}

export interface LibraryDrillResponse {
  success: boolean;
  drill: LibraryDrillDetail;
  svg_url?: string;
}

export interface LibraryCategoriesResponse {
  success: boolean;
  categories: string[];
}

// Response type for filter options
export interface FilterOptionsResponse {
  success: boolean;
  categories: string[];
  ageGroups: string[];
  durations: string[];
}

// Filter parameters for drill search
export interface DrillFilterParams {
  category?: string;
  age_group?: string;
  min_players?: number;
  max_players?: number;
  difficulty?: string;
  duration?: string; // Changed to string to match actual data format like "10 mins."
  search?: string;
  has_animation?: boolean;
}

// Fetch all drills from library using Supabase
export async function fetchLibraryDrills(): Promise<LibraryListResponse> {
  const { data, error } = await supabase
    .from('drill_list')
    .select('*');
  
  if (error) {
    throw new Error(`Failed to fetch drills: ${error.message}`);
  }
  
  const drills: LibraryDrillMeta[] = (data || []).map((row: DrillListRow) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    player_count: row.player_count,
    duration: row.duration,
    age_group: row.age_group,
    difficulty: row.difficulty,
    description: row.description,
    svg_url: row.svg_url,
    has_animation: row.has_animation,
  }));
  
  return {
    success: true,
    count: drills.length,
    drills,
  };
}

// Fetch single drill with full details using Supabase
export async function fetchLibraryDrill(id: string): Promise<LibraryDrillResponse> {
  const { data, error } = await supabase
    .from('drill_detail')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    throw new Error(`Failed to fetch drill: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Drill not found');
  }
  
  const detail: LibraryDrillDetail = {
    id: data.id,
    name: data.name,
    category: data.category,
    player_count: data.player_count,
    duration: data.duration,
    age_group: data.age_group,
    difficulty: data.difficulty,
    description: data.description,
    setup_text: data.setup_text,
    instructions_text: data.instructions_text,
    variations_text: data.variations_text,
    coaching_points_text: data.coaching_points_text,
    source: data.source,
    has_animation: data.has_animation,
    animation_html_url: data.animation_html_url,
    diagram_json: data.diagram_json,
    animation_json: data.animation_json,
  };
  
  return {
    success: true,
    drill: detail,
    svg_url: data.svg_url,
  };
}

// Fetch available categories from Supabase
export async function fetchLibraryCategories(): Promise<LibraryCategoriesResponse> {
  try {
    const { data, error } = await supabase
      .from('drill_list')
      .select('category');
    
    if (error) {
      console.error('Failed to fetch categories:', error);
      return { success: true, categories: [] };
    }
    
    // Extract unique categories
    const uniqueCategories = [...new Set((data || []).map((row: { category: string }) => row.category))].filter(Boolean).sort();
    
    return { success: true, categories: uniqueCategories };
  } catch (e) {
    console.error('Failed to fetch categories:', e);
    return { success: true, categories: [] };
  }
}

// Fetch all filter options (categories, age groups, durations) in one call
export async function fetchFilterOptions(): Promise<FilterOptionsResponse> {
  try {
    const { data, error } = await supabase
      .from('drill_list')
      .select('category, age_group, duration');
    
    if (error) {
      console.error('Failed to fetch filter options:', error);
      return { success: true, categories: [], ageGroups: [], durations: [] };
    }
    
    if (!data) {
      return { success: true, categories: [], ageGroups: [], durations: [] };
    }
    
    // Extract unique individual categories (split comma-separated values)
    const categorySet = new Set<string>();
    data.forEach(d => {
      if (d.category) {
        d.category.split(',').forEach((cat: string) => {
          const trimmed = cat.trim();
          if (trimmed) categorySet.add(trimmed.toUpperCase());
        });
      }
    });
    const categories = Array.from(categorySet).sort();
    
    // Extract and sort age groups by first number
    const ageGroups = [...new Set(data.map(d => d.age_group).filter(Boolean))].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    // Extract and sort durations by numeric value
    const durations = [...new Set(data.map(d => d.duration).filter(Boolean))].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    return { success: true, categories, ageGroups, durations };
  } catch (e) {
    console.error('Failed to fetch filter options:', e);
    return { success: true, categories: [], ageGroups: [], durations: [] };
  }
}

// Client-side filter helper for player count (handles formats like "6+", "4+", "6-12")
export function filterByPlayerCount(
  drills: LibraryDrillMeta[],
  minPlayers?: number,
  maxPlayers?: number
): LibraryDrillMeta[] {
  if (!minPlayers && !maxPlayers) return drills;
  
  return drills.filter(drill => {
    if (!drill.player_count) return true;
    
    // Extract first number from strings like "6+", "4+", "6-12"
    const match = drill.player_count.match(/(\d+)/);
    if (!match) return true;
    
    const drillMinPlayers = parseInt(match[1]);
    
    // Check min filter
    if (minPlayers && drillMinPlayers < minPlayers) return false;
    
    // Check max filter
    if (maxPlayers && drillMinPlayers > maxPlayers) return false;
    
    return true;
  });
}

// Client-side filter helper for duration (exact number match)
export function filterByDuration(
  drills: LibraryDrillMeta[],
  selectedDuration?: string
): LibraryDrillMeta[] {
  if (!selectedDuration || selectedDuration === 'Any Duration') return drills;
  
  const targetNum = selectedDuration.match(/(\d+)/)?.[1];
  if (!targetNum) return drills;
  
  return drills.filter(drill => {
    if (!drill.duration) return true;
    const drillNum = drill.duration.match(/(\d+)/)?.[1];
    return drillNum === targetNum;
  });
}

// Fetch filtered drills using Supabase
export async function fetchFilteredDrills(filters: DrillFilterParams): Promise<LibraryListResponse> {
  let query = supabase.from('drill_list').select('*');
  
  if (filters.category && filters.category !== 'All') {
    query = query.ilike('category', `%${filters.category}%`);
  }
  if (filters.age_group && filters.age_group !== 'All') {
    query = query.eq('age_group', filters.age_group);
  }
  if (filters.difficulty && filters.difficulty !== 'All') {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.has_animation !== undefined) {
    query = query.eq('has_animation', filters.has_animation);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch filtered drills: ${error.message}`);
  }
  
  const drills: LibraryDrillMeta[] = (data || []).map((row: DrillListRow) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    player_count: row.player_count,
    duration: row.duration,
    age_group: row.age_group,
    difficulty: row.difficulty,
    description: row.description,
    svg_url: row.svg_url,
    has_animation: row.has_animation,
  }));
  
  return {
    success: true,
    count: drills.length,
    drills,
  };
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
  svg_url?: string
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
    svg: undefined, // No longer using base64
    svgUrl: svg_url || meta.svg_url, // Use URL instead
    fullDescription: fullDescription || undefined,
    source: detail?.source,
    hasAnimation: detail?.has_animation ?? meta.has_animation,
    animationHtmlUrl: detail?.animation_html_url,
    drillJson: detail?.diagram_json,
    animationJson: detail?.animation_json,
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

// Fetch drills with optional filters (wrapper for easy use in components)
export async function fetchDrills(filters: DrillFilterParams = {}): Promise<Drill[]> {
  const response = await fetchFilteredDrills(filters);
  return response.drills.map(meta => mapLibraryDrillToDrill(meta));
}

// Fetch a single drill by ID with full details
export async function fetchDrillById(id: string): Promise<Drill | null> {
  try {
    const response = await fetchLibraryDrill(id);
    if (!response.success) return null;
    
    // Create a minimal meta object from the detail
    const meta: LibraryDrillMeta = {
      id: response.drill.id,
      name: response.drill.name,
      category: response.drill.category,
      player_count: response.drill.player_count,
      duration: response.drill.duration,
      age_group: response.drill.age_group,
      difficulty: response.drill.difficulty,
      description: response.drill.description,
      svg_url: response.svg_url,
      has_animation: response.drill.has_animation,
    };
    
    return mapLibraryDrillToDrill(meta, response.drill, response.svg_url);
  } catch (error) {
    console.error('Failed to fetch drill by ID:', error);
    return null;
  }
}

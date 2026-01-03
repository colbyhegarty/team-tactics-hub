import { DrillFormData, GenerateDrillResponse, SkillLevel, FieldSize, Drill, DrillCategory, IntensityLevel } from '@/types/drill';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

// Library API response types
export interface LibraryDrillMeta {
  id: string;
  name: string;
  category: string;
  player_count: string;
  duration: string;
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
  setup?: string;
  instructions?: string;
  variations?: string;
  coaching_points?: string;
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

// Fetch available categories
export async function fetchLibraryCategories(): Promise<LibraryCategoriesResponse> {
  const response = await fetch(`${API_URL}/api/library/categories/list`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch categories: ${errorText}`);
  }
  
  return response.json();
}

// Helper to convert API drill to app Drill type
export function mapLibraryDrillToDrill(
  meta: LibraryDrillMeta,
  detail?: LibraryDrillDetail,
  svg?: string
): Drill {
  const playerCount = parseInt(meta.player_count) || 10;
  const duration = parseInt(meta.duration) || 15;
  
  let fullDescription = '';
  if (detail) {
    if (detail.setup) fullDescription += `## Setup\n${detail.setup}\n\n`;
    if (detail.instructions) fullDescription += `## Instructions\n${detail.instructions}\n\n`;
    if (detail.coaching_points) fullDescription += `## Coaching Points\n${detail.coaching_points}\n\n`;
    if (detail.variations) fullDescription += `## Progressions\n${detail.variations}\n\n`;
  }
  
  return {
    id: meta.id,
    name: meta.name,
    category: (meta.category || 'Other') as DrillCategory,
    description: detail?.setup?.slice(0, 150) || `${meta.category} drill for ${playerCount} players`,
    playerCount,
    duration,
    intensity: 'Medium' as IntensityLevel,
    svg,
    fullDescription: fullDescription || undefined,
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

import { CustomDrill, DiagramData, CustomDrillFormData } from '@/types/customDrill';

const CUSTOM_DRILLS_KEY = 'drillforge_custom_drills';

// Default empty diagram
export const getEmptyDiagram = (): DiagramData => ({
  field: {
    type: 'FULL',
    markings: true,
    goals: 0,
  },
  players: [],
  cones: [],
  balls: [],
  goals: [],
  coneLines: [],
  actions: [],
});

// Default empty form
export const getEmptyFormData = (): CustomDrillFormData => ({
  name: '',
  description: '',
  category: '',
  difficulty: '',
  ageGroup: '',
  playerCount: '',
  duration: '',
  setupText: '',
  instructionsText: '',
  coachingPointsText: '',
  variationsText: '',
});

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get all custom drills
export function getCustomDrills(): CustomDrill[] {
  try {
    const stored = localStorage.getItem(CUSTOM_DRILLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Get a single custom drill by ID
export function getCustomDrill(id: string): CustomDrill | null {
  const drills = getCustomDrills();
  return drills.find(d => d.id === id) || null;
}

// Save a new custom drill
export function saveCustomDrill(
  formData: CustomDrillFormData,
  diagramData: DiagramData,
  basedOnDrillId?: string
): CustomDrill {
  const drills = getCustomDrills();
  const now = new Date().toISOString();
  
  const newDrill: CustomDrill = {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    basedOnDrillId,
    formData,
    diagramData,
  };
  
  drills.push(newDrill);
  localStorage.setItem(CUSTOM_DRILLS_KEY, JSON.stringify(drills));
  
  return newDrill;
}

// Update an existing custom drill
export function updateCustomDrill(
  id: string,
  formData: CustomDrillFormData,
  diagramData: DiagramData
): CustomDrill | null {
  const drills = getCustomDrills();
  const index = drills.findIndex(d => d.id === id);
  
  if (index === -1) return null;
  
  drills[index] = {
    ...drills[index],
    updatedAt: new Date().toISOString(),
    formData,
    diagramData,
  };
  
  localStorage.setItem(CUSTOM_DRILLS_KEY, JSON.stringify(drills));
  return drills[index];
}

// Delete a custom drill
export function deleteCustomDrill(id: string): boolean {
  const drills = getCustomDrills();
  const filtered = drills.filter(d => d.id !== id);
  
  if (filtered.length === drills.length) return false;
  
  localStorage.setItem(CUSTOM_DRILLS_KEY, JSON.stringify(filtered));
  return true;
}

// Clear all custom drills (for testing)
export function clearCustomDrills(): void {
  localStorage.removeItem(CUSTOM_DRILLS_KEY);
}

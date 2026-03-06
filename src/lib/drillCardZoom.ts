/**
 * Per-drill zoom overrides for drill card diagrams.
 * 
 * Zoom levels:
 * - default (not listed): 1.1 base, 1.15 hover
 * - zoomInSmall (*): 1.15 base, 1.20 hover  (diagram too zoomed out, zoom in a little)
 * - zoomInLarge (**): 1.25 base, 1.30 hover  (diagram too zoomed out, zoom in a lot)
 * - zoomOutSmall (***): 1.05 base, 1.10 hover (diagram too zoomed in, zoom out a little)
 * - zoomOutLarge (****): 0.95 base, 1.0 hover  (diagram too zoomed in, zoom out significantly)
 */

type ZoomLevel = 'zoomInSmall' | 'zoomInLarge' | 'zoomOutSmall' | 'zoomOutLarge' | 'zoomOutXLarge';

const zoomScales: Record<ZoomLevel, { base: number; hover: number }> = {
  zoomInSmall:   { base: 1.30, hover: 1.35 },
  zoomInLarge:   { base: 1.45, hover: 1.50 },
  zoomOutSmall:  { base: 1.05, hover: 1.10 },
  zoomOutLarge:  { base: 1.00, hover: 1.05 },
  zoomOutXLarge: { base: 0.90, hover: 0.95 },
};

const defaultZoom = { base: 1.15, hover: 1.20 };

// Map of drill name -> zoom level override
const drillZoomOverrides: Record<string, ZoomLevel> = {
  '1v1 Attacking Towards Goal': 'zoomInSmall',
  '1v1 Corner Breakout': 'zoomInSmall',
  '1v1 Recovery Drill': 'zoomInSmall',
  '2v1 with Goalkeepers': 'zoomInSmall',
  '3v2 Dynamic Transition Drill': 'zoomInSmall',
  '3v3 with Goalkeepers': 'zoomInSmall',
  '4v2 Attacking to Goal': 'zoomInSmall',
  '4v4 Plus Goalkeepers to Goals': 'zoomInSmall',
  '5v2 Defensive Rotation Drill': 'zoomInSmall',
  '6v4 Numerical Advantage Training Drill': 'zoomInSmall',
  '7v7 Small-Sided': 'zoomInSmall',
  'Building from the Back': 'zoomInSmall',
  'Check-To Passing Warm-Up': 'zoomInSmall',
  'Combination Play Breaking Ball Exercise': 'zoomInSmall',
  'Cross-Field Warm-Up Exercise': 'zoomInSmall',
  'Fixed Range Passing Exercise': 'zoomInSmall',
  'Goalkeeper Agility Training with Hurdle': 'zoomInSmall',
  'Goalkeeper Footwork Training': 'zoomInSmall',
  'Goalkeeper Movement Drill - Lateral Diving': 'zoomInSmall',
  'Passing Preparation Exercise': 'zoomInSmall',
  'Quick Transition Exercise': 'zoomInSmall',
  'Receiving with Back to Goal': 'zoomInSmall',
  'Side-by-Side 1v1 to Goal': 'zoomInSmall',
  'Small-Sided Finishing Game': 'zoomInSmall',
  'Soccer Fitness: Reaction and Acceleration': 'zoomInSmall',
  'Stop-and-Turn Dribbling Competition': 'zoomInSmall',
  'Three-Goal Triangle Challenge': 'zoomInSmall',
  'Three-Player Pass and Move Warm-Up': 'zoomInSmall',
  'Three-Player Pass and Warm-Up': 'zoomInSmall',
};

// Vertical offset overrides (percentage) — negative shifts diagram up
const drillOffsetOverrides: Record<string, number> = {
  '1v1 Attacking Dribble to Goal': -5,
  '2v1 with Goalkeepers': -5,
  '2v2 with Target Attacker': -5,
  '3v1 to Goal': -5,
  '3v3 with Goalkeepers': -5,
  '4V3 Attacking vs Defensive Play': -5,
  '4v4 Plus Goalkeepers to Goals': -5,
  '50-50 to Goal': -5,
  'Cross Delivery and Goal Scoring Exercise': -5,
  'Dribble and Turn Under Defensive Pressure': -5,
  'Dynamic Range Passing Exercise': -5,
  'End-Line Attack and Cross Training': -5,
  'Fixed Range Passing Exercise': -5,
  'Shooters and Retrievers': -5,
};

export function getDrillCardZoom(drillName: string): { base: number; hover: number; offsetY: number } {
  const level = drillZoomOverrides[drillName];
  const offsetY = drillOffsetOverrides[drillName] ?? 0;
  if (level) {
    return { ...zoomScales[level], offsetY };
  }
  return { ...defaultZoom, offsetY };
}

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
  zoomInSmall:   { base: 1.15, hover: 1.20 },
  zoomInLarge:   { base: 1.25, hover: 1.30 },
  zoomOutSmall:  { base: 1.05, hover: 1.10 },
  zoomOutLarge:  { base: 1.00, hover: 1.05 },
  zoomOutXLarge: { base: 0.90, hover: 0.95 },
};

const defaultZoom = { base: 1.00, hover: 1.05 };

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
  'Combination Play Breaking Ball Exercise': 'zoomInSmall',
  'Cross-Field Warm-Up Exercise': 'zoomInSmall',
  'Fixed Range Passing Exercise': 'zoomInSmall',
  'Goalkeeper Agility Training with Hurdle': 'zoomInSmall',
  'Goalkeeper Footwork Training': 'zoomInSmall',
  'Passing Preparation Exercise': 'zoomInSmall',
  'Quick Transition Exercise': 'zoomInSmall',
  'Receiving with Back to Goal': 'zoomInSmall',
  'Side-by-Side 1v1 to Goal': 'zoomInSmall',
  'Small-Sided Finishing Game': 'zoomInSmall',
  'Soccer Fitness: Reaction and Acceleration': 'zoomInSmall',
  'Stop-and-Turn Dribbling Competition': 'zoomInSmall',
  'Three-Player Pass and Warm-Up': 'zoomInSmall',
};

export function getDrillCardZoom(drillName: string): { base: number; hover: number } {
  const level = drillZoomOverrides[drillName];
  if (level) {
    return zoomScales[level];
  }
  return defaultZoom;
}

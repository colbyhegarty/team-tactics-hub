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

const defaultZoom = { base: 1.10, hover: 1.15 };

// Map of drill name -> zoom level override
const drillZoomOverrides: Record<string, ZoomLevel> = {};

export function getDrillCardZoom(drillName: string): { base: number; hover: number } {
  const level = drillZoomOverrides[drillName];
  if (level) {
    return zoomScales[level];
  }
  return defaultZoom;
}

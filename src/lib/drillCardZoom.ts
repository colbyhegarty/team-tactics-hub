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
  zoomOutLarge:  { base: 0.95, hover: 1.00 },
  zoomOutXLarge: { base: 0.85, hover: 0.90 },
};

const defaultZoom = { base: 1.10, hover: 1.15 };

// Map of drill name -> zoom level override
const drillZoomOverrides: Record<string, ZoomLevel> = {
  // Drills that still need zoom out (not repadded)
  '5v3 Switching Possession': 'zoomOutLarge',
  'Zig-Zag Dribbling Exercise': 'zoomOutLarge',

  // Repadded drills — zoom out more
  '1-2 Wall Pass Sequence': 'zoomOutLarge',
  'Agility Training Circuit': 'zoomOutLarge',
  'Basic Agility Circuit': 'zoomOutLarge',
  'Cone Dribbling Challenge': 'zoomOutLarge',
  'Defensive Clearances- High and Wide': 'zoomOutLarge',
  'Diamond Passing Sequence': 'zoomOutLarge',
  'Figure Eight Ball Control Exercise': 'zoomOutLarge',
  'Finishing in Front of Goal': 'zoomOutLarge',
  'Finishing in Front of Goal 2': 'zoomOutLarge',
  'Inside of the Foot Passing': 'zoomOutLarge',
  'Turn and Finish Shooting Drill': 'zoomOutLarge',

  // Repadded drills — zoom out significantly
  'Cross and Finish with Defensive Pressure': 'zoomOutXLarge',
  'Wide Service and Scoring Exercise': 'zoomOutXLarge',

  // Repadded drills — zoom out a little
  '2v2 Competition': 'zoomOutSmall',
  'Box Passing and Receiving Exercise': 'zoomOutSmall',
  'Midfield Combination to Cross': 'zoomOutSmall',
  'Passing Preparation Exercise': 'zoomOutSmall',
  'Triple Zone 1v1 Challenge': 'zoomOutSmall',

  // ** — too zoomed out, zoom in a lot
  '1st Defender Fundamentals': 'zoomInLarge',
  '1v1 Competitive Challenge': 'zoomInLarge',
  '1v1 Diamond Finishing Exercise': 'zoomInLarge',
  '1v1 Finishing Combination Exercise': 'zoomInLarge',
  '3v3 Finishing in the 18': 'zoomInLarge',
  '4v4 Five-Goal Game in the 18': 'zoomInLarge',
  'Aerial Service into the Penalty Area': 'zoomInLarge',
  'Agility Speed Test': 'zoomInLarge',
  'Attacking and Defensive Shooting Exercise': 'zoomInLarge',

  // * — zoom in a lot
  '1v1 Attack and Reaction Exercise': 'zoomInLarge',
  '1v1 Attacking with Four Mini Goals': 'zoomInLarge',
  '1v1 Battle to Tall Cones': 'zoomInLarge',
  '1v1 Knockout Competition': 'zoomInLarge',
  '1v1 Reaction Exercise': 'zoomInLarge',
  '1v1 Relay to Mini Goals': 'zoomInLarge',
  '1v1, 1v2, 2v2 Four Goal Game': 'zoomInLarge',
  '1v1v1 Triangle Competition': 'zoomInLarge',
  '2v1 Attacking Dribble Against Defender': 'zoomInLarge',
  '2v1 Receiving Facing the Defender': 'zoomInLarge',
  '2v1 Supporting Rondo': 'zoomInLarge',
  '2v1 to 1v1 Possession Exercise': 'zoomInLarge',
  '2v2 Attack with Targets': 'zoomInLarge',
  '2v2 to Four Mini-Goals': 'zoomInLarge',
  '3v2 Dynamic Transition Drill': 'zoomInLarge',
  '3v3 Plus 3 Possession': 'zoomInLarge',
  '3v3 Small-Sided to Four Goals': 'zoomInLarge',
  '4v3 Attacking vs Defensive Play': 'zoomInLarge',
  '4v4 Attack to Gates': 'zoomInLarge',
  '4v4 Field Zones Training': 'zoomInLarge',
  '4v4 Plus 2 End Zone Possession Drill': 'zoomInLarge',
  '4v4 Small-Sided to Mini-Goals': 'zoomInLarge',
  '4v4 to Four Goals': 'zoomInLarge',
  '4v4+1 Corner Support Possession': 'zoomInLarge',
  '4v4+4 Non-Stop Transition Possession Game': 'zoomInLarge',
  '50-50 to Goal': 'zoomInLarge',
  '5-Pass Retention Exercise': 'zoomInLarge',
  'Ball Strike Challenge': 'zoomInLarge',
  'Beating Defenders Through Dribbling': 'zoomInLarge',
  'Body Parts Activation Exercise': 'zoomInLarge',
  'Combination Shooting and Finishing Exercise': 'zoomInLarge',
  'Congested Dribbling Challenge': 'zoomInLarge',
  'Cross-Field Warm-Up Exercise': 'zoomInLarge',
  'Defend The Cone': 'zoomInLarge',
  'Defender-Splitting Passing Exercise': 'zoomInLarge',
  'Dribblers vs Defenders': 'zoomInLarge',
  'End-Line Attack and Cross Training': 'zoomInLarge',
  'End-Zone Target Game': 'zoomInLarge',
  'Four-Point Passing Game': 'zoomInLarge',
  'Gate Dribbling Challenge Drill': 'zoomInLarge',
  'Goalkeeper - Shot Angle Training': 'zoomInLarge',
  'Goalkeeper Arc Training Exercise 1': 'zoomInLarge',
  'Handling Balls Out of the Air': 'zoomInLarge',
  'Header/Catch Challenge': 'zoomInLarge',
  'Lane Spacing Small-Sided Game': 'zoomInLarge',
  'Locating The Target Player': 'zoomInLarge',
  'Midfield Attack Development': 'zoomInLarge',
  'Mirror Dribbling': 'zoomInLarge',
  'Paired Passing and Movement Warm-Up': 'zoomInLarge',
  'Passing to Eliminate the Opponent': 'zoomInLarge',
  'Quick Transition Exercise': 'zoomInLarge',
  'Shooters and Retrievers': 'zoomInLarge',
  'Six-Cone Passing Exercise': 'zoomInLarge',
  'Soccer Tag': 'zoomInLarge',
  'Speed Dribbling Tag Game': 'zoomInLarge',
  'Speed of Play Passing': 'zoomInLarge',
  'Speed of Play Warm-Up Drill': 'zoomInLarge',
  'Tag and Evade Challenge': 'zoomInLarge',
  'T-Cone Dribbling Exercise': 'zoomInLarge',
  'Tidy Up Training Drill': 'zoomInLarge',
  'Traffic Light Dribbling Exercise': 'zoomInLarge',

};

export function getDrillCardZoom(drillName: string): { base: number; hover: number } {
  const level = drillZoomOverrides[drillName];
  if (level) {
    return zoomScales[level];
  }
  return defaultZoom;
}

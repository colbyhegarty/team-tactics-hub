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

type ZoomLevel = 'zoomInSmall' | 'zoomInLarge' | 'zoomOutSmall' | 'zoomOutLarge';

const zoomScales: Record<ZoomLevel, { base: number; hover: number }> = {
  zoomInSmall:  { base: 1.15, hover: 1.20 },
  zoomInLarge:  { base: 1.25, hover: 1.30 },
  zoomOutSmall: { base: 1.05, hover: 1.10 },
  zoomOutLarge: { base: 0.95, hover: 1.00 },
};

const defaultZoom = { base: 1.10, hover: 1.15 };

// Map of drill name -> zoom level override
const drillZoomOverrides: Record<string, ZoomLevel> = {
  // **** — too zoomed in, zoom out significantly
  '1-2 Wall Pass Sequence': 'zoomOutLarge',
  '1v1 Recovery Drill': 'zoomOutLarge',
  'Agility Training Circuit': 'zoomOutLarge',
  'Basic Agility Circuit': 'zoomOutLarge',
  'Combination Play Breaking Ball Exercise': 'zoomOutLarge',
  'Cone Dribbling Challenge': 'zoomOutLarge',
  'Cross and Finish with Defensive Pressure': 'zoomOutLarge',
  'Dribble and Turn Under Defensive Pressure': 'zoomOutLarge',
  'Dribbling Warm-Up Exercise': 'zoomOutLarge',
  'Dynamic Range Passing Exercise': 'zoomOutLarge',
  'Fixed Range Passing Exercise': 'zoomOutLarge',
  'Goalkeeper Agility Training with Hurdle': 'zoomOutLarge',
  'Goalkeeper Footwork Training': 'zoomOutLarge',
  'Goalkeeper Movement Drill - Lateral Diving': 'zoomOutLarge',
  'Passing Preparation Exercise': 'zoomOutLarge',
  'Stop-and-Turn Dribbling Competition': 'zoomOutLarge',
  'Y Passing Drill 1': 'zoomOutLarge',
  'Y Passing Drill 2': 'zoomOutLarge',
  'Y Passing Drill 3': 'zoomOutLarge',

  // *** — too zoomed in, zoom out a little
  '1v1 Corner Breakout': 'zoomOutSmall',
  '5v2 Defensive Rotation Drill': 'zoomOutSmall',
  '5v3 Switching Possession': 'zoomOutSmall',
  'Box Passing and Receiving Exercise': 'zoomOutSmall',
  'Defensive Clearances- High and Wide': 'zoomOutSmall',
  'Diamond Passing Sequence': 'zoomOutSmall',
  'Figure Eight Ball Control Exercise': 'zoomOutSmall',
  'Finishing in Front of Goal': 'zoomOutSmall',
  'Finishing in Front of Goal 2': 'zoomOutSmall',
  'Inside of the Foot Passing': 'zoomOutSmall',
  'Midfeld Combination to Cross': 'zoomOutSmall',
  'Receiving with Back to Goal': 'zoomOutSmall',
  'Side-by-Side 1v1 to Goal': 'zoomOutSmall',
  'Soccer Fitness: Reaction and Acceleration': 'zoomOutSmall',
  'Three-Goal Triangle Challenge': 'zoomOutSmall',
  'Triple Zone 1v1 Challenge': 'zoomOutSmall',
  'Turn and Finish Shooting Drill': 'zoomOutSmall',
  'Wide Service and Scoring Exercise': 'zoomOutSmall',

  // ** — too zoomed out, zoom in a lot
  '1st Defender Fundamentals': 'zoomInLarge',
  '1v1 Competitive Challenge': 'zoomInLarge',
  '1v1 Diamond Finishing Exercise': 'zoomInLarge',
  '1v1 Finishing Combination Exercise': 'zoomInLarge',
  '2v2 Competition': 'zoomInLarge',
  '3v3 Finishing in the 18': 'zoomInLarge',
  '4v4 Five-Goal Game in the 18': 'zoomInLarge',
  'Aerial Service into the Penalty Area': 'zoomInLarge',
  'Agility Speed Test': 'zoomInLarge',
  'Attacking and Defensive Shooting Exercise': 'zoomInLarge',

  // * — too zoomed out, zoom in a little
  '1v1 Attack and Reaction Exercise': 'zoomInSmall',
  '1v1 Attacking with Four Mini Goals': 'zoomInSmall',
  '1v1 Battle to Tall Cones': 'zoomInSmall',
  '1v1 Knockout Competition': 'zoomInSmall',
  '1v1 Reaction Exercise': 'zoomInSmall',
  '1v1 Relay to Mini Goals': 'zoomInSmall',
  '1v1, 1v2, 2v2 Four Goal Game': 'zoomInSmall',
  '1v1v1 Triangle Competition': 'zoomInSmall',
  '2v1 Attacking Dribble Against Defender': 'zoomInSmall',
  '2v1 Receiving Facing the Defender': 'zoomInSmall',
  '2v1 Supporting Rondo': 'zoomInSmall',
  '2v1 to 1v1 Possession Exercise': 'zoomInSmall',
  '2v2 Attack with Targets': 'zoomInSmall',
  '2v2 to Four Mini-Goals': 'zoomInSmall',
  '3v2 Dynamic Transition Drill': 'zoomInSmall',
  '3v3 Plus 3 Possession': 'zoomInSmall',
  '3v3 Small-Sided to Four Goals': 'zoomInSmall',
  '4v3 Attacking vs Defensive Play': 'zoomInSmall',
  '4v4 Attack to Gates': 'zoomInSmall',
  '4v4 Field Zones Training': 'zoomInSmall',
  '4v4 Plus 2 End Zone Possession Drill': 'zoomInSmall',
  '4v4 Small-Sided to Mini-Goals': 'zoomInSmall',
  '4v4 to Four Goals': 'zoomInSmall',
  '4v4+1 Corner Support Possession': 'zoomInSmall',
  '4v4+4 Non-Stop Transition Possession Game': 'zoomInSmall',
  '50-50 to Goal': 'zoomInSmall',
  '5-Pass Retention Exercise': 'zoomInSmall',
  'Ball Strike Challenge': 'zoomInSmall',
  'Beating Defenders Through Dribbling': 'zoomInSmall',
  'Body Parts Activation Exercise': 'zoomInSmall',
  'Combination Shooting and Finishing Exercise': 'zoomInSmall',
  'Congested Dribbling Challenge': 'zoomInSmall',
  'Cross-Field Warm-Up Exercise': 'zoomInSmall',
  'Defend The Cone': 'zoomInSmall',
  'Defender-Splitting Passing Exercise': 'zoomInSmall',
  'Dribblers vs Defenders': 'zoomInSmall',
  'End-Line Attack and Cross Training': 'zoomInSmall',
  'End-Zone Target Game': 'zoomInSmall',
  'Four-Point Passing Game': 'zoomInSmall',
  'Gate Dribbling Challenge Drill': 'zoomInSmall',
  'Goalkeeper - Shot Angle Training': 'zoomInSmall',
  'Goalkeeper Arc Training Exercise 1': 'zoomInSmall',
  'Handling Balls Out of the Air': 'zoomInSmall',
  'Header/Catch Challenge': 'zoomInSmall',
  'Lane Spacing Small-Sided Game': 'zoomInSmall',
  'Locating The Target Player': 'zoomInSmall',
  'Midfield Attack Development': 'zoomInSmall',
  'Mirror Dribbling': 'zoomInSmall',
  'Paired Passing and Movement Warm-Up': 'zoomInSmall',
  'Passing to Eliminate the Opponent': 'zoomInSmall',
  'Quick Transition Exercise': 'zoomInSmall',
  'Shooters and Retrievers': 'zoomInSmall',
  'Six-Cone Passing Exercise': 'zoomInSmall',
  'Soccer Tag': 'zoomInSmall',
  'Speed Dribbling Tag Game': 'zoomInSmall',
  'Speed of Play Passing': 'zoomInSmall',
  'Speed of Play Warm-Up Drill': 'zoomInSmall',
  'Tag and Evade Challenge': 'zoomInSmall',
  'T-Cone Dribbling Exercise': 'zoomInSmall',
  'Tidy Up Training Drill': 'zoomInSmall',
  'Traffic Light Dribbling Exercise': 'zoomInSmall',
};

export function getDrillCardZoom(drillName: string): { base: number; hover: number } {
  const level = drillZoomOverrides[drillName];
  if (level) {
    return zoomScales[level];
  }
  return defaultZoom;
}

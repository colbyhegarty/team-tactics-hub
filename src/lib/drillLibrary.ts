import { Drill, DrillCategory } from '@/types/drill';

export const drillLibrary: Drill[] = [
  // Warm-up
  {
    id: 'warmup-1',
    name: 'Dynamic Rondo Warm-up',
    category: 'Warm-up',
    description: 'A progressive rondo that combines dynamic stretching with ball work. Players circulate in a large circle performing movements while 2 players in the middle try to intercept passes.',
    playerCount: 10,
    duration: 12,
    intensity: 'Low',
    fullDescription: `## Overview
A dynamic warm-up combining movement preparation with technical work.

## Setup
- Create a circle approximately 25 yards in diameter
- 8 players on the outside, 2 defenders in the middle
- One ball in play

## Instructions
1. Outside players pass the ball while performing dynamic movements between touches
2. Jog, high knees, butt kicks between passes
3. Middle players try to intercept
4. Switch defenders every 90 seconds

## Coaching Points
- Keep the body moving between passes
- Communicate with teammates
- First touch should be positive

## Progressions
1. Add a second ball
2. Limit touches to 2
3. Require specific movement patterns between passes`
  },
  {
    id: 'warmup-2',
    name: 'Passing Gates Activation',
    category: 'Warm-up',
    description: 'Players pass through small cone gates while progressing through dynamic movements. Great for activating passing technique and spatial awareness.',
    playerCount: 8,
    duration: 10,
    intensity: 'Low',
    fullDescription: `## Overview
Technical passing warm-up through gates with progressive intensity.

## Setup
- Set up 8-10 gates (2 cones, 2 yards apart) scattered in a 30x30 area
- Players in pairs with one ball

## Instructions
1. Pairs pass through gates, counting successful passes
2. Progress from walking to jogging to match pace
3. Challenge: most gates in 2 minutes

## Coaching Points
- Quality of pass through gates
- Awareness of space and other pairs
- Progressive increase in intensity

## Progressions
1. One touch only
2. Weak foot only
3. Add defenders`
  },
  {
    id: 'warmup-3',
    name: 'Ball Mastery Circuit',
    category: 'Warm-up',
    description: 'Individual ball mastery exercises performed in a circuit format. Ideal for improving touch, coordination and ball control.',
    playerCount: 16,
    duration: 15,
    intensity: 'Low',
    fullDescription: `## Overview
Individual technical work to prepare for training.

## Setup
- 4 stations in a square, 4 players per station
- Each player with a ball

## Instructions
1. Station 1: Toe taps (30 sec)
2. Station 2: Inside-outside rolls (30 sec)
3. Station 3: Pull-push (30 sec)
4. Station 4: Figure 8s around cones (30 sec)
5. Rotate after each round

## Coaching Points
- Head up when possible
- Light touches on the ball
- Increase speed gradually`
  },

  // Passing & Possession
  {
    id: 'passing-1',
    name: 'Y-Shape Combination Play',
    category: 'Passing & Possession',
    description: 'Players execute quick one-two combinations in a Y-shape pattern, emphasizing movement off the ball and wall passes.',
    playerCount: 8,
    duration: 15,
    intensity: 'Medium',
    fullDescription: `## Overview
Combination passing drill focusing on movement and timing.

## Setup
- Set up cones in a Y shape
- 3 lines of players at each point of the Y
- One ball starts at the base

## Instructions
1. Player at base passes to central player
2. Central player sets back
3. Base player plays to wide player and makes overlapping run
4. Wide player combines with central and switches play
5. Players follow their pass and join opposite line

## Coaching Points
- Weight and accuracy of pass
- Timing of runs
- Check shoulders before receiving

## Progressions
1. Add passive defender
2. Limit to one touch
3. Race against second group`
  },
  {
    id: 'passing-2',
    name: '4v4+3 Possession Box',
    category: 'Passing & Possession',
    description: 'Classic possession exercise with neutrals creating numerical superiority. Team in possession keeps ball while building through thirds.',
    playerCount: 11,
    duration: 20,
    intensity: 'Medium',
    fullDescription: `## Overview
Possession game developing composure under pressure.

## Setup
- 30x30 yard grid
- 4v4 inside with 3 neutrals on outside
- Neutrals play with team in possession

## Instructions
1. Team in possession aims for 6 consecutive passes = 1 point
2. Neutrals provide width and depth
3. On turnover, other team tries to keep ball
4. Play 3-minute games

## Coaching Points
- Body shape when receiving
- Playing out of pressure
- Use of neutrals to relieve pressure

## Progressions
1. Reduce grid size
2. Neutrals to 2 touch
3. Add target players on ends`
  },
  {
    id: 'passing-3',
    name: 'Switch Play Circuit',
    category: 'Passing & Possession',
    description: 'Practice switching the point of attack quickly. Players work on long diagonal passes and quick combinations.',
    playerCount: 12,
    duration: 18,
    intensity: 'Medium',
  },

  // Finishing
  {
    id: 'finishing-1',
    name: '1v1 to Goal from Flank',
    category: 'Finishing',
    description: 'Attackers receive from wide areas and take on a defender 1v1 before shooting. Develops dribbling confidence and finishing under pressure.',
    playerCount: 10,
    duration: 20,
    intensity: 'High',
    fullDescription: `## Overview
Realistic finishing situation from wide areas.

## Setup
- Half field with full-size goal
- Server on the wing
- Attacker on penalty box edge
- Defender starting deeper

## Instructions
1. Server plays ball to attacker's feet
2. Defender closes down
3. Attacker takes on 1v1 and finishes
4. Rotate positions after each go

## Coaching Points
- First touch to set up shot or dribble
- Commit defender before making move
- Placement over power

## Progressions
1. Limit time to shoot (5 seconds)
2. Add second defender recovery run
3. Cross option from wide`
  },
  {
    id: 'finishing-2',
    name: 'Box Finishing Circuit',
    category: 'Finishing',
    description: 'Continuous finishing circuit with various approaches - near post, far post, cutbacks, and volleys. High repetition drill.',
    playerCount: 8,
    duration: 15,
    intensity: 'High',
  },
  {
    id: 'finishing-3',
    name: 'Crossing and Finishing Waves',
    category: 'Finishing',
    description: 'Waves of attackers time their runs to meet crosses from wide areas. Practice both crossing technique and finishing.',
    playerCount: 12,
    duration: 20,
    intensity: 'High',
  },

  // Defensive
  {
    id: 'defensive-1',
    name: 'Pressing Triggers 6v4',
    category: 'Defensive Shape',
    description: 'Learn when to press as a unit. 6 defenders practice pressing on specific triggers against 4 attackers in a zonal game.',
    playerCount: 10,
    duration: 20,
    intensity: 'High',
    fullDescription: `## Overview
Team pressing exercise focusing on triggers and coordination.

## Setup
- 40x30 yard area divided into 3 zones
- 6 defenders vs 4 attackers + 2 neutrals

## Instructions
1. Attackers try to play through zones
2. Defenders press on triggers: backward pass, poor touch, ball in corner
3. If defenders win ball, try to score on mini goals
4. Reset if ball goes out

## Coaching Points
- Identify pressing triggers
- Press as a unit - not individually
- Cover shadows on ball-side

## Progressions
1. Add time limit for transitions
2. Require specific recovery runs
3. Progress to larger area`
  },
  {
    id: 'defensive-2',
    name: '4v4 Defending Transitions',
    category: 'Defensive Shape',
    description: 'Rapid transition exercise. When possession is lost, immediate pressing begins. Develops defensive reactions and recovery.',
    playerCount: 8,
    duration: 15,
    intensity: 'High',
  },

  // Conditioning
  {
    id: 'conditioning-1',
    name: 'Dribble Shuttle Sprints',
    category: 'Conditioning',
    description: 'High-intensity interval training with the ball. Players dribble through cones at various intensities with recovery periods.',
    playerCount: 16,
    duration: 12,
    intensity: 'High',
    fullDescription: `## Overview
Ball-related conditioning maintaining technical quality under fatigue.

## Setup
- 4 cones in a line, 10 yards apart
- Players at first cone with balls

## Instructions
1. Sprint dribble to cone 2 and back
2. Sprint dribble to cone 3 and back
3. Sprint dribble to cone 4 and back
4. Rest 60 seconds, repeat 4 times

## Coaching Points
- Maintain ball control at speed
- Quick changes of direction
- Head up when possible

## Progressions
1. Add turns at each cone
2. Competition between groups
3. Reduce rest periods`
  },
  {
    id: 'conditioning-2',
    name: 'Pressing Fitness Game',
    category: 'Conditioning',
    description: 'Small-sided game designed to maximize pressing intensity. Quick transitions and high work rate in a confined space.',
    playerCount: 12,
    duration: 18,
    intensity: 'High',
  },

  // Small-Sided Games
  {
    id: 'ssg-1',
    name: '5v5 Four Goal Game',
    category: 'Small-Sided Games',
    description: 'Attack and defend multiple goals, encouraging width in attack and defensive organization. Creates lots of transition moments.',
    playerCount: 10,
    duration: 20,
    intensity: 'High',
    fullDescription: `## Overview
Multi-directional game developing scanning and quick decisions.

## Setup
- 40x40 yard area
- 4 mini goals, one on each side
- 5v5, no goalkeepers

## Instructions
1. Teams can score in any of the 4 goals
2. After scoring, ball restarts from keeper
3. 3-minute games, most goals wins

## Coaching Points
- Check shoulders constantly
- Switch point of attack
- Defensive shape and recovery

## Progressions
1. Add neutral floater
2. Goals only count from inside a zone
3. Limit touches`
  },
  {
    id: 'ssg-2',
    name: '3v3 Line Soccer',
    category: 'Small-Sided Games',
    description: 'Score by dribbling over end line. Develops 1v1 skills, support play, and defensive recovery in tight spaces.',
    playerCount: 6,
    duration: 15,
    intensity: 'High',
  },
  {
    id: 'ssg-3',
    name: '4v4+GKs Match Play',
    category: 'Small-Sided Games',
    description: 'Realistic small-sided match with goalkeepers. Perfect for developing all-around game understanding.',
    playerCount: 10,
    duration: 25,
    intensity: 'Variable',
  },

  // Set Pieces
  {
    id: 'setpiece-1',
    name: 'Corner Kick Variations',
    category: 'Set Pieces',
    description: 'Practice 3-4 corner kick routines with specific runs and delivery types. Both attacking and defending.',
    playerCount: 14,
    duration: 20,
    intensity: 'Medium',
    fullDescription: `## Overview
Set piece training for corners - both attacking and defending.

## Setup
- Full-size goal with GK
- Corner flag set up
- Attacking and defending teams

## Instructions
1. Practice 4 different corner routines:
   - Near post flick-on
   - Far post delivery
   - Short corner combination
   - Set piece play with decoy runs
2. 5 reps of each

## Coaching Points
- Delivery quality and timing
- Blocking and screening
- Second ball awareness

## Progressions
1. Add active defending
2. Time limit on delivery
3. Competition format`
  },
  {
    id: 'setpiece-2',
    name: 'Free Kick Finishing',
    category: 'Set Pieces',
    description: 'Attacking free kicks from various positions around the box. Practice both direct shots and indirect set plays.',
    playerCount: 12,
    duration: 15,
    intensity: 'Medium',
  },

  // Cool-down
  {
    id: 'cooldown-1',
    name: 'Passing Circle Cool-down',
    category: 'Cool-down',
    description: 'Light passing in a circle with dynamic stretching between touches. Gradual decrease in intensity.',
    playerCount: 12,
    duration: 8,
    intensity: 'Low',
    fullDescription: `## Overview
Active recovery combining light passing with stretching.

## Setup
- Large circle, players evenly spaced
- 2 balls in play

## Instructions
1. Pass ball across circle
2. After passing, perform assigned stretch
3. Hold stretch until next pass received
4. Progress through: quads, hamstrings, calves, hip flexors

## Coaching Points
- Light, accurate passes
- Deep breathing during stretches
- Positive communication to end session`
  },
  {
    id: 'cooldown-2',
    name: 'Technical Juggling Wind-down',
    category: 'Cool-down',
    description: 'Individual juggling with progressive challenges while heart rate decreases. End with partner challenges.',
    playerCount: 16,
    duration: 10,
    intensity: 'Low',
  },
];

export function getDrillsByCategory(category: DrillCategory): Drill[] {
  return drillLibrary.filter(drill => drill.category === category);
}

export function getDrillById(id: string): Drill | undefined {
  return drillLibrary.find(drill => drill.id === id);
}

export const categories: DrillCategory[] = [
  'Warm-up',
  'Passing & Possession',
  'Finishing',
  'Defensive Shape',
  'Conditioning',
  'Small-Sided Games',
  'Set Pieces',
  'Cool-down',
];

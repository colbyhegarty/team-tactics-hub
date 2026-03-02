import { CustomDrill } from '@/types/customDrill';
import {
  calculateDrillBounds,
  createRenderContext,
  renderDrillFrame,
  CW,
  CANVAS_PADDING,
  RenderDrillData,
} from '@/utils/drillRenderer';

function toRenderData(drill: CustomDrill): RenderDrillData {
  const d = drill.diagramData;
  const coneIndexMap: Record<string, number> = {};
  d.cones.forEach((c, i) => { coneIndexMap[c.id] = i; });

  const renderConeLines = d.coneLines
    .map(cl => ({
      from_cone: coneIndexMap[cl.fromConeId] ?? -1,
      to_cone: coneIndexMap[cl.toConeId] ?? -1,
    }))
    .filter(cl => cl.from_cone >= 0 && cl.to_cone >= 0);

  const fullGoals = d.goals
    .filter(g => g.size === 'full')
    .map(g => ({ position: g.position, rotation: g.rotation }));
  const miniGoalsList = d.goals
    .filter(g => g.size === 'mini')
    .map(g => ({ position: g.position, rotation: g.rotation }));

  const renderActions = d.actions.map(a => {
    if (a.type === 'PASS') {
      return { type: 'PASS' as const, fromPlayer: a.fromPlayerId, toPlayer: a.toPlayerId };
    } else {
      return { type: a.type, player: a.playerId, toPosition: a.toPosition };
    }
  });

  return {
    field: { type: d.field.type, markings: d.field.markings, goals: d.field.goals },
    players: d.players.map(p => ({ id: p.id, role: p.role.toLowerCase(), position: p.position })),
    cones: d.cones.map(c => ({ position: c.position })),
    cone_lines: renderConeLines,
    balls: d.balls.map(b => ({ position: b.position })),
    goals: fullGoals,
    mini_goals: miniGoalsList,
    actions: renderActions,
  };
}

export function renderCustomDrillToDataURL(drill: CustomDrill): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const renderData = toRenderData(drill);
  const bounds = calculateDrillBounds(renderData);
  const rc = createRenderContext(bounds, CW, CANVAS_PADDING);

  canvas.width = rc.canvasWidth;
  canvas.height = rc.canvasHeight;

  renderDrillFrame(ctx, rc, renderData);
  return canvas.toDataURL('image/png');
}

export { toRenderData };

import { Session } from '@/types/session';
import { Drill } from '@/types/drill';

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, '0')}`;
}

function formatBulletPoints(text: string): string[] {
  return text
    .split(/\n|(?:\d+\.\s)/)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

// SVG icons as inline data URIs for professional look
const ICONS = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  timer: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  stickyNote: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>`,
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  checkSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
};

export function exportSessionToPDF(session: Session, drillDetails?: Record<string, Drill>) {
  const totalDuration = session.activities.reduce((s, a) => s + a.duration_minutes, 0);

  const dateStr = session.session_date
    ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  let html = `
    <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 780px; margin: 0 auto; padding: 20px 16px; color: #1a1a1a;">
      <!-- Header -->
      <div style="border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #111;">${session.title || 'Training Session'}</h1>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #555; align-items: center;">
          ${dateStr ? `<span style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.calendar} ${dateStr}</span>` : ''}
          ${session.session_time ? `<span style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.clock} ${session.session_time}</span>` : ''}
          ${session.team_name ? `<span style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.users} ${session.team_name}</span>` : ''}
          <span style="display: inline-flex; align-items: center; gap: 4px;">${ICONS.timer} ${totalDuration} min total</span>
        </div>
      </div>
  `;

  if (session.session_goals) {
    html += `
      <div style="background: #f0fdf4; border-left: 3px solid #16a34a; padding: 8px 12px; border-radius: 0 6px 6px 0; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; margin-bottom: 3px;">
          ${ICONS.target} Session Goals
        </div>
        <p style="margin: 0; font-size: 12px; color: #333; line-height: 1.5;">${session.session_goals}</p>
      </div>
    `;
  }

  // Activities
  html += `<div style="font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Activities</div>`;

  let currentTime = 0;
  session.activities.forEach((activity) => {
    const title = activity.title || activity.drill_name || 'Activity';
    const description = activity.description || '';
    const drillData = activity.library_drill_id && drillDetails ? drillDetails[activity.library_drill_id] : null;
    const instructions = drillData?.instructions || activity.drill_instructions || '';
    const setup = drillData?.setup || activity.drill_setup || '';

    html += `
      <div style="margin-bottom: 12px; page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Activity Header -->
        <div style="background: #f8fafc; padding: 6px 12px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; font-size: 12px; color: #111;">
            <span style="color: #16a34a; font-family: monospace; margin-right: 6px;">${formatTime(currentTime)}</span>
            ${title.toUpperCase()}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: #666; font-weight: 600;">
            ${ICONS.timer} ${activity.duration_minutes} min
          </div>
        </div>
        <div style="padding: 10px 12px;">
    `;

    const hasRightContent = setup || instructions || description;

    // Side-by-side layout: diagram left, setup+instructions right
    if (activity.drill_svg_url && hasRightContent) {
      html += `<div style="display: flex; gap: 10px; align-items: flex-start;">`;
      html += `
        <div style="flex-shrink: 0; border-radius: 6px; overflow: hidden; width: 220px;">
          <img src="${activity.drill_svg_url}" style="width: 100%; height: auto; display: block;">
        </div>
      `;
      html += `<div style="flex: 1; min-width: 0;">`;

      if (description) {
        html += `<p style="color: #444; font-size: 11px; line-height: 1.5; margin: 0 0 6px 0;">${description}</p>`;
      }

      if (setup) {
        const setupPoints = formatBulletPoints(setup);
        if (setupPoints.length > 0) {
          html += `
            <div style="margin-bottom: 6px;">
              <div style="font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; margin-bottom: 3px;">Setup</div>
              <div style="padding-left: 2px;">
                ${setupPoints.map(p => `<div style="font-size: 10px; color: #333; line-height: 1.4; margin-bottom: 1px; display: flex; gap: 5px;"><span style="color: #16a34a; font-size: 8px; margin-top: 2px;">▸</span><span>${p}</span></div>`).join('')}
              </div>
            </div>
          `;
        }
      }

      if (instructions) {
        const points = formatBulletPoints(instructions);
        if (points.length > 0) {
          html += `
            <div style="margin-bottom: 6px;">
              <div style="font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; margin-bottom: 3px;">Instructions</div>
              <div style="padding-left: 2px;">
                ${points.map(p => `<div style="font-size: 10px; color: #333; line-height: 1.4; margin-bottom: 1px; display: flex; gap: 5px;"><span style="color: #16a34a; font-size: 8px; margin-top: 2px;">▸</span><span>${p}</span></div>`).join('')}
              </div>
            </div>
          `;
        }
      }

      html += `</div></div>`;
    } else {
      // No diagram or no text content — render sequentially
      if (activity.drill_svg_url) {
        html += `
          <div style="margin-bottom: 8px; border-radius: 6px; overflow: hidden; max-width: 220px;">
            <img src="${activity.drill_svg_url}" style="width: 100%; height: auto; display: block;">
          </div>
        `;
      }
      if (description) {
        html += `<p style="color: #444; font-size: 11px; line-height: 1.5; margin: 0 0 6px 0;">${description}</p>`;
      }
    }

    // Notes - below everything
    if (activity.activity_notes) {
      html += `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 5px 10px; border-radius: 6px; margin-top: 6px;">
          <div style="display: flex; align-items: flex-start; gap: 5px;">
            ${ICONS.stickyNote}
            <span style="font-size: 10px; color: #166534;">${activity.activity_notes}</span>
          </div>
        </div>
      `;
    }

    html += '</div></div>';
    currentTime += activity.duration_minutes;
  });

  // Equipment
  if (session.equipment.length > 0) {
    html += `
      <div style="margin-top: 16px; page-break-inside: avoid;">
        <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Equipment Checklist</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${session.equipment.map(e => `<span style="display: inline-flex; align-items: center; gap: 5px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 16px; padding: 4px 12px; font-size: 11px;">${ICONS.checkSquare} ${e.name}${e.quantity ? ` <span style="color: #94a3b8;">(×${e.quantity})</span>` : ''}</span>`).join('')}
        </div>
      </div>
    `;
  }

  html += '</div>';

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html><head><title>${session.title || 'Session'}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 12mm; }
        }
      </style>
      </head>
      <body style="margin: 0; background: white;">${html}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

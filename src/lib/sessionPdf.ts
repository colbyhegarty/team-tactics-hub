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

export function exportSessionToPDF(session: Session, drillDetails?: Record<string, Drill>) {
  const totalDuration = session.activities.reduce((s, a) => s + a.duration_minutes, 0);

  const dateStr = session.session_date
    ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  let html = `
    <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 780px; margin: 0 auto; padding: 30px 20px; color: #1a1a1a;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 700; color: #111;">${session.title || 'Training Session'}</h1>
        <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #555;">
          ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
          ${session.session_time ? `<span>🕐 ${session.session_time}</span>` : ''}
          ${session.team_name ? `<span>👥 ${session.team_name}</span>` : ''}
          <span>⏱ ${totalDuration} minutes total</span>
        </div>
      </div>
  `;

  if (session.session_goals) {
    html += `
      <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <div style="font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; margin-bottom: 4px;">Session Goals</div>
        <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">${session.session_goals}</p>
      </div>
    `;
  }

  // Activities
  html += `<div style="font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 16px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;">Activities</div>`;

  let currentTime = 0;
  session.activities.forEach((activity) => {
    const title = activity.title || activity.drill_name || 'Activity';
    const description = activity.description || '';
    const drillData = activity.library_drill_id && drillDetails ? drillDetails[activity.library_drill_id] : null;
    const instructions = drillData?.instructions;

    html += `
      <div style="margin-bottom: 24px; page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
        <!-- Activity Header -->
        <div style="background: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; font-size: 14px; color: #111;">
            <span style="color: #16a34a; font-family: monospace; margin-right: 8px;">${formatTime(currentTime)}</span>
            ${title.toUpperCase()}
          </div>
          <div style="font-size: 12px; color: #666; font-weight: 600;">${activity.duration_minutes} min</div>
        </div>
        <div style="padding: 14px 16px;">
    `;

    // Diagram - full width, below header
    if (activity.drill_svg_url) {
      html += `
        <div style="margin-bottom: 12px; border-radius: 8px; overflow: hidden;">
          <img src="${activity.drill_svg_url}" style="width: 100%; height: auto; display: block;">
        </div>
      `;
    }

    // Description
    if (description) {
      html += `<p style="color: #444; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">${description}</p>`;
    }

    // Instructions from drill data
    if (instructions) {
      const points = formatBulletPoints(instructions);
      if (points.length > 0) {
        html += `
          <div style="margin-bottom: 10px;">
            <div style="font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #16a34a; margin-bottom: 6px;">Instructions</div>
            <div style="padding-left: 4px;">
              ${points.map(p => `<div style="font-size: 13px; color: #333; line-height: 1.5; margin-bottom: 4px; display: flex; gap: 8px;"><span style="color: #16a34a; font-size: 10px; margin-top: 3px;">▸</span><span>${p}</span></div>`).join('')}
            </div>
          </div>
        `;
      }
    }

    // Notes - below diagram with matching icon style
    if (activity.activity_notes) {
      html += `
        <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 8px 12px; border-radius: 6px; margin-top: 8px;">
          <div style="display: flex; align-items: flex-start; gap: 6px;">
            <span style="font-size: 11px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap;">📋 Notes:</span>
            <span style="font-size: 13px; color: #78350f;">${activity.activity_notes}</span>
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
      <div style="margin-top: 24px; page-break-inside: avoid;">
        <div style="font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;">Equipment Checklist</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${session.equipment.map(e => `<span style="display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 14px; font-size: 13px;">☐ ${e.name}${e.quantity ? ` <span style="color: #94a3b8;">(×${e.quantity})</span>` : ''}</span>`).join('')}
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
          @page { margin: 15mm; }
        }
      </style>
      </head>
      <body style="margin: 0; background: white;">${html}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

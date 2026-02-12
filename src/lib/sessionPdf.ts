import { Session } from '@/types/session';

function formatTime(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, '0')}`;
}

export function exportSessionToPDF(session: Session) {
  const totalDuration = session.activities.reduce((s, a) => s + a.duration_minutes, 0);

  let html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
      <h1 style="margin-bottom: 5px;">${session.title || 'Training Session'}</h1>
      <div style="color: #666; margin-bottom: 15px;">
        ${session.session_date ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
        ${session.session_time ? ' | ' + session.session_time : ''}
        ${session.team_name ? ' | ' + session.team_name : ''}
      </div>
      <div style="color: #666; margin-bottom: 20px;">Total Duration: ${totalDuration} minutes</div>
  `;

  if (session.session_goals) {
    html += `<div style="margin-bottom: 20px;"><strong>Session Goals:</strong><p>${session.session_goals}</p></div>`;
  }

  html += '<hr style="margin: 20px 0;">';

  let currentTime = 0;
  session.activities.forEach((activity) => {
    const title = activity.title || activity.drill_name || 'Activity';
    const description = activity.description || '';

    html += `
      <div style="margin-bottom: 25px; page-break-inside: avoid;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
          ${formatTime(currentTime)} - ${title.toUpperCase()} (${activity.duration_minutes} min)
        </div>
    `;

    if (activity.drill_svg_url) {
      html += `
        <div style="display: flex; gap: 15px; align-items: flex-start;">
          <img src="${activity.drill_svg_url}" style="width: 200px; height: 150px; object-fit: contain; background: #2d4a2d; border-radius: 8px; padding: 4px;">
          <div style="flex: 1;">
            ${description ? `<p style="color: #333;">${description}</p>` : ''}
            ${activity.activity_notes ? `<p style="background: #fffbeb; padding: 8px; border-radius: 4px; margin-top: 10px;">📝 ${activity.activity_notes}</p>` : ''}
          </div>
        </div>
      `;
    } else {
      html += `
        ${description ? `<p style="color: #333;">${description}</p>` : ''}
        ${activity.activity_notes ? `<p style="background: #fffbeb; padding: 8px; border-radius: 4px; margin-top: 10px;">📝 ${activity.activity_notes}</p>` : ''}
      `;
    }

    html += '</div>';
    currentTime += activity.duration_minutes;
  });

  if (session.equipment.length > 0) {
    html += `
      <hr style="margin: 20px 0;">
      <div><strong>Equipment Checklist:</strong>
        <div style="margin-top: 10px;">
          ${session.equipment.map(e => `☐ ${e.name}${e.quantity ? ` (${e.quantity})` : ''}`).join(' &nbsp;&nbsp; ')}
        </div>
      </div>
    `;
  }

  html += '</div>';

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html><head><title>${session.title || 'Session'}</title></head>
      <body>${html}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

// Progress share poster: canvas-drawn image, Web Share API first,
// download fallback, clipboard text as last resort.
export const SITE_URL = 'https://bluesangg.github.io/mcu-timeline/';

export function buildShareText(routeTitle, seen, total, nextTitle) {
  return `我在补《毁灭日》之前该看的漫威：「${routeTitle}」已看 ${seen}/${total} 部${nextTitle ? `，下一部《${nextTitle}》` : ''}！\n${SITE_URL}`;
}

export function drawPoster(ctx, { title, seen, total, next }) {
  const W = 1080, H = 1440;
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, W, H);
  const RED = '#ED1D24', WHITE = '#f2eee7', MUTED = '#aaa9a5';
  // red MCU box
  ctx.fillStyle = RED;
  ctx.fillRect(80, 80, 190, 92);
  ctx.fillStyle = WHITE;
  ctx.font = '700 56px Oswald, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('MCU', 175, 128);
  // route title
  ctx.textAlign = 'left';
  ctx.font = '600 60px Oswald, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(title.length > 14 ? title.slice(0, 14) + '…' : title, 80, 300);
  // big fraction
  ctx.fillStyle = RED;
  ctx.font = '700 300px Oswald, sans-serif';
  ctx.fillText(`${seen}/${total}`, 80, 600);
  // next up
  ctx.fillStyle = MUTED;
  ctx.font = '44px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(next ? `下一部：《${next.zh}》` : '全部看完，静候毁灭日', 80, 830);
  // progress bar
  const bw = 920, bx = 80, by = 900;
  ctx.fillStyle = '#2b2b30';
  ctx.fillRect(bx, by, bw, 18);
  ctx.fillStyle = RED;
  ctx.fillRect(bx, by, Math.round(bw * (total ? seen / total : 0)), 18);
  // footer
  ctx.fillStyle = MUTED;
  ctx.font = '36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('bluesangg.github.io/mcu-timeline', 80, 1330);
  ctx.fillStyle = RED;
  ctx.fillRect(80, 1240, 120, 8);
}

export async function shareProgress(document, navigator, { title, seen, total, next }) {
  const text = buildShareText(title, seen, total, next ? next.zh : '');
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (ctx) {
    try { await (document.fonts ? document.fonts.ready : Promise.resolve()); } catch { /* fall through */ }
    drawPoster(ctx, { title, seen, total, next });
    const blob = await new Promise(r => { try { canvas.toBlob(r, 'image/png'); } catch { r(null); } });
    if (blob) {
      const file = new File([blob], 'mcu-progress.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'MCU Timeline', text }); return 'shared'; }
        catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mcu-progress.png';
      document.body.appendChild(a); a.click(); a.remove();
      return 'downloaded';
    }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; }
  catch { return 'failed'; }
}

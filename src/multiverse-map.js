// Multiverse map: a schematic "rivers of time" SVG.
// Lanes are vertical (time flows downward). Nodes are key works; links are
// branch/travel events. Labels for events are spoiler-gated.
export const MAP_LANES = [
  { id: 'tva', name: 'TVA · 时间之外', box: true },
  { id: 'xmen', name: '变种人宇宙' },
  { id: 'sacred', name: '神圣时间线', trunk: true },
  { id: 'branch', name: '分支宇宙' },
  { id: 'earth-828', name: 'Earth-828' },
];
export const MAP_NODES = [
  { id: 'captain-america-the-first-avenger-2011', lane: 'sacred', row: 0 },
  { id: 'the-avengers-2012', lane: 'sacred', row: 1 },
  { id: 'avengers-endgame-2019', lane: 'sacred', row: 2 },
  { id: 'x-men-97-season-1-2024', lane: 'xmen', row: 2 },
  { id: 'loki-season-1-2021', lane: 'branch', row: 3 },
  { id: 'loki-season-2-2023', lane: 'branch', row: 4 },
  { id: 'spider-man-no-way-home-2021', lane: 'sacred', row: 4 },
  { id: 'doctor-strange-in-the-multiverse-of-madness-2022', lane: 'sacred', row: 5 },
  { id: 'deadpool-and-wolverine-2024', lane: 'branch', row: 6 },
  { id: 'thunderbolts-2025', lane: 'sacred', row: 7 },
  { id: 'the-fantastic-four-first-steps-2025', lane: 'earth-828', row: 7 },
  { id: 'avengers-doomsday-2026', lane: 'sacred', row: 8 },
];
// kind: split = a branch is born, travel = crossing between universes,
// tva = dashed TVA oversight, converge = the coming collision.
export const MAP_LINKS = [
  { from: 'avengers-endgame-2019', to: 'loki-season-1-2021', kind: 'split', label: '时间穿越，分叉开始', safe: '分支点' },
  { from: 'loki-season-1-2021', to: 'loki-season-2-2023', kind: 'tva', label: 'TVA：时间之外的管理局', safe: 'TVA' },
  { from: 'loki-season-2-2023', to: 'deadpool-and-wolverine-2024', kind: 'tva', label: '被 TVA 放逐到虚空的时间线', safe: 'TVA' },
  { from: 'the-fantastic-four-first-steps-2025', to: 'thunderbolts-2025', kind: 'travel', label: '飞船穿越宇宙而来', safe: '穿越点' },
  { from: 'x-men-97-season-1-2024', to: 'avengers-doomsday-2026', kind: 'travel', label: '变种人将被卷入碰撞', safe: '交汇' },
  { from: 'deadpool-and-wolverine-2024', to: 'avengers-doomsday-2026', kind: 'travel', label: '虚空之外的旅人', safe: '交汇' },
];
export const MAP_ROWS = 9;

const LANE_W = 140, LANE_X0 = 90, ROW_H = 66, ROW_Y0 = 76;
const laneX = i => LANE_X0 + i * LANE_W;
const rowY = r => ROW_Y0 + r * ROW_H;
const short = s => (s.length > 9 ? s.slice(0, 9) + '…' : s);

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderMap(document, works, { spoiler = 'safe', onNode } = {}) {
  const host = document.getElementById('multiverse-map');
  if (!host) return;
  const lookup = new Map(works.map(w => [w.id, w]));
  const laneIdx = Object.fromEntries(MAP_LANES.map((l, i) => [l.id, i]));
  const nodePos = {};
  MAP_NODES.forEach(n => { nodePos[n.id] = { x: laneX(laneIdx[n.lane]), y: rowY(n.row), ...n }; });

  const W = LANE_X0 * 2 + (MAP_LANES.length - 1) * LANE_W;
  const H = ROW_Y0 * 2 + (MAP_ROWS - 1) * ROW_H;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="inherit">`;

  // Lane lines + labels
  MAP_LANES.forEach((lane, i) => {
    const x = laneX(i);
    const rows = MAP_NODES.filter(n => n.lane === lane.id).map(n => n.row);
    if (lane.box) {
      const y1 = rowY(2) - 34, y2 = rowY(6) + 40;
      s += `<rect x="${x - 62}" y="${y1}" width="124" height="${y2 - y1}" rx="10" fill="none" stroke="currentColor" stroke-dasharray="5 5" opacity="0.45"/>`;
      s += `<text x="${x}" y="${y1 - 10}" text-anchor="middle" font-size="11" opacity="0.7">${esc(lane.name)}</text>`;
      return;
    }
    if (!rows.length) return;
    const y1 = rowY(Math.min(...rows)) - 30, y2 = rowY(Math.max(...rows)) + 34;
    s += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width="${lane.trunk ? 3 : 1.5}" opacity="${lane.trunk ? 0.9 : 0.45}"/>`;
    s += `<text x="${x}" y="${y1 - 10}" text-anchor="middle" font-size="11" opacity="0.7">${esc(lane.name)}</text>`;
  });

  // Links
  MAP_LINKS.forEach(lk => {
    const a = nodePos[lk.from], b = nodePos[lk.to];
    if (!a || !b) return;
    const dash = lk.kind === 'tva' ? ' stroke-dasharray="4 4"' : '';
    const mx = (a.x + b.x) / 2;
    s += `<path d="M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.55"${dash}/>`;
    const lx = (a.x + b.x) / 2, ly = (a.y + b.y) / 2;
    if (spoiler === 'full') {
      s += `<text x="${lx}" y="${ly - 8}" text-anchor="middle" font-size="10.5" opacity="0.75">${esc(lk.label)}</text>`;
    } else {
      s += `<text x="${lx}" y="${ly - 6}" text-anchor="middle" font-size="10.5" opacity="0.6">◆ ${esc(lk.safe)}</text>`;
    }
  });

  // Doomsday convergence ring
  const doom = nodePos['avengers-doomsday-2026'];
  if (doom) {
    s += `<circle cx="${doom.x}" cy="${doom.y}" r="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.8"/>`;
    s += `<text x="${doom.x}" y="${doom.y + 44}" text-anchor="middle" font-size="11" font-weight="600">三宇宙碰撞</text>`;
  }

  // Nodes
  MAP_NODES.forEach(n => {
    const w = lookup.get(n.id);
    if (!w) return;
    const p = nodePos[n.id];
    const isDoom = n.id === 'avengers-doomsday-2026';
    s += `<g class="map-node" data-node="${esc(n.id)}" style="cursor:pointer">`;
    s += `<title>${esc(w.zh)}${isDoom ? ' · 待上映' : ''}</title>`;
    s += `<circle cx="${p.x}" cy="${p.y}" r="${isDoom ? 10 : 7}" fill="var(--bg)" stroke="currentColor" stroke-width="2"/>`;
    s += `<text x="${p.x}" y="${p.y + 24}" text-anchor="middle" font-size="11">${esc(short(w.zh))}</text>`;
    s += `</g>`;
  });
  s += '</svg>';
  host.innerHTML = s;
  if (onNode) {
    host.querySelectorAll('.map-node').forEach(g => {
      g.addEventListener('click', () => onNode(g.getAttribute('data-node')));
    });
  }
}

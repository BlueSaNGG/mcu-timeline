// "How the multiverse happened": causal beats linking the works.
// Each beat states only what its work establishes (the studio never kept
// one consistent rulebook). Text is spoiler-gated: safe = vague, full = names names.
export const STORY_BEATS = [
  {
    n: '01', works: ['avengers-endgame-2019'],
    title: '时间穿越，分叉诞生',
    safe: '复仇者回到过去，时间线开始分叉。',
    full: '复仇者穿越时间偷宝石；2012 年的洛基带着宇宙魔方逃走——这条分支本该被 TVA 修剪。',
  },
  {
    n: '02', works: ['loki-season-1-2021'],
    title: '留存者之死，时间线失控',
    safe: 'TVA 失去了它的主人，分支不再被修剪。',
    full: '希尔维杀死了"留存者"，神圣时间线当场失控分叉——多元宇宙正式开闸。',
  },
  {
    n: '03', works: ['spider-man-no-way-home-2021'],
    title: '咒语失控，墙被撕开',
    safe: '一个失控的咒语，撕开了宇宙之间的墙。',
    full: '奇异博士的咒语被反复打断后失控，把其他宇宙的人拽了进来。墙早就裂了，咒语是最后一根稻草。',
  },
  {
    n: '04', works: ['doctor-strange-in-the-multiverse-of-madness-2022'],
    title: '宇宙碰撞有了名字',
    safe: '有人第一次讲清楚了"宇宙碰撞"这个概念。',
    full: '"Incursion"——两个宇宙相撞，只能活一个。这是《毁灭日》的核心威胁。',
  },
  {
    n: '05', works: ['loki-season-2-2023'],
    title: '时间线有了新的守护者',
    safe: 'TVA 从修剪改成了守护。',
    full: '洛基坐上时间尽头的王座，把无数分支护成一棵世界树。TVA 不再修剪，开始守护。',
  },
  {
    n: '06', works: ['avengers-doomsday-2026'],
    title: '三宇宙碰撞',
    safe: '12 月 18 日，三个宇宙即将相撞。',
    full: '神圣时间线、Earth-828、变种人宇宙走向碰撞。《复仇者联盟5：毁灭日》12 月 18 日上映。',
  },
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function renderStory(document, works, { spoiler = 'safe', onWork } = {}) {
  const host = document.getElementById('story-track');
  if (!host) return;
  const lookup = new Map(works.map(w => [w.id, w]));
  host.innerHTML = STORY_BEATS.map(b => {
    const chips = b.works.map(id => {
      const w = lookup.get(id);
      return w ? `<button class="story-chip" data-work="${esc(id)}">${esc(w.zh)}</button>` : '';
    }).join('');
    return `<article class="story-card"><span class="story-num">${b.n}</span><h3>${esc(b.title)}</h3><p>${esc(spoiler === 'full' ? b.full : b.safe)}</p><div class="story-works">${chips}</div></article>`;
  }).join('');
  if (onWork) {
    host.querySelectorAll('[data-work]').forEach(btn => {
      btn.addEventListener('click', () => onWork(btn.getAttribute('data-work')));
    });
  }
}

import {loadCatalog} from './data.js';
import {mountCatalog} from './timeline.js';

export function startApplication({document, load = loadCatalog, mount = mountCatalog} = {}) {
  if (!document) throw new TypeError('document is required');
  let busy = false;
  let dispose = null;
  async function boot() {
    if (busy || dispose) return;
    busy = true;
    const timeline = document.getElementById('timeline');
    timeline.replaceChildren();
    document.getElementById('result-count').textContent = '正在整理时间线…';
    const controls = [...document.querySelectorAll('.controls button, .controls input, #clear')];
    controls.forEach(control => {control.disabled = true;});
    try {
      const catalog = await load();
      dispose = mount(catalog, {document});
      controls.forEach(control => {control.disabled = false;});
    } catch {
      document.getElementById('countdown').hidden = true;
      document.getElementById('result-count').textContent = '作品资料暂不可用';
      const panel = document.createElement('div');
      panel.className = 'empty';
      panel.setAttribute('role', 'alert');
      const title = document.createElement('h3');
      title.textContent = '作品资料加载失败';
      const explanation = document.createElement('p');
      explanation.textContent = '请检查网络后重试。';
      const retry = document.createElement('button');
      retry.className = 'chip';
      retry.textContent = '重试';
      retry.addEventListener('click', boot);
      panel.append(title, explanation, retry);
      timeline.replaceChildren(panel);
    } finally {
      busy = false;
    }
  }
  return {ready: boot(), retry: boot, dispose: () => dispose?.()};
}

if (typeof document !== 'undefined') startApplication({document});

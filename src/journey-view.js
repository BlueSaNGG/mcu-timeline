import {buildRoutes, routeProgress} from './routes.js';
import {renderMap} from './multiverse-map.js';
import {renderStory} from './multiverse-story.js';
import {ARTWORK} from './artwork.js';
// Compatibility view: preserves legacy behavior until the audited model cutover.
export function mountCatalog(catalog, {document, now = () => Date.now(), schedule = setInterval, cancel = clearInterval} = {}) {
  if (!document) throw new TypeError('document is required');
  const SOURCE_DATA = catalog;
  const CHRONO_ORDER = catalog.chrono_order;
const rank=Object.fromEntries(CHRONO_ORDER.map((x,i)=>[x,i]));
const UNIVERSE_LABELS={sacred:'神圣时间线','earth-828':'Earth-828',xmen:'变种人宇宙',branch:'分支',tva:'分支'};
function formatInUniverse(value){if(!value||!value.start)return '时间未定/时间之外';const start=String(value.start),end=value.end==null?'':String(value.end);if(end&&end!==start){if(/^\d{4}$/.test(start)&&/^\d{4}$/.test(end))return start+'–'+end+'年';return start+'–'+end}return /^\d{4}$/.test(start)?start+'年':start}
function formatWorkType(x){if(x.type==='film')return '电影';if(x.type==='short')return '短片'+(x.runtime_min?'（'+x.runtime_min+'分钟）':'');if(x.episodes===1)return '特别篇';return x.episodes?'剧集（'+x.episodes+'集）':'剧集'}
function formatSaga(value){return value==='Infinity Saga'?'无限传奇':'多元宇宙传奇'}
const DATA=SOURCE_DATA.works.map((x,i)=>({
  ...x,idx:i,zh:x.title_cn,en:x.title,format:formatWorkType(x),sagaLabel:formatSaga(x.saga),release:x.release_date||'日期待定',
  desc:x.synopsis_cn,chars:x.key_characters||[],line:UNIVERSE_LABELS[x.universe]||'分支',typeKey:x.type==='film'?'电影':x.type==='short'?'短片':'剧集',
  releaseKey:x.release_date||'9999-12-31',chrono:rank[x.id]??999,upcoming:x.status==='upcoming',time:formatInUniverse(x.in_universe),
  note:x.in_universe&&x.in_universe.note?x.in_universe.note:''
}));
const window = document.defaultView;
const state={sort:'release',phase:'all',saga:'all',line:'all',type:'all',q:'',spoiler:'safe',remaining:false,progress:false};
const watched = new Set();
const routes=buildRoutes(DATA,CHRONO_ORDER);
let activeRoute=null,selectedRoute='doomsday',routeRemaining=false;
const removers=[];
function on(el,type,handler){if(!el)return;el.addEventListener(type,handler);removers.push(()=>el.removeEventListener(type,handler));}
function notifyStorage(){document.getElementById('storage-notice').textContent='暂时无法保存；当前操作仅在本次页面有效。';}
try {const saved=JSON.parse(window.localStorage.getItem('mcu-watched-v1')||'[]');if(Array.isArray(saved))saved.filter(id=>DATA.some(x=>x.id===id)).forEach(id=>watched.add(id));state.spoiler=window.localStorage.getItem('mcu-spoiler-v1')==='full'?'full':'safe';const savedRoute=window.localStorage.getItem('mcu-route-v1');if(Object.hasOwn(routes,savedRoute)){activeRoute=savedRoute;selectedRoute=savedRoute;}const savedTab=window.localStorage.getItem('mcu-route-tab-v1');if(Object.hasOwn(routes,savedTab))selectedRoute=savedTab;const savedSort=window.localStorage.getItem('mcu-sort-v1');if(savedSort==='release'||savedSort==='chrono')state.sort=savedSort;}catch{notifyStorage();}
function save(){try{window.localStorage.setItem('mcu-watched-v1',JSON.stringify([...watched]));window.localStorage.setItem('mcu-spoiler-v1',state.spoiler);if(activeRoute)window.localStorage.setItem('mcu-route-v1',activeRoute);window.localStorage.setItem('mcu-route-tab-v1',selectedRoute);window.localStorage.setItem('mcu-sort-v1',state.sort);}catch{notifyStorage();}}
function heroProgress(){
 const route=routes[activeRoute||'release'],status=routeProgress(route,watched);
 const next=activeRoute?status.next:route.works[0];
 document.getElementById('hero-title').innerHTML=activeRoute?(next?'你的旅程，<br>继续向前。':'这一段旅程，<br>你已走完。'):'每个宇宙，<br>都有一个起点。';
 document.getElementById('journey-status').textContent=activeRoute?route.title+' · '+status.seen+' / '+status.total+' 已看':(watched.size?'已记录 '+watched.size+' 部 · 选择路线后开始旅程':'上映顺序 · 适合首次观看');
 document.getElementById('start-route').textContent=activeRoute?(next?'继续浏览：'+next.zh+' ↗':'查看已完成路线 ↗'):'开始首次观看路线 ↗';
 document.getElementById('feature-title').textContent=next?next.zh:'路线已完成';
 document.getElementById('feature-year').textContent=next?(next.release.slice(0,4)+' / 第 '+next.phase+' 阶段'):route.works.length+' / '+route.works.length+' 部';
 document.getElementById('feature-phase').textContent=next?'PHASE '+next.phase:'COMPLETE';
 document.getElementById('feature-label').textContent=activeRoute?(next?'UP NEXT':'JOURNEY COMPLETE'):'THE BEGINNING';
 document.getElementById('feature-caption').textContent=next?(activeRoute?'你的下一部作品。':'一段旅程的开始。'):'保留你的记录，开启新的探索。';
 document.getElementById('feature-number').textContent=next?String(route.works.indexOf(next)+1).padStart(2,'0'):'✓';
 document.getElementById('feature-type').textContent=next?next.en.toUpperCase():'ALL DONE.';
 const art=next&&ARTWORK[next.id],feature=document.getElementById('feature'),image=document.getElementById('feature-image'),credit=document.getElementById('art-credit');
 if(art){credit.href=art.source;credit.hidden=false;image.alt=next.zh+'官方海报';if(image.getAttribute('src')!==art.src){feature.classList.remove('has-art');image.hidden=false;image.src=art.src;}}
 else{feature.classList.remove('has-art');image.hidden=true;image.removeAttribute('src');credit.hidden=true;credit.removeAttribute('href');}
}
function renderRoute(){
 const route=routes[selectedRoute],status=routeProgress(route,watched);
 document.getElementById('route-title').textContent=route.title;
 document.getElementById('route-description').textContent=route.description;
 document.getElementById('route-tag').textContent=activeRoute===selectedRoute?'当前路线':'路线预览';
 document.getElementById('route-count').textContent=status.seen+' / '+status.total+' 已看';
 document.getElementById('route-next').textContent=status.next?'下一部：'+status.next.zh:'这条路线已完成';
 const progress=document.getElementById('route-progress');progress.max=status.total;progress.value=status.seen;
 document.getElementById('activate-route').textContent=activeRoute===selectedRoute?(status.next?'继续这条路线 ↗':'查看完成记录 ↗'):'开始这条路线 ↗';
 document.getElementById('route-hint').textContent=activeRoute===selectedRoute?'已保存活动路线；切换路线会保留所有已看记录。':'预览不会改变你的活动路线；点击开始后才保存。';
 document.getElementById('route-remaining').setAttribute('aria-pressed',String(routeRemaining));
 document.getElementById('route-size').textContent=routeRemaining?'剩余 '+(status.total-status.seen)+' 部':status.total+' 部';
 document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===selectedRoute)));
 document.getElementById('route-list').innerHTML=route.works.map((x,i)=>({x,i})).filter(({x})=>!routeRemaining||!watched.has(x.id)).map(({x,i})=>`<li class="${watched.has(x.id)?'watched':''} ${status.next?.id===x.id?'next':''}" id="route-work-${esc(x.id)}"><span class="route-index">${String(i+1).padStart(2,'0')}</span><div class="route-work"><b>${esc(x.zh)}</b>${route.why&&route.why[x.id]?`<span class="route-why">${esc(route.why[x.id])}</span>`:''}<small>${esc(x.release.slice(0,4))} · ${status.next?.id===x.id?'下一部':watched.has(x.id)?'已看':'未看'}</small></div><button class="watch-button" data-watch="${esc(x.id)}" aria-pressed="${watched.has(x.id)}" aria-label="${watched.has(x.id)?'标记未看':'标记已看'}：${esc(x.zh)}">${watched.has(x.id)?'✓ 已看 · 撤销':'＋ 已看'}</button></li>`).join('')||'<li>全部看完了。切换到完整路线查看记录。</li>';
}
function activateSelection(){activeRoute=selectedRoute;save();heroProgress();renderRoute();document.getElementById('route-details').open=true;document.getElementById('routes').scrollIntoView?.();}
on(document.getElementById('feature-image'),'load',()=>{document.getElementById('feature').classList.add('has-art');});
on(document.getElementById('feature-image'),'error',()=>{document.getElementById('feature-image').hidden=true;document.getElementById('feature').classList.remove('has-art');document.getElementById('art-credit').hidden=true;});
on(document.getElementById('activate-route'),'click',activateSelection);
on(document.getElementById('route-remaining'),'click',()=>{routeRemaining=!routeRemaining;renderRoute();document.getElementById('route-details').open=true;});
function applySpoiler(){if(state.spoiler==='safe'){state.line='all';const group=document.querySelector('[data-filter="line"]');group.closest('.filter-group').hidden=true;document.querySelector('.legend').hidden=true;group.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===0);b.setAttribute('aria-pressed',String(i===0));});}else{document.querySelector('[data-filter="line"]').closest('.filter-group').hidden=false;document.querySelector('.legend').hidden=false;}document.querySelectorAll('[data-spoiler]').forEach(b=>{const active=b.dataset.spoiler===state.spoiler;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});document.getElementById('search').placeholder=state.spoiler==='safe'?'搜索中文名或英文名':'搜索作品、剧情或角色';save();render();drawMap();drawStory();}
function focusWork(id){Object.assign(state,{phase:'all',saga:'all',line:'all',type:'all',q:'',remaining:false,progress:false});resetControls();render();const el=document.getElementById('work-'+id);if(!el)return;el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1800);}
function drawMap(){renderMap(document,DATA,{spoiler:state.spoiler,onNode:focusWork});}
function drawStory(){renderStory(document,DATA,{spoiler:state.spoiler,onWork:focusWork});}

function eraFor(x){if(state.spoiler==='safe'&&state.sort==='chrono')return{key:'safe-chrono',title:'故事时间',sub:'剧情时间与宇宙说明已隐藏'};if(state.sort==='release')return{key:'p'+x.phase,title:'PHASE '+x.phase,sub:x.phase<=3?'无限传奇':'多元宇宙传奇'};const n=x.chrono;if(n<=4)return{key:'origin',title:'起源与旧世界',sub:'公元前 1260 — 1998'};if(n<=17)return{key:'heroes',title:'英雄纪元',sub:'2008 — 2015'};if(n<=32)return{key:'war',title:'分裂与终局',sub:'2016 — 2023'};if(n<=57)return{key:'multiverse',title:'多元宇宙开启',sub:'2024 — 2026'};return{key:'collision',title:'三界汇流',sub:'2027 → 待揭晓'}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function formatCredits(x){
 if(x.type==='film'||x.type==='short'){const parts=[];if(x.director)parts.push('导演 '+x.director);if(x.runtime_min)parts.push(x.runtime_min+' 分钟');return parts.length?`<p class="credits">${esc(parts.join(' · '))}</p>`:''}
 if(x.episodes===1)return '';
 const s=x.seasons>1?x.seasons+' 季 · ':'';
 return `<p class="credits">${s}${x.episodes?'共 '+x.episodes+' 集':'待播出'}</p>`;
}
function renderCard(x){const seen=watched.has(x.id);const more=state.spoiler==='full'
?`<div class="dates"><div class="datecell"><span>宇宙内时间点</span><b>${esc(x.time)}</b></div><div class="datecell"><span>${x.upcoming?'目录计划日期 · 待核验':'首映 / 上线'}</span><b>${esc(x.release)}</b></div></div><p class="desc">${esc(x.desc)}</p><div class="cast">${x.chars.slice(0,6).map(c=>`<span>${esc(c)}</span>`).join('')}</div>${x.note?`<div class="note">${esc(x.note)}</div>`:''}`
:`<div class="dates"><div class="datecell"><span>${x.upcoming?'目录计划日期 · 待核验':'首映 / 上线'}</span><b>${esc(x.release)}</b></div></div><p class="safe-note">无剧透 · 仅展示基础信息</p>`;
return `<article class="card ${seen?'watched':''}" data-line="${esc(state.spoiler==='full'?x.line:'hidden')}" id="work-${esc(x.id)}"><div class="meta"><span class="badge phase">PHASE ${x.phase}</span><span class="badge">${esc(x.format)}</span>${state.spoiler==='full'?`<span class="badge line">${esc(x.line)}</span>`:''}${x.upcoming?'<span class="badge status">待上映</span>':''}</div><h3>${esc(x.zh)}</h3><p class="en">${esc(x.en)}</p>${formatCredits(x)}<details class="card-more"><summary>展开详情</summary>${more}</details>${!x.upcoming?`<button class="watch-button" data-watch="${esc(x.id)}" aria-pressed="${seen}" aria-label="${seen?'标记未看':'标记已看'}：${esc(x.zh)}">${seen?'✓ 已看 · 点击撤销':'＋ 标记已看'}</button>`:''}</article>`}
function render(){const q=state.q.trim().toLowerCase();let rows=DATA.filter(x=>(state.phase==='all'||String(x.phase)===state.phase)&&(state.saga==='all'||x.sagaLabel===state.saga)&&(state.line==='all'||x.line===state.line)&&(state.type==='all'||x.typeKey===state.type)&&(!state.remaining||!watched.has(x.id))&&(!state.progress||watched.has(x.id))&&(!q||(state.spoiler==='safe'?[x.zh,x.en]:[x.zh,x.en,x.desc,x.time,x.chars.join(' ')]).join(' ').toLowerCase().includes(q)));rows.sort(state.sort==='chrono'?(a,b)=>a.chrono-b.chrono:(a,b)=>a.releaseKey.localeCompare(b.releaseKey)||a.idx-b.idx);document.getElementById('result-count').textContent=`显示 ${rows.length} / ${DATA.length} 部作品`;document.getElementById('view-title').textContent=state.progress?'我的进度':state.sort==='chrono'?'宇宙内编年史':'上映顺序';const el=document.getElementById('timeline');if(!rows.length){el.innerHTML=state.progress?'<div class="empty"><h3>还没有观看记录</h3><p>在作品下方标记已看，回到这里查看你的进度。</p></div>':'<div class="empty"><h3>没有匹配作品</h3><p>试试清除搜索词或调整筛选条件。</p></div>';return}const groups=[];rows.forEach(x=>{const g=eraFor(x);let last=groups[groups.length-1];if(!last||last.key!==g.key){last={...g,items:[]};groups.push(last)}last.items.push(x)});el.innerHTML=groups.map(g=>`<section class="group"><header class="group-label"><b>${g.title}</b><span>${g.sub}</span></header><div class="cards">${g.items.map(renderCard).join('')}</div></section>`).join('')}
function changeSort(sort){state.progress=false;state.sort=sort;save();document.querySelectorAll('[data-sort]').forEach(b=>{const active=b.dataset.sort===sort;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}
document.querySelectorAll('[data-sort]').forEach(btn=>on(btn,'click',()=>changeSort(btn.dataset.sort)));
document.querySelectorAll('[data-route]').forEach(btn=>on(btn,'click',()=>{selectedRoute=btn.dataset.route;routeRemaining=false;save();renderRoute();document.getElementById('routes').scrollIntoView?.();}));
on(document.getElementById('start-route'),'click',e=>{e.preventDefault();selectedRoute=activeRoute||'doomsday';activateSelection();});
on(document.getElementById('copy-list'),'click',async e=>{const btn=e.currentTarget;const route=routes[selectedRoute];const lines=route.works.map((x,i)=>`${i+1}. ${x.zh}${watched.has(x.id)?' ✓':''}`);const text=`${route.title}\n${lines.join('\n')}\nhttps://bluesangg.github.io/mcu-timeline/`;try{await window.navigator.clipboard.writeText(text);btn.textContent='已复制，去粘贴吧';}catch{btn.textContent='复制失败';}setTimeout(()=>{btn.textContent='复制补番清单';},2200);});
document.querySelectorAll('[data-filter]').forEach(group=>on(group,'click',e=>{const b=e.target.closest('button');if(!b)return;group.querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});state[group.dataset.filter]=b.dataset.value;render();}));
on(document.getElementById('search'),'input',e=>{if(e.isComposing)return;state.q=e.target.value;render();});
on(document.getElementById('search'),'compositionend',e=>{state.q=e.target.value;render();});
function resetControls(){document.getElementById('search').value='';document.querySelectorAll('[data-filter]').forEach(g=>g.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('active',i===0);b.setAttribute('aria-pressed',String(i===0));}));document.getElementById('remaining').setAttribute('aria-pressed',String(state.remaining));}
on(document.getElementById('clear'),'click',()=>{Object.assign(state,{phase:'all',saga:'all',line:'all',type:'all',q:'',remaining:false,progress:false});resetControls();render();});
on(document.getElementById('remaining'),'click',()=>{state.progress=false;state.remaining=!state.remaining;document.getElementById('remaining').setAttribute('aria-pressed',String(state.remaining));render();});
function showProgress(){Object.assign(state,{phase:'all',saga:'all',line:'all',type:'all',q:'',remaining:false,progress:true});resetControls();render();}
on(document.getElementById('progress-link'),'click',showProgress);on(document.getElementById('mobile-progress'),'click',showProgress);
function showAll(){if(!state.progress)return;state.progress=false;render();}
on(document.getElementById('all-link'),'click',showAll);on(document.getElementById('mobile-timeline'),'click',showAll);
function toggleWatched(e){const b=e.target.closest('[data-watch]');if(!b)return;const id=b.dataset.watch,container=e.currentTarget;watched.has(id)?watched.delete(id):watched.add(id);save();heroProgress();render();renderRoute();const target=container.querySelector('[data-watch="'+id+'"]');if(target)target.focus({preventScroll:true});else document.getElementById(container.id==='route-list'?'route-remaining':'remaining').focus({preventScroll:true});}
on(document.getElementById('timeline'),'click',toggleWatched);on(document.getElementById('route-list'),'click',toggleWatched);
const dialog=document.getElementById('spoiler-dialog');let trigger=null;
function closeDialog(){if(dialog.close)dialog.close();else dialog.removeAttribute('open');trigger?.focus();}
document.querySelectorAll('[data-spoiler]').forEach(b=>on(b,'click',()=>{if(b.dataset.spoiler===state.spoiler)return;if(b.dataset.spoiler==='full'){trigger=b;if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}else{state.spoiler='safe';applySpoiler();}}));
on(dialog,'cancel',()=>{trigger?.focus();});
const UNIVERSES=[
 {line:'神圣时间线',name:'神圣时间线',en:'SACRED TIMELINE',blurb:'主宇宙的故事，复仇者们的家园。'},
 {line:'Earth-828',name:'Earth-828',en:'EARTH-828',blurb:'复古未来的平行宇宙。'},
 {line:'变种人宇宙',name:'变种人宇宙',en:'X-MEN UNIVERSE',blurb:'变种人的动画宇宙。'},
 {line:'分支',name:'分支宇宙',en:'BRANCHED',blurb:'分岔的时间线，以及时间之外的一切。'},
];
function renderMultiverse(){const grid=document.getElementById('universe-grid');if(!grid)return;grid.innerHTML=UNIVERSES.map(u=>{const n=DATA.filter(x=>x.line===u.line).length;return `<button class="universe-card" data-universe="${esc(u.line)}"><span class="universe-count">${n}</span><span class="universe-name">${esc(u.name)}</span><span class="universe-en">${u.en}</span><span class="universe-blurb">${u.blurb}</span><span class="universe-go">查看作品 <span aria-hidden="true">→</span></span></button>`}).join('')}
function applyUniverse(line){state.progress=false;state.line=line;const group=document.querySelector('[data-filter="line"]');group.querySelectorAll('button').forEach(b=>{const active=b.dataset.value===line;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}
let pendingUniverse=null;
on(document.getElementById('universe-grid'),'click',e=>{const b=e.target.closest('[data-universe]');if(!b)return;const line=b.dataset.universe;if(state.spoiler==='full'){applyUniverse(line);document.getElementById('collection').scrollIntoView?.()}else{pendingUniverse=line;trigger=b;if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','')}});
on(document.getElementById('confirm-spoiler'),'click',()=>{state.spoiler='full';applySpoiler();closeDialog();if(pendingUniverse){applyUniverse(pendingUniverse);pendingUniverse=null;document.getElementById('collection').scrollIntoView?.()}});
on(document.getElementById('cancel-spoiler'),'click',()=>{pendingUniverse=null;closeDialog()});
function getCountdownTarget(){const timestamp=now();return DATA.filter(x=>x.upcoming&&x.type==='film'&&/^\d{4}-\d{2}-\d{2}$/.test(x.release_date||'')).map(x=>({...x,targetTime:new Date(x.release_date+'T00:00:00').getTime()})).filter(x=>x.targetTime>timestamp).sort((a,b)=>a.targetTime-b.targetTime)[0]||null}
function tick(){const panel=document.getElementById('countdown'),target=getCountdownTarget();if(!target){panel.hidden=true;return}panel.hidden=false;document.getElementById('countdown-name').textContent='《'+target.zh+'》';document.getElementById('countdown-en').textContent=target.en.toUpperCase();document.getElementById('countdown-date').textContent=target.release_date.split('-').join(' · ');const diff=target.targetTime-now();const d=Math.floor(diff/864e5),h=Math.floor(diff/36e5)%24,m=Math.floor(diff/6e4)%60,s=Math.floor(diff/1e3)%60;['days','hours','mins','secs'].forEach((id,i)=>document.getElementById(id).textContent=String([d,h,m,s][i]).padStart(2,'0'))}
tick();const timer=schedule(tick,1000);document.getElementById('total-stat').textContent=DATA.length;resetControls();heroProgress();renderRoute();renderMultiverse();drawMap();drawStory();applySpoiler();changeSort(state.sort);

  return () => {cancel(timer);removers.forEach(remove=>remove());};
}

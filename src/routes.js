// Editorial route scope is fixed: 23 Infinity Saga films, no series or future releases.
const MEMBERS = [
  "iron-man-2008",
  "the-incredible-hulk-2008",
  "iron-man-2-2010",
  "thor-2011",
  "captain-america-the-first-avenger-2011",
  "the-avengers-2012",
  "iron-man-3-2013",
  "thor-the-dark-world-2013",
  "captain-america-the-winter-soldier-2014",
  "guardians-of-the-galaxy-2014",
  "avengers-age-of-ultron-2015",
  "ant-man-2015",
  "captain-america-civil-war-2016",
  "doctor-strange-2016",
  "guardians-of-the-galaxy-vol-2-2017",
  "spider-man-homecoming-2017",
  "thor-ragnarok-2017",
  "black-panther-2018",
  "avengers-infinity-war-2018",
  "ant-man-and-the-wasp-2018",
  "captain-marvel-2019",
  "avengers-endgame-2019",
  "spider-man-far-from-home-2019"
];
export function buildRoutes(works, chronology) {
 const lookup=new Map(works.map(x=>[x.id,x]));
 const members=MEMBERS.map(id=>lookup.get(id)).filter(Boolean);
 const rank=new Map(chronology.map((id,i)=>[id,i]));
 return {
 release:{id:'release',title:'首次观看 · 无限传奇',description:'23 部电影，按上映顺序观看。适合第一次进入漫威；不包含剧集和后续传奇。',reason:'保留影片原本的揭晓顺序。',works:[...members].sort((a,b)=>a.release_date.localeCompare(b.release_date))},
 chrono:{id:'chrono',title:'重温故事 · 无限传奇',description:'同样的 23 部电影，按目录中的故事时间排列。适合已经看过、想重新串起故事的观众；彩蛋可能涉及后续作品。',reason:'重温时间脉络；故事排序沿用现有目录，仍待逐项核验。',works:[...members].sort((a,b)=>(rank.get(a.id)??Infinity)-(rank.get(b.id)??Infinity))}
 };
}
export function routeProgress(route,watched){const seen=route.works.filter(x=>watched.has(x.id)).length;return {seen,total:route.works.length,next:route.works.find(x=>!watched.has(x.id))||null};}

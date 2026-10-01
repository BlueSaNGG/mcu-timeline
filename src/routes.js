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
// Doomsday prep: the minimal pre-Doomsday set. Release order. Whys are
// spoiler-safe by design (no plot reveals, only viewing guidance).
const DOOMSDAY_MEMBERS=[
 "avengers-infinity-war-2018",
 "avengers-endgame-2019",
 "loki-season-1-2021",
 "spider-man-no-way-home-2021",
 "doctor-strange-in-the-multiverse-of-madness-2022",
 "loki-season-2-2023",
 "deadpool-and-wolverine-2024",
 "x-men-97-season-1-2024",
 "thunderbolts-2025",
 "the-fantastic-four-first-steps-2025",
 "avengers-doomsday-2026"
];
const DOOMSDAY_WHY={
 "avengers-infinity-war-2018":"先建立宇宙级威胁的量级——毁灭日的敌人是这个级别的",
 "avengers-endgame-2019":"时间穿越如何制造分支宇宙；也是史蒂夫·罗杰斯故事的上一站",
 "loki-season-1-2021":"TVA 和多元宇宙的基本规则，都在这季交代清楚",
 "spider-man-no-way-home-2021":"不同宇宙的熟面孔在大银幕相遇的先例",
 "doctor-strange-in-the-multiverse-of-madness-2022":"「宇宙碰撞」这个概念第一次被讲透——它是毁灭日的核心威胁",
 "loki-season-2-2023":"时间线如今由谁守着，看完就懂 TVA 的现状",
 "deadpool-and-wolverine-2024":"TVA 的另一面：虚空、被抛弃的时间线、锚点人物",
 "x-men-97-season-1-2024":"变种人宇宙的代表作；毁灭日里 X 战警登场，先熟悉这个宇宙的气质",
 "thunderbolts-2025":"新一代复仇者集结；片尾记得留到最后",
 "the-fantastic-four-first-steps-2025":"认识 Earth-828 的神奇四侠；片尾同样留到最后",
 "avengers-doomsday-2026":"12 月 18 日，三宇宙碰撞"
};
export function buildRoutes(works, chronology) {
 const lookup=new Map(works.map(x=>[x.id,x]));
 const members=MEMBERS.map(id=>lookup.get(id)).filter(Boolean);
 const doomMembers=DOOMSDAY_MEMBERS.map(id=>lookup.get(id)).filter(Boolean);
 const rank=new Map(chronology.map((id,i)=>[id,i]));
 return {
 release:{id:'release',title:'首次观看 · 无限传奇',description:'23 部电影，按上映顺序观看。适合第一次进入漫威；不包含剧集和后续传奇。',reason:'保留影片原本的揭晓顺序。',works:[...members].sort((a,b)=>a.release_date.localeCompare(b.release_date))},
 chrono:{id:'chrono',title:'重温故事 · 无限传奇',description:'同样的 23 部电影，按目录中的故事时间排列。适合已经看过、想重新串起故事的观众；彩蛋可能涉及后续作品。',reason:'重温时间脉络；故事排序沿用现有目录，仍待逐项核验。',works:[...members].sort((a,b)=>(rank.get(a.id)??Infinity)-(rank.get(b.id)??Infinity))},
 doomsday:{id:'doomsday',title:'毁灭日补课 · 三宇宙前传',description:'12 月 18 日《毁灭日》上映前补完这 11 部：多元宇宙的规则、三个宇宙的来历、毁灭博士的伏笔。按上映顺序观看，每部附一句话看点（无剧透）。',reason:'三宇宙碰撞前的最小必看集合。',why:DOOMSDAY_WHY,works:[...doomMembers].sort((a,b)=>a.release_date.localeCompare(b.release_date))}
 };
}
export function routeProgress(route,watched){const seen=route.works.filter(x=>watched.has(x.id)).length;return {seen,total:route.works.length,next:route.works.find(x=>!watched.has(x.id))||null};}

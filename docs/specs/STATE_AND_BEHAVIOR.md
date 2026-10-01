# 状态与行为契约

需求编号 ST-*。业务规则集中为纯函数或独立模块，页面只读取衍生结果。未明确需求不新增偏好或推测用户意图。

## ST-01 状态归属

| 状态 | 存放 | 默认 |
| --- | --- | --- |
| view、routeId、query、sort、filters、hideWatched | hash URL | home、空、空、release、all、false |
| spoilerMode、spoilerConsent | mcu:prefs:v1 | safe、false |
| watchedIds、activeRouteId | mcu:progress:v1 | []、null |
| 单部展开集合 revealedWorkIds | 页面内存 | 空集合 |
| 加载/错误/导入预览/弹窗 | 页面内存 | 空 |
| 作品与路线 | 审核过的 catalog | 只读 |

prefs 形状：{version:1, spoilerMode:"safe"|"full", spoilerConsent:boolean}。
progress 形状：{version:1, watchedIds:string[], activeRouteId:string|null, updatedAt:ISO时间}。
两个存储键互不覆盖。读取未支持的更高版本时不自动覆写原数据；提示导出/升级，并在本次页面使用默认状态；自动写入暂停，保留高版本原数据，只有用户明确确认恢复或重置才替换。

## ST-02 初始化

读取资料与本机设置 → 验证 shape 与引用 → 解析 URL → 衍生可见数据 → 首次渲染。
full 仅在 spoilerConsent === true 时有效，否则 safe。避免先渲染 full 再隐藏。
资料加载失败显示错误页，允许重试；重试不清空有效本机记录。
有多个数据文件时只在全部加载和交叉校验通过后替换 catalog，禁止半套新旧数据混用。

## ST-03 URL 合约

示例（相对应用根，不是部署地址）：
- #/home
- #/catalog?q=托尼&sort=release&phase=1&type=film&hideWatched=1
- #/route/infinity-release?remaining=1

catalog 参数：q、sort=release|story|recommended、phase=all|1..6、saga=all|infinity|multiverse、universe=all|实体id、type=all|film|seriesSeason|special、hideWatched=0|1。
route 参数 remaining=0|1。其他字段忽略并移除，尤其 mode/spoiler 不得开启剧透。
使用 URLSearchParams 编码；默认值可省略，canonical 顺序固定，生成链接不依赖手写字符串拼接。
未知 view/routeId 显示“页面或路线不存在”，有回首页按钮；非法筛选值回默认，不崩溃。
页面导航 push 历史；搜索/筛选变动 replace 当前历史，避免每个字占一个返回步骤。浏览器前后恢复对应 URL。
分享 URL 可含显式用户搜索词，复制前显示目标；默认无模式/单部展开/进度。分享路线只复制路线 id，不带搜索词。

## ST-04 剧透状态机

safe → 请求 full：
- 从未确认：打开提醒，保持 safe；确认才更新 full/consent，并保存。
- 有效 consent：直接 full。
取消提醒保持所有既有状态。
full → safe：同步清空 revealedWorkIds、过滤敏感 DOM、重建安全搜索结果；不丢查询/焦点锚点/已看/路线。
每次全局模式变化均清空单部展开；再次主动操作可展开。
可见性公式：safe 块始终可见；spoiler 块当全局 full 或 spoilerWorkIds 全部属于 revealedWorkIds 时可见。
全局搜索只考虑全局 mode，不考虑单部展开。静态公共元信息始终 safe。

若作品关联、宇宙/时间字段本身是 spoiler，safe 卡片使用“相关资料含剧透”中性占位；该字段不能用于 safe 筛选、计数、搜索或排序。由审核提供安全投影和 storyOrderSafe，避免顺序/分组本身泄露。
不让一个 spoiler 角色的安全 character 名称绕过作品关联标签。

## ST-05 搜索、排序、筛选

正规化：Unicode NFKC、trim、英文小写、连续空白归一。保留中文，不做未经验证的繁简自动映射；常见繁体由 aliases 补充。
索引：作品安全标题/别名/安全简介 + 可见角色关联的角色名称/别名；full 增加审核过的敏感段。不自动从安全简介猜角色关联。
排序：精确标题 > 精确角色别名 > 标题/角色包含 > 简介包含；同级按当前 sort，最后按 id。无 q 时仅按 sort。
release：displayReleaseEventId 对应日期升序；未知最后；同日按 id。不以未来日期自动改 status。
story：安全模式用 storyOrderSafe，full 用 storyOrderFull；在宇宙内按明确 rank 排列，未知/时间之外/诗选单列；不同宇宙分组不声称互相先后。
recommended：当前唯一精选路线成员先按其顺序，其他单列“未包含在当前推荐路线”；不伪装成全目录权威观看顺序。
筛选组之间 AND，组内单选。null 分类不匹配具体分类，但属于 all。隐藏已看依据 watchedIds。
safe 宇宙筛选只使用可见宇宙字段；含剧透的分组不暴露隐藏关联。
关键词、筛选条件不依赖摘要里碰巧出现的中文称号来补齐角色搜索。

## ST-06 已看与路线

toggleWatched(id) 只修改该 id。写入成功后更新时间；失败保留内存操作并提示。
开始路线只修改 activeRouteId，不修改 watchedIds；查看路线不等于开始。
nextWork = 路线顺序中首个不在 watchedIds 的成员；不存在则 completed。
remainingMinutes = 未看成员已知 runtimeMinutes 之和；missingRuntimeCount 单独列出。可选路线后续再引入，不提前建状态。
删除/修改数据时保留未知 watchedIds 在导出内，不渲染成伪造作品；提示“N 条记录当前目录无法匹配”。

## ST-07 导出/导入

导出：version、kind:"mcu-progress"、exportedAt、watchedIds、activeRouteId。不得混入剧透偏好。
导入最大 1MiB：合法 JSON、kind/version、字符串 id 数组、无重复、活动路线字符串/null；只接受定义字段，不把任意对象合并进应用状态。
未知作品剔除并列出数量，未知路线变 null。未支持版本报错，不猜迁移。
采用“替换”恢复，无隐式合并；显示预览，明确确认后一次写入。取消、非法文件、超限文件均不改变原数据。
清空保留 prefs；页面当次保留操作前备份，可提供撤销。导入前提醒导出当前记录。
多标签页 storage 事件：有效进度更新同步；若当前有导入预览则取消预览并提示“其他页面更新了进度，请重新导入”。偏好外部变动同样校验，safe/full 变化执行同一清除规则。

## ST-08 接口约定

normalizeQuery、buildVisibleCatalog(catalog, mode, revealedIds)、searchWorks(visibleCatalog,q)、filterWorks、sortWorks、deriveRouteProgress、parseHash、serializeHash、readPrefs、readProgress、exportProgress、validateImport。
每个接口有清晰输入输出，未知值有处理。模块不得直接调用页面 DOM 来推断业务状态。
render 不重写全部页面导致输入焦点丢失；敏感内容移除不得仅使用隐藏样式。

# 数据合约与编辑审核

需求编号 DATA-*。catalog.schema.json 是可执行的 JSON Schema draft 2020-12；规范文件存在不代表生产资料已核实。

## DATA-01 文件和兼容

MVP 数据统一输出 data/catalog.json，按 schema 验证，避免多文件发布中途版本不一致。后续可拆编辑输入文件，但运行时必须使用同版本合成 catalog。
旧计划的 data/works.json 等是编辑职责示意，本规格决定首版实际格式。
初次迁移建立 docs/LEGACY_ID_MAP.md，列出全部原有 id；禁止删除或改名以掩盖迁移错误。旧字段映射：
- title_cn/title → titleZh/titleEn；type/episodes → 明确审核后的 type。
- release_date → releaseEvents；非院线/平台日期不能默认称上线。
- in_universe → timeline；字符年份不直接充当排序。
- universe → universeLinks；tva 不等于普通宇宙，未知映射暂存 null/空关联并留审核记录。
- key_characters → 角色实体及带可见性标签的 characterLinks。
- synopsis_cn → 原剧情进入已审核 spoilerSections；必须另写安全简介，不能把原简介自动认为 safe。
- 无法核实旧 status → unverified，而非按日期推断 released。

## DATA-02 字段含义

block 的 text 可见性按 safe/spoiler；sourceIds 指向根 sources。safe 块 spoilerWorkIds 必须空，spoiler 块非空。spoilerFreeSynopsis 必须 safe。敏感关联也有 visibility/spoilerWorkIds。
universeLinks 可包含主宇宙、访问宇宙和时间之外场所；同一作品最多一个 primary，角色同 id 不重复。没有可见 primary 的 safe 卡片显示“宇宙未披露/待核实”，不猜。
timeline.safeRank/fullRank 是同组编辑排序，主线 kind 未知/时间之外/诗选时为 null。kind 本身及 rank 不得泄露已隐藏的剧情；有风险时以安全投影的 unknown 处理。
displayReleaseEventId 指定列表所用事件；为 null 时显示日期待定。电影优先 US theatrical，剧集优先对应平台 streaming；festival 单独标注，不代替 released。地区必须显示或在全局口径中说明。
runtimeMinutes 季按整季合计，不能拿单集时长当整季；null 对应 unknown，estimated 显示“约”。
status 需核实；scheduled 可日期未知，unknown 日期必须 null。传闻不能用 confirmed。
verification 指整条核实覆盖状态，不取代字段来源。来源 supports 使用明确字段路径，例如 works/<id>/releaseEvents/<id>/date。
phase 为 null 代表不适用或未证实，不强迫延伸作品进入阶段。角色实体名称可安全，但其出场关联仍可能 spoiler。
MVP 路线 reasons 与 workIds 一一对应，每部一个理由；safe 理由必须 safe，full 可 null，非 null 时 spoiler。
relations MVP 可空；后续 source、certainty 和 spoiler 标签完整才加入。

## DATA-03 Schema 之外的校验

scripts/validate-data.mjs 必须：
1. 使用所选验证器启用 date/uri 格式校验；日期真实存在，不能接受 2026-02-30。固定依赖版本。
2. 检查所有实体 id 唯一；work 内 releaseEvents id 唯一。
3. 检查所有 source/character/universe/work/route 引用；displayReleaseEventId 必须指向本作事件。
4. 检查每个 spoilerWorkIds 都是已存在的作品；作品敏感块至少含本作 id，跨作品另列其他 id。
5. 检查 safe synopsis/route reason 可见性、runtime 与 certainty、未知日期与 certainty 一致。
6. story rank 在同宇宙/同分组内可确定排序；同 rank 以 id 决定，不伪造先后。
7. 路线 workIds 非空、成员已核实、reasons 完整；draft 路线不得生产显示。
8. prerequisite/sequel/storyBefore 分别检查其需要的无环条件；跨宇宙访问不当作全图 DAG。
9. 正式 catalog 禁止 fixture-* id 与 example.invalid 来源；校验器测试模式显式允许合成数据。
10. sourceIds 为空的未知字段可以存在，但不可显示为 confirmed。项目推断用 editorial 来源、推断说明与证据链接，不伪称 official。

## DATA-04 逐项审核与真实证据

创建 docs/DATA_AUDIT.md：每作一行，列 id、收录类型、发行/状态、宇宙/时间、角色、双文本、路线/时长、来源与核实日期、剩余冲突。
先 5 个代表条目估算，再优先审核路线成员、高风险发行/分类和全部可见文本。
需要人工阅读原始上下文才能认定无剧透；自动关键词只能辅助。简介、角色、搜索、来源标题、时间标签和排序均检查。
官方来源优先，可靠二级资料用于补足；有冲突记录两个口径，保留 unknown/estimated。不能凭记忆更新现实档期。
完整剧透不是无限扩充：只写有依据的摘要/结局/彩蛋；没有资料显示“详细剧情待补充”。

## DATA-05 合成样例

fixtures/catalog.synthetic.json 全部虚构：
- 甲：已知时长、安全角色、本作结局。
- 乙：时长未知、秘密角色关联、跨甲乙剧透。
- 丙：时间之外，无主宇宙。
- 路线仅甲乙，完整时长已知 100 分钟、缺失 1 部；甲已看后下一部乙、已知剩余 0 分钟/缺失 1 部。
它验证字段和规则，绝不是审核过的 MCU 数据。开发前另从真实目录提取 5 条，经查源审校生成生产候选样例；未审核数据不可替代这些证据。

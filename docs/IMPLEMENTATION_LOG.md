# 实施记录

## 2026-09-30：D00 / D01 兼容阶段

基线 main：67090861eb202cf98342559f14c1bf8acda81839。
D00：目录已读取，无 AGENTS.md 或部署 workflow。当前线上地址此前已实际访问。
GitHub connector 拒绝读取 Pages 配置 endpoint（INVALID_ARGUMENT）；部署来源/分支保护未确认。本次只提交工作分支与草稿 PR，不合并/发布。

### 完成内容

- 原 CSS → styles/main.css；渲染交互 → src/timeline.js；资料 → data/catalog.json。
- 68 个作品全部 id 保留；原 chronology 保留，未悄悄改剧情/年份/顺序。
- ES module 加载、HTTP/资料错误显示与重试、无脚本说明。
- 验证器 Ajv + ajv-formats；日期格式检查、引用和重复 id 检查、全量旧 id 清单。
- 新规格 Schema 加入条件分支的 array 类型，消除严格编译警告；完整 draft 2020-12 + 合成样例校验通过。
- 固定开发依赖与锁文件，静态预览服务、数据/DOM/HTTP 检查。

### 规格调整与理由

D01 分成兼容提取与 D02 审核后规范化迁移。临时 data/catalog.json 仍使用原字段并新增 chrono_order；用 scripts/catalog.legacy.schema.json 检查。
选择保留原资料/渲染以隔离结构重构风险。把 68 条原资料直接升级成“verified”或机械安全简介会造成虚假核实。
D02 必须将运行时 catalog 切到规范 v1 模型并去掉 legacy 校验路径。该过渡不是最终数据设计，也不表示无剧透保护已经完成。
旧分组、中文角色漏检、日期时区口径及剧透仍在后续任务中，未借重构宣布修复。

### 验证

npm run check：两套 Schema/格式/引用校验通过，12 个测试通过。
覆盖：68 id、重复/漏序/非法日期/引用、关系环、loader 错误、搜索与筛选/清除/空结果、两种原排序、可注入时钟的倒计时、外部文本转义、加载失败重试、子路径 MIME/资源。
style 内容按原文提取，没有重新设计。npm dev 是本地静态预览，不是线上发布。

### 未验证与限制

- Cloud Browser 无法打开本地预览：net::ERR_BLOCKED_BY_CLIENT。无真实桌面/手机截图，视觉检查 pending。
- jsdom 是 DOM 模拟，不等价真实浏览器 ES modules/网络/布局验收。
- 未进行 68 条事实及剧透审核；DATA_AUDIT.md 全部待审。
- Pages 发布配置及保护规则未知；Safari 实机和真人体验 pending。

### 回滚与下一步

本 PR 只改工作分支；不合并即可保持现网。若将来合并后需回滚，恢复此前 index.html、移除 module 入口；原目录 id 未改。
下一任务 D02：查源审核 5 个代表条目，记录时间预算；随后规范模型与安全文本迁移。其后 D03 实施双模式和可见索引。

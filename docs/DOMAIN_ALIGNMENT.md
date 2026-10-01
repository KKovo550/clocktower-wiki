# 阶段 1：全仓库领域语言对齐

日期：2026-09-25。源码基线：a4288a8（baseline before audit）。本阶段只建立词表并记录命名差异，不判定缺陷严重度、不重命名业务代码。

## 基线与可回滚范围

基线包含 2,339 个源码与文本文件，约 98 MB：Python、Astro、Worker、JavaScript、HTML（含内联脚本）、JSON/JSONL、配置、文档等。图片原件、依赖、缓存及构建产物不在本次基线范围。未推送到公开仓库。提交沿用了发布仓库已验证的 KKovo550 提交身份，仅对该命令设置，未改全局 Git 配置。

## 覆盖范围与方法

对基线中的 HTML、JS/MJS/CJS、Python、Astro、文档及命令脚本共 1,233 个文件进行术语检索；进一步阅读核心模型、数据字段、调用入口、配置和维护说明。全仓库范围指所有子系统都纳入术语调查，不等于每一行完成正确性或安全审查。

- Python 管线：site、prepare_astro、sync_recent、夜序整合和数据维护说明；区分资料同步、内容生成、来源修订及发布。
- Astro：内容契约、正文分段、公共布局和路由；区分百科正文、公共界面及发布产物。
- Worker：content、worker、在线编辑集成；区分管理员会话、在线正文编辑记录及本地编辑草稿。
- 剧本工具：核心导入、夜序、制图及夜序查看器；区分角色、玩家、在场、存活与状态覆盖。
- 剧本库：导入、对比、图片角色、个人记录、历史版本及编辑器交接；区分库内记录、原件及个人状态。
- 角色索引：类型、能力类别、标签与剧本归属；梳理角色身份和分类。
- 内联脚本：role_index/角色索引.html、script_lib/剧本库.html 两处；包含角色数据、类别/来源及剧本目录等术语。没有把它们当普通静态正文跳过。
- 基础 JSON：检查 config/script-tool 的角色、相克与预设字段，并对照导入契约；剧本原件按资料域纳入检索，不逐份人工审阅。
- Issue：查询公开仓库 state=all，当前返回空列表，无可补充的 issue 术语。需求依据使用用户本会话中的明确要求，不虚构 issue。
- 图片二进制未做 OCR，依赖与生成缓存未当作业务术语来源。

## 已统一的概念边界

统一词表位于根 CONTEXT.md。词表只放领域定义；本文件保留代码映射、观察与后续问题。

1. 角色类型是镇民、外来者等分类；阵营专指善良/邪恶。
2. 剧本列出候选角色，在场玩家名单记录本次玩家与角色分配；同一角色可以有多个玩家。
3. 在场不等于存活；夜序查看器的在场筛选不作为生死判定。
4. 默认夜序、导入夜序、手动调整夜序分别命名；展示排序也不等于夜序。
5. 资料出处、剧本归属、导入来源三个概念拆开，不再统称来源。
6. 剧本历史版本、页面修订分别命名；异步请求序号是实现机制，不放入领域词表。
7. 编辑草稿、制图状态、个人剧本记录、在线正文编辑记录分别描述。
8. 资料同步、内容生成和网站发布分别描述；“已保存/已构建”不表示线上已生效。

## 命名差异与代码依据

以下是阶段 1 的语言观察，不是阶段 2 的缺陷清单，也未赋 P0—P3。

### L01：角色类型被称作阵营

依据：script_tool/assets/script-tool/core.js 的 teams/normalize 及“未知阵营”提示；script_lib/assets/js/core.js 的“英文阵营键”注释；assets/role-index.js 的界面则使用“角色类型”。
统一：用“角色类型”描述 townsfolk 等分类，善恶归属才称“阵营”。兼容边界：外部 team 和压缩字段 t 暂时保留，不在本阶段破坏导入格式。

### L02：旅行者英文拼写不一致

依据：ScriptCore.normalize 与剧本库 normalizeTeam 都将 traveler 转为 traveller；外部数据仍可出现两种拼写。
统一：内部概念选 Traveller；Traveler 是外部兼容别名。不是要求修改用户导入的原始 ID。

### L03：Role、Character、玩家混用风险

依据：编辑器 CHARS/sel、角色索引 ROLES、剧本库 chars/characters，以及夜序查看器 players/roleId；剧本库的 CHARS 为数组记录，编辑器的 CHARS 为对象记录。
统一：领域叙述统一角色 Role，人物参与者为玩家 Player。相同变量名不代表相同数据结构，后续审查需要按模块区分，暂不引入全站统一模型或批量重命名。

### L04：source/sources 表示不同关系

依据：角色索引 assets/role-index.js 使用 sources 筛选“剧本来源”；编辑器整合使用 source='yuque' 区分导入渠道；script_lib/assets/js/workspace.js 的 sources 是原始链接。
统一：分别用剧本归属、导入来源、资料出处。角色的 edition/ed 也不能直接替代这些关系。

### L05：夜序字段和编号缺省语义分散

依据：core.js 的 firstNight/otherNight 与 f/o；integrate_editor_nights.py 中 0 和 None；night-viewer.js 的 JSON 优先与本站表切换。
统一：描述时注明“默认/导入/手动调整”及“首夜/其他夜晚”；未提供信息、数据未列行动、行动待定位需区分。具体字段语义和优先级是否一致留给阶段 2，不在这里改变数据。

### L06：override 是夜序调整，也可能是在线编辑

依据：core.js 的 overrides/nightOverrides 与 scripts/admin-content.mjs 的 overrides/admin-overrides.json。
统一：前者为手动调整夜序，后者为在线正文编辑记录；不再无上下文称“覆盖”。

### L07：version/revision 同词异义

依据：script_lib/assets/js/workspace.js 的 versionChoices/historyFor；scripts/sync_recent.py 的 revisions；night-viewer.js 的 revision 用于异步读取序号。
统一：剧本历史版本、页面修订、异步请求序号分开；最后一项只在实现讨论中使用。

### L08：图片/剧照/角色图标/role 容易混淆

依据：script_lib/assets/js/core.js 的 scriptPictures 和 pictureRoles，front/back/logo 为图片用途；art-core.js/art.js 的角色图标和生成图片。
统一：角色图标、剧本参考图片、生成剧本图。picture role 语境称“图片用途”，不是游戏角色。

### L09：category/tag 在不同工具中含义不同

依据：assets/role-index.js 区分 categories 与 tags；script_lib/assets/js/categories.js 为剧本分类；搜索还区分页面类别。
统一：明确使用能力类别、能力标签、剧本库分类或页面类别，避免脱离对象仅称“分类”。

### L10：同步、保存、发布容易被理解成同一步

依据：README 发布流程；scripts/sync_recent.py 的暂存及更新；scripts/admin-content.mjs 的构建时正文合并；admin 在线保存与 Pages 部署为独立动作。
统一：资料同步、内容生成、网站发布分开；说明当前状态时必须指出发生在本地、后台还是线上站点。

## 边界例子

- 剧本有 26 种角色，名单登记 10 位玩家：不能显示“26 位在场玩家”。
- 两名玩家都分配同一个角色：是 2 位玩家、1 种在场角色，合并夜序不代表删掉一个玩家。
- 玩家死亡：不能只因死亡自动从“在场”移除。
- 两个来源都有同名角色：共享显示名不意味着共享角色身份。
- JSON 指定 0，本站有正数夜序：是两种不同夜序来源，不能在语言上称为相同默认数据。
- 制图改了能力说明：称“制图状态修改”，不直接宣称已修改剧本原件。
- 本地构建成功：称“构建通过”，尚不能称“网站已更新”。

## 后续阶段待确认项

本阶段不收窄审查范围。阶段 2 可再确定重点；若保留全仓库范围，至少覆盖上述全部子系统。需审查而非现在修改的事项包括：各模块同名字段的数据形状、身份匹配边界、夜序来源优先级、生成区块与手工维护边界。

本阶段不新增依赖、不删除代码、不改既有数据结构、不运行会重写生成内容的构建。检查限定为文档内容、引用路径、Git 变更范围与提交。

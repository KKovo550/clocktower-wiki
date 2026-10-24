# Astro 维护约定

分享请求的超时必须覆盖响应体消费，不能在仅收到 HTTP 头后就清除计时器。阅读连接 15 秒未收到头时终止；body 连续 15 秒没有新数据时取消，整个连接与下载最长 3 分钟。活跃的慢速下载不能被旧的固定 45 秒阈值截断。上传允许 90 秒，避免等待大快照上传时被 15 秒读连接阈值中断。使用 Promise deadline 和 AbortController，底层连接忽略 abort 时 UI 仍可结束等待。`readLimited` 响应取消，解密与解压另有 30 秒 deadline。阅读阶段显示连接、已下载／总量、解密状态，旧任务不得回填新链接的界面。回归覆盖“收到头但 body 永不结束”、忽略 abort 的连接、持续低速下载和解密停住，运行 `scripts/test-grimoire-share-network.cjs` 验证 Chrome/WebKit 手机视图。手机尺寸或使用代理的浏览器验收不等同于真实手机网络可达性，发布时需单独比较服务地址的直连与代理结果。

手机链接的预览调用 `replay-share.embed(...,{compact:true})`，由共享 `review-export.embedImage` 生成背景最长边 960、其他图像最长边 384 的 WebP（不支持时回退 PNG／原资源），保留所有记录和身份数据。下载的独立 HTML 与 PNG 导出默认不启用该压缩，不能全局缩小导出资源或改动角色目录。旧链接不重写，阅读端需继续支持旧的全尺寸图像。

手机只读链接由 `share-link.js` 负责阶段筛选、先预览再确认、AES-GCM 加密与本机撤销凭据；`share-reader.html` 仅加载分享组件，将已验证的解密快照交给 `replay-share.js`，在无同源权限的 sandbox iframe 内阅读。链接 hash 保存密钥，网络请求不传密钥，服务端只存密文。不得序列化原 game、私人笔记或草稿，也不得给阅读页加载 core/app、导入或编辑入口。阶段筛选必须在 embed 之前，历史身份只取所选端点。手机阅读和互动 HTML 复用同一个 viewer。

`admin/replay-store.mjs` 使用 SQLite Durable Object 的事务 KV、64 KiB 分块保存不可变快照；1/7/30 天到期检查在读路径执行，alarm 清理存储。创建按每日地址哈希限制 10 次/小时、30 次/日、64 MiB/日；读取与撤销不受上传限额影响。仅保存撤销令牌 SHA-256，不向读者返回管理凭据；撤销删除所有密文块。前端上传前保存撤销凭据，写本机记录失败则不上传；网络响应丢失保留 pending 凭据。服务无管理员 OAuth 依赖，原后台权限逻辑不变。生产端点与页面路径变更时同步 `share-link.js`、reader CSP 和 Worker SITE_URL。默认入口现为 clocktower-replay.pages.dev，Pages 的独立 gateway 只转发分享 API，通过 Service Binding 连接原 Worker；不使用外部 HTTP 抓取原 workers.dev 地址、不新增存储或迁移旧链接。

新增验收：`node --test scripts/tests/grimoire-share-link.test.mjs`；`node scripts/test-grimoire-share-link.cjs`（Chrome/WebKit 桌面、手机）。后者使用事务存储适配器模拟服务，另需 Wrangler 本地运行实际 Durable Object 验证分块写入和撤销，发布后验证真实链接。

复盘图片导出的范围统一由 `review-export.js` 的 `selectedStages` 校验并按原始索引排序，`plan` 和 `replay-share.js` 的 `stageSequence` 共用范围与信息排版。部分阶段禁止附加全局身份对照；顶部当前围桌与历史逐阶段魔典保持明确区分。`imageMetrics` 同时服务预估和真实 PNG 尺寸，避免提示与渲染分歧。阶段勾选改变后递增导出任务版本、撤销旧 URL 并禁用下载，旧异步任务不能重画或重新启用保存；显示选项自动刷新，阶段多选由用户点击生成。新增浏览器验收：`node scripts/test-grimoire-export-options.cjs`。

魔典联动由 `core.js` 的 `linkReview` 在同一次 reducer 中处理，新记录仅在 `phaseIndex` 对应的当前阶段允许 `updateBoard: true`。默认不联动，旧记录修改不再次执行。`boardLink` 只证明曾关联一次状态更新，不随文字修订伪造新的状态历史。圆桌建议包含 gameId/revision/玩家状态签名，后续操作后失效；app.js 合并该次确认与原圆桌操作的撤销边界。不得用行动文案推断能力是否生效。新增剧本外角色需匹配完整角色定义，不能用缺失夜序的默认值伪造行动顺序。

`stageChanges` 统一比较可靠的阶段端点，以永久玩家 ID 匹配；UI、互动分享与阶段图片沿用同一摘要。缺少完整起点（含 partial）不推断变化。`archive.js` 使用独立的版本化本地键、整库写入与原始字符串并发检查；写失败不更新内存快照，也不淘汰旧局。恢复时先保存当前对局，再尝试写入所选对局；任一失败不切换 UI。原始库损坏时保留字节并允许下载。新增回归：`scripts/tests/grimoire-linked-library.test.cjs` 与 `scripts/test-grimoire-linked-library.cjs`（Chrome/WebKit 桌面和手机）。

复盘角色／阵营变化以可选 changedRole、changedAlignment 保留历史结果。changedRole 为玩家角色定义的 id/name/team/ability/image 快照，null 明确表示空白，undefined 表示未选择；不可把二者互换。changedAlignment 仅 good/evil。新提交按角色变化、阵营变化、同时变化分别要求相应字段，其他行动不能带入隐藏的旧值；旧备份中同名自定义行动没有字段时继续按原文字显示，不虚构变化结果。全角色库通过 app.js 注入 getRoles 延迟读取，并按 ID 保留本局定义优先，搜索结果最多呈现 60 项；只存复盘快照，不向本局剧本添加外部角色。私密视图切换清空选择器和结果，publicView 继续不导出 review。scripts/test-grimoire-review-role-change.cjs 覆盖本局定义优先、角色搜索、空白、两阵营、组合变化、外部角色、再次编辑和隐私。

复盘中毒／醉酒的能力来源保存在可选 source 玩家快照，独立于行动人和 targets，复用同一历史玩家校验与 snapshot 逻辑。仅两项“因某个玩家的能力”行动的新提交要求 sourceSeatId；旧备份的同名自定义文字没有 source 时继续保留，不猜测来源。编辑旧来源时按座位 ID 保留快照，即使该玩家已离场或改角色；其他行动不得携带 source，切换为简单记录／恢复时重建条目并移除旧字段。源选择器隐藏时 disabled，避免不可见的 required 阻塞提交；这六项状态记录清空无关玩家目标；默认仅记录时不更改提示标记、生死或投票，当前阶段的新记录可按上述联动约定显式更新魔典。scripts/test-grimoire-review-status.cjs 覆盖桌面／手机／iPad 的两种来源、四种直接记录、图标、刷新、隐私与玩家状态不变。

复盘“提名玩家（记录票数）”的 votes 是可选的新历史字段：新提交须指定一名目标及 0–999 整数，校验旧备份时容许此前同名自定义行动没有票数，不补写虚构的 0。其他行动不接受票数；改为不记录票数时显式省略旧值。UI 使用条件票数表单，隐藏时同步 disabled，避免旧的无效数字触发不可见的原生校验。提名目标点击单选替换，提名说书人提交空玩家目标。投票和处决条目只描述历史，不改核心玩家生死或投票状态。scripts/test-grimoire-review-nomination.cjs 覆盖零票、超出人数的票数、无效数值切换到无票数行动、目标切换、刷新和再次编辑，并核对玩家状态不变。

复盘行动输入框右侧使用独立的原生 select（gReviewActionPreset）展开完整预设，选中后写入仍可编辑的 gReviewAction；手动输入自定义行动时取消预设选中。不要换回 input＋datalist：后者会按已填的“选择了”等文字过滤候选，造成点击箭头无法选择其他行动。scripts/test-grimoire-review-action-picker.cjs 以实际点击箭头、键盘选择不同项、预设切换及自定义保存覆盖 Chrome／WebKit 桌面和触屏，界面测试覆盖输入与预设同步和重新编辑。

魔典复盘由 grimoire/review.js 展示，core.js 的可选 review 字段保存连续昼夜阶段、单调记录编号、行动或文字记录。旧 v1 存档缺少 review 时按当前阶段补齐空时间线，不回填或猜测玩家行动。reviewSave 在写入时截取行动人／目标的座位号、姓名、角色 ID／名称／类型；旧快照独立于现有座位与角色，修改文本保留未改选的快照，换座、删座和重新分配不得重写历史。每阶段 100 条、全局 2000 条、198 阶段，并继续受 UTF-8 8 MB 存档上限约束。仅可删除最后阶段，含记录需确认；加删复盘阶段不能推进或回退实际游戏。右侧记录入口打开复盘，菜单操作记录与面板操作历史保留原历史列表；复盘沿用普通玻璃侧栏和现有撤销／保存警告。公开视图须清除面板及编辑草稿，publicView 不导出 review。新增模块同时列入页面脚本与 jsdom 测试加载清单。scripts/test-grimoire-review.cjs 检查 Chrome／WebKit 桌面和触屏的记录、编辑、恢复、玻璃、缩放及隐私。

魔典新功能动效集中在 app.js 的 playMotion／cancelMotion／contentArrive。每个目标只保留一个短动画，完成和取消均释放记录；系统 prefers-reduced-motion 切换、后台和 pagehide 清理动画及背景过渡层。普通弹窗在 open 后的同一轮 RAF 中按最终模式判断，只对非玩家展示正文淡入，关闭同步取消。背景交叉渐变仅缓存旧背景图像和底色，过渡层不含角色或面板 DOM；线下抽取仅对当前图案旋转及公开进度条做动画，盖回先取消并同步清空旧身份。缩放、布局、拖动坐标即时提交，仅附带内容或阴影反馈，避免对 zoom／宽高／位置／模糊做逐帧补间。script-picker 的 onViewChange 为可选展示回调，不写入状态。scripts/test-grimoire-feature-motion.cjs 覆盖真实动画、连点替换、背景清理、身份立即盖回与实时减少动态效果，配合缩放和 panel-motion 回归验证交互及关闭无残影。

魔典网页缩放 pageZoom（75–150，每步 5）保存于 botc_grimoire_display_v1，与显示剧本图标、摘要收起和自由布局偏好一同保留，不写入对局。根节点 CSS zoom 负责整体缩放；--g-viewport-width／--g-viewport-height 将视口单位转换到逻辑尺寸，measure、uiWidth／uiHeight、pointerX／pointerY 负责 DOM 边界及指针坐标转换。原生 visualViewport 的偏移和高度也除以缩放比例，不禁用浏览器原有缩放。计时面板通过依赖注入的 measure 对齐工具按钮。放大后空间不足时启用 g-zoom-table-ui 的可滚动圆桌，保持角色尺寸并避免默认圆桌挤压；100% 继续使用原布局。新增定位代码沿用逻辑坐标，新增视口尺寸样式沿用共享变量。scripts/test-grimoire-zoom.cjs 检查桌面／触屏尺寸、75/125/150%、刷新、面板边界、拖动、提示标记、全屏及展示遮盖，配合自由布局、手机圆桌和菜单回归。

魔典普通弹窗默认继承 app.css 的 --g-glass-* 黑色染色亚光玻璃变量：gDialog 共用规则覆盖根容器、标题栏、透明正文和中性黑色表单／卡片；新增模式复用这个结构即可。非弹窗新增面板使用 g-glass-surface。模糊强度由触屏媒体查询降低，不支持 backdrop-filter 时使用较实的黑色回退；粘性工具栏采用薄黑色和局部模糊，保持滚动时清晰。玩家展示的 g-signal-dialog／g-signal-player、g-bluff-reveal 和线下抽取使用不透明遮盖，继续排除在普通玻璃规则外。目录内 AGENTS.md 记录后续实现约定；scripts/test-grimoire-matte-glass.cjs 覆盖三张参考界面、其他普通模式、无特定模式类的新页面继承，以及展示隐私与桌面／触屏尺寸。

魔典自定义背景由 app.js 的 backgroundPanel／prepareBackground 管理，单独保存至 localStorage 的 botc_grimoire_background_v1，不写入对局、历史或通用显示偏好。只接收本地 JPEG／PNG／WebP（15 MB、6400 万像素以内），解码后最长边缩至 2560，转为 JPEG 并限制 data URL 在 2 MiB 字符以内；选择和暗度调整保持草稿，存储成功才应用。异步图片结果通过 modalRevision 和请求编号丢弃过期选择，finally 释放 object URL。自定义模式仅改 g-app 背景并关闭默认夜景／云雾伪元素，默认模式恢复原有昼夜过渡；不得把不透明的身份展示对话框改成透明。核心／界面测试及 scripts/test-grimoire-custom-background.cjs 覆盖上传缩放、暗度、刷新、昼夜、取消、错误与恢复默认，后者使用 Chrome／WebKit 的桌面和触屏尺寸。

## 分层与数据来源

正式页面由 Astro 渲染。`src/components/` 负责公共界面，`src/layouts/` 负责页面布局，`src/pages/` 负责现有 URL。侧栏内容只编辑 `config/navigation.json`；Python 兼容站点读取同一配置，不能再单独维护一份菜单。

百科正文暂时保留在现有 HTML 中，角色数据仍通过既有整合脚本生成。`scripts/prepare_astro.py` 是兼容适配层：先准备内容、验证引用，再将正文记录和发布资源输出到 `.astro-content/`。它不创建 ZIP、不调用交互测试，也不触发发布。后续可以逐类将正文换成结构化数据；不要一次重写角色能力、来源和工具逻辑。

`templates/header.html` 和 `footer.html` 仅服务旧 Python 中间站点，不是 Astro 公共界面的来源。`templates/sidebar.html` 是生成文件。旧同步功能继续生成中间内容，同步完成后需运行 Astro 构建才能形成正式发布结果。

## 日常命令

手机与持续使用验收见 [MOBILE_QA.md](MOBILE_QA.md)：包含 iPhone 13 Pro Max 的 Safari 真机步骤、安卓真机要求、多人一周试用记录方式，以及独立 WebKit / Chrome 触屏和反复保存回归。模拟通过不能替代真机或长期使用记录。

- 首次安装：`npm ci`，`python -m pip install -r requirements.txt`。
- 本地开发：`npm run dev`。Astro 组件变更热更新；正文、Python 脚本或数据变更后重新启动该命令。
- 类型检查：`npm run check`。
- 正式构建：`npm run build`，包含类型、导入正文、公共导航、资源引用及资源哈希检查。
- 回归测试：`npm test`，覆盖角色索引、搜索、认证查询、剧本库与编辑器交接、导入契约和分享模式。
- 发布前验证：`npm run validate`，依次构建和测试。
- 离线打包：验证成功后 `npm run package:offline`。打包前会再次核对当前构建产物，损坏的静态资源会阻止打包。

需要 Python 3.10+、Pillow、Node.js 22.22.2+（22.x）或 24.15+（24.x），也支持 26+；Node 版本需满足开发测试依赖。`PYTHON` 可指定解释器；指定的解释器不可用时会报错，不会悄悄换环境。Node 和 Python 启动逻辑统一放在 `scripts/lib/runtime.mjs`。

## 修改与验证

### 剧本工具数据流

- `config/script-tool/` 保存基础角色、相克和 ID 型预设，`build_editor_catalog.py` 生成 `data.js`；`integrate_homebrew_editor.py` 合并导入角色，之后再生成夜序和奥德赛相克数据。生成区块应由构建脚本维护，不手动修改。
- 角色 ID 必须唯一。“戏子（改）”使用 `xizi_revised_gstone`，“戏子”保留 `xizi_gstone`，不改变目录索引。旧文件如果只有共享的 ID 而无名称和能力，无法辨认是否指改版，按原版解析；需要改版时重新选择该角色。
- 夜序来自 `pages/夜晚行动顺序一览.html`，经 `integrate_editor_nights.py` 生成 `SCRIPT_NIGHT_ORDER`。`ScriptCore.nightOrder` 统一处理目录顺序、标准 ID 别名和用户拖拽覆盖，JSON 导出、列表和图片均使用它。ID 匹配容忍首尾空格及 `_gstone` 后缀，但保留原始 ID，并检查角色名称。
- 奥德赛相克由 `integrate_odyssey_jinx.py` 从总表和角色说明提取，同时生成编辑器数据与百科卡片。`ScriptCore.matchJinx` 是相克提示、搭配检查和图片的共同入口：优先匹配规则中的角色 ID，名称匹配有歧义时不显示，重复规则只显示一次。
- 制图中的说明、排序和自定义相克属于图片编辑状态；夜序属于剧本状态，每次渲染重新读取，撤销图片操作不能回滚外部夜序。重新打开制图时，主界面已修改的标题与作者会同步；没有修改的字段保留图片中的编辑结果。
- `ScriptCore.restoreDraft` 负责草稿校验和迁移，返回完整状态后界面才能应用；读取失败时保留当前状态及原始存储。旧版索引草稿继续兼容；带名称的旧“戏子（改）”草稿会迁移 ID 和夜序覆盖，重复 ID 或无效角色阻止恢复。
- 构建读取在线编辑记录时，对连接中断、429 和服务端错误最多尝试三次。最终失败仍停止构建，禁止用空记录或旧缓存覆盖在线修改。

对应回归：`test-editor-nights.cjs`、`test-odyssey-jinx.cjs`、`test-art-ui.cjs` 和 `scripts/tests/admin.test.mjs`。发布前统一运行 `npm run validate`。

制图始终输出一张完整图片，保持角色能力完整、不切页。默认 `officialVintage` 固定为参考 PNG 的真实尺寸 1111 × 1500；只有手动选择 `readable`／`auto` 或标注“允许自动加长”的旧预设才按内容增高。PNG 默认 1 倍，显式 2 倍为 2222 × 3000；SVG 根宽高与 viewBox 保持原始尺寸。默认不添加术语说明、不保留空说明栏高度；说明栏仍可手动选择。传奇／奇遇合并逻辑和夜序独立于正文间距，复古预设的叶子先于角色绘制。

配置源为 `config/script-art/presets.json`，`build_art_presets.py` 读取参考 PNG 后生成运行配置；`art-print-layout.js` 管理固定画布内的正文适配。名称字体为 SimHei，正文为 Sarasa UI SC，字体随 SVG 内嵌；HTTP 使用字体文件，`file://` 使用按需加载的字体脚本。固定验收样例、视觉基线和干净环境验证见 [稳定版本验收](STABILITY.md)。

`art-decorations.js` 的素材来源和摘要见 `script_tool/assets/script-tool/decorations/sources.json`；正常构建读取 `config/script-art/` 中固定的本地素材，不需要历史 `.sync/` 缓存。刷新旧素材时显式运行 `python scripts/import_art_decorations.py --refresh`。

剧本制图入口在编辑器的“生成剧本图片”。`art-core.js` 负责纯布局和 SVG 生成；`art.js` 负责对话框、背景处理及 PNG 下载；`art.css` 只影响制图界面。`scripts/build_art_icons.py` 把已收录的本地图标转成小尺寸内嵌索引色 PNG，由界面按需加载 `art-icons.js`，避免离线 Canvas 被文件跨域限制阻断。不要引用参考网站的私有素材或服务。排版测试检查说明不丢失、分页边界、转义；对话框测试检查草稿保持、设置更新及关闭重开。

角色索引的剧本/合集来源在 `config/role-sources.json` 配置；`scripts/role_sources.py` 读取百科正文中角色分类下的图标名单，按详情页路径匹配。不要依据名字、版本数字或正文中偶然提及的角色猜来源。华灯初上与山雨欲来独立列出，体验剧本及卡牌附赠名单不算本体来源；未匹配者保留在其他／未归类。修改来源后运行完整构建，并检查来源多选、交叉筛选与分面计数测试。

修改公共布局用 Astro 组件；新增侧栏入口改导航配置；新增业务行为尽量放进对应工具脚本，并为重要行为补回归检查。Astro 严格类型检查覆盖 `src/`，导入 JSON 由 `validatePages` 在运行时校验。路径必须保留 `.html`、不允许越界、不允许大小写重复、必须包含首页。

剧本工具导出的 `firstNight` / `otherNight` 优先使用 `pages/夜晚行动顺序一览.html` 合并表中的编号。`scripts/integrate_editor_nights.py` 在构建时生成 `data.js` 中的 `SCRIPT_NIGHT_ORDER`，按角色 ID 和名称匹配，区分同名官方、奥德赛和海外自制角色；不要手动维护第二份夜序。已匹配角色未行动的夜晚为 0，明确待定位的行动与表外角色保留原值。仅导出时应用映射，不改写导入对象或浏览器存档；回归检查为 `node scripts/test-editor-nights.cjs`。

导入正文通过受控的 HTML 片段渲染，仅接受本地内容管线产物；外部来源仍须经过现有清洗过程。不要把用户输入或未清洗的远端 HTML 直接交给 `set:html`。

构建校验要求正文和原有脚本与导入结果一致，但不要求原生公共组件永久等同于旧模板。它另行检查公共控件 ID、导航配置、全部本地链接和静态资源哈希，允许公共布局独立改进。

发布资源清单与“不带剧本图片”的转换逻辑只在 `scripts/site.py` 的 `release_files` / `release_payload` 中维护，旧打包和 Astro 共用。不要遍历整个工作目录作为公开目录，尤其不能把 `.sync/`、`node_modules/` 和剧本原图带入发布包。

剧本预览只读取明确分类的正背面；有一面未生成时，详情区明确指出不可用的那一面，不用同名或其他版本的图片代替。看图弹窗可保存当前图片、失败后重试；网页保存的是 WebP 阅读副本，保留实际文件扩展名，原图入口仍提供浏览器自行打开的保存方式。`node scripts/test-library-picture-browser.cjs` 覆盖桌面、小手机和横屏、真实下载字节一致性、模拟请求失败与恢复；可用 `PICTURE_TEST_ROOT=dist/astro` 验收构建产物，`PICTURE_TEST_BASE` 验收线上页面。

B 站图片下载在写入前必须严格解码，不能只检查 PNG/JPEG 文件头。截断文件保持为预览不可用，不通过放宽解码错误设置生成缺失内容；待取得完整的同一原图后再恢复。2026-10-19 排查发现 `image-previews.js` 的 14 个不可用项在原始图库及本地备份中均为相同的截断文件，原来源访问受限，仍需完整副本；后续维护以该清单逐项核对，不能把状态提示改善记作原图恢复。

`.astro-content/`、`.astro-content-next/`、`.astro/` 和 `dist/` 都是生成目录。准备失败不得继续发布；临时内容准备完成后才替换上一份内容。构建不访问外部资料站，在线资料同步由明确的同步命令单独执行。

## 发布与回退

当前公开 GitHub 仓库只有构建产物，并不包含完整源码或运行本地测试所需数据，因此不能把它误当作源码 CI。发布前在本地运行 `npm run validate`，只将 `dist/astro/` 同步到发布仓库，保留其 `.git`；提交后等待 Pages 成功并检查线上页面。不要把整个根目录直接推送到公开仓库。

源代码和原始数据应随本地项目备份，`package-lock.json` 应一并保留。升级依赖应独立进行，使用 `npm ci` 验证并运行完整检查。页面地址、localStorage 键、角色 ID 和跨页面导入协议属于兼容约定，修改前必须考虑既有草稿和旧链接。

回退线上版本可在发布仓库撤销对应提交后重新部署。不要为回退清除浏览器草稿或删除原始角色、剧本资料。


夜序弹窗支持在首夜、其他夜晚各自列表中拖拽或使用上下按钮排序。当前剧本的 `nightOverrides` 随浏览器存档保存，优先于全站默认夜序，并同时应用于预览、复制、角色排序和 JSON 导出。恢复默认会清除两夜调整；导入、清空、随机生成、载入预设会重置调整。

群星目录与配置维护于 `config/stars.json`，角色运作原文维护于 `config/stars-guide.json`。使用 `scripts/import_stars.py 文档路径 --guide-only` 更新原文；构建时 `integrate_stars.py` 按角色名合并说明，保留没有新版说明的角色及寻宝团线上/线下配置。页面文件仍使用 `群星_角色名.html` 防止同名来源冲突，显示标题不含“群星：”。

海外自制角色总览由 `scripts/style_homebrew.py` 基于 `config/yuque-import.json` 渲染，导入和构建共用该布局。通用角色网格使用 `.gallery` / `.gallerybox`，总览仅通过目录锚点导航，不加载搜索与类型筛选脚本；修改时验证分区锚点及完整角色数量。

角色快速预览由 `scripts/prepare-role-preview.mjs` 生成 `assets/role-preview-data.js`，按页面路径区分同名角色。能力、夜序来自统一 API 数据，运作方式来自角色页面；相克规则优先用角色页面资料，同名跨来源规则不作推断。图标悬浮预览由 `assets/role-preview.js` 管理，点击图标仍直接打开对应角色页面，本地资料脚本按需加载，支持离线打开及键盘操作。

公共视觉与动效单独维护在 `assets/site-experience.css` 和 `assets/site-experience.js`；`site.py` 为页面添加样式并将脚本纳入离线资源，`wiki.js` 加载独立控制器。首页封面由 `scripts/style_home.py` 生成，更新必须保留正文、目录锚点及 `homeDraftResume`。滚动显现最多观察 32 个主要区块，每个区块仅显现一次；鼠标与滚动事件按动画帧合并，不持续运行动画循环，不依赖动画库。缺少 IntersectionObserver、关闭动态效果及打印时内容始终可见；页面离开时清理待处理帧，浏览器返回缓存时恢复。绘图 SVG、画布尺寸与角色业务不属于这一层。修改后运行 `node --test scripts/test-site-experience.cjs` 及 `npm run validate`，同时检查手机导航、键盘搜索和系统减少动态效果设置。

正文阅读色、工作区面板和控件统一使用 `site-experience.css` 中的 `--experience-text`、`--experience-muted`、`--experience-line`、`--experience-surface`、`--experience-blue` 及圆角变量。工作区规则限定在 `.role-index`、`.library-content`、`.script-editor`，制图弹窗只覆盖外部控件；不要给 `.art-stage`、`.art-hit`、绘图 SVG 或导出内容添加公共主题规则。结果列表前 10 项与详情采用短 CSS 入场过渡，原有渲染会自然触发，不新增数据监听、定时器或动画库。系统减少动态效果和打印时沿用全局禁用规则。检查桌面和手机下的筛选、选中状态、禁用按钮、对话框以及实际 PNG 导出，保持语义告警颜色。

剧本库的浏览布局使用 `.library-browse` 限定在 `script_lib/assets/library.css`，展示交互集中于 `script_lib/assets/js/presentation.js`。低频条件及排序位于 `libraryAdvanced`；读取浏览器偏好或角色查询链接后，如有已启用条件会自动展开，手动收拢后仍显示条件数量。列表保留每条记录的原始下标，选中标记随列表重绘恢复；手机及单列容器选中后聚焦详情，并可返回选中条目。路径、分类、历史版本和来源折叠展示，原有控件 ID、个人记录存储键、图片按需加载和导出协议均保留。`script_lib/tests/presentation.test.cjs` 覆盖条件恢复、折叠提示、键盘选中、重绘标记及手机焦点往返。

角色详情的首屏摘要和阅读目录由 `assets/role-details.js` 增强，样式限定在 `site-experience.css` 的 `.role-detail-page`；`scripts/site.py` 注入并发布控制器。控制器直接移动原始标题、图标、能力和目录节点，保留原文、链接和章节 ID；群星角色优先展示完整的最终 JSON「角色配置」，历史能力留在正文。桌面目录侧置，手机默认折叠；不增加数据监听、定时器或存储。无角色类型或有效能力章节的页面保持原样，脚本缺失时仍可阅读原页面。修改后运行 `node --test scripts/test-role-details.cjs` 与 `npm run validate`，并检查手机首屏正文宽度及原目录锚点。

互动反馈沿用 `site-experience.css` 中的 `--experience-fast`（140ms）、`--experience-duration`（220ms）与统一缓动。悬停只在精细指针设备启用，禁用控件不位移；键盘焦点始终可见。支持 `::details-content` 的浏览器用原生高度过渡展开/收起，其他浏览器保留直接切换及短淡入；支持离散过渡的浏览器为普通弹窗加开合过渡，保留原生 Escape 和焦点语义，制图画布弹窗沿用原逻辑。目录仅在原生 hash 变化时更新 `aria-current="location"`，不拦截导航、不观察滚动。系统减少动态效果时禁用全部过渡；测试桌面悬停、键盘、手机展开/关闭、连续操作及弹窗关闭后点击，避免视觉残留或阻挡操作。

编辑器卡片选择后，`app.js` 仅在原卡片已有焦点时恢复到重绘后的同一 `data-i` 卡片，避免 Enter/空格操作中断；其他控件上的焦点保持不变。`scripts/test-editor-workspace.cjs` 覆盖连续切换和不抢焦点，选择、存储及导入规则沿用原实现。

剧本库列表的标题和作者分行展示，字体分别为 16px 与 13px，分类与数量使用较淡的 11px 辅助文本；仅列表标签统一淡色，详情中的阵营信息保留。完整作者可换行，分类被截断时可通过原文提示查看；索引、筛选和记录不变。

手机编辑器底部快捷栏位于主工作区容器外，避免固定定位被容器约束；查看剧本使用原生锚点，生成图片委托原有 `bArt`，数量及可用状态随 `renderStat` 更新。820px 以下显示，内容及页尾预留 84px 加安全区；编辑输入框时隐藏快捷栏，打印时隐藏。700px 以下的制图弹窗分为固定头部、独立滚动内容和底部操作区，预览、设置与保存保留原有行为，切换视图重置内容滚动位置；不修改制图尺寸或绘图资源。回归包括 `test-editor-workspace.cjs`、`test-art-ui.cjs`，并检查小屏、横屏、长标题/作者、底部内容及真实 PNG 导出。


## 在线魔典

在线魔典入口为 `script_tool/在线魔典.html`，逻辑位于 `script_tool/assets/grimoire/`：`core.js` 管理纯状态、校验和存储冲突，`catalog.js` 适配现有角色与剧本数据，`app.js` 管理主界面交互，`app.css` 负责独立界面；`aux.js` 与 `aux.css` 管理传奇／奇遇、恶魔伪装面板及圆牌选择器。对局仅写 `botc_grimoire_v1`，最近导入写 `botc_grimoire_scripts_v1`，不修改编辑器、剧本库或夜序查看器存档。备份格式使用 `kind: clocktower-grimoire`、`version: 1`；旧对局缺少 `specials` 时按空列表载入，`bluffs` 保留空格位置。特殊角色不加入座位与夜序；在场筛选包含死亡座位，显示偏好不写入对局。隐私展示必须同时清除角色图像、可访问名称及已关闭弹窗的私密内容。“给恶魔看”须覆盖整个页面，仅显示伪装资料。`WikiBeforeUpdate` 在未保存时阻止缓存更新刷新。运行核心、界面和缓存测试及 `scripts/test-grimoire-browser.cjs`、`scripts/test-grimoire-aux-browser.cjs`，再运行完整验证；浏览器脚本可通过 `GRIMOIRE_TEST_ROOT=dist/astro` 验证构建产物，浏览器引擎测试不代表真机或长期对局验收。

魔典座位的圆牌与名称使用两个独立按钮；圆牌选角、名称单击管理、双击／双触改名。名称的单击计时应在其他弹窗、重绘与玩家视角切换时取消，拖动后应拦截合成点击，保留新指针操作及键盘激活。改动后运行 `scripts/test-grimoire-seat-browser.cjs` 验证 Chrome／WebKit 的鼠标、键盘、触屏、隐私与改名不丢提醒。

死亡票快捷图标使用原有 vote 动作与 ghostVote 状态，只有死亡玩家显示；玩家视角不渲染票按钮，背面圆牌仅允许 cycleStatus 动作：存活变死亡有票，有票变无票，无票变存活并恢复票。该动作原子更新、保存并可撤销，不改变私密字段。说书人 life 动作仍保留原票状态。roleLabel 的 SVG textPath 每次创建使用唯一 ID，角色名称只能写入 textContent，完整名称保留在按钮可访问名称中。角色图标、叶子、名称应分层，死亡票和帷幕的按压不可触发全站 transform 动画。提示标记使用 theme/reminder1.png，圆桌尺寸约为角色圆牌的 48%。

圆牌共用 `theme/token1.png` 与 `theme/leaf-*.png`。`GrimoireCatalog.tokenMarks` 只从提示数组、两个明确夜序值及 setup 数据生成标记；不得从能力文字推断设置变化。新导入角色保存 setup 布尔值，旧版缺省只按 ID 与名称一致的目录记录补显示。超过五个提示时逐片使用 top1，避免截断数量。座位与角色选择器共用 `decorateToken`；生死帷幕使用 `theme/shroud1.png`，快捷入口仅占圆牌上方，中央仍选角色。顶部按钮必须保持 min-height 覆盖全站移动端规则，禁止按压位移。使用 `scripts/test-grimoire-token-skin-browser.cjs` 检查叶子、设置标志、撤销、刷新、触屏与玩家视角。

圆牌夜序同时调用首夜与其他夜晚的在场列表，分别生成左蓝、右红圆点，编号与对应列表一致；不要按当前阶段只保留一类，也不要用角色类型决定颜色。圆点挂在角色按钮上，不能拦截点击；未行动的夜晚不生成圆点，玩家视角全部隐藏。运行 `scripts/test-grimoire-night-badges-browser.cjs` 验证双夜序编号、缩放、列表、触屏与隐私。

夜序预览使用 `ClocktowerGrimoire.nightOrder(state,{first,all})`，当前夜记录沿用 `nightQueue` 和 `nightMark`。纯预览不修改状态；夜序界面始终只读，不提供记录按钮；底层 nightMark 仅兼容既有对局资料。角色表和夜序使用各自的面板与浮动状态，关闭其中一个不得清理另一个的按钮与刷新回调；切换玩家视角须清空全部私密正文。运行 `scripts/test-grimoire-night-browser.cjs` 与 `scripts/test-grimoire-sheet-browser.cjs` 验证预览、跨夜记录、死亡与重复角色、小屏、浮动和隐私。

原生 `#gDialog` 仅用于角色／提示标记选择、确认及菜单。角色表、夜序分别由 `sideViews` 管理独立 section，笔记使用 `#gNotesPanel`，不得在关闭选择器时清理这些面板；各自保存打开、浮动、滚动、筛选状态。玩家视角统一隐藏并清除私密正文。原生弹窗关闭后会清除其模式样式。该弹窗及 backdrop 必须立即关闭，禁用全站 display／overlay 退场过渡，避免旧内容在侧栏类清理后跳回屏幕中央。使用 `scripts/test-grimoire-panel-motion.cjs` 逐帧检查角色表、夜序的固定／浮动模式、关闭按钮及 Escape，并验证焦点归还。

三个浮动面板共用 `panelResize`，通过右下角 `.g-panel-resize` 的 Pointer Events 和 pointer capture 调整 `--float-width/height`，支持触屏与方向键（Shift 加速）。尺寸仅对浮动样式生效，固定布局不受影响；关闭／固定切换保留当前页面的尺寸。视口改变及重新打开时调用 `fitFloatingPanel` 限制宽高并夹紧位置，不能重建编辑器或正文。浮动角色表按窗口宽度自动换列。运行 `scripts/test-grimoire-panel-resize.cjs` 验证三个面板鼠标缩放、键盘、触摸、尺寸恢复、内容保留、最小尺寸、窄屏／横屏边界与玩家视角隐私。

魔典菜单使用 `g-menu-dialog` 分组侧栏，菜单刷新与其他面板共用刷新回调，打开角色表／夜序时须清除菜单样式。`shuffleSeats` 仅重排完整座位对象，不重新发角色、不清除提醒或夜序进度。四种布局与圆牌夜序标记是本页偏好；玩家视角不展示夜序编号。“游戏指示”和获胜文字仅全屏展示，不写入胜负或重置对局。运行 `scripts/test-grimoire-menu-browser.cjs`，检查人数取消、乱序／撤销、备份下载、布局、提示遮挡及小屏。

浏览器全屏与游戏指示遮盖分开：fullscreen 在同一次用户点击中同步关闭菜单并调用原生接口，调用前不得等待异步工作以免丢失用户激活。isFullscreen 读取标准／WebKit 状态，退出接口与实际进入的接口类型匹配；fullscreenchange／webkitfullscreenchange 只更新菜单按钮及安排座位布局，不写入对局或重绘私密资料。请求进行中禁用按钮以防重复操作，Promise 拒绝和旧接口错误事件均恢复操作并提示。原问题是全屏调用后菜单仍显示“进入全屏”；scripts/test-grimoire-fullscreen.cjs 在修复前复现该问题，修复后检查真实 Chrome／WebKit 的进入、退出、浏览器主动退出，以及失败恢复和旧接口回退；UI 测试补充待处理请求和错误事件。

游戏指示准备界面为 `.g-signal-compose`，`signalPanel` 的临时草稿保留预设、自定义文字和三个角色 ID，不写入 storage／undo／history；菜单入口须包装为零参数回调，避免把点击事件当草稿。角色选择复用 `aux.picker`，只选择本剧本角色，返回后保留文字与其他附带位。`showSignal` 只创建显式选择的内容，全屏使用 `.g-signal-dialog.g-signal-player` 与 `#gSignalScreen`，背景须不透明，所有私密面板留在其下层。整屏是单个返回按钮，角色 token 不能嵌套按钮；Escape 在 cancel 事件中返回准备界面，模式清理和玩家视角切换必须清除 `signalReturn`，不能意外重开。手机上用 ID 规则保证 `#gSignalScreen` 至少 100dvh，防止全站按钮最小高度覆盖它。运行 `test-grimoire-signals.cjs` 检查 22 项、三格与重复角色、自定义／留空回退、整屏遮挡、返回草稿、键盘／触屏、窄屏／横屏及对局不变；配合 menu-browser 和 core/UI 回归。

`shortcut` 将 T/N/C/O 转发到 `gPlayerView/gAdvance/gSheet/gNight` 现有按钮，不另写状态变更逻辑。仅处理未被消费的单次字母按键；排除输入／选择／富文本焦点、输入法（含 keyCode 229）、重复、Ctrl/Alt/Meta 及任何打开的原生 dialog。执行前取消名称延迟单击，尊重按钮 hidden/disabled；玩家视角只允许 T 与公开角色表 C，N/O 不得绕过私密操作限制。按钮提供 aria-keyshortcuts 及悬停提示。运行 `test-grimoire-shortcuts.cjs` 和 core/UI，验证真实键盘、大小写、阶段与夜数、取消确认、输入笔记、公开角色表、弹窗／全屏保护及小屏；既有 Escape 路径保持独立。

单人选角使用 `aux.seatRole` 的 `.g-seat-role-picker`，支持本剧本／全角色切换、两段类型分组、来源多选、能力类别与搜索的交集；共享的 `aux.picker` 仍供伪装、传奇和游戏指示使用，不能将全角色切换带入这些用途。本局角色按 ID 覆盖全局库的同 ID 资料，不按名称去重或覆盖导入能力。`assign.extraRole` 仅允许添加所选、尚不存在的玩家角色，原子完成加入定义与分配；拒绝覆写、错配 ID 或传奇／奇遇占座。取消浏览不得修改对局；重复选择当前角色不得清除提示。玩家卡片角色 select 的 `data-role-library` 选项转入全库并通过返回回调恢复卡片。

`prepare-grimoire-role-filters.mjs` 从角色百科已有 ROLES JSON 和 CHARS 生成离线 `role-filters.js`，由 prepare-api 生成流程调用；只解析 JSON，不执行百科 HTML。来源用精确 ID／百科页面对应现有 sources 名单，能力类别复用 categories；不从能力文字猜测来源。新增脚本须在 catalog.js 前加载。运行 `test-grimoire-all-roles.cjs`、core/UI、seat-browser、seat-card 和 signals 回归，检查来源／类型／类别、分区、取消无写入、单角色扩展、重复、保存恢复、夜序、导入覆写保护、小屏与隐私。

提示标记模块为 `grimoire/reminders.js` 与 `reminders.css`，须在 `app.js` 前加载。座位继续保存 `reminders` 文字数组，并以等长 `reminderDetails` 记录标记类型和来源角色；旧存档缺省为 `null`。添加、移除、重发角色与备份校验必须同时处理两者，来源角色须属于剧本，不保存重复图标数据。圆桌通过每个圆牌的 `--marker-x/y` 将每位玩家的标记沿一条朝内的直线依次排列，换座、布局与缩放时重算；加号使用下一枚标记的坐标，仅按钮自身的圆形命中区域 hover 或 focus-visible 时显示；隐藏时保留该位置的命中区域，不使用座位 hover、focus-within 或连接路径触发，触屏保持可见；标记单击即移除且保留撤销。列表将标记与加号放在资料下方并换行；玩家视角不生成标记 DOM。标记与加号的定位 transform 不可被全站按钮 active 缩放覆盖，`reminders.css` 对圆桌、列表及选择器分别固定 transform 并禁用位移动画；用 `scripts/test-grimoire-reminder-motion.cjs` 验证悬停、按下几何坐标不变及边缘单击命中。运行 `scripts/test-grimoire-reminder-browser.cjs` 检查悬停、触屏、来源图标、相同文字、移除后索引、恢复与隐私。

笔记面板沿用 v1 的 `notes` 字符串，不新增备份格式；快捷昼夜、标签和目标插入使用 textarea 的光标／选区，不解析执行笔记文字。`apply(notes)` 只刷新笔记状态，不重建座位节点；保存失败时保留输入并显示未保存，重试后刷新面板状态。清空先确认并保留面板内撤销，切换玩家视角清空编辑 DOM。运行 `scripts/test-grimoire-notes-browser.cjs` 检查编辑、浮动拖动、昼夜更新、恢复和小屏；`scripts/test-grimoire-panels-browser.cjs` 统一检查三面板并存、背景操作、token 选择后的保留、夜序进度与玩家视角。旧 sheet/night 浏览器入口转发至此集成验收。左侧工具通过信息卡实测高度与 ResizeObserver 保持 16px 间距，传奇面板跟随入口并限制在视口内。

名称单击进入 `.g-seat-dialog` 紧凑玩家卡片，保持 `gSeatName/Role/Alignment` 编辑入口；生死与投票收在 `#gSeatStatus`。提示标记复用 `markers.token/picker`，可传返回回调，不能丢失草稿。可选 v1 座位字段 `noteDraft`（2000 字）和 `notes`（至多 100 条 `{text,phase,round,at}`）在校验旧备份时补空值；与全局 notes 字符串分开。`seatNoteDraft` 不重建圆桌，输入按玩家合并撤销及历史；`seatNoteAdd/Remove`、`seatRemove` 均走 reducer，移除座位必须清除其所有夜序 progress 引用，且保留其他座位身份。缩减人数、替换剧本也须识别只有笔记的占用座位。玩家视角清空卡片正文与标题中的输入框，公开投影不得带出草稿或记录。运行 `test-grimoire-seat-card.cjs` 检查紧凑布局、窄屏／横屏、资料入口、草稿与记录、标记返回、状态、换座、移除与撤销、刷新和隐私；配合 core/UI、seat-browser、aux-browser 与独立面板回归。

分配角色使用 `g-distribution-dialog` 和本次草稿，不在点击圆牌、搜索或随机补齐时修改对局。`distributionCounts` 仅提供基础配置，`fillBag` 保留手动选择、排除未选旅行者、不解析特殊设置能力；不能满足配比时原草稿不变。`distribute` 默认仍要求满人数，显式 `partial:true` 才允许未满人数并随机放置空位；`extraRoles` 只允许已选的剧本外玩家角色，与座位分配一次提交和撤销，不覆盖已有导入资料。备份格式仍为 v1。运行 grimoire 核心／界面测试和 `scripts/test-grimoire-distribution-browser.cjs`，验证重复数量、人数上限、搜索、取消、部分分配、随机补齐、全角色库、撤销及手机布局。

线下抽取复用满人数的 `distribute`，开始前先验证当前存档可保存，再准备随机结果、写入会话进度并保存对局，存档失败撤去暂存进度且不替换内存状态。进度 `botc_grimoire_draw_v1` 仅保存版本、对局指纹和已完成座位数，位于 sessionStorage；不另存角色资料或已揭开状态，不改变 v1 备份。指纹包含 revision、updatedAt、座位 ID 和 roleId，恢复时严格核对并从盖住状态继续。逐人查看不再随机；只有盖回并成功写入进度才前进。展示期间公开视图保持开启，原面板私密 DOM 已清除；`g-offline-draw` 复用不透明全屏 signal 样式，禁止背景透出或内容淡入。Escape、后台、pagehide、意外关闭对话框均盖回，不自动跳过该座位；返回说书人必须明确确认。核心／界面测试覆盖存储失败、重复角色、原存档保留和刷新恢复，`scripts/test-grimoire-offline-draw.cjs` 检查 Chrome／WebKit 的桌面、手机横竖屏与 iPad 尺寸。

批量全角色库复用 `C.roleGroups/roleInfo` 的来源名单，来源多选为并集，搜索与来源为交集。`gBagSelected` 预览保留所有草稿角色，按 ID 显示重复数量，点击移除一张；不得因筛选隐藏而丢弃选择。随机补齐将完整玩家定义传入 `fillBag`，通过可选 `candidateIds` 单独限制新增候选，保留来源外的手选角色且不随机追加它们。未传此选项时保留原 API 行为。预览放在列表滚动区内，窄屏来源单行横向滚动，底部操作固定在弹窗内；验证 320×568 和 844×390 时仍有角色滚动空间。

## 全站宽屏适配

`assets/product-hierarchy.css` 中的屏幕媒体规则统一处理 2000 CSS 像素及以上窗口：首页、角色索引、角色合集、剧本库、相克规则、夜序查看器及普通资料页使用可用宽度。卡片和长列表增加列数；文字资料居中并保留阅读宽度。目录复用原有节点，超宽屏移入正文旁，普通宽屏恢复右侧目录，手机与打印沿用原有行为。布局按浏览器窗口宽度判断，字体不随屏幕缩小。

运行 `node scripts/test-site-responsive.cjs` 检查代表页面在超宽屏、桌面及手机上的宽度、横向溢出、目录位置，以及剧本选中和夜序导入后的布局。可添加 `--screenshots` 保存截图到 `.sync`，或用 `CLOCKTOWER_CHROME_PATH` 指定 Chromium。目录节点与键盘焦点的窗口切换回归见 `node scripts/test-role-details.cjs`。

剧本选择由 `grimoire/script-picker.js` 管理，官方卡片复用现有预设，库内 JSON 从 `api/v1/scripts.json` 的明确链接读取；不要凭名称猜文件路径。API 的 logo 使用 `prepare-script-logos.mjs` 生成的小图，原始图库不进入分享构建；五个官方透明 logo 的目视确认映射在 `config/grimoire-script-logos.json`。收藏与图片修正按源路径／别名只读关联；不能覆盖库内偏好。最近导入单独限 10 份／2 MB，损坏原记录不自动覆盖。文件、JSON 地址与目录请求必须检查弹窗版本、当前标签和请求序号，编辑、切换或关闭后不得应用旧响应。运行 `test-grimoire-script-picker-browser.cjs` 检查真实库内 JSON、logo、收藏、分页、批量包、多文件、网址、最近记录、取消及移动布局，再运行完整构建。眼睛按钮保留 SVG 和动态可访问名称，列表布局仅从菜单操作。

本地 `file://` 模式不使用 `fetch` 读取库内 JSON：目录复用 API 生成的 `script-directory.js`，原文复用剧本库已有哈希脚本，避免复制整库原文或要求关闭浏览器安全限制。`node scripts/test-grimoire-file-library.cjs` 在独立浏览器中检查直接打开 HTML 后的目录、logo 和原文导入；`GRIMOIRE_TEST_ROOT=dist/astro` 可检查构建产物。API 测试逐项核对本地原文和 HTTP JSON 相同。

隐藏角色的背面按存活、死亡有票、死亡无票三态复用 `theme/life1.png` 与 `theme/death1.png`，翻牌只创建短暂的公开背面层，结束或取消后清理；不得复制私密角色 DOM 作为动画残影。`node scripts/test-grimoire-token-flip.cjs` 检查桌面／手机、Chrome／WebKit 的真实 3D 变换、即时隐藏、快速反向、Esc 与减少动态效果，另用常规魔典验收检查玩家视角和对局保存。

说书人的死亡票放在 `.g-seat-caption` 中，以名称按钮的右边缘为基准，间隔 3 像素并垂直居中；不能再按整个圆牌的右边缘定位，避免名称长短和列表布局造成漂移。玩家视角直接通过背面表达死亡票，不渲染外置帷幕和票图标。`node scripts/test-grimoire-public-life.cjs` 检查三种公开背面、隐私、圆桌／列表中的票位置、点击操作及视角切换，涵盖桌面、428 与 320 像素宽度。

`node scripts/test-grimoire-token-type.cjs` 检查 1–8 字名称的实际 SVG 字形边界、白色描边，以及死亡与复活时图标／两种夜序标记的颜色变化。名称样式由共用 `roleLabel` 生成，避免只优化座位而遗漏分配角色、伪装和传奇选择器；死亡压暗仅作用于座位中的角色图片和夜序标记，不应滤暗整张底牌或名称。

日夜场景由 `.g-app` 的 `data-phase` 驱动，准备阶段沿用白天。夜景是负层级背景，云雾是更上方的负层级装饰，二者均禁止指针事件；不能给整个工作台施加亮度或透明度滤镜。首次读取存档不播放昼夜过渡，其后切换阶段才启用淡入淡出。`node scripts/test-grimoire-phase-background.cjs` 覆盖日夜推进、刷新夜间存档、撤销、玩家视角、减少动态效果和装饰层操作，支持 `GRIMOIRE_TEST_ROOT=dist/astro` 验证构建产物。

帷幕仅在说书人将存活玩家标为死亡时播放 g-shroud-cover；动画作用于按钮的 ::before 图案，固定按钮命中区域不动。结束、取消或超时清理标记，其他重绘与恢复存档不重播，尊重减少动态效果。`node scripts/test-grimoire-status-cycle.cjs` 验证 Chrome／WebKit 的下盖动画、稳定命中区、隐藏圆牌鼠标／触屏／键盘三态循环、隐私、人数、撤销和持久保存，支持 `GRIMOIRE_TEST_ROOT=dist/astro`。

提示标记的弧形名称由 reminders.js 的 caption 生成独立 SVG 路径，路径 ID 与角色名称隔离且每次唯一；文字只写入 textContent。善良／邪恶通用标记由 catalog.reminderIcon 引用 theme/reminder-good.png、reminder-evil.png，不借用角色图。显式 custom 类型即使文字为“善良”也不显示图标；居中文字使用纯文字 SVG，最多三行并保留完整 title／aria-label。保留 v1 提醒及来源字段，无需迁移。`node scripts/test-grimoire-reminder-display.cjs` 检查 Chrome／WebKit 桌面、428／320 宽度的弧度、边界、图标、居中、列表、移除与隐私；另运行 reminder-browser 和 reminder-motion 验证持久保存与固定点击区。

圆桌中央图标由 gCenter 绘制，位于座位／提示标记后方，pointer-events 为 none。剧本模型保留可选 logo（最多 10000 字符），兼容原有无该字段的 v1 备份；剧本库选择须沿用 logoURL 的分类修正，JSON 导入读取 _meta.logo，站内 URL 保存为相对 script_tool 的路径以便备份移植。prepare-script-logos.mjs 从已确认配置与生成清单输出 script-logo-presets.js，页面须在 catalog.js 前加载，支持 file://；旧官本只有名称及完整角色 ID 集合均匹配时才回补官本图标。无图或失效回退 theme/custom.png，列表自动隐藏。开关独立保存在 botc_grimoire_display_v1，默认 true，不写对局记录。运行 test-grimoire-center-logo.cjs，配合 script-picker-browser 和 file-library 检查图标来源、失效回退、开关保存、旧存档、玩家视角及桌面／手机布局。

夜序列表与圆牌编号使用 ClocktowerGrimoire.nightActions，按角色 ID 合并显示并保存所有 seats／steps；不可按角色名称合并，也不可修改基础 nightOrder／nightQueue 的逐座位结果。底层 nightMark 继续逐玩家保存，聚合状态只有所有玩家相同时才为 done／skipped，部分完成为 mixed。nightMark 保持旧数据兼容，界面不再显示完成、跳过、撤回按钮，也不按旧进度淡化或划去角色。只有在场 seats 非空且全部死亡时整条行动加 dead；混合生死时仅死亡玩家的标签与操作行淡化，死亡不能自动过滤行动。使用 test-grimoire-night-duplicates.cjs 检查 Chrome／WebKit 桌面、428／320 宽度的合并、灰化、编号、独立记录、复活、刷新与隐私，并运行 night-badges-browser、panels-browser 回归。

夜序面板无已分配 roleId 时自动 all=true，并禁止切回空的在场列表；分配角色后恢复可切换，清空最后一个角色后再次自动显示全剧本。预览始终不写 progress／history，旧进度保留在备份中但不作为显示样式。night-readonly 浏览器验收及 UI 测试覆盖自动切换、两种夜晚均无操作按钮、清空角色与只读存档字节不变。

紧凑对局卡为 #gSummary，图标按钮 #gSummaryLogo 与原 gScript 共用剧本选择器；open(opener) 须保留来源焦点，关闭后返回相应按钮。#gSummaryToggle 收起、#gSummaryOpen 在左侧工具栏展开，summaryCollapsed 与 showScriptLogo 共存于 botc_grimoire_display_v1，写入任一设置不能覆盖另一项。折叠只更新卡片和布局，不重建座位或笔记编辑器。positionLeftTools 对隐藏卡片使用 -8px 作为基准，使工具栏和固定笔记从 8px 开始；显示时仍留 16px 间隔。基础配比直接用 distributionCounts，并扣除已分配旅行者，不从角色能力推断设置。运行 test-grimoire-summary.cjs 验证桌面／窄屏／横屏、图标入口、焦点、持久折叠、笔记与隐私；配合 script-picker-browser、panels-browser 和 status-cycle 回归。

倒计时模块为 grimoire/timer.js 与 timer.css，在 app.js 前加载并由 GrimoireTimer.create 初始化，作为页面内工具独立于 reducer、history、对局存储及私密内容。运行使用 Date.now 截止时间计算剩余量，不能按回调次数减秒；收起、视角切换不暂停，visibilitychange/focus 校准后台时间，到时清除 interval 且只提示一次。音频仅在用户开始或开启声音时解锁，禁用或不支持音频仍有文字和颜色提示。状态提示固定留出两行，避免输入失焦校验改变计时面板高度导致按钮点击落空。测试 scripts/test-grimoire-timer.cjs 覆盖双浏览器、320 窄屏及 844×390 横屏、暂停续计、收起到时与存档不变；核心界面测试另验证到时音效不重复和静音。

中央倒计时 gTimerCenter 是 gBoard 的独立子节点，不在每次重绘的 gSeats 内；positionCenter 接收圆桌中心及图标高度的逻辑坐标，随普通／手机／缩放虚拟画布定位。HUD 共用 timer 的 remaining/running/finished，不另开 interval；started 区分已使用的计时和尚未开始／重置状态。默认打开，仅布尔显示偏好保存至 botc_grimoire_timer_center_v1，计时期限仍不跨刷新保存。沙漏 SVG 保留同一 DOM，用 CSS 小图案旋转，暂停／隐藏／后台／到时停止，prefers-reduced-motion 时无动画。HUD 设 pointer-events:none，并复用黑色亚光玻璃；不写入对局、历史或私密身份。scripts/test-grimoire-center-timer.cjs 覆盖双引擎、桌面／手机横竖屏／iPad、中央位置、缩放与滚动、暂停到时、偏好和减少动态效果。

计时入口位于 .g-left-tools 内、传奇按钮下方，面板通过 timer.position 跟随入口并限制在视口内；positionLeftTools 在摘要折叠、视角与尺寸变化后统一重定位。左侧栏可在高度不足时滚动，保留伪装按钮的空间；玩家视角隐藏伪装入口后按视口底部计算边界，不能使用隐藏元素的零尺寸裁掉侧栏。

自定义导入页采用 .g-script-custom-scroll 与 .g-script-custom-footer：表单／候选在主区滚动，确认按钮与状态留在底部，不能因最近记录数量或长 JSON 被挤出视口。最近标签的显示与删除保留分开的 button、完整可访问名称，当前项按规范化剧本内容比较（不比较 logo）；官方快捷按钮只切换标签，不改对局。Ctrl／Meta + Enter 走相同载入入口并忽略输入法组合状态；主动载入递增 importJob，防止更早的文件或网址请求覆盖内容。使用 script-picker-browser 验证 10 条长名称记录、桌面／320 窄屏／横屏及原有 URL、文件、多剧本、取消、备份与迟到响应保护。

标记间距由 app.js 的 reminderPlacement 计算：先定位全部角色，再读取几何信息。首枚标记边缘间距统一为 32px，为座位名称留下固定空间，每枚标记与加号严格位于角色中心到圆桌中心的射线上，按顺序向内增加；不读取名称、死亡票、夜序编号、邻近角色或标记做避让。后续标记共用同一直线及步长，不能因 hover／active 改变坐标。运行 test-grimoire-reminder-spacing.cjs 检查 13 人、多枚标记、各方位、圆形／椭圆的严格朝内直线及统一间距，并确认长名字与死亡票不会挪动标记，再运行 reminder-browser 与 reminder-motion 回归。

提示标记的悬停操作由 reminders.js 的 control 生成，圆牌按钮与翻转／删除按钮为并列节点，不能嵌套 button。桌面悬停、键盘聚焦或触屏点击圆牌显示操作，点击圆牌本身不删除。翻转通过 reminderFlip 更新 reminderDetails 的可选 flipped:true，旧版省略字段仍可读取；图案、文字与纹理共用 .g-reminder-face 旋转 180°，仅对内层图案播放 360ms 动画，坐标与操作按钮不能旋转，减少动态效果时跳过动画。翻转随备份、刷新、换座和撤销保留，公开视角清空标记与操作。

角色表与夜序面板的图标通过 app.js 的 roleWikiIcon 包装为新窗口链接，玩家卡片的游戏建议也复用 GrimoireCatalog.wikiPage。优先保留 CHARS 中 ID 与名称一致的映射；外部 ID 则仅按标准化名称与能力文本唯一匹配，忽略空白、全半角及常见逗号、句号、分号、冒号，不忽略夜晚星号、数量或加减号。只读取 CHARS 的本站 ../pages/ 路径，不使用导入剧本提供的网址；能力版本不同、同名能力匹配有歧义或未知角色保持普通图标，不改写原始角色定义。链接须保留 _blank、noopener noreferrer、角色名与百科用途的可访问名称，以及键盘聚焦样式，不能拦截标题栏拖动或修改对局。grimoire-ui 检查可信映射与自定义降级，panels-browser 检查固定／浮动图标实际打开新页面、原页面与对局保持不变；test-grimoire-wiki-links.cjs 使用真实的精挑细选v17外部 ID 剧本回归两个面板、桌面／触屏和固定／浮动窗口。

窗口 resize 与圆桌 ResizeObserver 共用 schedulePosition，在一帧内合并排版请求；显式 position（如换布局／角色变更后的 render）会取消待执行帧并立即更新，避免使用过时坐标。scripts/test-grimoire-layout-performance.cjs 覆盖 13／30 人圆桌的密集尺寸事件与浏览器重排次数；不使用受机器负载影响的绝对耗时作为通过条件。玩家改名走 refreshSeatName，只更新对应座位的可见名字及无障碍标签，不能重建圆牌／标记、打断动画或改变其他座位；grimoire-ui 保留节点、提醒状态和撤销回归。

普通替换剧本、导入对局和重新开局共用 replace：保留确认、校验与撤销，不自动下载“替换前备份”；菜单手动备份继续可用，损坏存档的单独恢复保护流程不变。grimoire-ui 与 script-picker-browser 检查取消无写入、确认无下载、撤销恢复与手动导出。触屏剧本选择器的正文沿用自身伸缩布局，不叠加普通弹窗的固定高度扣减；script-picker-browser 检查短横屏剧本列表，visual-viewport 检查键盘弹出时导入按钮可见。

phoneViewport 只匹配粗指针下宽度不超过 700px，或宽度不超过 1000px 且高度小于 500px 的视口；这些视口默认调用 positionPhoneTable，使用圆桌和独立滚动区域，40px 标记、24px 朝内间距及紧凑控制栏均限定在 g-phone-ui。超过 20 人的圆桌宽度至少为 620px，提示标记较多时也按向内直线所需空间扩展，允许横向平移；玩家视角不使用私密标记数量计算圆桌尺寸。普通手机圆桌为底部控制留出可视区域，短横屏改为左右分区。细指针桌面沿用原坐标计算；test-grimoire-phone-circle.cjs 检查触屏 8／13／15／20／30 人、平移、提醒入口、首中末座位和手选列表，设置 GRIMOIRE_DESKTOP_BASELINE 可与旧构建比较桌面几何信息。平板圆桌的横向半径不再为桌面侧栏预留 400px，底部按控制栏实测高度留空。resize 只调整布局和坐标，不调用 render 重建座位；手选布局由 layoutExplicit 区分。VisualViewport 的 resize／scroll 仅在粗指针且 scale 接近 1 时更新编辑窗口可见高度和上下边界，不改变对局、不移动整个圆桌，也不拦截捏合缩放。浮动面板和 timer 共用可见边界，文本区域须保留节点与光标。运行 scripts/test-grimoire-responsive.cjs（手机、iPad 横竖屏、分屏、浮动面板与布局恢复）和 scripts/test-grimoire-visual-viewport.cjs（模拟键盘缩高与视口平移），配合 panel-resize、seat-card、timer、panels-browser 与 layout-performance 回归；浏览器模拟不等同于实体设备测试。

标记翻转走 reminders.refreshFlip，同步圆桌与玩家卡片中的朝向和 aria-pressed，不重建其他圆牌／标记。反向翻转从当前显示角度继续，停止同一标记已有的动画；其他标记的动画继续运行。grimoire-ui 与 reminder-flip 浏览器回归覆盖连续翻转、双视图一致、撤销与刷新。

圆桌的能力悬浮说明由 app.js 的 setupRoleTooltips 统一委托给 gSeats，只响应鼠标悬停及键盘可见焦点，触屏点击继续原有选角功能。说明读取当前对局能力，用 textContent 输出，固定坐标限制在可见视口内，不跟随每次 pointermove 测量。render、open、滚动、窗口失焦及切换玩家视角时清空说明和 aria-describedby，避免缓存私密角色文字。test-grimoire-role-hover.cjs 检查白色名称、边缘定位、字距、HTML 文本、键盘收起、触屏与隐私。

自由摆放使用 tableShape=free 和独立的 freePositions 编号数组，写入 botc_grimoire_display_v1.freeLayout，不进入对局状态、历史或备份。placeSeats 以画布比例适配视口，按整座圆牌和名称的尺寸约束边界；不改玩家 ID 或顺序。setupSeatPointer 在自由模式下移动位置、在其他模式下保留 swap；pointermove 合并到现有 RAF，仅松手／键盘微调后保存，取消手势恢复拖动前坐标。自由模式下不自动转列表，手机画布大小不随私密标记数变化；新增编号取圆桌默认点，删除及换座保持编号对应的布局。自由模式提示标记沿角色到中央的直线定距排列；不执行避让。test-grimoire-free-layout.cjs 检查桌面／触屏拖动、提示跟随、刷新恢复、窗口适配、键盘、重置、玩家视角和损坏的布局偏好。

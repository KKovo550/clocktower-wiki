# Astro 维护约定

## 分层与数据来源

正式页面由 Astro 渲染。`src/components/` 负责公共界面，`src/layouts/` 负责页面布局，`src/pages/` 负责现有 URL。侧栏内容只编辑 `config/navigation.json`；Python 兼容站点读取同一配置，不能再单独维护一份菜单。

百科正文暂时保留在现有 HTML 中，角色数据仍通过既有整合脚本生成。`scripts/prepare_astro.py` 是兼容适配层：先准备内容、验证引用，再将正文记录和发布资源输出到 `.astro-content/`。它不创建 ZIP、不调用交互测试，也不触发发布。后续可以逐类将正文换成结构化数据；不要一次重写角色能力、来源和工具逻辑。

`templates/header.html` 和 `footer.html` 仅服务旧 Python 中间站点，不是 Astro 公共界面的来源。`templates/sidebar.html` 是生成文件。旧同步功能继续生成中间内容，同步完成后需运行 Astro 构建才能形成正式发布结果。

## 日常命令

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

`.astro-content/`、`.astro-content-next/`、`.astro/` 和 `dist/` 都是生成目录。准备失败不得继续发布；临时内容准备完成后才替换上一份内容。构建不访问外部资料站，在线资料同步由明确的同步命令单独执行。

## 发布与回退

当前公开 GitHub 仓库只有构建产物，并不包含完整源码或运行本地测试所需数据，因此不能把它误当作源码 CI。发布前在本地运行 `npm run validate`，只将 `dist/astro/` 同步到发布仓库，保留其 `.git`；提交后等待 Pages 成功并检查线上页面。不要把整个根目录直接推送到公开仓库。

源代码和原始数据应随本地项目备份，`package-lock.json` 应一并保留。升级依赖应独立进行，使用 `npm ci` 验证并运行完整检查。页面地址、localStorage 键、角色 ID 和跨页面导入协议属于兼容约定，修改前必须考虑既有草稿和旧链接。

回退线上版本可在发布仓库撤销对应提交后重新部署。不要为回退清除浏览器草稿或删除原始角色、剧本资料。


夜序弹窗支持在首夜、其他夜晚各自列表中拖拽或使用上下按钮排序。当前剧本的 `nightOverrides` 随浏览器存档保存，优先于全站默认夜序，并同时应用于预览、复制、角色排序和 JSON 导出。恢复默认会清除两夜调整；导入、清空、随机生成、载入预设会重置调整。

群星目录与配置维护于 `config/stars.json`，角色运作原文维护于 `config/stars-guide.json`。使用 `scripts/import_stars.py 文档路径 --guide-only` 更新原文；构建时 `integrate_stars.py` 按角色名合并说明，保留没有新版说明的角色及寻宝团线上/线下配置。页面文件仍使用 `群星_角色名.html` 防止同名来源冲突，显示标题不含“群星：”。

海外自制角色总览由 `scripts/style_homebrew.py` 基于 `config/yuque-import.json` 渲染，导入和构建共用该布局。通用角色网格使用 `.gallery` / `.gallerybox`，总览仅通过目录锚点导航，不加载搜索与类型筛选脚本；修改时验证分区锚点及完整角色数量。

角色快速预览由 `scripts/prepare-role-preview.mjs` 生成 `assets/role-preview-data.js`，按页面路径区分同名角色。能力、夜序来自统一 API 数据，运作方式来自角色页面；相克规则优先用角色页面资料，同名跨来源规则不作推断。图标悬浮预览由 `assets/role-preview.js` 管理，点击图标仍直接打开对应角色页面，本地资料脚本按需加载，支持离线打开及键盘操作。

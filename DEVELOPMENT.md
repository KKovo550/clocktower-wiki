# 钟楼资料库 · Astro

面向《染·钟楼谜团》玩家与说书人的中文资料网站，整合角色百科、规则查询、角色索引、剧本库、剧本编辑与制图工具。

[访问网站](https://kkovo550.github.io/clocktower-wiki/) · [反馈问题](https://github.com/KKovo550/clocktower-wiki/issues) · [文档中心](docs/README.md) · [维护约定](docs/MAINTENANCE.md)

本目录是源码维护项目。Astro 生成正式静态网站，Python 负责内容整合、图片处理与搜索数据生成，浏览器脚本负责搜索和剧本工具。GitHub 的 `KKovo550/clocktower-wiki` 仓库存放构建后的发布文件，不能直接当作本源码项目安装运行。

## 选择入口

- **使用网站**：[角色索引](https://kkovo550.github.io/clocktower-wiki/role_index/角色索引.html) · [剧本库](https://kkovo550.github.io/clocktower-wiki/script_lib/剧本库.html) · [剧本工具](https://kkovo550.github.io/clocktower-wiki/script_tool/剧本工具.html)
- **维护源码**：从下面的快速开始安装依赖；发布目录不包含开发环境。
- **定位问题**：[故障排查](docs/TROUBLESHOOTING.md) · [后台配置](docs/ADMIN.md)
- **程序调用**：[公共 JSON 数据接口](docs/API.md)，支持角色、剧本索引、原始剧本 JSON、默认夜序和相克规则。

## 阅读导航

- [快速开始](#快速开始)与[常用命令](#常用命令)
- [目录与维护入口](#目录与维护入口) · [完整维护约定](docs/MAINTENANCE.md)
- [剧本数据与状态约定](#剧本数据与状态约定)
- [内容更新](#内容更新)与[GitHub Pages 发布](#github-pages-发布)
- [离线包与图片策略](#离线包与图片策略)
- [常见问题与排查](#常见问题与排查)

## 主要功能

- **资料查询**：全文搜索、角色详情、规则说明、夜晚行动顺序及认证说书人查询。
- **角色索引**：按名称、ID、能力描述、角色类型、能力类别和来源组合筛选，支持官方、奥德赛及海外自制角色。同名角色保留各自来源。奥德赛、群星和海外自制总览使用统一图库排版；图标悬浮预览只显示名称、已有英文名、角色类型、能力及已有背景故事，点击打开详情。
- **剧本库**：搜索、包含或排除角色、剧本对比、收藏、个人记录及可用 JSON 导出。可将当前版本的 JSON 发送到剧本工具，确认后载入。
- **剧本工具**：角色选择、官方预设、自定义角色、随机生成、搭配检查、JSON 导入导出和浏览器草稿保存。
- **图片导入**：浏览器 PaddleOCR 识别标题和角色，优先检索剧本库候选；人工核对并补选后导入，无需启动本地识别服务，支持试验性 GPU 加速。
- **在场夜序**：独立查看器导入剧本 JSON，手动添加玩家并分配角色，可过滤为只显示在场角色。
- **夜序编辑**：首夜与其他夜晚独立拖拽或按按钮调整，支持恢复默认。列表、复制文本、制图和 JSON 导出使用同一套顺序。
- **相克规则**：百科卡片支持搜索与分组筛选，包含奥德赛规则；剧本提示、搭配检查和制图共用匹配逻辑。
- **剧本制图**：默认“复古官方风 · 固定参考图尺寸”，PNG 原始清晰度和 SVG 均为 1111 × 1500；角色名称使用 SimHei，正文使用 Sarasa UI SC。默认不添加底部术语说明，释放的高度用于角色间距；传奇与奇遇合并展示，角色绘制在四角叶子上方。支持自定义 Logo、夜序、相克、撤销与重做；自动加长必须手动选择。AI Logo 通过本机服务使用环境变量密钥，公开静态网站不提供生成服务。
- **外部角色图标**：未收录角色按 JSON 图片地址加载，制图优先使用本地缓存，跨域失败时自动经本站图标接口读取并内嵌；不替换原始角色数据。
- **快捷编辑与制图**：手机工作区快捷导航、设置与预览切换、三种快速版式及可恢复的一键纯净；导入 JSON 的元数据与角色扩展字段随草稿和再次导出保留。

## 快速开始

两人共同开发请先阅读 [协作指南](docs/COLLABORATION.md)，克隆私有源码仓库并通过功能分支和 Pull Request 合并修改。

需要 Node.js 22.22.2+（22.x）、24.15+（24.x）或 26+，以及 Python 3.10+。Python 依赖见 `requirements.txt`。

在源码项目根目录执行：

```powershell
npm ci
python -m pip install -r requirements.txt
npm run validate
npm run preview
```

打开终端显示的预览地址，站点基础路径为 `/clocktower-wiki/`。开发时使用：

```powershell
npm run dev
```

正文、角色数据或同步内容改变后，重新启动开发服务或重新构建。若 Python 不在 PATH 中，可将 `PYTHON` 环境变量设为解释器完整路径。

首次图片处理较慢，后续构建复用缓存。当前配置会在构建时联网读取在线编辑记录；这与构建完成后的网站离线阅读是不同流程。

## 常用命令

```powershell
npm run build            # 准备内容、类型检查、Astro 构建、产物校验
npm test                 # 交互、数据与工作流回归测试
npm run validate         # 完整构建和全部已接入测试，发布前使用
npm run preview          # 预览已构建的网站
npm run package:offline  # 校验并生成 Astro 离线包
npm run preview:art      # 生成固定验收样例 PNG、SVG 和浏览目录
```

正式网站输出为 `dist/astro/`，离线包为 `dist/钟楼百科_Astro离线分享版.zip`。旧的 `python scripts/site.py` 命令用于兼容内容管线，其 HTML 和 ZIP 不作为当前默认发布产物。

稳定版本交接步骤与固定制图样例见 [稳定版本验收](docs/STABILITY.md)。样例测试不读取本机历史 `.sync/` 快照；修改视觉基线必须单独生成并人工核对。

针对性检查：

```powershell
node scripts/test-editor-nights.cjs
node scripts/test-odyssey-jinx.cjs
node scripts/test-script-art.cjs
node scripts/test-art-ui.cjs
node scripts/test-workflow.cjs
node scripts/test-role-index.cjs
node scripts/test-certifications.cjs
node --test scripts/tests/admin.test.mjs
```

检查覆盖正文保留、页面与资源引用、图片尺寸、资源哈希、导入导出、草稿、夜序、相克和主要交互。自动测试不能替代实际设备上的视觉与下载体验检查。

## 目录与维护入口

```text
src/                     Astro 页面、组件、布局和内容契约
pages/                   百科正文及部分生成页面
files/                   图片详情页面
images/                  原始百科图片
assets/                  公共样式、脚本、搜索索引与生成媒体
role_index/              角色索引数据与页面
script_lib/              剧本库页面、数据及本地原件
script_tool/             剧本工具与制图模块
scripts/                 内容构建、导入、同步、打包与测试
config/                  导航、来源清单、搜索别名及后台配置
admin/                   在线编辑后台相关代码
templates/               兼容页面模板及 GitHub README 模板
docs/                    维护文档
.astro-content/          Astro 生成输入，不手工修改
.sync/                   本机下载缓存、暂存和备份，不发布
dist/astro/              正式静态产物
```

- 公共页头、侧栏和页脚修改 `src/components/`，全站布局修改 `src/layouts/WikiLayout.astro`。
- 导航以 `config/navigation.json` 为准；不要在各页面重复修改导航。
- 正文修改对应 `pages/*.html`；认证查询、相克汇总等生成内容应修改其来源或生成脚本。
- 搜索别名维护 `config/search-aliases.json`；搜索索引在构建时生成。
- `templates/github-readme.md` 是发布仓库的 README 来源，构建时复制到产物中；源码 README 另存为 `DEVELOPMENT.md`，`docs/*.md`、`CONTEXT.md` 和基础数据配置说明随构建一起发布。

## 剧本数据与状态约定

- 夜序以百科总表为默认来源，手动调整统一用于列表、复制文本、图片和 JSON。
- 相克提示、搭配检查与制图使用同一套角色匹配逻辑。
- 导入和草稿恢复先完整校验，失败时不部分应用状态。
- 制图中的说明、排版和自定义相克不写回剧本 JSON。
- 已收录角色优先复用本地图标；匹配不改变导入的能力和夜序。

实现入口、旧草稿迁移及具体边界见 [剧本工具数据说明](docs/SCRIPT_TOOL.md)。

完整的数据来源、生成顺序与修改入口见 [数据维护指南](docs/DATA_MAINTENANCE.md)。

## 内容更新

### 官方百科最近更改

```powershell
python scripts/sync_recent.py --dry-run
python scripts/sync_recent.py
python scripts/sync_recent.py --days 30
```

也可运行 `SYNC.cmd`。同步使用 `.sync/stage-*` 暂存，通过检查后更新文件，备份保存在 `.sync/backup-*`，失败不推进检查点。同步期间避免同时编辑页面；确认同步进程已结束后，才处理遗留的 `.sync/run.lock`。

删除、移动、模板及其他命名空间事件需要人工处理。角色索引、剧本库和海外自制资料具有独立来源，官方同步不会自动改写它们。同步完成后仍需 `npm run validate`，再发布 Astro 产物。

### 海外自制角色

```powershell
python scripts/import_yuque.py --refresh
python scripts/test_yuque.py
npm run validate
```

来源清单为 `config/yuque-import.json`。不带 `--refresh` 可用已有缓存重建。详情使用独立文件名，保留来源和署名，不覆盖同名官方角色。

### 在线编辑记录

`config/admin.json` 配置在线编辑来源。构建读取 `admin-overrides.json`，检查与本地正文是否冲突；冲突或最终读取失败会停止构建。连接中断、429 和服务端错误最多尝试三次，不使用空数据代替在线编辑记录。

## GitHub Pages 发布

当前发布仓库：[KKovo550/clocktower-wiki](https://github.com/KKovo550/clocktower-wiki)。Pages 从 `main` 分支根目录提供静态文件，网站基础路径为 `/clocktower-wiki/`。

1. 在源码项目完成修改，运行 `npm run validate`。
2. 通过预览检查本次修改涉及的页面。
3. 将 `dist/astro/` 的发布文件同步到发布仓库，核对差异，保留仓库配置与在线编辑记录。
4. 提交并推送到 `main`。
5. 在 GitHub Actions 确认 Pages 部署成功，再检查线上页面。

不要上传整个源码工作目录、`.sync/`、凭据、依赖缓存或剧本原图资源库。源码 Git 与发布仓库应分别维护；修改本地文件、构建或打包都不会自动上线。

## 离线包与图片策略

默认只交付 `dist/钟楼百科_Astro离线分享版.zip`，不包含剧本图片库，也不附带大型剧本库资源包。解压后保留目录结构，在电脑浏览器中打开 `index.html`；手机优先使用在线网站。

百科图片、角色图标、搜索、剧本查询、对比及可用 JSON 导出保留。发布版剧本库的原有剧照预览不可用，但剧本工具生成 PNG/SVG 的功能可用。外部链接和远程图片需要联网。

本地 `script_lib/library` 原件可能通过硬链接保留，应视为只读，修改内容可能影响原项目。只有明确需要完整图片库时，才另行运行 `python scripts/package_library.py`。该脚本仍使用旧包的顶层目录，不能假定与 Astro 包直接解压后就能合并；需要人工对齐 `script_lib/library` 路径，并检查发布版中已禁用的图片入口。

## 常见问题与排查

草稿恢复失败、导入缺图、夜序或相克不一致、图片文字过密、构建冲突及发布缓存的处理方法，见 [故障排查](docs/TROUBLESHOOTING.md)。

重要剧本先导出 JSON；不要把清理浏览器存储当作普通刷新步骤。

## 日常维护建议

1. 先确认数据来源及生成脚本，避免同时维护多份夜序或相克数据。
2. 修改业务行为时补充能复现问题的回归检查，失败时保留原始输入以便核对。
3. 发布前运行 `npm run validate`，并预览受影响的页面。
4. 核对发布差异，仅同步构建产物；确认 Pages 成功后记录提交号。
5. 内容同步前备份工作文件，重要剧本导出 JSON；不要在反馈或提交中包含私人数据与凭据。

## 反馈与来源

反馈请提供页面地址、角色或剧本名称、复现步骤、预期与实际结果及设备浏览器信息。不要提交账号密码、令牌或私人存档。

资料主要来自[钟楼百科](https://clocktower-wiki.gstonegames.com/)、[奥德赛百科](https://www.yuque.com/u48069482/taiyi)及[海外自制角色合集](https://www.yuque.com/liuzhongqi-7p5ih/wxjs)。制图装饰来源记录见 `script_tool/assets/script-tool/decorations/sources.json`。页面保留对应原文链接，规则和认证状态请结合来源核对。

本项目为个人整理的非官方网站。游戏名称、规则文字、图标与第三方素材归各自权利人所有；公开访问不代表统一开源或商业授权。当前没有声明统一开源许可证，使用或再分发前应分别确认代码及素材的授权条件。

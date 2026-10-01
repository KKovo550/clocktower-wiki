# 项目概览 · 阶段 0

日期：2026-09-25。范围：D:/dpsh/wiki_site 本地维护源码，以及公开发布仓库的工作流配置。仅建立全局认知；未进行缺陷定级、依赖漏洞扫描或业务代码修改。

## 已读取的依据

根 README.md、package.json、package-lock.json 的存在情况、requirements.txt、astro.config.mjs、tsconfig.json、scripts/package.json、scripts/test.mjs、scripts/prepare_astro.py、scripts/lib/runtime.mjs、docs/MAINTENANCE.md、admin/wrangler.jsonc、config/github-pages.json。
根目录没有 CONTEXT.md、CLAUDE.md、AGENTS.md、pyproject.toml 或 go.mod；排除依赖、生成目录和缓存后的目录中也未发现 AGENTS.md / CLAUDE.md。

## 项目定位与技术栈

这是中文钟楼百科、角色检索、剧本库、剧本编辑/制图和夜序查看工具，主体为静态网站，另有独立的在线编辑后台。

- Astro 7.3.3：静态渲染、公共布局与动态路径入口。
- JavaScript：浏览器工具主要使用原生 DOM 和全局脚本；Node 侧包含 ESM 与 CommonJS。scripts/package.json 明确指定 CommonJS，根包指定 ESM。
- TypeScript 6.0.3 / astro check：src 使用 strict 配置，但 checkJs=false；不能把类型检查通过理解为全部浏览器脚本都受到类型检查。
- Python 3.10+ / Pillow 12.3.0：百科内容、角色数据、图片、同步、打包与兼容页面管线。
- Cloudflare Worker：admin/worker.mjs 为后台入口；wrangler.jsonc 定义静态资源与部署配置。
- npm package-lock.json 锁定 Node 依赖；requirements.txt 固定 Pillow 版本。未在本阶段判断依赖是否过时或存在漏洞。

## 目录结构（聚合展示）

```text
wiki_site/
├── README.md / package.json / package-lock.json / requirements.txt
├── astro.config.mjs / tsconfig.json
├── src/
│   ├── components/        公共页头、侧栏、页脚
│   ├── layouts/           WikiLayout.astro
│   ├── pages/             [...path].astro
│   └── lib/               内容契约与加载
├── scripts/               内容构建、同步、集成、发布校验
│   ├── lib/               运行时及网络请求工具
│   └── tests/             Node 测试
├── config/                导航、来源、后台与发布配置
│   └── script-tool/       基础角色、相克、预设
├── pages/                 百科正文与部分生成页
├── files/                 图片详情 HTML
├── images/                原始百科图片
├── assets/                共享脚本、样式、索引和生成媒体
├── role_index/            角色检索页面与数据
├── script_tool/
│   ├── 剧本工具.html / 夜序查看器.html
│   ├── assets/script-tool/ 编辑、制图、导入、夜序模块
│   ├── icons/             角色图标
│   └── 魔典/              既有魔典相关资源
├── script_lib/
│   ├── assets/ / data/    浏览器逻辑与索引
│   ├── library/           本地剧本原件（图片、JSON 等）
│   ├── tools/             数据处理工具
│   └── tests/             剧本库测试
├── admin/                 在线编辑 Worker、前端与配置脚本
├── templates/             兼容页面与公开 README 模板
└── docs/                  维护、数据、后台与排障说明
```

树与规模统计忽略 node_modules、dist、build、.git、.sync、.astro、.astro-content、.astro-content-next、__pycache__ 和符号链接；大型内容目录不展开到单文件。

## 代码规模

按 .js/.mjs/.cjs/.ts/.tsx/.astro/.py/.css 的物理行统计，以下主要代码目录共 124 个文件、9,495 行。包含测试和少量生成数据脚本，不含 HTML 内联脚本；压缩文件/单行数据会低估实际复杂度，不是纯手写业务 LOC。

- src：6 个代码文件，114 行。
- scripts：46 个代码文件，3,343 行。
- admin：4 个代码文件，162 行。
- assets：15 个代码文件，1,113 行。
- role_index：3 个代码文件，244 行。
- script_tool：14 个代码文件，1,470 行。
- script_lib：36 个代码文件，3,049 行。

同一排除口径下另有 1,109 个 HTML、1,070 个 JSON，文件名含 test 的代码文件 28 个。script_lib 共 6,848 个文件，以内容资源为主，不能全部视为代码。

## 构建、测试与 CI

构建链：npm run build → prepare:content → Python site.build/check → .astro-content-next 暂存 → 在线编辑记录集成 → .astro-content → astro check → astro build → check:output。

正式输出 dist/astro，base 为 /clocktower-wiki；离线包另由 package:offline 生成。当前构建读取远程在线编辑记录，构建需要联网与产物支持离线阅读是两件事。

测试采用 Node 内置 node:test、assert、jsdom/VM 交互测试，以及 Python unittest 和独立检查脚本。npm test 调用内容/后台测试、10 个工具测试套件、剧本库 *.test.cjs、2 个 Python unittest 文件。存在未直接列入此入口的独立 Python 测试，是否需纳入留待阶段 2。

npm run validate = 完整构建 + 已接入测试。本阶段未重新运行全套；此前最近构建日志 .sync/night-players-build.log 显示 1,105 条路由、93,209 处本地引用、1,460 个资源哈希校验通过。这是既有构建证据，不是本轮全项目审查通过的结论。

本地未发现 .github/workflows。通过 GitHub API 检查公开仓库，仅返回启用的 pages-build-deployment（dynamic/pages/pages-build-deployment）；这是静态 Pages 部署流程，不是源码单测/类型/内容构建 CI。

## 版本管理与实施前提

根源码 Git 无 HEAD，git ls-files 为 0；当前文件尚未建立版本化源码基线。dist/github-pages 是独立的发布仓库。后续“每项修复单独提交、可回滚”需要先明确源码基线与纳入范围，不能把整个资源目录直接推到公开仓库。本阶段不创建提交、不改变仓库状态、不发布。

## 潜在风险区域（仅列候选，不定级）

1. 源码基线与公开产物仓库的备份、提交、回滚边界。
2. Python/Node/Astro 多阶段生成过程的输入快照、原子性及远程依赖。
3. 角色 ID、同名角色、别名、来源以及夜序/相克的跨模块一致性。
4. JSON 导入、草稿迁移、玩家名单与制图历史的状态隔离、竞态。
5. 外部 HTML 清洗、SVG/图片 URL、Worker 认证授权与 GitHub 写入边界。
6. 大型资源、嵌入式图标、重复解析/搜索及长海报导出的性能。
7. 浏览器脚本类型检查、测试入口完整性、真实浏览器与离线体验覆盖。
8. Windows 路径、编码、硬链接资源、文件 URL 与跨域环境差异。
9. 文档、配置、生成文件之间的来源归属与术语一致性。
10. 依赖锁定、可复现安装、源码 CI 与发布校验的完整性。

## 阶段边界

阶段 0 完成，仅新增本概览及展示文件。等待确认后才进入阶段 1：提取领域术语并创建 CONTEXT.md；不提前进入分维度审查或修复实施。

# 钟楼资料库

查角色、找剧本、做海报，用魔典带团与复盘。面向《染·钟楼谜团》（Blood on the Clocktower）玩家、说书人和剧本作者的中文资料网站，支持电脑与手机。

[访问网站](https://kkovo550.github.io/clocktower-wiki/) · [使用指南](docs/USER_GUIDE.md) · [魔典教程](https://kkovo550.github.io/clocktower-wiki/index.html#guide-grimoire) · [反馈问题](https://github.com/KKovo550/clocktower-wiki/issues) · [文档中心](docs/README.md)

本目录是**源码维护项目**。私有源码仓库为 [clocktower-wiki-source](https://github.com/KKovo550/clocktower-wiki-source)，公开仓库 [clocktower-wiki](https://github.com/KKovo550/clocktower-wiki) 保存构建后的静态网站。参与开发请使用源码仓库，协作方式见[协作指南](docs/COLLABORATION.md)。本文描述当前源码能力；线上版本以实际部署内容为准。

## 从这里开始

- **查资料**：[角色百科](https://kkovo550.github.io/clocktower-wiki/role_index/角色索引.html)、[相克规则](https://kkovo550.github.io/clocktower-wiki/pages/相克规则.html)与[夜晚行动顺序](https://kkovo550.github.io/clocktower-wiki/pages/夜晚行动顺序一览.html)。
- **找剧本**：[剧本库](https://kkovo550.github.io/clocktower-wiki/script_lib/剧本库.html)，按名称、作者、角色和分类筛选，查看版本与可用 JSON。
- **做剧本**：[剧本工具](https://kkovo550.github.io/clocktower-wiki/script_tool/剧本工具.html)，编辑角色、夜序与规则，导出 JSON、PNG 或 SVG。
- **带团复盘**：[在线魔典](https://kkovo550.github.io/clocktower-wiki/script_tool/在线魔典.html)，管理座位、身份、状态与行动记录；只需夜序时可使用[独立夜序查看器](https://kkovo550.github.io/clocktower-wiki/script_tool/夜序查看器.html)。
- **接入数据**：[只读 JSON 接口](docs/API.md)，提供角色、剧本索引、原始剧本 JSON、默认夜序与相克资料。

## 主要功能

### 百科与剧本

- 全文搜索及角色筛选，支持名称、ID、能力、类型与来源；收录官方、华灯初上、山雨欲来、奥德赛、群星及海外自制等资料。
- 角色详情、能力分类、规则范例、相克与夜序查询；同名角色保留来源与能力版本。
- 剧本库支持包含／排除角色、分类筛选、相似剧本对比、收藏、个人记录、图片查看和可用 JSON 导出。

### 编辑与制图

- 官方预设、自定义角色、JSON 导入预览、替换或追加、多个草稿与恢复点。
- 浏览器内图片识别，结合剧本库候选与人工校对恢复角色名单，无需另开本地识别服务。
- 首夜与其他夜晚独立排序；编辑器、夜序、制图与 JSON 导出共用顺序。
- 复古风格海报，支持 Logo、背景、相克和自定义排版；默认智能适配，优先保留 1111 × 1500，内容过多时按原双栏风格加长，导出 PNG／SVG。

### 在线魔典与复盘

- 圆桌、列表与自由摆放，支持角色分配、线下抽取、换座、生死与死亡票、提醒标记、昼夜推进和计时。
- 手机 15 人圆桌提供顶部快捷工具栏与“编号＋姓名”标签；空间不足或标记较多时可滑动查看。
- 从玩家详情快速添加当前阶段的复盘。优先按本局能力匹配已核对模板，其他描述可生成记录表单；复杂规则保留原文，由说书人填写实际结果。
- 支持能力来源、阶段变化摘要与阶段魔典。符合条件的行动可选择仅记录或同时更新当前魔典；历史补记只修订记录。
- 对局库保存与归档、备份恢复、图片复盘、离线互动 HTML，以及有有效期、可撤销的手机只读分享链接。

完整操作说明见[使用指南](docs/USER_GUIDE.md)和[魔典说明](docs/GRIMOIRE.md)。自动生成记录表单不等于自动理解或裁定全部能力。

## 保存与分享

- 草稿、玩家笔记、个人记录和对局主要保存在当前浏览器，不会自动跨设备同步。
- 剧本 JSON 用于交换剧本；完整创作备份用于迁移编辑资料；对局备份用于继续魔典。图片与只读复盘不能代替这些备份。
- 复盘分享是固定快照，之后编辑不会同步到旧链接。分享包含所选阶段的真实身份、夜间信息与提醒，排除玩家私密笔记和未保存草稿，发送前请核对预览。
- 网站主体为静态页面；在线编辑、远程图标读取和手机只读分享等服务需要对应后端。分享服务配置见[后台说明](docs/ADMIN.md)及[分享入口说明](admin/share-gateway/README.md)。

## 本地运行

环境要求以 `package.json` 和 `requirements.txt` 为准：Node.js 22.22.2+（22.x）、24.15+（24.x）或 26+，Python 3.10+。

在完整源码项目根目录执行：

```powershell
npm ci
python -m pip install -r requirements.txt
npm run dev
```

打开终端提示的地址，站点基础路径为 `/clocktower-wiki/`。首次准备会生成图片、字体等缓存，耗时较长；当前配置还会联网读取在线正文编辑记录。若 Python 不在 PATH 中，可用 `PYTHON` 环境变量指定解释器完整路径。

正文或基础角色资料改变后，需要重新准备内容或重启开发服务。仅需预览已有构建时使用 `npm run preview`。

## 常用命令

```powershell
npm run dev              # 准备内容并启动开发服务
npm run check            # Astro 类型与页面检查
npm run build            # 准备内容、检查、构建并校验产物
npm test                 # 已接入的数据、交互和工作流测试
npm run validate         # 完整构建与测试，发布前运行
npm run preview          # 预览已构建网站
npm run package:offline  # 校验并生成离线包
npm run preview:art      # 生成固定制图验收样例
```

网站输出为 `dist/astro/`，离线包为 `dist/钟楼百科_Astro离线分享版.zip`。修改源码不会自动更新旧构建或旧离线包。旧的 `python scripts/site.py` 命令保留用于兼容内容管线，其 HTML 和 ZIP 不是当前默认发布产物。

自动检查不能替代真机上的触屏、下载和分享验证。固定样例与交接步骤见[稳定版本验收](docs/STABILITY.md)。

## 修改入口

- **公共页面与导航**：`src/components/`、`src/layouts/` 与 `config/navigation.json`。
- **首页**：`scripts/style_product_home.py` 和 `scripts/style_home.py`；功能更新维护 `config/home-updates.json`，百科资料更新来自 `recent.html`。角色与剧本数量由目录数据生成。
- **首页教程**：`scripts/site_guide.py`；交互逻辑为 `assets/start-guide.js`。
- **百科正文与搜索**：`pages/`、`role_index/`、`config/search-aliases.json`；生成页面应修改对应来源或生成脚本。
- **剧本库**：`script_lib/`；**剧本编辑与制图**：`script_tool/assets/script-tool/`；**在线魔典**：`script_tool/assets/grimoire/`。
- **角色与来源**：`config/script-tool/`、`config/stars.json`、`config/yuque-import.json`，具体约定见[数据维护指南](docs/DATA_MAINTENANCE.md)。
- **界面样式**：`assets/archive-parchment.css` 等共享样式；魔典使用自己的样式约定。网页主题不参与海报 SVG 绘制。
- **文档与发布介绍**：`docs/`、`README.md` 和 `templates/github-readme.md`。构建将发布模板复制为网站产物的 `README.md`，本源码说明复制为 `DEVELOPMENT.md`。

`.astro-content/` 是生成输入，`.sync/` 是本机缓存与暂存目录，`dist/` 是构建输出。不要将手工修改只留在这些目录中。原百科首页说明与锚点保存在 `about.html`。

## 内容维护

常见维护命令：

```powershell
python scripts/sync_recent.py --dry-run  # 预览官方百科更新
python scripts/sync_recent.py            # 按当前配置同步百科
python scripts/import_yuque.py --refresh # 刷新海外自制来源
```

官方百科、群星、海外自制与剧本库有各自的数据来源；一次同步不会自动覆盖所有合集。同步使用暂存与备份，失败时保留原内容；删除、移动和模板事件需人工处理。

构建会按 `config/admin.json` 读取在线编辑记录并检查冲突。读取失败或正文冲突会停止构建，不应使用空数据绕过。

更多说明：[维护约定](docs/MAINTENANCE.md) · [数据维护](docs/DATA_MAINTENANCE.md) · [群星导入](docs/STARS_IMPORT.md) · [故障排查](docs/TROUBLESHOOTING.md)。

## 协作与发布

协作者需要私有源码仓库的独立权限，公开发布仓库的权限不会自动继承。按[协作指南](docs/COLLABORATION.md)使用功能分支和 Pull Request，避免覆盖彼此的修改。

发布流程：

1. 在源码项目完成修改，运行 `npm run validate`，预览受影响页面。
2. 检查 `dist/astro/`，将发布文件同步到公开发布仓库，保留仓库配置与在线编辑记录。
3. 核对差异后提交、推送，在 GitHub Actions 确认 Pages 部署成功，再检查线上页面。
4. 需要新版离线包时，单独运行 `npm run package:offline`。

**本地修改、构建、打包或合并源码，不会自动发布网站。** 请勿上传 `.sync/`、凭据、依赖缓存、私人对局或大型剧本原图库。

发布版包含已确认正反面的剧本压缩预览，不包含原尺寸剧本图片库。外部链接、远程图片与在线分享服务需要联网；手机本地文件的能力受系统和浏览器限制。

## 文档与反馈

- [文档中心](docs/README.md)：使用、开发和维护入口。
- [剧本工具说明](docs/SCRIPT_TOOL.md)：导入、草稿、夜序、OCR 与制图约定。
- [在线魔典](docs/GRIMOIRE.md)：带团、记录、分享与恢复。
- [后台配置](docs/ADMIN.md) · [公共 API](docs/API.md) · [统一术语](CONTEXT.md)。

反馈问题请提供页面地址、角色或剧本名称、操作步骤、预期与实际结果，以及设备和浏览器信息。必要时附截图，不要提交账号密码、令牌或私人存档。

## 来源与权利

主要资料来自[钟楼百科](https://clocktower-wiki.gstonegames.com/)、[奥德赛百科](https://www.yuque.com/u48069482/taiyi)及[海外自制角色合集](https://www.yuque.com/liuzhongqi-7p5ih/wxjs)，并保留对应来源和署名。制图参考及装饰来源见 `script_tool/assets/script-tool/decorations/sources.json`。感谢游戏创作者、资料整理者、角色与剧本作者和图标画师。

本项目是个人整理的非官方网站。代码、规则、图标、剧本及其他素材应分别确认授权；仓库公开不代表统一开源或商业许可。目前未声明统一开源许可证，使用或再分发前请核对相应权利。

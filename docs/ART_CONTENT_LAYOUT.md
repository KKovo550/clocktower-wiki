# 固定海报正文排版优化（2026-10-13）

此轮仅修改本地，未提交、推送或发布；等待用户确认效果后再处理 GitHub。保留 1111 × 1500 输出、原有图标／素材和其他预设，未改变角色定义或夜序数据。

## 算法

`art-print-layout.js` 的 `contentLayout` 负责固定画布、紧凑海报这一分支。其他阅读版、自动长图及旧预设继续走原分支。

1. 从参考图读取画布比例，以 1280 宽的设计坐标计算；PNG 和 SVG 输出尺寸仍为 1111 × 1500。
2. 使用已加载字体的实际文字宽度，将名称、完整能力段落、相克和角色规则分别换行。每角色高度由名称行数、能力行数、行距、图标及说明块共同决定，不使用统一角色高度。长名称完整换行，不再省略后半部分。
3. 每个分区尝试连续切分点，选择两列最大高度最小的方案；保留角色输入的相对阅读顺序，不跨分区。各列独立累积高度，下一分区始于较长列底部加标题清空距离。
4. 统一标题／分隔线样式，按实际分区高度分配空间。两个栏和各分区使用同一角色间距，不拉伸短列，也不为填满画布分配额外空白。正文列使用可用宽度，仅留下 6 个设计像素的字形安全边。
5. 按用户第二次反馈，使用原版在相同内容、设置下的适配字号和文字锚点作为基准与上限，不再自动放大正文。优先调整间距和行距，角色间距为 10–22 个设计像素、行距至少约 1.24 倍；只有仍无法容纳时才允许在原版字号基础上最多再缩小 5%，保留原有最低可读字号约 17.6。超出容量时拒绝导出，不裁切、不自动增加高度。
6. 术语框复用同一份换行结果与高度数据，按实际内容预留空间；没有术语框时正文可延伸至底部装饰清空区。长标题进入作者信息的横向范围时，收进标题区，避免压住作者文字。
7. 背景、底纹和角饰保持独立 SVG 图层，不改变正文预算。预览、导出及点击区域共用同一布局对象；夜序沿用原有独立几何和排序逻辑。
8. `wrapAbility` 用实际测量在小范围内寻找同等行数的断点，减少“正确”“玩家”“死亡”等词语被拆分；自动末行仅余 1–2 汉字时，调整最后两行，使末行至少有 4 个汉字。保持原文字、标点规则、行数和显式换段，不用缩放字形处理孤字。显式独立的“死亡”等短段落不会强行并入上一段。

## 修改范围

- `script_tool/assets/script-tool/art-print-layout.js`：内容驱动的双列分区、递进适配、完整名称、术语空间预算。
- `script_tool/assets/script-tool/art-core.js`：使用每角色能力起点和名称行数、实测术语框、长标题与作者清空距离。
- `script_tool/assets/script-tool/art.js`：Canvas 文字测量采用与渲染一致的字体及字重。
- `scripts/tests/art-content-fit.test.cjs`：分区边界、完整文字、独立两列、按容量缩字、背景独立、术语及容量保护。
- `scripts/render-art-content-fit.cjs`：真实 Chrome 字体测量、SVG 字形边界检查、生产 SVG/PNG 导出和前后对比图。
- `scripts/test-art-vintage.cjs`、`scripts/test-art-file-fonts.cjs`：更新每角色起点、动态术语高度和 Canvas 字重模拟，继续保护旧预设和导出功能。
- `scripts/test.mjs`、`docs/SCRIPT_TOOL.md`：登记新验收入口及当前行为。

## 本地验收和图片

主要样本直接读取剧本库的 `#信口雌黄-努力努力.json`，保留原角色文字、顺序及身份。对比使用相同暖纸、夜序素材、图标与文字标题；用户上传的金色 Logo 不作为固定测试资源替换或写入项目。

图片位于 `.sync/poster-layout-20261013/`，每张 1111 × 1500；`*-前后对比.png` 左侧是优化前、右侧是优化后。保存 SVG、PNG、每项布局数据和 `before-report.json`／`after-report.json`。

第二次反馈的最终审阅图位于 `.sync/poster-wrap-20261013/`，保留“原版”“上轮大字版”“换行优化”三个版本。`*-原版与换行优化.png` 和 `*-上轮大字版与换行优化.png` 均为左侧基准、右侧本轮结果。主样本正文设计字号保持 18.5744，自动短末行计数从原版 3 处、上轮 5 处降到 0 处；其他验收样本也按相同规则检查。原始字体、图片、长名称和上一轮对比不会被覆盖。

第三次反馈按用户红线缩小标题区：`header` 集中规定标题、上传 Logo、顶部徽记、作者、人数及副标题的位置。普通正文起点从设计坐标 175 上移到 150，导出中约上移 22 像素；主样本字号、文字区域宽度和换行不变，统一角色间距从 18 增至约 21.88，约增加 22%。不修改图片源或 Logo 颜色，上传 Logo 等比例缩进标题区。人数与副标题同时存在时增加相应保留行；全局规则框仍按其实际高度保留空间，不强行上移覆盖它。标题编辑的点击范围跟随新的标题区，避开首个角色。

第三次反馈图片位于 `.sync/poster-header-20261013/`，`*-上移前后对比.png` 为左旧右新，所有单张导出仍为 1111 × 1500。除既有样本外，添加了长标题加人数／副标题／版本，以及上传 Logo 的浏览器边界验收。

第四次标注反馈仅调整顶部和文字对比度：上传 Logo 的最大设计高度由 86 增至 116，底部到设计坐标 124（导出约 108 像素）；文字标题上限由 86 增至 108。作者与 Logo 可以处在同一纵向区域，但保留水平安全距离，特别宽的 Logo 或长作者名自动收窄／避让。正文起点、字号、行距、换行、角色间距及分区几何数据不变。固定印刷海报角色名称取消 6% 白色混合，技能普通文字改用既有深色墨色 `#211a17`；颜色关键词、字重及字号保持原值。首夜爪牙／恶魔信息图标单独缩至角色夜序图标的 72%，上限 40，仍居中占用原槽位，不移动或缩小可拖动的角色图标。

本轮比较图位于 `.sync/poster-polish-20261013/`，`*-标注修改前后对比.png` 左旧右新；备份位于 `.sync/poster-polish-20261013-before/`。真实浏览器同时检查 Logo 与作者的矩形边界、标题裁切、名称与能力边界，并核对前后八个有效样本的完整正文几何数据完全一致。

## 图标视觉尺寸统一（正文排版锁定）

`config/script-art/icon-optics.json` 保存可维护的分类阈值和补偿系数。`scripts/build_art_icons.py` 从现有内嵌 PNG 的透明度和有效像素测量形状，追加 `SCRIPT_ART_ICON_OPTICS` 元数据，不重画、重新着色或修改任何图标像素。视觉边界按 alpha ≥ 24 测量；安全边界纳入所有非透明像素。形状细长（短长轴比 ≤ 0.42）或密度很低（≤ 0.18）的系数为 1.12；线条型密度 ≤ 0.30 为 1.06；横向展开（宽高比 ≥ 1.45，密度 ≥ 0.30）为 0.94；饱满型密度 ≥ 0.52 为 0.92；普通型为 1.00。分类依次判定，目标视觉长边为 64 个设计像素 × 系数，相当于导出中的约 51–62 像素。

`ScriptArt.iconGeometry` 仅在当前固定海报的正文绘制阶段应用补偿。原布局中的图标中心保持不变，尺寸不再随着能力行数增大；最终以现有横向图标区和角色高度的像素边界限制，保留横向 2、纵向 1 个设计像素的安全距离。短描述角色空间不足时只在现有空间内补偿，不改行距或角色高度。原图透明边留白与既有裁切视口纳入计算，不直接统一 PNG 外接框。相同位图的导入别名复用测量，未知／替换位图不应用过时数据。夜序、相克注释小图标、角色来源标记和其他预设维持原绘制。

本轮不修改 `art-print-layout.js`、正文文字参数或任何布局计算结果。测试将整个布局逐字段比较，并删除正文角色图标后逐字比较 SVG，覆盖正文、阵营分区、标题、作者、页脚、背景、装饰与夜序。真实像素另检验不会碰到文字或邻接角色。备份与图片分别保存在 `.sync/poster-optical-20261013-before/`、`.sync/poster-optical-20261013/`；`*-图标调整前后对比.png` 为左旧右新。

确认视觉效果并同步时，五个固定验收样本的 SVG 基线更新为本轮结果。早期九个基于历史缓存逐轮比较字号、固定行高、强制列尾填充或夜序大小的实验测试保留为历史参考，不再作为当前排版的发布约束；日常测试由 `art-content-fit`、`art-icon-optics`、`art-night-drag`、固定验收基线、界面与导出测试覆盖这些行为。Canvas 测量替身从带字重的完整字体表达式提取 `px` 字号，避免误把字重 500 当成字号。密集剧本手动加入术语超过当前容量时测试要求明确提示并禁止导出，简短传奇剧本继续验证术语成功导出；不修改生产布局以迎合旧测试。

样本包括原剧本、带术语框、五个加长能力、长名称与多段角色规则、32 个短描述角色、原剧本加两名传奇角色。另测试原剧本再追加多名角色导致超出容量的情况，要求明确拒绝而非裁切。容量按内容和字号决定，不等于固定可接受任意 32 角色组合。

浏览器通过 `Canvas.measureText` 排版、生产 SVG 渲染和 Canvas PNG 导出，并将 SVG 放入文档后使用 `getBBox()` 检查实际名称／能力边界、列宽、术语框与长标题／作者信息。角色能力完整性、分区边界、数据不变和背景独立另由测试检查。未自动更新历史视觉快照，效果需要用户确认。

回归入口：

```text
node --test scripts/tests/art-content-fit.test.cjs scripts/tests/art-night-drag.test.cjs
node scripts/test-art-ui.cjs
node scripts/test-art-vintage.cjs
node scripts/test-script-art.cjs
node scripts/test-art-file-fonts.cjs
node scripts/render-art-content-fit.cjs
node scripts/render-art-content-fit.cjs --wrap-review --before
node scripts/render-art-content-fit.cjs --wrap-review --previous
node scripts/render-art-content-fit.cjs --wrap-review
node scripts/render-art-content-fit.cjs --header-review --before
node scripts/render-art-content-fit.cjs --header-review
node scripts/render-art-content-fit.cjs --polish-review --before
node scripts/render-art-content-fit.cjs --polish-review
node --test scripts/tests/art-icon-optics.test.cjs
node scripts/render-art-content-fit.cjs --optical-review --before
node scripts/render-art-content-fit.cjs --optical-review
node scripts/test-art-preview-scroll.cjs --release
npm run build
```

## 回退

修改前文件保存在 `.sync/poster-layout-20261013-before/`，以相同相对路径保存三个运行文件、预设源与生成配置、工具说明，清单为 `files.txt`。回退时将清单中的文件复制回项目相同路径，再构建本地页面；不需要修改角色数据、素材或 Git 历史。该备份目录与对比图片均在忽略目录内，不进入发布产物。

第二次反馈之前的文件另存于 `.sync/poster-wrap-20261013-before/`，包含上轮布局、相关测试、生成工具和说明，清单同样为 `files.txt`。

第三次反馈之前的文件另存于 `.sync/poster-header-20261013-before/`，保留上一轮已完成的字号与换行逻辑，可单独回退本次标题区和间距调整。

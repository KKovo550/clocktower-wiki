# 在线魔典视觉资源

本地界面改版日期：2026-10-21。

善良／邪恶提示标记新增透明面具 `script_tool/theme/reminder-good.png`、`reminder-evil.png`，由内置 imagegen 参照用户截图生成；原始提示词、用途和保存说明见 [提示标记面具素材](GRIMOIRE_REMINDER_MASKS.md)。紫色底纹和文字仍由界面独立绘制，自定义标记只绘制文字。

背景使用用户提供并已存在于项目中的 `script_tool/theme/bg_day.png` 和 `bg_night.png`。准备阶段及白天使用前者，夜晚使用后者；由对局阶段驱动，恢复、撤销、玩家视角也沿用同一阶段。夜景层在背景上淡入淡出，预先加载以避免首次切换等待。`theme/clouds.png` 作为静态透明装饰，主要保留边缘，白天不透明度 0.16、夜晚 0.08，位于所有座位、标记与控件下方，不拦截鼠标操作。减少动态效果时直接切换。素材保持原文件，均不依赖外站图床。角色牌复用 `theme/token1.png`，隐藏背面按生死／票状态复用 `theme/life1.png` 与 `theme/death1.png`。

界面采用全屏场景、环形座位、两侧快捷工具和右下角控制面板。手机保留同一布局逻辑，压缩侧栏并为底部控制预留区域；超过 10 人时默认列表展示。显示方式和面板收起不会改变对局数据。玩家视角隐藏控制面板及私密工具。

选择剧本中的 logo 来自现有剧本库。`scripts/prepare-script-logos.mjs` 将已分类 logo 和 `config/grimoire-script-logos.json` 中逐个目视确认的五个官方透明 logo 生成至 `script_tool/assets/grimoire/script-logos/`，最长 320 × 160、保持透明与比例，不裁剪；清单位于 `script-logos.json`。目录按原图内容与缩图设置的哈希去重，不改变图库原文件。`prepare-api.mjs` 会先更新这些小图，JSON 索引只链接可发布的预览资源；不把 `script_lib/library/` 原图目录带入构建产物。原有正背面阅读预览也可用于用户在浏览器里指定的图片分类修正。

旧背景 `script_tool/assets/grimoire/moonlit-town.webp` 保留在素材目录，以下记录其原始生成提示词：

```text
Create one ORIGINAL production background illustration asset for a fullscreen Chinese Blood on the Clocktower storyteller grimoire web application. Landscape wide 16:9, 1920x1080 or higher. Atmospheric hand-painted storybook illustration, cool slate blue / grey muted palette, moonlit medieval European village in drifting silver mist, a tall gothic clock tower near the center slightly to the upper half, steep timber-frame roofs and crooked bare trees on the far left and right and lower foreground, pale clouded moon upper right, detailed soft watercolor / charcoal textures. Village square open through the middle, calm low-contrast center and spacious middle ring where circular role tokens will later be overlaid by code. Architecture feels eerie, beautiful, lived-in and gently mysterious, not horror gore. Foreground roofs frame bottom corners; atmospheric perspective, cinematic soft diffuse lighting. Illustration fills entire canvas to edges. No words, no letters, no logo, no watermark, no UI, no cards, no tokens, no border, no people. This is the background scene only, NOT a website screenshot. Make a distinct original town composition, do not reproduce any existing screenshot or game artwork.
```

实际生成尺寸为 1672 × 941，WebP 保持同一尺寸。上述目标尺寸是生成提示，非实际文件尺寸承诺。

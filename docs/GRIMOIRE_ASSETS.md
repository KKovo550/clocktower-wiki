# 在线魔典视觉资源

本地界面改版日期：2026-10-21。

背景文件：`script_tool/assets/grimoire/moonlit-town.webp`。使用内置 `image_gen` 工具生成原创插画，保留原始 PNG，并使用 Sharp 转为 WebP（quality 85）。网站内实际使用的文件约 282 KiB，不依赖外站图床。角色牌复用本站已有纸张纹理 `assets/skin/bg.png`，边缘、文字与状态标记由 CSS 绘制。

界面采用全屏场景、环形座位、两侧快捷工具和右下角控制面板。手机保留同一布局逻辑，压缩侧栏并为底部控制预留区域；超过 10 人时默认列表展示。显示方式和面板收起不会改变对局数据。玩家视角隐藏控制面板及私密工具。

生成时使用的完整提示词：

```text
Create one ORIGINAL production background illustration asset for a fullscreen Chinese Blood on the Clocktower storyteller grimoire web application. Landscape wide 16:9, 1920x1080 or higher. Atmospheric hand-painted storybook illustration, cool slate blue / grey muted palette, moonlit medieval European village in drifting silver mist, a tall gothic clock tower near the center slightly to the upper half, steep timber-frame roofs and crooked bare trees on the far left and right and lower foreground, pale clouded moon upper right, detailed soft watercolor / charcoal textures. Village square open through the middle, calm low-contrast center and spacious middle ring where circular role tokens will later be overlaid by code. Architecture feels eerie, beautiful, lived-in and gently mysterious, not horror gore. Foreground roofs frame bottom corners; atmospheric perspective, cinematic soft diffuse lighting. Illustration fills entire canvas to edges. No words, no letters, no logo, no watermark, no UI, no cards, no tokens, no border, no people. This is the background scene only, NOT a website screenshot. Make a distinct original town composition, do not reproduce any existing screenshot or game artwork.
```

实际生成尺寸为 1672 × 941，WebP 保持同一尺寸。上述目标尺寸是生成提示，非实际文件尺寸承诺。

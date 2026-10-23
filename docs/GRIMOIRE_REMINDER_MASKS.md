# 提示标记面具素材

2026-10-23 使用内置 imagegen 生成，依据用户提供的红色邪恶面具与蓝色善良面具截图，作为风格参考；不是截取截图中的背景或完整圆牌。两张 PNG 都保留真实透明通道，图标和名称由界面分开绘制。

- 善良：`script_tool/theme/reminder-good.png`
- 邪恶：`script_tool/theme/reminder-evil.png`

原始生成图保留在 Codex 的 generated_images 中，项目引用的是已复制到 theme 中的本地文件。

## 最终生成提示词

邪恶：

```text
Create ONE transparent PNG game UI icon, not a complete token. Asset: EVIL alignment theatre mask for a Chinese Blood on the Clocktower grimoire reminder. Use the attached small red smiling theatrical mask screenshot as visual style reference only. A single symmetrical front-facing slightly elongated classic smiling theatre mask, rich crimson red outer face and forehead with ivory-white sculpted cheek/eye highlights, narrow closed crescent eyes, broad sly ivory toothy smile, subtle raised eyebrows. Handmade painted aged screen-print / worn parchment illustration texture, strong simple silhouette and chunky facial features readable at 32 pixels. Flat orthographic icon, very light relief only. Match old gothic board-game character artwork, avoid photorealism, avoid glossy emoji or plastic 3D. Center the isolated mask in a square image with roughly 8% transparent padding around it, use most of available space. Transparent outside the mask and through eye holes. No text, no labels, no circular token, no purple disk, no border, no background scene, no watermark. This will be paired with a blue GOOD mask of identical silhouette and size.
```

善良：

```text
Create ONE transparent PNG game UI icon, not a complete token. Asset: GOOD alignment theatre mask for a Chinese Blood on the Clocktower grimoire reminder. Use the attached small blue smiling theatrical mask screenshot as visual style reference only. A single symmetrical front-facing slightly elongated classic smiling theatre mask, rich cobalt / cyan blue outer face and forehead with ivory-white sculpted cheek/eye highlights, narrow closed crescent eyes, broad friendly ivory toothy smile, subtle raised eyebrows. Handmade painted aged screen-print / worn parchment illustration texture, strong simple silhouette and chunky facial features readable at 32 pixels. Flat orthographic icon, very light relief only. Match old gothic board-game character artwork, avoid photorealism, avoid glossy emoji or plastic 3D. Center the isolated mask in a square image with roughly 8% transparent padding around it, use most of available space. Transparent outside the mask and through eye holes. No text, no labels, no circular token, no purple disk, no border, no background scene, no watermark. This will be paired with a red EVIL mask of identical silhouette and size.
```

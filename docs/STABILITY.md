# 稳定版本验收与交接

当前制图默认值以 `config/script-art/presets.json` 为准：复古官方风、参考原图 1111 × 1500、SimHei 名称、Sarasa UI SC 正文、默认无术语说明、传奇／奇遇合并、角色绘制在叶子上方。自动加长必须手动选择。早期 `ART_VINTAGE*.md` 是历史记录，不覆盖当前默认值。

## 固定视觉样例

在源码根目录执行 `npm run preview:art`，打开 `.sync/art-acceptance/index.html` 查看五张 PNG 和 SVG：

- `ordinary`：22 角色普通剧本，包含厨师／共情者相克。
- `reference-long`：25 角色长能力剧本，检查短列末尾空间及恶魔间距。
- `supplemental`：25 角色复杂剧本，包含传奇／奇遇及短能力角色。
- `many`：32 个短能力角色，检查固定画布适配。
- `manual-footer`：主动添加术语说明，检查正文与底部边界。

输入剧本、角色描述和字体测量数据保存在 `scripts/fixtures/art-acceptance/`，不读取历史 `.sync/` 缓存。预览使用当前生产 SVG 渲染器并内嵌两种字体；PNG 的标题字形仍可能受运行机器可用字体和栅格器影响。SVG 基线使用固定测量数据，PNG 校验尺寸而不比较跨系统像素哈希。

两种提供字体的 SHA-256 固定在 `font-sources.json`，字体测试直接核对仓库中的文件，不要求克隆独立的“分析梅利剧本工具”项目。

`.gitattributes` 固定 SVG 源文件使用 LF 换行，避免 Windows 克隆时将装饰转换成 CRLF、导致内嵌图像摘要变化。固定样例仍比较完整 SVG 摘要，不忽略素材差异。

`npm test` 包含固定样例验收：检查完整能力、双栏边界、角色碰撞、图标框、术语显示、合并分区、叶子层级及实际 PNG 1111 × 1500。基线包含完整 SVG 摘要和主要布局数值，可发现标题、装饰或正文的意外变化。

只有明确批准视觉变化后才执行 `node scripts/render-art-acceptance.cjs --update-baseline`。逐张核对图片及 `baseline.json` 差异，再运行 `npm run validate`。常规预览和测试不会自行重写基线。

## 新协作者首次验证

1. 接受私有源码仓库邀请，克隆 `KKovo550/clocktower-wiki-source` 的实际默认分支。
2. 安装 README 要求的 Node.js 与 Python，执行 `npm ci`、`python -m pip install -r requirements.txt`。
3. 在没有 `node_modules`、`dist`、`.astro-content` 和历史 `.sync` 的首次工作目录中执行 `npm run validate`。
4. 执行 `npm run preview:art`，打开五张样例，与维护者确认的图片比较。
5. 执行 `npm run dev`，手动核对 JSON 导入、夜序调整、预设切换／撤销、PNG／SVG 下载。

已有历史测试在检测到本机旧快照时会做额外对比；固定样例验收无此条件，干净克隆也会执行。首次验证成功后再建立自己的功能分支。重要剧本以导出 JSON 备份；本机草稿不在 Git 中。

源码库与公开发布库分别保存维护输入和静态构建结果。源码库包含构建所需图片、字体、OCR 模型、JSON 与配置；原始剧本图片／PDF、独立研究目录、密钥及缓存不属于交接内容。网站发布前记录源码提交与发布提交的对应关系，保留 `dist/astro/` 的产物校验结果。

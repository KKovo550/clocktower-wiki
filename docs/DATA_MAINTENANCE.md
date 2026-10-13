# 网站数据维护

## 基本原则

修改来源，再运行构建。不要同时修改来源和生成结果。独立快照不是自动同步数据库：百科正文、角色目录与剧本库有不同的更新入口。

## 按要修改的内容找入口

### 基础角色、相克与预设

维护 `config/script-tool/roles.json`、`jinx.json`、`presets.json`。字段及兼容约定见[配置说明](../config/script-tool/README.md)。`scripts/build_editor_catalog.py` 校验并生成浏览器数据。

角色 ID 必须唯一；不为修复图片而修改能力。预设引用 ID，避免角色排序变化导致选错角色。能力、名称、图片等仍沿用已有字段，不在本次整理中改写规则。

### 海外自制角色

来源清单为 `config/yuque-import.json`，详情保存在 `pages/海外自制_*.html`。使用 `scripts/import_yuque.py` 更新源资料，`integrate_homebrew_editor.py` 再合并到编辑器。生成器会去掉上次的海外角色再重建，避免重复追加。

### 夜序和奥德赛相克

夜序源为百科夜序页及奥德赛角色页面的前位角色说明；依次通过 `integrate_odyssey_nights.py`、`integrate_editor_nights.py` 生成合并表与浏览器夜序映射。

奥德赛相克源为相克总表与角色页，`integrate_odyssey_jinx.py` 同时生成编辑器数据和百科卡片。增加新的补充来源时，要更新该脚本的来源列表，并核对抓取到的规则文本。

### 百科、索引与查询

- 百科正文：`pages/`，官方最近更改更新由 `sync_recent.py` 处理。
- 全角色索引：`role_index/roles.jsonl` 为独立基础快照，`integrate_roles.py` 关联百科和图片；正文同步不等于索引能力更新。
- 角色来源：`config/role-sources.json`；分类依据源页面名单，不凭能力描述猜测。
- 搜索别名：`config/search-aliases.json`；`assets/search-index.js` 自动生成。
- 导航：`config/navigation.json`；不在每页手动添加链接。
- 认证查询：从本地原名单构建，`build_certifications.py` 生成查询页。
- 剧本库：独立数据快照，原件在 `script_lib/library`；默认发布不包含剧照。原件可能是硬链接，应按只读数据处理。
- 在线正文编辑：构建读取发布仓库中的 `admin-overrides.json`，本地冲突需合并，不能直接清空在线记录。

剧本图片以 `script_lib/data/library.jsonl` 的 `imageDir`、`images` 和 `roles` 为准。核对过版本的图片组使用 `imageBinding: "explicit"`，重新入库不会把目录中其他版本的图片追加回来；找不到对应原图时使用空图片组和 `pictureNotice` 说明，不能拿最新版本海报代替。此类 JSON 内容修改后，图片会进入待核对状态。

正背面分类支持本地 OCR：`node script_lib/tools/classify-pictures.cjs --name 剧本名 --apply`，不传 `--name` 时扫描缺少分类的图片，默认最多 40 张，可用 `--limit` 调整。默认不传 `--apply` 只预览。识别依据完整图片的角色能力表、人数表与署名，横幅和标题裁图不当作封面；多个候选或证据不足时不自动选。人工分类优先，缓存按原图 SHA256 校验，损坏文件跳过，进度保存在 `backups/ocr-cache`。分类记录保存在 `data/picture-analysis.json`，入库会自动使用有效缓存；新同步图片也会先进行本地识别。不修改图片原件。

全量扫描使用 `node script_lib/tools/classify-pictures.cjs --all --apply`。完整人数表优先于封面底部的能力预览；重复文件按 SHA256 合并为一个候选。`data/picture-classification-reviews.json` 保存已核对的图片、版本选择及仅有附图的条目，识别缓存中的 `reviewed` 分类不会随算法升级被覆盖。损坏图片按内容指纹记录为 `unreadable`，原件变化后才重新尝试解码。已确认只有横幅或附图的条目使用 `pictureNotice` 说明缺少完整海报，不要求读者补分类。

剧本详情和图片查看器只显示 `roles.front` 与 `roles.back` 指定的有效图片，图数和“有图”筛选也按这两面统计。Logo、横幅及其他附图保留在原件和图片导出清单中，不进入阅读区。尚未分类时提示“正背面尚待确认”，并保留折叠的“修正图片分类”入口，不能用任意前三张原图代替正背面。

图文与 JSON 配对候选兼容括号、空格和英文译名，但不省略版本号。候选需要核对版本和角色名单后确认，不能仅凭近似名称合并。确认记录保存为 `data/merges.json` 中的 `{to, content}`，`content` 为忽略格式和字段顺序的 JSON SHA256：格式调整保留配对，实质修改后解除图片配对并重新显示独立图文。原始 JSON、图片、来源和个人记录别名继续保留。

B 站图片增量更新使用 `node script_lib/tools/sync-bilibili.cjs --apply`，仅补某篇失败文章可加 `--article 文章ID`（可重复指定）。同名新文章单独入库；仅有明确相同文章来源时复用目录。HTML 空壳会尝试公开文章正文接口，访问限制则停止请求、保留失败队列。`script_lib/tools/picture-policy.cjs` 按完整 SHA256 排除已确认的 BWG 导航宣传图，避免再次入库；不按尺寸或编号删除其他剧本图片。

## 生成顺序

`site.py` 编排内容处理：基础角色 JSON → 海外角色合并 → 图标内嵌 → 夜序整合 → 奥德赛相克整合 → 页面与搜索生成。Astro 随后生成 `dist/astro/`。

图标包、搜索索引、夜序映射和 Astro 产物是可重建结果；`.sync/` 是缓存与备份。基础 JSON、原始页面、来源配置、模板和生成脚本应随源码保存。

## 修改与验证

1. 找到上面的来源入口，保留规则出处，避免修改生成区块。
2. 改 ID 前确认导入、草稿、预设及外部文件的兼容方案。名称不能代替 ID。
3. 执行 `npm run validate`；重复 ID、非法夜序和不存在的预设引用会使校验失败。
4. 对规则改动核对页面和导出 JSON；对图标及布局改动检查制图预览。
5. 只发布 `dist/astro/`，源码和生成脚本单独备份。

本次已将 330 个基础角色、160 条基础相克记录、5 个预设迁到 JSON；海外角色仍由原来源生成。后续数量以文件与构建输出为准。

[返回 README](../README.md) · [维护约定](MAINTENANCE.md)

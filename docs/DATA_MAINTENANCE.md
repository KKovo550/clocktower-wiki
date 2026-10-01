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

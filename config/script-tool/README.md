# 剧本工具基础数据

本目录是基础目录的维护入口，浏览器使用的 `data.js` 由构建生成。

- `roles.json`：基础角色，保留原有 ID、名称、能力、图片和夜序字段。不要随意改动 ID；首尾空格暂为历史兼容保留。新增角色需要唯一 ID。
- `jinx.json`：原有基础相克记录，保留原文；规则有来源更新时先核对原文。奥德赛补充规则仍从百科页面提取，不在这里重复录入。
- `presets.json`：预设名称与角色 ID 列表，列表顺序即预设角色顺序。不再手写数组索引。
- `official-storyteller.json`：官方传奇与奇遇角色的标准 ID、类型、设置与特殊字段映射，核对来源为官方公开资源。中文能力和图标从本站角色页面生成。新增角色追加在现有目录末尾，保留旧草稿的索引；黄昏后的行动按官方夜序接入本站合并顺序。

海外自制角色由 `config/yuque-import.json` 和对应页面导入，不手动追加到本基础目录。海外相克由 `scripts/integrate_overseas_jinx.py` 从角色页面的“相克规则”章节生成，同时更新相克规则页面和剧本工具；组合按角色 ID 匹配，同名版本不会互相替代。空白、暂无和未完待续的章节不生成规则。

运行 `npm run validate` 完成生成和检查。构建顺序为基础 JSON → 海外角色 → 图标 → 夜序 → 奥德赛相克 → 海外相克。生成后的 `script_tool/assets/script-tool/data.js` 不作为角色维护入口。拼音数据目前仍保留在该文件内，生成器不会覆盖。

单独检查基础数据和预设引用：

```powershell
python -m unittest discover -s scripts -p test_editor_catalog.py
```

此整理保留既有规则文本，不表示重新审核了所有规则的准确性。调整角色排列前，也要考虑旧的索引型草稿兼容；ID 型预设不再依赖排列。

## 外部角色图标缓存

`icon-images.json` 记录未收录角色的图片来源 URL、本地文件及 SHA-256；输入图片存放在 `imported-icons/`。这些图片只为制图提供缓存，不会把角色自动加入百科收录目录，也不会修改导入 JSON。

`build_art_icons.py` 在正常构建中离线校验并内嵌缓存图片，清单 `proxy` 指向现有 Worker 的只读图标接口。新增缓存需显式运行 `scripts/cache_imported_icons.py <剧本JSON路径>`；该下载命令仅接受已核查的 Gstone 角色图标路径。

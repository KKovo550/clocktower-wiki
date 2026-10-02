# 公共数据接口 v1

本站使用 GitHub Pages 静态部署，提供只读 HTTP GET JSON 数据接口，无需密钥。源码根目录的 `api/v1/` 是自动生成物，不手工编辑。运行 `node scripts/prepare-api.mjs` 更新；正常 `npm run build` 也会生成并发布。

线上基础地址为 `https://kkovo550.github.io/clocktower-wiki/api/v1/`。接口随网站构建和发布一起更新。

- `index.json`：接口目录、数据数量、内容版本 `revision`。
- `roles.json`：角色列表 `{version,total,items}`；包含 ID、名称、类型、能力、图片地址、来源及首夜/其他夜晚顺序。
- `scripts.json`：剧本索引 `{version,total,items}`；包含稳定 ID、名称、作者、分类、角色名单、别名、来源及 JSON 相对地址。
- `scripts/{id}.json`：原始剧本 JSON 数组，可导入剧本工具。通过索引的 `json` 字段获取地址，不通过名称猜测 ID。
- `night-order.json`：角色默认夜序 `{version,items}`。
- `jinxes.json`：现有角色相克规则 `{version,items}`。

## 搜索名称并获取剧本

```js
const base = 'https://kkovo550.github.io/clocktower-wiki/api/v1/';
async function get(path) {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const index = await get('scripts.json'); // 调用方可缓存索引
const normalize = value => value.normalize('NFKC').replace(/\s/g, '').toLowerCase();
const query = normalize('载入史册');
const matches = index.items.filter(s =>
  [s.name, ...s.aliases].some(name => normalize(name).includes(query))
);
// 同名剧本可能有不同作者或版本，先由调用方选定条目。
const selected = matches.find(s => s.json);
if (selected) {
  const script = await get(selected.json);
  console.log(script);
}
```

Python 可通过 `urllib.request.urlopen` 或已有 HTTP 客户端读取同样的地址。其他语言只需普通 HTTP GET 和 JSON 解析。

## 使用约定

搜索、筛选、分页在调用方完成；`?q=...` 不会触发服务器搜索。不提供上传、OCR 或写入接口，图片识别仍由浏览器执行。跨域访问遵循托管平台响应头；本接口不控制 GitHub Pages 的 CORS 配置。

角色 ID 是不透明字符串，保留原始值；不能用名称去重。同名角色来自不同来源。剧本 ID 是原件路径的 SHA-256，内容更新不改 ID，路径移动会改变 ID。外链条目没有可用原始 JSON，`json` 为 `null`。相对 JSON 地址以 API 基础地址解析。

角色夜序是网站默认数据，具体剧本原件可能自定义夜序。原始剧本字段和第三方图片地址保持来源语义；角色接口优先提供本站已托管的图标。缓存时可比较 `index.json` 的 `revision`，刷新后再获取数据。v1 只增加兼容字段，破坏性变更使用新版本路径。

数据维护入口：角色来自剧本工具生成目录，剧本来自 `script_lib/data/library.jsonl`；禁止把接口生成物当作第二份数据源。

接口生成器先校验并写入临时目录，再整体替换 v1 快照；移除或移动剧本后不会残留旧 JSON。替换失败会恢复旧快照。目标目录若含符号链接或非 JSON 文件则拒绝覆盖。

## 制图图标读取接口

`GET https://clocktower-wiki-admin.clocktower-wiki.workers.dev/api/role-icon?url=<经过URL编码的HTTPS图片地址>` 返回 PNG/JPEG/WebP/GIF 位图，用于解决外部图床没有跨域许可头、无法写入制图画布的问题。此接口部署于现有 Worker，属于只读公开资源，不需要管理员会话；不上传图片，不执行 OCR，不转发 Cookie 或授权信息。

仅允许 `admin/icon-proxy.mjs` 列出的已知图床，Gstone 限定角色图标路径；每次重定向重新核查地址。限制 8 MB、10 秒，拒绝内网目标、SVG、HTML 和不匹配的位图类型。成功位图缓存一天，失败响应不缓存。浏览器仅允许本站、本地开发及 `file:` 离线页面的来源。图床失效或反爬仍可能失败，客户端继续尝试图片数组中的下一个地址。

`api/v1` 的静态 JSON 接口和原始剧本数据不会因此改变。制图优先使用随网站内嵌的图标缓存，只有缓存缺失且直接加载失败时才使用此读取接口。

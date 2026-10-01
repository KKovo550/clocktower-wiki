# 在线编辑后台

后台代码在 `admin/`，独立部署到 Cloudflare Workers；百科继续托管于 GitHub Pages。后台地址 https://clocktower-wiki-admin.clocktower-wiki.workers.dev ，当前还需要 GitHub OAuth 应用配置才可登录。

## 编辑范围

后台提供所有生成页面的目录、正文 HTML 编辑、安全预览、修改摘要和最近 15 次 GitHub 版本记录。编辑范围是 `<main>` 内部；共享导航、脚本、已有 ID 等结构受保护，由 Astro 和工具源代码维护。它不是 MediaWiki 的维基语法编辑器，也不是通用代码部署接口。工具页可编辑说明和标签，但不能用后台新增程序功能。预览屏蔽脚本，正式页面的交互由已有程序提供。

## 身份和保存

- GitHub OAuth 授权码 + PKCE + state；登录仅允许 `ADMIN_ID` 指定的数字 ID。
- GitHub token 仅保存在 AES-GCM 加密、Secure、HttpOnly、SameSite=Lax 的一小时会话 Cookie 中，不交给前端 JS，不写入仓库。
- 修改要求同源 Origin 与 CSRF token。未配置时拒绝登录和写入。
- 保存检查文件 SHA，并通过 Git trees/commit/ref 原子提交页面和 `admin-overrides.json`。分支并发更新导致保存失败，绝不强推。
- `public_repo` 是 GitHub OAuth 的公开仓库写入权限，授权范围宽于此站；后台代码固定只操作 `KKovo550/clocktower-wiki`。如以后需要仓库级授权，迁移为仅安装在该仓库的 GitHub App。
- GitHub Pages 部署完成后公众可看到修改。版本记录链接到 GitHub，可用 Git 提交恢复。恢复时页面与 overrides 必须一同恢复。

## 配置和部署

`admin/wrangler.jsonc` 不含密钥。用官方 Wrangler 设置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`SESSION_SECRET` 三个 secrets，不要提交到源码。OAuth 回调为后台域名加 `/auth/callback`，首页为后台根地址。SESSION_SECRET 使用至少 32 随机字节。

当前 SESSION_SECRET 已通过官方 CLI 生成并保存。注册 GitHub OAuth 应用后，双击项目根目录的 `配置管理员登录.cmd`，输入 Client ID 与隐藏输入的 Client Secret。脚本直接上传到 Worker secrets，不落盘、不输出密钥。不要在聊天里发送 Client Secret。

GitHub 注册入口：https://github.com/settings/applications/new 。应用名称可填“钟楼百科管理”，Homepage URL 填 `https://clocktower-wiki-admin.clocktower-wiki.workers.dev`，Authorization callback URL 填 `https://clocktower-wiki-admin.clocktower-wiki.workers.dev/auth/callback`。

命令：`npm exec --yes --package=wrangler -- wrangler deploy --config admin/wrangler.jsonc`。

后台登录成功不代表普通访问者获权；每个读写 API 都校验会话中的管理员 ID。

## 构建同步

首次部署百科前，`config/admin.json` 的 `syncEnabled` 为 false，构建生成空 overrides 和全页面目录。该文件首次发布后，必须把 syncEnabled 设为 true，再开放后台登录。

每次 Astro 构建读取远程 `admin-overrides.json`，在生成内容上应用修改。网络失败或本地正文与在线记录 base 不一致时中止构建，人工合并后才可发布。覆盖记录保存首次编辑前的正文，因此不会把线上变化丢回旧版本。此同步层仅用于 Astro 构建，不改变原始离线 HTML 源文件。

发布前先 fetch/rebase 公开仓库，再构建并复制产物，提交和 push；遇到远程并发更新必须重新同步、重新构建，不能强推。

页面标题、搜索索引及工具结构化角色数据目前不由正文编辑自动更新；此类数据仍应修改对应源文件并构建。

## 检查

`node --test scripts/tests/admin.test.mjs` 检查正文边界、路径、脚本保护、会话校验和跨站拦截；`npm run build` 校验目录、内容与静态资源。上线后必须验证实际 GitHub 登录及保存/发布流程，未完成前不能声称后台可用。

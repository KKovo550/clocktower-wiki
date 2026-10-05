# 两人协作指南

源码仓库：<https://github.com/KKovo550/clocktower-wiki-source>（私有）。
发布仓库：<https://github.com/KKovo550/clocktower-wiki>（公开构建产物）。

私有源码仓库需要单独接受邀请。公开仓库的权限不会自动继承。

## 首次使用

安装 Git、符合 README 要求的 Node.js，以及 Python 3.10+。使用自己的 GitHub 账号登录 GitHub Desktop 或 GitHub CLI，然后执行：

```powershell
git clone https://github.com/KKovo550/clocktower-wiki-source.git
cd clocktower-wiki-source
npm ci
python -m pip install -r requirements.txt
npm run dev
```

打开终端提示的地址，并访问 `/clocktower-wiki/`。用 Codex 打开这个源码目录即可编辑。不要将账号令牌、管理员密钥或 `.env` 文件发给另一位协作者。

## 每次修改

先提交或暂存自己已有的工作，再同步主分支，然后为本次功能创建新分支：

```powershell
git switch main
git pull --ff-only
git switch -c codex/describe-your-change
```

修改公共界面：`src/components/`、`src/layouts/`；菜单：`config/navigation.json`；剧本工具：`script_tool/`；基础角色数据：`config/script-tool/`。具体规则见 [维护约定](MAINTENANCE.md)。

完成后运行 `npm run validate`，检查 `git diff`，只提交本次需要的文件，推送当前分支。在 GitHub 创建目标为 `main` 的 Pull Request，请另一人检查后合并。每次功能使用不同的分支名；遇到冲突处理后重新验证，不要强制覆盖对方的提交。

首次克隆后按照 [稳定版本验收](STABILITY.md) 生成固定海报样例，并完整跑一次构建与测试。源代码的默认分支以 GitHub 仓库实际设置为准；本地旧目录的 `master` 不等同于远程 `main`。

## 发布与素材

主分支合并不会自动发布网站。目前由 KKovo550 按 README 的发布步骤，将验证通过的 `dist/astro/` 同步到公开发布仓库；离线分享包使用 `npm run package:offline` 生成。发布前先同步公开仓库，避免覆盖在线后台编辑。

源码保留构建所需的角色图片、字体、OCR 模型、剧本 JSON 和索引。约 17 GB 的剧本原始图片/PDF、独立研究项目、依赖缓存、构建目录和密钥不上传。正常网站与剧本工具开发不依赖这些原始剧本图片；需要重新采集或打包原始素材时，再单独传递素材目录。

首次构建会生成图片缓存，并联网读取在线编辑记录，因此耗时比后续构建更长。请勿将本地缓存当作源码提交。

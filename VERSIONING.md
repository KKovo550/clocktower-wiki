# 版本与回退策略

本仓库使用两层保护，避免网站更新后出现问题时无法恢复。

## 1. 稳定版本快照

长期稳定版本使用不可随 `main` 自动移动的分支保存：

- `release/v1.0`
- `release/v1.1`
- `release/v1.2`
- `release/v1.3`

这些分支代表经过确认的稳定节点。后续发布新稳定版时，继续创建：

- `release/v1.4`
- `release/v1.5`
- ...

不要在旧的 `release/vX.Y` 分支上继续开发。

## 2. 每次 main 更新前自动备份

工作流 `.github/workflows/backup-before-main-update.yml` 会在每次向 `main` 推送后，自动把“更新前的 main”保存下来。

系统会创建：

- 一个永久备份 Tag：`backup/main-before-<run-number>-<sha>`
- 一个始终指向最近一次更新前版本的恢复分支：`backup/latest-before-main-update`

永久备份 Tag 不会自动移动，所以可以保留每一次更新前的历史版本。

## 3. 出问题时怎么恢复

### 临时查看旧版

切换到对应快照：

```bash
git checkout release/v1.3
```

或者查看最近一次更新前版本：

```bash
git checkout backup/latest-before-main-update
```

### 推荐：用 revert 撤销错误更新

如果只是最近一次提交有问题，优先使用：

```bash
git revert <错误提交SHA>
git push origin main
```

这样会保留完整历史。

### 整体恢复到稳定版本

只有确认需要让整个 `main` 回到旧版时，再执行：

```bash
git checkout main
git reset --hard release/v1.3
git push --force-with-lease origin main
```

注意：这会改写 `main` 历史，应谨慎使用。

## 4. 推荐发布流程

1. 在 `main` 正常开发。
2. 每次 push 前的旧版由 GitHub Actions 自动保存。
3. 确认阶段性功能稳定后，创建新的 `release/vX.Y` 快照分支。
4. 在 `CHANGELOG.md` 写清楚这一版新增了什么。
5. 如果更新出问题，优先从自动备份或稳定版本快照恢复。

# MiMo CLI 项目规则

## 双目录工作流

本项目采用双目录结构：

- **`mimo-cli/`**：开发目录，用于日常开发、修改、测试
- **`mimo-cli-push/`**：发布目录，关联 GitHub 仓库 `https://github.com/ljj6600/MIMO-CLI.git`，用于提交代码

### 同步流程

1. 在 `mimo-cli/` 中进行开发和修改
2. 测试通过后（typecheck + build），将修改的文件复制到 `mimo-cli-push/`
3. 在 `mimo-cli-push/` 中执行 git commit 和 push 到 GitHub
4. 代码同步方向：**mimo-cli → mimo-cli-push → GitHub**
5. 当需要以 GitHub 为准时，先在 `mimo-cli-push/` 中 `git pull`，再将文件复制到 `mimo-cli/`

### 重要：不要在 mimo-cli 中执行 git 操作，mimo-cli 不是 git 仓库

## 构建和验证命令

```bash
# 类型检查
bun run typecheck

# 构建
bun run build

# Lint 检查
bun run lint
```

## 发布规则

- **npm 包**：仅包含 `dist/*.mjs` + `dist/*.map`（约 1.4MB），**不包含** `dist/mimo.exe` 和 `dist/exe-entry.js.map`
- **Windows exe**：仅通过 GitHub Releases 分发，不随 npm 包发布
- `package.json` 的 `files` 字段通过 `!dist/mimo.exe` 和 `!dist/exe-entry.js.map` 排除 exe

## 代码规范

- 代码注释：除非用户明确要求，否则不添加注释
- 遵循项目现有代码风格和命名规范
- i18n：所有用户可见的文本都需要中英文翻译（zh/en）

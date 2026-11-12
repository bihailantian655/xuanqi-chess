# 玄棋 · 中国象棋人机对战

纯静态单文件网页游戏，无需构建、无需后端。手机竖屏单手可玩，支持 PWA 安装到主屏幕并离线运行。

## 在线玩

推送到 GitHub 后，GitHub Actions 会自动部署到：

```
https://<你的用户名>.github.io/xuanqi-chess/
```

手机浏览器打开这个地址 → 菜单「添加到主屏幕」/「安装应用」，即可得到一个无地址栏的全屏 App 图标（离线也能打开，首次访问需联网缓存）。

> 首次部署若报错，去仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**，然后重跑一次 workflow。

## 游戏特性

- 六大对局模式：经典 / 限时 / 等级 / 让子 / 训练闯关 / 自由对局
- 91 关古谱残局，连将杀训练与选关
- AI 棋力四档、执红 / 执黑、实时局面评估条与棋谱记录
- 智能提示、悔棋、认输、重开；翻转棋盘、音效、背景音乐与多套皮肤
- 竖屏优先布局：设置放顶部，操作条 / 形势 / 棋谱放棋盘下方

## 本地运行

```bash
python -m http.server 8000
# 打开 http://localhost:8000/index.html
```

也可以直接双击 `index.html`（`file://` 下 Service Worker 不会注册，但游戏功能完整）。

## 仓库结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 游戏本体（单文件，含全部 CSS / JS）+ PWA 注入片段 |
| `manifest.webmanifest` | 应用名称、图标、竖屏与全屏模式 |
| `sw.js` | Service Worker，离线缓存 |
| `icons/icon-192.png` / `icon-512.png` | 主屏幕图标 |
| `.github/workflows/deploy.yml` | 校验 → 组装 `dist/` → 打包 zip → 部署 GitHub Pages |

## GitHub Actions 产物

每次 push 到 `main` 会产出两项：

1. **在线站点**：自动发布到 GitHub Pages
2. **`xuanqi-pwa-zip`**：可下载的 zip 包（Actions 运行页的 Artifacts 里），解压即是完整静态站点

工作流做了完整性校验（关键文件存在、棋盘 canvas 存在、manifest 已注入），校验不通过就不会部署。

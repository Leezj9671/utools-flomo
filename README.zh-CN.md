# flomo 速记 · uTools 插件

[English](README.md) · **简体中文**

> 在 uTools 里随手记到 flomo：选标签、⌘/Ctrl + Enter 发送、选中文字一键转为带出处的摘录。

一个以键盘为核心的 [uTools](https://www.u-tools.cn) 小插件，通过 flomo 官方的 **PRO 记录 API（webhook）** 发送笔记。不用 cookie，没有中转服务器——笔记从你的电脑直接发到 `flomoapp.com`。

![flomo 速记](docs/store/01-write.png)

## 为什么做它

这个插件源自一款老 flomo 插件的评论区，同样的抱怨反复出现：

| 用户说 | 本插件的做法 |
| --- | --- |
| 「API 一直填不进去，粘贴了没反应，下次又让我输」 | 配置引导接受各种粘贴形式（纯链接、`POST https://…` 整行、带引号的链接），验证时**不会新建笔记**，并显示 flomo 返回的真实错误信息 |
| 「希望加默认标签」「选中的文字能直接打标签」 | 每条笔记预填默认标签，历史标签自动补全，正文里的 `#行内标签` 照常可用 |
| 「还得挪鼠标去点同步按钮」 | `⌘/Ctrl + Enter` 发送，发完面板自动收起（可关闭） |
| 「想保留原文，同时写下感想」 | `⌘/Ctrl + E` 把文字转为「引用」并附上来源网页，编辑区留给你自己的想法 |
| 「怎么确定我的 API 没被上传到别处」 | 代码开源；唯一的网络请求发往你的 flomo webhook；API 地址默认只存在本机，可选通过 uTools 同步 |
| 「写的东西丢了」 | 输入时实时保存草稿，发送失败也不会丢 |

## 截图

| 标签 | 摘录 | 配置 | 隐私 |
| --- | --- | --- | --- |
| ![标签](docs/store/02-tags.png) | ![摘录](docs/store/03-excerpt.png) | ![配置](docs/store/04-setup.png) | ![隐私](docs/store/05-privacy.png) |

## 使用

| 在 uTools 里 | 结果 |
| --- | --- |
| 搜索 `flomo` → **flomo 速记**（别名：`记到 flomo`、`浮墨`） | 打开编辑框；未发送的草稿会自动恢复 |
| 输入或选中任意文字 → **记到 flomo** | 带着这段文字打开编辑框 |
| 把 flomo API 地址粘贴到搜索框 → **设为 flomo API** | 直接进入验证并保存 |

编辑框里：

| 按键 | 作用 |
| --- | --- |
| `⌘/Ctrl + Enter` | 发送 |
| `⌘/Ctrl + E` | 切换摘录：原文 + 来源链接 |
| `⌘/Ctrl + ,` | 设置 |
| 标签输入框里按 `Tab` | 采用第一个候选标签 |
| 标签输入框为空时按 `Backspace` | 删除最后一个标签 |

### 实际发送的内容

```text
「引用的原文」            ← 仅摘录模式

你的想法，支持 **markdown**

[example.com](https://…)  ← 来源链接，仅摘录模式

#默认 #标签
```

flomo 的 markdown 会渲染加粗和链接，但会吞掉 `>` 引用块，所以摘录用「」标出原文。

## 使用要求

- **flomo PRO** 会员（记录 API 是 PRO 功能）。在 flomo →「设置 → API」获取你的专属地址。
- uTools **8.x**（主要支持版本）。uTools **7.x** 通过运行时兼容方案支持，见[兼容性](#兼容性)。

## 从源码安装

```bash
git clone git@github.com:Leezj9671/utools-flomo.git
cd utools-flomo
npm install
npm run dev        # 在 http://127.0.0.1:5173 提供界面（端口固定）
```

然后在 **uTools 开发者工具** 插件中：

1. 新建项目，并把工程目录指向 `public/plugin.json`（不要新建 React/Vue 模板工程）。
2. 点击 **安装（开发模式）**，并开启 **退出到后台立即结束运行**，确保改动的代码能生效。
3. 在 uTools 中搜索 `flomo`。

如需独立运行的版本，执行 `npm run build`，再用开发者工具打包 `dist/`（`dist/plugin.json`）。

## 开发

```bash
npm run dev      # 带热更新的 Vite 开发服务器
npm test         # flomo 客户端单元测试（离线）
FLOMO_API=https://flomoapp.com/iwh/… npm test   # 额外跑一次真实验证，不会新建笔记
npm run build    # 类型检查 + 生产构建，输出到 dist/
npm run logo     # 重新生成 public/logo.png
npm run shots    # 重新生成 docs/store/ 下的市场截图（需先 npm run dev）
```

- **浏览器预览**：在 uTools 之外打开 `http://127.0.0.1:5173` 时，会装载一个模拟运行时（`src/lib/platform.ts`），方便开发和截图。可用查询参数控制：`?payload=…`、`?code=setup`、`?noapi=1`、`?fail=invalid_api`、`?dark=1`、`?reset=1`。加上 `?stage&title=…&sub=…` 即为市场截图使用的带标题 1280×800 版式。模拟环境和外框只在开发模式存在、不会打进正式包；它们只用来看视觉效果，不能证明 uTools 里的运行行为。
- **uTools 里的运行时错误**：开发模式下，报错和环境报告（uTools/Chrome 版本、缺失的 API、preload 加载失败）会 POST 到开发服务器并追加写入 `.devlog`，不用打开 DevTools 也能排查。界面出错时会显示错误面板，而不是白屏。

## 发布

```bash
npm run build
```

`dist/` 就是插件根目录：`plugin.json` 不含 `development` 字段，没有 sourcemap，也没有开发用的模拟环境。在 uTools 开发者工具里把工程目录指向 `dist/plugin.json`，在不开开发服务器的情况下测试，再从开发者工具发布。市场文案、版本说明和完整的发布清单见 [docs/store-listing.md](docs/store-listing.md)。

## 目录结构

```text
public/
  plugin.json        功能入口：write（文本指令 + 「记到 flomo」匹配指令）、setup（API 地址正则匹配）
  preload.js         window.services 桥接层（Node/Electron 侧）
  lib/flomo.js       webhook 客户端：解析地址、验证、发送（Node https）
src/
  App.tsx            视图切换、插件进入处理、面板高度
  components/        Composer、TagInput、Onboarding、SettingsView、ApiField 等
  lib/compose.ts     编辑器状态 → 笔记正文
  lib/store.ts       设置（同步）、API 地址（本机）、草稿
  lib/platform.ts    uTools 运行时或浏览器模拟环境
  dev/               仅开发用的预览外框与截图舞台
scripts/             测试、logo 与市场截图生成脚本
```

## 兼容性

| | uTools 8.x | uTools 7.x |
| --- | --- | --- |
| 面板高度 | `setExpandHeight` | `setExpendHeight`（运行时检测） |
| API 地址存储 | `getPluginLocalDataPath()` | 系统应用数据目录，如 `~/Library/Application Support/utools-flomo/` |
| 网络请求 | Node `https` | Node `https`（Electron 22 的 Node 没有全局 `fetch`） |
| 构建目标 | Chrome 108+ | Chrome 108 |

## 隐私

- 请求只发往你配置的 flomo webhook 地址。
- API 地址写入本机文件，权限为 `0600`。开启「在多台设备间同步 API 地址」后，会额外存入 uTools 的同步数据库。
- 设置、默认标签和历史标签存放在 uTools 的同步数据库；草稿只保存在本地。

## 许可证

[MIT](LICENSE)

## 致谢

基于 uTools 官方[开发文档](https://www.u-tools.cn/docs/)与 [utools-plugin-dev skill](https://github.com/uTools-Labs/utools-plugin-dev-skill) 开发。与 flomo、uTools 官方无关。

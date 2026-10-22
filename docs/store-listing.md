# Store listing & release checklist

Copy for the uTools plugin market (Chinese, as shown to users) and the steps to publish a version from the uTools developer tool.

## Listing copy

**名称**

```
flomo 速记
```

**简介**（开发者工具项目设置里的「描述」，一行）

```
在 uTools 里快速记到 flomo：标签、快捷键发送、划词摘录
```

**详细介绍**

```
不用打开 flomo，在 uTools 里写下想法就发出去。

· ⌘/Ctrl + Enter 发送，发完自动收起，像发消息一样没有压力
· 默认标签 + 历史标签补全；选中的文字也能先打好标签再发
· 摘录模式（⌘/Ctrl + E）：原文加「」并附上网页来源，下面写你的想法
· 首次配置有引导：粘贴 API 地址即可，验证时不会在 flomo 里新建笔记
· 草稿实时保存，发送失败内容不丢，可直接重试
· 支持 Markdown（加粗、链接），深色模式自动跟随

怎么用
· 输入「flomo」打开编辑框
· 输入或选中任意文字，选「记到 flomo」
· 把 flomo API 地址粘贴到搜索框，选「设为 flomo API」

隐私
· 只请求你自己的 flomo API 地址，没有中转服务器、没有统计
· API 地址默认只保存在本机，可选通过 uTools 账号同步
· 开源：https://github.com/Leezj9671/utools-flomo

需要 flomo PRO 会员（使用 flomo 官方记录 API）。
本插件为第三方开发，与 flomo 官方无关。
```

**截图**（`docs/store/`，2560×1600，按顺序上传；`npm run shots` 可重新生成）

1. `01-write.png` — 想到就记，⌘↵ 就发
2. `02-tags.png` — 标签不再靠手打
3. `03-excerpt.png` — 划词摘录，出处不丢（深色）
4. `04-setup.png` — 粘贴即用，一次配置
5. `05-privacy.png` — 你的笔记，只发往 flomo

## Release notes

### 0.1.0

```
首个版本
· ⌘/Ctrl + Enter 发送，发完自动收起
· 默认标签 + 历史标签补全（Tab）
· 摘录模式（⌘/Ctrl + E）：原文 + 来源链接 + 你的想法
· 首次配置引导：粘贴 API 地址即可，验证连接不会产生笔记
· 草稿自动保存，发送失败可直接重试
· 支持 Markdown 与深色模式，兼容 uTools 7.x / 8.x
```

## Publishing a version

1. `npm run build`.
2. In the developer tool, set the project's 工程目录 to **`dist/plugin.json`** (not `public/plugin.json`: that one only works with the dev server running).
3. Stop the dev server and test the installed plugin end to end: first-time setup, write, excerpt, default tags, settings, a real send.
4. Check the project description and platforms in the developer tool settings, then 发布到 uTools 插件应用市场 with the version number and release notes above.
5. Tag the commit: `git tag v0.1.0 && git push --tags`.
6. Switch 工程目录 back to `public/plugin.json` and run `npm run dev` to continue developing.

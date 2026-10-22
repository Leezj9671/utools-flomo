// Renders plugin-market screenshots (1280×800 @2x) into docs/store/.
// Needs the dev server: `npm run dev`, then `npm run shots`.
// Chrome path can be overridden with CHROME_PATH.
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.env.SHOTS_BASE ?? 'http://127.0.0.1:5173/'
const OUT = new URL('../docs/store/', import.meta.url).pathname
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Mock storage seeded before each page load (keys mirror src/lib/platform.ts).
const SEED = {
  'mock:settings': { defaultTags: ['灵感'], markdown: true, autoHide: true, withSource: true, syncApi: false },
  'mock:recent-tags': ['读书/摘录', '读书/方法论', '产品思考', '写作', '工作/复盘', '灵感'],
}

const scenes = [
  {
    file: '01-write.png',
    title: '想到就记，⌘↵ 就发',
    sub: '在 uTools 里写下想法，一键发送到 flomo，发完自动收起',
    query: { payload: '好的工具不该让人「打开」它。\n\n记录的成本越低，记下来的东西就越多。先记下，再整理。' },
    async act(page) {
      await page.click('.composer .tags-input')
      await page.keyboard.type('产品思考')
      await page.keyboard.press('Enter')
      await page.click('.editor')
    },
  },
  {
    file: '02-tags.png',
    title: '标签不再靠手打',
    sub: '默认标签自动带上，历史标签 Tab 补全，选中的文字也能先打好标签再发',
    query: { payload: '每周复盘只问三个问题：做成了什么、卡在哪里、下周最重要的一件事。' },
    async act(page) {
      await page.click('.composer .tags-input')
      await page.keyboard.type('工作/复盘')
      await page.keyboard.press('Enter')
      await page.keyboard.type('读')
    },
  },
  {
    file: '03-excerpt.png',
    title: '划词摘录，出处不丢',
    sub: '⌘E 把选中的原文转为「引用」，自动附上网页来源，下面写你的想法',
    query: { dark: '', payload: '所谓笔记，不是为了记住，而是为了更好地遗忘——把脑子留给思考。' },
    async act(page) {
      await page.keyboard.press('Meta+e')
      await page.keyboard.type('和 GTD 的「清空大脑」是一回事：先放下，才能想得更深。')
      await page.click('.composer .tags-input')
      await page.keyboard.type('读书/摘录')
      await page.keyboard.press('Enter')
      await page.click('.editor')
    },
  },
  {
    file: '04-setup.png',
    title: '粘贴即用，一次配置',
    sub: '自动识别 flomo API 地址，验证连接不会在 flomo 里产生笔记',
    query: { noapi: '' },
    async act(page) {
      await page.fill('.field input', 'POST https://flomoapp.com/iwh/MTIz/0123456789abcdef0123456789abcdef/')
    },
  },
  {
    file: '05-privacy.png',
    title: '你的笔记，只发往 flomo',
    sub: '没有中转服务器、没有统计；API 地址默认只存在本机；代码开源',
    query: { code: 'setup' },
    async act(page) {
      await page.$eval('.mf-body', (el) => (el.scrollTop = el.scrollHeight))
    },
  },
]

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: CHROME })
for (const scene of scenes) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
  await context.addInitScript((seed) => {
    localStorage.clear()
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v))
  }, SEED)
  const page = await context.newPage()
  const params = new URLSearchParams({ stage: '', title: scene.title, sub: scene.sub, ...scene.query })
  if (!('dark' in scene.query)) params.set('light', '')
  await page.goto(BASE + '?' + params)
  await page.waitForSelector('.app')
  await page.waitForTimeout(300)
  await scene.act(page)
  await page.waitForTimeout(400)
  await page.screenshot({ path: OUT + scene.file })
  console.log('wrote', OUT + scene.file)
  await context.close()
}
await browser.close()

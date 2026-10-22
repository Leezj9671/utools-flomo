// Offline tests for the flomo client. Run: npm test
// Set FLOMO_API to also run the live, non-writing verifyApi check.
const test = require('node:test')
const assert = require('node:assert/strict')
const { parseApiUrl, sendMemo, verifyApi, classify } = require('../public/lib/flomo.js')

const URL = 'https://flomoapp.com/iwh/MTIz/0123456789abcdef0123456789abcdef/'

test('parseApiUrl accepts the forms people actually paste', () => {
  assert.equal(parseApiUrl(URL), URL)
  assert.equal(parseApiUrl(URL.slice(0, -1)), URL)
  assert.equal(parseApiUrl(`POST ${URL}\nContent-Type: application/json`), URL)
  assert.equal(parseApiUrl(`  "${URL}"  `), URL)
  assert.equal(parseApiUrl('https://flomoapp.com/mine'), null)
  assert.equal(parseApiUrl(''), null)
})

test('classify maps flomo responses to error kinds', () => {
  assert.equal(classify({ code: 0, message: '已记录' }).ok, true)
  assert.equal(classify({ code: -1, message: 'API 地址验证失败' }).kind, 'invalid_api')
  assert.equal(classify({ code: -1, message: '请升级 PRO 会员' }).kind, 'not_pro')
  assert.equal(classify({ code: -1, message: 'memo 内容太太太长啦，请精简' }).kind, 'rejected')
})

test('sendMemo refuses blank content before touching the network', async () => {
  const res = await sendMemo(URL, '  \n ')
  assert.equal(res.ok, false)
  assert.equal(res.kind, 'empty')
})

test('live verifyApi (no memo created)', { skip: !process.env.FLOMO_API }, async () => {
  const good = await verifyApi(process.env.FLOMO_API)
  assert.equal(good.ok, true, good.message)
  const bad = await verifyApi(process.env.FLOMO_API.replace(/[a-f0-9]{8}\/?$/i, '00000000/'))
  assert.equal(bad.ok, false)
  assert.equal(bad.kind, 'invalid_api')
})

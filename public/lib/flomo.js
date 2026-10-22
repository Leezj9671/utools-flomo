// flomo incoming-webhook client. Pure Node (no uTools/Electron), so it can be unit tested.
'use strict'

const https = require('node:https')

const API_PATTERN = /https:\/\/flomoapp\.com\/iwh\/[A-Za-z0-9]+\/[A-Za-z0-9]{16,}\/?/i
const TIMEOUT_MS = 12000

/**
 * Pull the webhook URL out of whatever the user pasted: a bare URL, the
 * "POST https://..." line copied from flomo's settings page, or a URL wrapped in quotes.
 */
function parseApiUrl(input) {
  const match = String(input || '').match(API_PATTERN)
  if (!match) return null
  const url = match[0]
  return url.endsWith('/') ? url : url + '/'
}

function classify(result) {
  if (result.code === 0) return { ok: true, message: result.message || '已记录', memo: result.memo }
  const message = result.message || '未知错误'
  let kind = 'rejected'
  if (/验证失败/.test(message)) kind = 'invalid_api'
  else if (/会员|PRO|pro/.test(message)) kind = 'not_pro'
  else if (/频繁|稍后/.test(message)) kind = 'rate_limited'
  return { ok: false, kind, message }
}

// Node's https module rather than fetch: uTools 7.x ships Electron 22 / Node 16, which
// has no global fetch in preload, and https also sidesteps browser CORS rules.
function post(url, body) {
  const payload = Buffer.from(JSON.stringify(body))
  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': payload.length },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          try {
            resolve(classify(JSON.parse(Buffer.concat(chunks).toString('utf8'))))
          } catch {
            resolve({ ok: false, kind: 'server', message: `flomo 返回了无法识别的响应（HTTP ${res.statusCode}）` })
          }
        })
      },
    )
    req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })))
    req.on('error', (err) =>
      resolve({
        ok: false,
        kind: 'network',
        message: err.code === 'ETIMEDOUT' ? '连接 flomo 超时，请检查网络后重试' : '无法连接 flomo，请检查网络或代理设置',
      }),
    )
    req.end(payload)
  })
}

/** Send one memo. Empty content is refused locally: flomo would happily store a blank memo. */
async function sendMemo(apiUrl, content, { markdown = true } = {}) {
  const url = parseApiUrl(apiUrl)
  if (!url) return { ok: false, kind: 'invalid_api', message: 'API 地址格式不正确' }
  const text = String(content || '')
  if (!text.trim()) return { ok: false, kind: 'empty', message: '内容为空' }
  const body = { content: text }
  if (markdown) body.content_type = 'markdown'
  return post(url, body)
}

/**
 * Check an API URL without creating a memo. flomo authenticates the URL before
 * validating the body, so a deliberately malformed body (content as an array)
 * comes back as a content error for a valid URL and "API 地址验证失败" otherwise.
 */
async function verifyApi(apiUrl) {
  const url = parseApiUrl(apiUrl)
  if (!url) return { ok: false, kind: 'invalid_api', message: '没有识别到 flomo API 地址，应形如 https://flomoapp.com/iwh/xxx/xxx/' }
  const result = await post(url, { content: ['ping'] })
  if (result.ok) return { ok: true, url, message: '已连接' }
  if (result.kind === 'rejected') return { ok: true, url, message: '已连接' }
  return { ...result, url }
}

module.exports = { parseApiUrl, sendMemo, verifyApi, classify }

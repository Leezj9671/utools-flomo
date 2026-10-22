# AGENTS.md

Guidance for coding agents working on this repo (Claude Code reads it through `CLAUDE.md`).

## What this is

A uTools plugin (Vite + React 18 + TypeScript, no UI library) that posts notes to flomo's PRO webhook API. User-facing strings are Simplified Chinese; code, comments and commits are English.

## Source of truth for uTools APIs

- Use only APIs documented in the official utools-plugin-dev skill (`references/`). In the `utools-apps-dev` workspace it is mounted at `../.claude/skills/utools-plugin-dev`; upstream: https://github.com/uTools-Labs/utools-plugin-dev-skill.
- The docs target uTools 8.x. Anything used only for 7.x compatibility (`setExpendHeight`, the app-data fallback in `preload.js`) must stay behind a runtime `typeof … === 'function'` check, with the 8.x API tried first.
- Theme follows `prefers-color-scheme` (the docs' recommendation), not `utools.isDarkColors()`.

## Layout and boundaries

- `public/` is copied verbatim into `dist/`: `plugin.json`, `preload.js`, `lib/flomo.js`, `logo.png`, and `package.json` (`"type": "commonjs"`, required because the root package is ESM).
- `public/preload.js` is CommonJS and the only place with Node/Electron access. It exposes a minimal `window.services`; never expose `fs`, `child_process` or raw Node objects to the page.
- `public/lib/flomo.js` is pure Node (no uTools/Electron) so `scripts/flomo.test.cjs` can test it. Keep networking on Node `https` — uTools 7.x (Electron 22 / Node 16) has no global `fetch` in preload.
- `src/lib/platform.ts` returns the real runtime inside uTools and a mock in a plain browser. Keep the mock in sync when adding a `utools` or `services` call, and add the type to `src/types.d.ts`.
- `src/lib/store.ts` decides where data lives: settings and tag history → `utools.dbStorage` (synced); the API URL → local file via preload (synced only if the user opts in); drafts → `localStorage`.

## flomo webhook facts (verified against the live API, 2026-10)

- `POST {apiUrl}` with `{"content": "...", "content_type": "markdown"}` → `{"code": 0, "message": "已记录", "memo": {...}}`.
- Bad URL → `{"code": -1, "message": "API 地址验证失败"}`.
- **Empty content is accepted and creates a blank memo.** `sendMemo` refuses blank content locally; keep that guard.
- Auth is checked before the body, so `{"content": ["ping"]}` returns a content error for a valid URL and "验证失败" for an invalid one. `verifyApi` relies on this to check a URL without creating a memo. Never verify by sending a real memo.
- Markdown: bold and links render; `>` blockquotes are dropped. Excerpts use 「」.
- Tags are inline `#tag` text (nested with `/`); there is no separate tags field.

## uTools behaviour (verified on uTools 8.0.0)

- uTools adds its own search entry named after the plugin name set in the developer tool. The `write` feature's first command is `flomo 速记`, identical to that name, so search shows a single entry instead of two. Keep them in sync if the plugin is renamed.
- Every `over` match command shows up for *any* typed or selected text, so the plugin deliberately has only one (`记到 flomo`); excerpt is a toggle inside the composer, not a separate command.

## Release

- `npm run build` writes `dist/`; `vite.config.ts` strips `development` from `dist/plugin.json`, and the browser mock and devlog are dev-only and absent from the bundle.
- Before packaging, check `dist/` has no `.git*`, `*.map`, or remote resources (uTools FAQ), then install `dist/plugin.json` in the developer tool and test without the dev server.

## Workflow

```bash
npm run dev     # must stay on 127.0.0.1:5173 (plugin.json development.main)
npm test        # offline unit tests; set FLOMO_API to add the live, non-writing check
npm run build   # tsc --noEmit + vite build
```

- Debug inside uTools via `.devlog` (dev only): `src/lib/devlog.ts` POSTs errors and an environment report to the Vite middleware in `vite.config.ts`.
- Browser + mock is for visuals only. Report anything that depends on uTools behaviour (focus, panel height, `readCurrentBrowserUrl`, match commands) as unverified until it has been run in uTools.
- Do not run tests that create memos in someone's flomo account without asking; if you must, tag them `#utools-flomo-test` and say so.
- Never commit an API URL. `.devlog`, `dist/` and `.env*` are gitignored.
- Commits: Conventional Commits in English (`feat:`, `fix:`, `docs:`, `chore:`).

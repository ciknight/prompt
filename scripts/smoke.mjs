// scripts/smoke.mjs
// Lightweight HTTP smoke test: serve the built site via astro preview, fetch
// key pages, and assert their content. No browser, no Playwright.
//
// Usage: npm run smoke  (requires `npm run build` to have produced dist/)
//
// Spawns `astro preview` in a child process, polls until it responds, runs
// assertions, then kills the server.

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { setTimeout as killTimer } from 'node:timers';

const PORT = 4321;
const BASE = `http://localhost:${PORT}/prompt`;

function log(msg) { console.log(`[smoke] ${msg}`); }

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return;
    } catch { /* not ready yet */ }
    await sleep(500);
  }
  throw new Error(`server did not start within ${timeoutMs}ms`);
}

const checks = [
  { url: '/', expectTitle: 'AI 提示词收藏', expectCategoryCount: 6 },
  { url: '/about/', expectH1: '关于' },
  { url: '/category/shipin-shengcheng/', expectH1: '视频生成' },
  { url: '/category/juese-yu-ip/', expectH1: '角色与IP' },
  { url: '/prompts/manju-fenjing-jiehe-10s/', expectH1NotEmpty: true },
  { url: '/prompts/hongbei-ziti-caizhi-2/', expectNoImageSrc: true },
];

async function run() {
  log('starting astro preview on port ' + PORT);
  // Use the npm CLI directly to ensure PATH resolves correctly across platforms.
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const server = spawn(npmCmd, ['run', 'preview', '--', '--port', String(PORT)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    detached: false,
  });
  server.stdout?.on('data', () => {}); // silence
  server.stderr?.on('data', () => {});

  // Auto-kill on exit
  const kill = () => { try { server.kill(); } catch {} };
  process.on('exit', kill);
  process.on('SIGINT', () => { kill(); process.exit(130); });

  try {
    await waitForServer(BASE + '/');
    let pass = 0, fail = 0;
    for (const c of checks) {
      const fullUrl = BASE + c.url;
      try {
        const r = await fetch(fullUrl);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const html = await r.text();
        if (c.expectTitle && !html.includes(`<title>${c.expectTitle}`)) {
          throw new Error(`title missing: ${c.expectTitle}`);
        }
        if (c.expectH1) {
          const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
          if (!m || m[1] !== c.expectH1) throw new Error(`h1 != "${c.expectH1}"`);
        }
        if (c.expectH1NotEmpty) {
          const m = html.match(/<h1[^>]*>([\s\S]+?)<\/h1>/);
          if (!m || m[1].trim().length === 0) throw new Error('h1 empty');
        }
        if (c.expectCategoryCount) {
          // Astro uses root-absolute paths with `base` prefix; base prefix gets
          // prepended at build time (we now use BASE_URL-aware links).
          const matches = html.match(/href="\/prompt\/category\//g) || [];
          if (matches.length < c.expectCategoryCount) {
            throw new Error(`only ${matches.length} category links, want ≥${c.expectCategoryCount}`);
          }
        }
        if (c.expectNoImageSrc) {
          // Page should NOT contain any image src (images stripped for copyright).
          if (/<img\s+[^>]*src=/i.test(html)) {
            throw new Error(`page contains <img> tag; images should be stripped`);
          }
        }
        console.log(`✓ ${c.url}`);
        pass++;
      } catch (e) {
        console.error(`✗ ${c.url}: ${e.message}`);
        fail++;
      }
    }
    console.log(`\n[smoke] ${pass} passed, ${fail} failed`);
    process.exit(fail > 0 ? 1 : 0);
  } finally {
    kill();
  }
}

run().catch(e => { console.error('[smoke] error:', e); process.exit(1); });
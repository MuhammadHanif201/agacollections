// Joins the storefront's layout stylesheets into one file per cascade group (base, chrome, footer), in the order listed
// in src/components/store/css-groups.json: about 21 render-blocking requests become 3 on every page.
//
// - relative url()s (fonts, icon font) are rewritten to absolute paths, since the joined file lives in /bundles/
// - minified with esbuild when it is installed (it comes with tsx); otherwise the files are only joined
// - the file name carries a hash of the content, so it can be cached for a year (next.config.ts headers)
// - writes public/bundles/<group>.<hash>.css and src/components/store/css-bundles.json, which LegacyStyles reads
//
// Runs before `next build` and `next dev` (package.json). Edit the source stylesheets as before; the bundles follow.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT_DIR = path.join(PUBLIC, 'bundles');
const GROUPS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/components/store/css-groups.json'), 'utf8'));
const MANIFEST = path.join(ROOT, 'src/components/store/css-bundles.json');

let transform = null;
try { transform = createRequire(path.join(ROOT, 'package.json'))('esbuild').transformSync; } catch { /* join only */ }

function absolutize(css, webPath) {
  const dir = path.posix.dirname(webPath);
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
    if (/^(data:|https?:|\/|#)/i.test(u.trim())) return m;
    return `url(${q}${path.posix.normalize(path.posix.join(dir, u.trim()))}${q})`;
  });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = {};
const keep = new Set();
for (const group of ['base', 'chrome', 'footer']) {
  const parts = GROUPS[group].map((webPath) => {
    const css = fs.readFileSync(path.join(PUBLIC, webPath), 'utf8').replace(/^﻿/, '').replace(/@charset\s+["'][^"']*["']\s*;/gi, '');
    return `/* ${webPath} */\n${absolutize(css, webPath)}`;
  });
  let out = parts.join('\n');
  if (transform) out = transform(out, { loader: 'css', minify: true, legalComments: 'none', charset: 'ascii' }).code;
  const hash = crypto.createHash('sha256').update(out).digest('hex').slice(0, 10);
  const name = `${group}.${hash}.css`;
  fs.writeFileSync(path.join(OUT_DIR, name), out);
  manifest[group] = `/bundles/${name}`;
  keep.add(name);
  console.log(`css bundle ${name}: ${GROUPS[group].length} files, ${Math.round(out.length / 1024)}KB${transform ? ' (minified)' : ''}`);
}
for (const f of fs.readdirSync(OUT_DIR)) if (!keep.has(f)) fs.unlinkSync(path.join(OUT_DIR, f));
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

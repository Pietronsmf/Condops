// Gera js/icons.js com apenas os ícones Phosphor usados no código.
// Uso: npm install && npm run icons
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = process.env.PHOSPHOR_ASSETS || join(root, 'node_modules/@phosphor-icons/core/assets');

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && !p.endsWith('icons.js') ? [p] : [];
  });

// Ícones da navegação também têm a versão preenchida para o item ativo
const NAV_FILL = ['house', 'chat-circle-text', 'wrench', 'gauge', 'handshake', 'folder', 'chart-bar', 'squares-four'];

const names = new Set(NAV_FILL.map((n) => `${n}-fill`));
for (const file of walk(join(root, 'js'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g)) names.add(m[1]);
}

const paths = {};
for (const name of [...names].sort()) {
  const fill = name.endsWith('-fill');
  const file = fill ? join(assets, 'fill', `${name}.svg`) : join(assets, 'regular', `${name}.svg`);
  if (!existsSync(file)) continue;
  const svg = readFileSync(file, 'utf8');
  paths[name] = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
}

const out = `/* Ícones Phosphor (licença MIT, phosphoricons.com). Gerado por tools/build-icons.mjs; não editar à mão. */
'use strict';

(function (CO) {
  const P = ${JSON.stringify(paths, null, 2)};

  CO.icon = (name, cls = '') =>
    \`<svg class="icon\${cls ? ' ' + cls : ''}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">\${P[name] || ''}</svg>\`;
})(window.CO);
`;
writeFileSync(join(root, 'js/icons.js'), out);
console.log(`js/icons.js: ${Object.keys(paths).length} ícones`);

/**
 * Generates static HTML test pages for UI testing via the serve-ui.js server.
 * Run with: npx ts-node scripts/gen-test-pages.ts
 * Output: scripts/test-pages/*.html
 */

// Minimal vscode stub so view renderers can import without the real extension host
(global as any).vscode = {};

import * as fs from 'fs';
import * as path from 'path';
import { renderErrorView } from '../src/views/errorView';
import { renderAddActionForm } from '../src/views/addItemForm';
import { renderEditActionForm } from '../src/views/editItemForm';
import type { Action } from '../src/types';

const outDir = path.join(__dirname, 'test-pages');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Use 'unsafe-inline' for test pages so all scripts run without nonce restrictions
const NONCE = 'test-nonce-12345';
const CSP = "'unsafe-inline'";
const CODICON = '';

// Injected before the nonce script so acquireVsCodeApi is available
const mockVscodeApi = `
<script nonce="${NONCE}">
  window.acquireVsCodeApi = () => ({
    postMessage: (msg) => {
      const t = document.getElementById('vsc-toast') || document.createElement('div');
      t.id = 'vsc-toast';
      t.style = 'position:fixed;bottom:10px;right:10px;background:#0e639c;color:#fff;padding:8px 16px;border-radius:4px;z-index:9999;font-family:sans-serif;font-size:13px';
      t.innerText = 'COMMAND: ' + JSON.stringify(msg);
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    },
    getState: () => ({}),
    setState: () => {}
  });
</script>
`;

// ── Error View ──────────────────────────────────────────────
const errorHtml = renderErrorView(
  'Unexpected token } in JSON at position 42',
  CSP, NONCE, CODICON
).replace('</head>', mockVscodeApi + '</head>');
fs.writeFileSync(path.join(outDir, 'error.html'), errorHtml);
console.log('✓ error.html');

// ── Add Action Form ─────────────────────────────────────────
const addHtml = renderAddActionForm({
  cspSource: CSP,
  nonce: NONCE,
  codiconStyles: CODICON,
  typeOptions: `
    <option value="shell" selected>shell</option>
    <option value="npm">npm</option>
    <option value="vscode">vscode</option>
  `,
  customColors: ['#ff0000', '#00ff00'],
}).replace('</head>', mockVscodeApi + '</head>');
fs.writeFileSync(path.join(outDir, 'add-action.html'), addHtml);
console.log('✓ add-action.html');

// ── Edit Action Form (with existing params) ─────────────────
const itemWithParams: Action = {
  name: 'Deploy to env',
  command: 'npm run deploy -- --env=${ENV} --tag=${TAG}',
  type: 'npm',
  params: [
    { name: 'ENV', prompt: 'Target environment', options: ['staging', 'production'] },
    { name: 'TAG', prompt: 'Docker image tag', default: 'latest' },
  ],
};
const editHtml = renderEditActionForm({
  cspSource: CSP,
  nonce: NONCE,
  codiconStyles: CODICON,
  item: itemWithParams,
  iconMap: new Map([['shell', 'terminal'], ['npm', 'package'], ['vscode', 'extensions']]),
  customColors: [],
}).replace('</head>', mockVscodeApi + '</head>');
fs.writeFileSync(path.join(outDir, 'edit-action.html'), editHtml);
console.log('✓ edit-action.html');

console.log('\nTest pages written to scripts/test-pages/');

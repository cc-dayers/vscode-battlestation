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
import { renderAddActionWizard } from '../src/views/addActionWizard';
import { renderEditActionForm } from '../src/views/editItemForm';
import { renderGenerateConfigView } from '../src/views/generateConfigView';
import type { Action } from '../src/types';

const outDir = path.join(__dirname, 'test-pages');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Use 'unsafe-inline' for test pages so all scripts run without nonce restrictions
const NONCE = 'test-nonce-12345';
const CSP = "'unsafe-inline'";
const CODICON = '';

// Injected before the nonce script so acquireVsCodeApi is available.
// Also sets window.__lastCommand so Playwright tests can assert on submitted messages.
const mockVscodeApi = `
<script nonce="${NONCE}">
  window.__lastCommand = null;
  window.acquireVsCodeApi = () => ({
    postMessage: (msg) => {
      window.__lastCommand = msg;
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

// ── Add Action Wizard ───────────────────────────────────────
const wizardHtml = renderAddActionWizard({
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
fs.writeFileSync(path.join(outDir, 'add-wizard.html'), wizardHtml);
console.log('✓ add-wizard.html');

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

// ── Edit Action Form (with workspace / secondary label) ──────
const itemWithWorkspace: Action = {
  name: 'workspace-app:build',
  command: 'yarn workspace my-app build',
  type: 'npm',
  workspace: 'my-app',
  workspaceColor: '#2e7d32',
};
const editWorkspaceHtml = renderEditActionForm({
  cspSource: CSP,
  nonce: NONCE,
  codiconStyles: CODICON,
  item: itemWithWorkspace,
  iconMap: new Map([['shell', 'terminal'], ['npm', 'package']]),
  customColors: [],
}).replace('</head>', mockVscodeApi + '</head>');
fs.writeFileSync(path.join(outDir, 'edit-action-workspace.html'), editWorkspaceHtml);
console.log('✓ edit-action-workspace.html');

// ── Generate Config View ────────────────────────────────────────
const generateConfigHtml = renderGenerateConfigView({
  cspSource: CSP,
  nonce: NONCE,
  codiconStyles: CODICON,
  hasNpm: true,
  hasTasks: true,
  hasLaunch: true,
  hasWorkspace: true,
  showWelcome: false,
}).replace('</head>', mockVscodeApi + '</head>');
fs.writeFileSync(path.join(outDir, 'generate-config.html'), generateConfigHtml);
console.log('✓ generate-config.html');

console.log('\nTest pages written to scripts/test-pages/');

const http = require('http');
const path = require('path');
const port = 3001;

let renderGenerateConfigView;
try {
  const mod = require(path.join(__dirname, '../dist/views/generateConfigView'));
  renderGenerateConfigView = mod.renderGenerateConfigView;
} catch (e) {
  console.error('Could not load compiled generateConfigView. Is npm run watch running?', e.message);
  process.exit(1);
}

// Build the first-timer HTML
let html = renderGenerateConfigView({
  cspSource: 'self',
  nonce: 'preview',
  codiconStyles: '',
  hasNpm: true,
  hasTasks: false,
  hasLaunch: false,
  showWelcome: true,
  isFirstTimer: true,
  hasWorkspace: true,
});

// Patch out the CSP meta tag and nonces so browser doesn't block inline scripts
html = html
  .replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')
  .replace(/ nonce="[^"]*"/g, '')
  // Stub acquireVsCodeApi before any other script runs  
  .replace('<head>', `<head>
    <style>
      /* VSCode CSS variables fallback for browser preview */
      :root {
        --vscode-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --vscode-foreground: #cccccc;
        --vscode-textLink-foreground: #4d9de0;
        --vscode-errorForeground: #f14c4c;
        --vscode-button-background: #0e639c;
        --vscode-button-foreground: #ffffff;
        --vscode-button-hoverBackground: #1177bb;
        --vscode-descriptionForeground: #aaaaaa;
        --vscode-focusBorder: #007fd4;
      }
      body { background: #1e1e1e; }
    </style>
    <link rel="stylesheet" href="http://localhost:3000/codicon.css">`)
  // Inject stub API + replay button before </body>
  .replace('</body>', `
    <script>
      // Stub VS Code API
      window.acquireVsCodeApi = () => ({
        postMessage: (msg) => console.log('vscode.postMessage', msg),
        getState: () => ({}),
        setState: () => {}
      });
    </script>
    <div style="position:fixed;top:8px;right:8px;z-index:9999">
      <button onclick="location.reload()" style="background:#0e639c;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-family:sans-serif">↺ Replay</button>
    </div>
    </body>`);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(port, () => {
  console.log(`Welcome preview at http://localhost:${port}`);
});

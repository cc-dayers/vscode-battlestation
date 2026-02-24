const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

// Mock VS Code API
const mockVscodeApi = `
  window.acquireVsCodeApi = () => ({
    postMessage: (msg) => {
      console.log('VSCode API received message:', msg);
      // add a visual toast so we can see it!
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '10px';
      toast.style.right = '10px';
      toast.style.background = '#0e639c';
      toast.style.color = 'white';
      toast.style.padding = '8px 16px';
      toast.style.borderRadius = '4px';
      toast.style.zIndex = '9999';
      toast.id = 'toast-msg';
      toast.innerText = 'COMMAND SENT: ' + msg.command;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    },
    getState: () => ({}),
    setState: (state) => {}
  });
`;

const indexHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Settings View Test</title>
    <link href="/output.css" rel="stylesheet" />
    <link href="/codicon.css" rel="stylesheet" />
    <style>
      body { padding: 20px; background: #1e1e1e; color: #cccccc; font-family: sans-serif; }
      .codicon { font-family: codicon; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      ${mockVscodeApi}
      window.__INITIAL_DATA__ = {
        actions: [
          { name: "Build Tool", command: "npm run build", type: "npm" },
          { name: "Deploy Script", command: "bash ./deploy.sh", type: "shell" }
        ],
        iconMap: { npm: "package", shell: "terminal" },
        display: {
          showIcon: false, // We disabled icons to verify the bug fix!
          showType: true,
          showCommand: true,
          showGroup: true,
          hideIcon: 'eye-closed',
          playButtonBg: 'transparent',
          density: 'comfortable',
          useEmojiLoader: false,
          loaderEmoji: '🌯'
        }
      };
    </script>
    <script type="module" src="/mainView.js"></script>
  </body>
</html>
`;

const settingsHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Settings View Test</title>
    <link href="/output.css" rel="stylesheet" />
    <link href="/codicon.css" rel="stylesheet" />
    <style>
      body { padding: 20px; background: #1e1e1e; color: #cccccc; font-family: sans-serif; }
      .codicon { font-family: codicon; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      ${mockVscodeApi}
      window.__SETTINGS__ = {
        showIcon: true,
        showType: true,
        showCommand: true,
        showGroup: true,
        hideIcon: 'eye-closed',
        backupCount: 3,
        configExists: true,
        usedIcons: ['package', 'terminal', 'play', 'gear', 'history', 'trash'],
        customConfigPath: null
      };
    </script>
    <script type="module" src="/settingsView.js"></script>
  </body>
</html>
`;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log('GET', req.url);

  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml, 'utf-8');
    return;
  }

  if (req.url === '/settings' || req.url === '/settings.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(settingsHtml, 'utf-8');
    return;
  }

  let filePath = path.join(__dirname, '../media', req.url);
  let extname = String(path.extname(filePath)).toLowerCase();
  let contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log('UI Server running at http://localhost:' + port);
});

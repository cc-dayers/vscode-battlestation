const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

// Mock VS Code API
const mockVscodeApi = `
  window.__lastCommand = null;
  window.acquireVsCodeApi = () => {
    const api = {
      postMessage: (msg) => {
        window.__lastCommand = msg;
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
    };

    window.addEventListener('mouseup', (e) => {
      if (e.button === 3 || e.button === 4) {
        api.postMessage({ command: 'cancelForm' });
      }
    });

    window.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      if ((!isMac && e.altKey && e.key === 'ArrowLeft') || 
          (isMac && e.metaKey && e.key === 'ArrowLeft')) {
        api.postMessage({ command: 'cancelForm' });
      }
    });

    return api;
  };
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
          { name: "Build Tool", command: "npm run build", type: "npm", group: "Build" },
          { name: "Deploy Script", command: "bash ./deploy.sh", type: "shell", group: "Build" },
          { name: "Test Suite", command: "npm test", type: "npm", group: "Build" },
          { name: "Hidden Action", command: "echo hidden", type: "shell", hidden: true },
          { name: "Launch Reports", command: "npm run reports", type: "npm", group: "Launch" },
          { name: "Launch All", command: "npm run all", type: "npm", group: "Launch" }
        ],
        groups: [
          { name: "Build", icon: "package", color: "#4a90d9" },
          { name: "Launch", icon: "rocket" }
        ],
        workflowSummaries: [],
        experimentalFeatures: {
          workflows: false
        },
        iconMap: { npm: "package", shell: "terminal" },
        display: {
          showIcon: true,
          showType: true,
          showCommand: true,
          showGroup: true,
          hideIcon: 'eye-closed',
          playButtonBg: 'transparent',
          density: 'comfortable',
          useEmojiLoader: false,
          loaderEmoji: '🌯'
        },
        showHidden: true,
        // Feature 3: test status dots — Build=ok, Deploy=fail, Test=never run
        runStatus: {
          "Build Tool": { exitCode: 0, timestamp: Date.now() - 90000 },
          "Deploy Script": { exitCode: 1, timestamp: Date.now() - 5000 }
        }
      };
    </script>
    <script type="module" src="/mainView.js"></script>
  </body>
</html>
`;

const url = require('url');

const getSettingsHtml = (reqUrl) => {
  const parsedUrl = url.parse(reqUrl, true);
  const configExists = parsedUrl.query.configExists !== 'false';
  const backupCount = parsedUrl.query.backupCount ? parseInt(parsedUrl.query.backupCount, 10) : 3;

  return `
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
        backupCount: ${backupCount},
        configExists: ${configExists},
        usedIcons: ['package', 'terminal', 'play', 'gear', 'history', 'trash'],
        customConfigPath: null,
        actionToolbar: ['hide', 'setColor', 'edit', 'delete']
      };
    </script>
    <script type="module" src="/settingsView.js"></script>
  </body>
</html>
`;
};

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

  const parsedReq = url.parse(req.url);

  if (parsedReq.pathname === '/' || parsedReq.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtml, 'utf-8');
    return;
  }

  if (parsedReq.pathname === '/settings' || parsedReq.pathname === '/settings.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getSettingsHtml(req.url), 'utf-8');
    return;
  }

  // Generated test pages (run `npx ts-node scripts/gen-test-pages.ts` to rebuild)
  const testPageRoutes = { '/error': 'error.html', '/add-action': 'add-action.html', '/add-wizard': 'add-wizard.html', '/edit-action': 'edit-action.html', '/edit-action-workspace': 'edit-action-workspace.html', '/generate-config': 'generate-config.html', '/workflow-builder': 'workflow-builder.html' };
  if (testPageRoutes[parsedReq.pathname]) {
    const pagePath = path.join(__dirname, 'test-pages', testPageRoutes[parsedReq.pathname]);
    if (fs.existsSync(pagePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(pagePath, 'utf-8'), 'utf-8');
    } else {
      res.writeHead(404);
      res.end('Test page not found. Run: npx ts-node scripts/gen-test-pages.ts');
    }
    return;
  }

  let filePath = path.join(__dirname, '../media', parsedReq.pathname);
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

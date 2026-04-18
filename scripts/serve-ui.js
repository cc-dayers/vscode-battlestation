const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

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

const jobsHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Jobs View Test</title>
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
      window.__JOBS_INITIAL_DATA__ = {
        jobs: [
          {
            jobId: "job-nightly-tests",
            name: "Nightly Tests",
            schedule: "0 9 * * 1-5",
            timezone: "America/New_York",
            enabled: true,
            paused: false,
            valid: true,
            status: "scheduled",
            targetKind: "workflow",
            targetLabel: "workflow-release",
            nextRunAt: Date.now() + 3600_000,
            lastFinishedAt: Date.now() - 90_000,
            lastOutcome: "success",
            lastLogPath: ".vscode/battle.jobs/logs/job-nightly-tests/run-1.log",
            lastLogLine: 3
          },
          {
            jobId: "job-paused",
            name: "Paused Sync",
            schedule: "*/15 * * * *",
            enabled: true,
            paused: true,
            valid: true,
            status: "paused",
            targetKind: "action",
            targetLabel: "action-sync",
            lastFinishedAt: Date.now() - 5_000,
            lastOutcome: "failure"
          },
          {
            jobId: "job-missed",
            name: "Missed Deploy",
            schedule: "0 2 * * *",
            enabled: true,
            paused: false,
            valid: true,
            status: "scheduled",
            targetKind: "action",
            targetLabel: "action-deploy",
            nextRunAt: Date.now() + 7200_000,
            lastFinishedAt: Date.now() - 7200_000,
            lastOutcome: "missed",
            lastLogPath: ".vscode/battle.jobs/logs/job-missed/run-missed-1.log",
            lastLogLine: 8
          }
        ]
      };
    </script>
    <script type="module" src="/jobsView.js"></script>
  </body>
</html>
`;

const battlesHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Battles View Test</title>
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
      window.__BATTLES_INITIAL_DATA__ = {
        providers: [
          {
            providerId: "bb-prs",
            providerName: "Bitbucket PRs",
            providerIcon: "git-pull-request",
            providerColor: "#0052CC",
            battles: [
              {
                id: "pr-123",
                title: "Fix auth flow",
                description: "PR #123 needs your review",
                status: "active",
                priority: "high",
                url: "https://bitbucket.org/team/repo/pull-requests/123",
                tags: ["review", "auth"],
                metadata: { author: "johndoe", branch: "feature/auth" },
                actions: [
                  { label: "Checkout", type: "shell", value: "git checkout feature/auth" }
                ]
              },
              {
                id: "pr-456",
                title: "Update CI pipeline",
                description: "PR #456 — CI config changes",
                status: "active",
                priority: "medium",
                url: "https://bitbucket.org/team/repo/pull-requests/456",
                tags: ["ci"],
                actions: []
              },
              {
                id: "pr-789",
                title: "Bump dependencies",
                status: "active",
                priority: "low",
                tags: ["deps", "bot"],
                actions: []
              }
            ],
            lastRefreshedAt: Date.now() - 120_000,
            isLoading: false
          },
          {
            providerId: "gh-issues",
            providerName: "GitHub Issues",
            providerIcon: "issues",
            providerColor: "#238636",
            battles: [],
            lastRefreshedAt: Date.now() - 300_000,
            isLoading: false
          },
          {
            providerId: "error-provider",
            providerName: "Broken Provider",
            providerIcon: "warning",
            battles: [],
            lastError: "Command not found: fake-cli",
            isLoading: false
          }
        ]
      };
    </script>
    <script type="module" src="/battlesView.js"></script>
  </body>
</html>
`;

const jobAdminHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>Job Admin Test</title>
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
      window.__JOB_ADMIN_DATA__ = {
        snapshot: {
          jobId: "job-nightly-tests",
          name: "Nightly Tests",
          schedule: "0 9 * * 1-5",
          timezone: "America/New_York",
          enabled: true,
          paused: false,
          valid: true,
          status: "scheduled",
          targetKind: "workflow",
          targetLabel: "workflow-release",
          nextRunAt: Date.now() + 3600_000,
          lastRunAt: Date.now() - 90_000,
          lastFinishedAt: Date.now() - 85_000,
          lastExitCode: 0,
          lastOutcome: "success",
          lastRunId: "run-abc123",
          lastLogPath: ".vscode/battle.jobs/logs/job-nightly-tests/run-abc123.log",
          lastLogLine: 3
        },
        recentRuns: [
          {
            runId: "run-abc123",
            jobId: "job-nightly-tests",
            jobName: "Nightly Tests",
            targetKind: "workflow",
            targetLabel: "workflow-release",
            startedAt: Date.now() - 90_000,
            finishedAt: Date.now() - 85_000,
            exitCode: 0,
            outcome: "success",
            logPath: ".vscode/battle.jobs/logs/job-nightly-tests/run-abc123.log",
            logLine: 3,
            inputs: { ENV: "staging" }
          },
          {
            runId: "run-xyz456",
            jobId: "job-nightly-tests",
            jobName: "Nightly Tests",
            targetKind: "workflow",
            targetLabel: "workflow-release",
            startedAt: Date.now() - 3_600_000,
            finishedAt: Date.now() - 3_595_000,
            exitCode: 1,
            outcome: "failure",
            logPath: ".vscode/battle.jobs/logs/job-nightly-tests/run-xyz456.log",
            logLine: 3,
            inputs: { ENV: "staging" }
          }
        ]
      };
    </script>
    <script type="module" src="/jobAdmin.js"></script>
  </body>
</html>
`;


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

  if (parsedReq.pathname === '/jobs' || parsedReq.pathname === '/jobs.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(jobsHtml, 'utf-8');
    return;
  }

  if (parsedReq.pathname === '/battles' || parsedReq.pathname === '/battles.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(battlesHtml, 'utf-8');
    return;
  }

  if (parsedReq.pathname === '/job-admin' || parsedReq.pathname === '/job-admin.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(jobAdminHtml, 'utf-8');
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

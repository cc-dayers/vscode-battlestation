export interface LayoutOptions {
  title: string;
  cspSource: string;
  nonce: string;
  codiconStyles?: string;
  styles: string;
  body: string;
  script: string;
  scriptUri?: string;
  cssUri?: string;
}

/**
 * Shared HTML shell for all webview pages.
 * Uses nonce-based CSP instead of 'unsafe-inline' for scripts.
 */
export function htmlShell(opts: LayoutOptions): string {
  const codiconBlock = opts.codiconStyles
    ? `<style>${opts.codiconStyles}</style>`
    : "";

  const externalScript = opts.scriptUri
    ? `<script nonce="${opts.nonce}" type="module" src="${opts.scriptUri}"></script>`
    : "";

  const externalCss = opts.cssUri
    ? `<link href="${opts.cssUri}" rel="stylesheet" />`
    : "";

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${opts.cspSource} 'unsafe-inline'; font-src ${opts.cspSource}; script-src ${opts.cspSource} 'nonce-${opts.nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${codiconBlock}
  ${externalCss}
  <title>${opts.title}</title>
  <style>${opts.styles}</style>
</head>
<body>
${opts.body}
<script nonce="${opts.nonce}">
  (function() {
    if (typeof acquireVsCodeApi === 'function') {
      const originalAcquire = acquireVsCodeApi;
      let cachedApi = null;
      window.acquireVsCodeApi = function() {
        if (!cachedApi) {
          cachedApi = originalAcquire.apply(this, arguments);
          
          // Support mice with "Back" buttons (button 3 or 4 are standard)
          window.addEventListener('mouseup', (e) => {
            if (e.button === 3 || e.button === 4) {
              cachedApi.postMessage({ command: 'cancelForm' });
            }
          });
          
          // Support keyboard back (Alt+Left on Windows/Linux, Cmd+Left on Mac)
          window.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            if ((!isMac && e.altKey && e.key === 'ArrowLeft') || 
                (isMac && e.metaKey && e.key === 'ArrowLeft')) {
              cachedApi.postMessage({ command: 'cancelForm' });
            }
          });
        }
        return cachedApi;
      };
    }
  })();
${opts.script}
</script>
${externalScript}
</body>
</html>`;
}

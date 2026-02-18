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
${opts.script}
</script>
${externalScript}
</body>
</html>`;
}

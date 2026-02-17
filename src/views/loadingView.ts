import { htmlShell } from "../templates/layout";
import { esc } from "./helpers";

export function renderLoadingView(
  cspSource: string,
  nonce: string,
  options?: Record<string, never>
): string {
  return htmlShell({
    title: "Loading...",
    cspSource,
    nonce,
    styles: `
      body {
        font-family: var(--vscode-font-family);
        color: var(--vscode-foreground);
        background: transparent;
        padding: 20px;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
      }
      .loader {
        width: 40px;
        height: 40px;
        border: 4px solid var(--vscode-progressBar-background);
        border-top-color: var(--vscode-button-background);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .loading-text {
        margin-top: 16px;
        font-size: 13px;
        opacity: 0.8;
      }
    `,
    body: `
      <div class="loader"></div>
      <div class="loading-text">Loading Battlestation...</div>
    `,
    script: "",
  });
}

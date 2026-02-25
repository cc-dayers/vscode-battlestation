export interface ThemeColorOption {
  name: string;
  value: string;
}

export const THEME_COLOR_OPTIONS: ThemeColorOption[] = [
  { name: "Red", value: "var(--vscode-charts-red)" },
  { name: "Orange", value: "var(--vscode-charts-orange)" },
  { name: "Yellow", value: "var(--vscode-charts-yellow)" },
  { name: "Green", value: "var(--vscode-charts-green)" },
  { name: "Blue", value: "var(--vscode-charts-blue)" },
  { name: "Purple", value: "var(--vscode-charts-purple)" },
  { name: "Pink", value: "var(--vscode-charts-pink)" },
  { name: "Foreground", value: "var(--vscode-foreground)" },
  { name: "Error", value: "var(--vscode-errorForeground)" },
  { name: "Warning", value: "var(--vscode-editorWarning-foreground)" },
  { name: "Info", value: "var(--vscode-editorInfo-foreground)" },
  { name: "Success", value: "var(--vscode-testing-iconPassed)" },
];

const AUTO_GROUP_COLOR_PALETTE = [
  "var(--vscode-charts-blue)",
  "var(--vscode-charts-green)",
  "var(--vscode-charts-orange)",
  "var(--vscode-charts-purple)",
  "var(--vscode-charts-yellow)",
  "var(--vscode-charts-red)",
  "var(--vscode-charts-pink)",
];

export function getPreferredThemeColorForName(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (lower.includes("npm") || lower.includes("node")) return "var(--vscode-charts-purple)";
  if (lower.includes("task")) return "var(--vscode-charts-green)";
  if (lower.includes("launch") || lower.includes("debug")) return "var(--vscode-charts-orange)";
  if (lower.includes("docker") || lower.includes("container")) return "var(--vscode-charts-blue)";
  if (lower.includes("python")) return "var(--vscode-charts-yellow)";
  if (lower.includes("go")) return "var(--vscode-charts-blue)";
  if (lower.includes("rust")) return "var(--vscode-charts-red)";
  if (lower.includes("test")) return "var(--vscode-charts-yellow)";
  if (lower.includes("build")) return "var(--vscode-charts-red)";
  if (lower.includes("git")) return "var(--vscode-charts-green)";
  return undefined;
}

function hashIndex(name: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

export function pickDistinctThemeColor(name: string, used: Set<string>): string {
  const preferred = getPreferredThemeColorForName(name);
  if (preferred && !used.has(preferred)) {
    return preferred;
  }

  for (const color of AUTO_GROUP_COLOR_PALETTE) {
    if (!used.has(color)) {
      return color;
    }
  }

  return AUTO_GROUP_COLOR_PALETTE[hashIndex(name, AUTO_GROUP_COLOR_PALETTE.length)];
}

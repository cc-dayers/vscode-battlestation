import * as vscode from "vscode";
import * as cp from "child_process";
import type {
  Battle,
  BattleProvider,
  BattleProviderState,
  Config,
} from "../types";
import { ConfigService } from "./configService";

const OUTPUT_CAP = 64 * 1024; // 64KB
const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const CACHE_KEY = "battlestation.battles.cache";

export class BattleProviderService implements vscode.Disposable {
  private readonly states = new Map<string, BattleProviderState>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly disposables: vscode.Disposable[] = [];

  private readonly onDidUpdateEmitter = new vscode.EventEmitter<BattleProviderState[]>();
  public readonly onDidUpdate = this.onDidUpdateEmitter.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configService: ConfigService
  ) {
    this.disposables.push(
      this.onDidUpdateEmitter,
      this.configService.onDidChange(() => {
        void this.hydrate();
      })
    );
  }

  public dispose(): void {
    this.clearAllTimers();
    this.disposables.forEach((d) => d.dispose());
  }

  public getStates(): BattleProviderState[] {
    return Array.from(this.states.values());
  }

  public async hydrate(): Promise<void> {
    const config = await this.configService.readConfig();
    const providers = config?.battleProviders ?? [];

    // Remove states for providers that no longer exist
    for (const id of this.states.keys()) {
      if (!providers.some((p) => p.id === id)) {
        this.states.delete(id);
        this.clearTimer(id);
      }
    }

    // Initialize state for new providers, refresh all
    for (const provider of providers) {
      if (provider.enabled === false) {
        this.states.delete(provider.id);
        this.clearTimer(provider.id);
        continue;
      }

      if (!this.states.has(provider.id)) {
        this.states.set(provider.id, {
          providerId: provider.id,
          providerName: provider.name,
          providerIcon: provider.icon,
          providerColor: provider.color,
          battles: [],
          isLoading: false,
        });
      } else {
        // Update provider metadata in case it changed
        const existing = this.states.get(provider.id)!;
        existing.providerName = provider.name;
        existing.providerIcon = provider.icon;
        existing.providerColor = provider.color;
      }

      this.setupTimer(provider);
    }

    // Restore cached data for instant render
    this.restoreCache();
    this.fireUpdate();

    // Then refresh all in parallel
    await this.refreshAll();
  }

  public async refreshAll(): Promise<void> {
    const config = await this.configService.readConfig();
    const providers = (config?.battleProviders ?? []).filter(
      (p) => p.enabled !== false
    );
    await Promise.all(providers.map((p) => this.refreshProvider(p.id)));
  }

  public async refreshProvider(providerId: string): Promise<void> {
    const config = await this.configService.readConfig();
    const provider = config?.battleProviders?.find((p) => p.id === providerId);
    if (!provider) {
      return;
    }

    const state = this.states.get(providerId);
    if (!state) {
      return;
    }

    state.isLoading = true;
    this.fireUpdate();

    try {
      const battles = await this.executeProvider(provider);
      state.battles = battles;
      state.lastRefreshedAt = Date.now();
      state.lastError = undefined;
    } catch (err: unknown) {
      state.lastError =
        err instanceof Error ? err.message : String(err);
    } finally {
      state.isLoading = false;
      this.persistCache();
      this.fireUpdate();
    }
  }

  /** Execute a provider CLI command and parse JSON output. */
  public executeProvider(provider: BattleProvider): Promise<Battle[]> {
    return new Promise((resolve, reject) => {
      const cwd = provider.cwd || this.getWorkspaceRoot();
      if (!cwd) {
        reject(new Error("No workspace folder open"));
        return;
      }

      const proc = cp.exec(provider.command, {
        cwd,
        timeout: DEFAULT_TIMEOUT,
        maxBuffer: OUTPUT_CAP,
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";
      let stdoutSize = 0;

      proc.stdout?.on("data", (chunk: string | Buffer) => {
        const text = typeof chunk === "string" ? chunk : chunk.toString();
        stdoutSize += text.length;
        if (stdoutSize <= OUTPUT_CAP) {
          stdout += text;
        } else {
          proc.stdout?.destroy();
        }
      });

      proc.stderr?.on("data", (chunk: string | Buffer) => {
        stderr += typeof chunk === "string" ? chunk : chunk.toString();
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to run provider "${provider.name}": ${err.message}`));
      });

      proc.on("close", (exitCode) => {
        if (exitCode !== 0) {
          const errMsg = stderr.trim() || `Exit code ${exitCode}`;
          reject(new Error(`Provider "${provider.name}" failed: ${errMsg}`));
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          const battles = this.validateBattles(parsed);
          resolve(battles);
        } catch (parseErr: unknown) {
          const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
          reject(new Error(`Invalid JSON from provider "${provider.name}": ${msg}`));
        }
      });
    });
  }

  private validateBattles(parsed: unknown): Battle[] {
    // Support both { battles: [...] } and raw array
    let raw: unknown[];
    if (Array.isArray(parsed)) {
      raw = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      "battles" in parsed &&
      Array.isArray((parsed as any).battles)
    ) {
      raw = (parsed as any).battles;
    } else if (
      // JSON-RPC 2.0 response: { jsonrpc: "2.0", result: { battles: [...] } }
      parsed &&
      typeof parsed === "object" &&
      "result" in parsed &&
      typeof (parsed as any).result === "object" &&
      Array.isArray((parsed as any).result?.battles)
    ) {
      raw = (parsed as any).result.battles;
    } else {
      throw new Error(
        "Expected { battles: [...] }, a JSON array, or a JSON-RPC 2.0 response"
      );
    }

    return raw
      .filter(
        (item: any) =>
          item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string"
      )
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? undefined,
        status: item.status ?? "active",
        priority: item.priority ?? undefined,
        url: item.url ?? undefined,
        tags: Array.isArray(item.tags) ? item.tags : undefined,
        metadata: item.metadata ?? undefined,
        actions: Array.isArray(item.actions) ? item.actions : undefined,
      }));
  }

  private setupTimer(provider: BattleProvider): void {
    this.clearTimer(provider.id);
    const interval = provider.refreshInterval;
    if (!interval || interval <= 0) {
      return;
    }

    const timer = setInterval(() => {
      void this.refreshProvider(provider.id);
    }, interval * 1000);

    this.timers.set(provider.id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  private clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }

  private fireUpdate(): void {
    this.onDidUpdateEmitter.fire(this.getStates());
  }

  private getWorkspaceRoot(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  private persistCache(): void {
    const data: Record<string, { battles: Battle[]; lastRefreshedAt?: number }> = {};
    for (const [id, state] of this.states) {
      data[id] = {
        battles: state.battles,
        lastRefreshedAt: state.lastRefreshedAt,
      };
    }
    void this.context.globalState.update(CACHE_KEY, data);
  }

  private restoreCache(): void {
    const data = this.context.globalState.get<
      Record<string, { battles: Battle[]; lastRefreshedAt?: number }>
    >(CACHE_KEY);
    if (!data) {
      return;
    }

    for (const [id, cached] of Object.entries(data)) {
      const state = this.states.get(id);
      if (state && state.battles.length === 0) {
        state.battles = cached.battles ?? [];
        state.lastRefreshedAt = cached.lastRefreshedAt;
      }
    }
  }
}

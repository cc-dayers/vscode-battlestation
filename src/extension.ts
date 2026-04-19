import * as vscode from "vscode";
import { BattlestationViewProvider } from "./view";
import { JobsViewProvider } from "./jobsView";
import { BattlesViewProvider } from "./battlesView";
import { ConfigService } from "./services/configService";
import { RunStatusService } from "./services/runStatusService";
import { ActionExecutionService } from "./services/actionExecutionService";
import { WorkflowExecutionService } from "./services/workflowExecutionService";
import { JobLogService } from "./services/jobLogService";
import { JobSchedulerService } from "./services/jobSchedulerService";
import { BattleProviderService } from "./services/battleProviderService";
import { WorkflowBuilderPanel } from "./workflowBuilderPanel";
import { BattleTestPanel } from "./battleTestPanel";
import { JobAdminPanel } from "./jobAdminPanel";

const WORKFLOWS_EXPERIMENT_KEY = "experimental.workflows";
const WORKFLOWS_EXPERIMENT_CONTEXT = "battlestation.experimental.workflows";
const BATTLES_EXPERIMENT_KEY = "experimental.battles";
const BATTLES_EXPERIMENT_CONTEXT = "battlestation.experimental.battles";

export function activate(context: vscode.ExtensionContext) {
  const configService = new ConfigService(context);
  const runStatusService = new RunStatusService();
  const actionExecutionService = new ActionExecutionService(runStatusService);
  const workflowExecutionService = new WorkflowExecutionService(configService, actionExecutionService);
  const jobLogService = new JobLogService();
  const jobSchedulerService = new JobSchedulerService(
    context,
    configService,
    actionExecutionService,
    workflowExecutionService,
    jobLogService
  );
  const workflowBuilderPanel = new WorkflowBuilderPanel(context, configService, workflowExecutionService);
  const jobAdminPanel = new JobAdminPanel(context, jobSchedulerService, jobLogService);
  const jobsProvider = new JobsViewProvider(context, jobSchedulerService);
  const battleProviderService = new BattleProviderService(context, configService);
  const battlesProvider = new BattlesViewProvider(context, battleProviderService, configService);
  const battleTestPanel = new BattleTestPanel(context, configService, battleProviderService);
  const provider = new BattlestationViewProvider(
    context,
    configService,
    actionExecutionService,
    workflowExecutionService,
    workflowBuilderPanel,
    runStatusService
  );

  const syncExperimentalContexts = () => {
    const workflowsEnabled = vscode.workspace
      .getConfiguration("battlestation")
      .get<boolean>(WORKFLOWS_EXPERIMENT_KEY, false);

    void vscode.commands.executeCommand(
      "setContext",
      WORKFLOWS_EXPERIMENT_CONTEXT,
      workflowsEnabled
    );

    if (!workflowsEnabled) {
      workflowBuilderPanel.close();
    }

    const battlesEnabled = vscode.workspace
      .getConfiguration("battlestation")
      .get<boolean>(BATTLES_EXPERIMENT_KEY, false);

    void vscode.commands.executeCommand(
      "setContext",
      BATTLES_EXPERIMENT_CONTEXT,
      battlesEnabled
    );

    if (battlesEnabled) {
      void battleProviderService.hydrate();
    }
  };

  syncExperimentalContexts();

  void jobSchedulerService.hydrate();

  context.subscriptions.push(
    jobSchedulerService,
    jobsProvider,
    jobAdminPanel,
    battleProviderService,
    battlesProvider,
    battleTestPanel,
    provider,
    workflowBuilderPanel,
    vscode.window.registerWebviewViewProvider("battlestation.view", provider),
    vscode.window.registerWebviewViewProvider("battlestation.jobs", jobsProvider),
    vscode.window.registerWebviewViewProvider("battlestation.battles", battlesProvider),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration(`battlestation.${WORKFLOWS_EXPERIMENT_KEY}`) ||
        event.affectsConfiguration(`battlestation.${BATTLES_EXPERIMENT_KEY}`)
      ) {
        syncExperimentalContexts();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.open", () => {
      vscode.commands.executeCommand("battlestation.view.focus");
    })
  );

  const pickJobId = async (filter?: (snapshot: ReturnType<typeof jobSchedulerService.getSnapshots>[number]) => boolean) => {
    const snapshots = jobSchedulerService.getSnapshots().filter((snapshot) => (filter ? filter(snapshot) : true));
    if (snapshots.length === 0) {
      return undefined;
    }

    if (snapshots.length === 1) {
      return snapshots[0].jobId;
    }

    const choice = await vscode.window.showQuickPick(
      snapshots.map((snapshot) => ({
        label: snapshot.name,
        description: snapshot.schedule,
        detail: snapshot.targetLabel,
        jobId: snapshot.jobId,
      })),
      { title: "Select a Battlestation job" }
    );

    return choice?.jobId;
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openJobs", () => {
      void vscode.commands.executeCommand("battlestation.jobs.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.runJobNow", async (jobId?: string) => {
      const resolvedJobId = jobId || (await pickJobId());
      if (!resolvedJobId) {
        return;
      }
      await jobSchedulerService.runJobNow(resolvedJobId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.pauseJob", async (jobId?: string) => {
      const resolvedJobId = jobId || (await pickJobId((snapshot) => snapshot.status !== "paused"));
      if (!resolvedJobId) {
        return;
      }
      await jobSchedulerService.pauseJob(resolvedJobId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.resumeJob", async (jobId?: string) => {
      const resolvedJobId = jobId || (await pickJobId((snapshot) => snapshot.status === "paused"));
      if (!resolvedJobId) {
        return;
      }
      await jobSchedulerService.resumeJob(resolvedJobId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openJobLog", async (jobId?: string) => {
      const resolvedJobId = jobId || (await pickJobId((snapshot) => Boolean(snapshot.lastLogPath)));
      if (!resolvedJobId) {
        return;
      }
      const opened = await jobSchedulerService.openLatestLog(resolvedJobId);
      if (!opened) {
        void vscode.window.showInformationMessage("No log is available for that job yet.");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openJobAdmin", async (jobId?: string) => {
      const resolvedJobId = jobId || (await pickJobId());
      if (!resolvedJobId) {
        return;
      }
      await jobAdminPanel.open(resolvedJobId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openWorkflowBuilder", (workflowId?: string) => {
      void provider.openWorkflowBuilder(workflowId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.runWorkflow", (workflowId?: string) => {
      void provider.runWorkflow(workflowId);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.refresh", () => {
      provider.syncAndRefresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.addItem", () => {
      provider.showAddActionForm();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.addGroup", () => {
      provider.showAddGroupForm();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openSettings", () => {
      provider.showSettingsForm();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.toggleSearch", () => {
      provider.toggleSearch();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.toggleHidden", () => {
      provider.toggleShowHidden();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.hideHidden", () => {
      provider.toggleShowHidden();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.collapseAllGroups", () => {
      provider.collapseAllGroups();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.expandAllGroups", () => {
      provider.expandAllGroups();
    })
  );

  // --- Battles commands ---

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openBattles", () => {
      void vscode.commands.executeCommand("battlestation.battles.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.refreshBattles", () => {
      void battleProviderService.refreshAll();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.addBattleProvider", async () => {
      const name = await vscode.window.showInputBox({
        title: "Battle Provider Name",
        prompt: "A friendly name for this provider (e.g. Bitbucket PRs)",
        placeHolder: "My Provider",
      });
      if (!name) return;

      const command = await vscode.window.showInputBox({
        title: "Provider Command",
        prompt: "CLI command that outputs JSON with a battles array",
        placeHolder: "bb-cli battles list --json",
      });
      if (!command) return;

      const intervalStr = await vscode.window.showInputBox({
        title: "Refresh Interval (seconds)",
        prompt: "How often to auto-refresh (0 = manual only)",
        value: "300",
      });
      const refreshInterval = parseInt(intervalStr || "300", 10) || 0;

      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const config = await configService.readConfig();
      const providers = config?.battleProviders ?? [];
      providers.push({ id, name, command, refreshInterval, enabled: true });

      await configService.writeConfig({
        ...(config || { actions: [] }),
        battleProviders: providers,
      });

      void vscode.window.showInformationMessage(`Battle provider "${name}" added.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.openBattlesSettings", () => {
      battlesProvider.showSettings();
      void vscode.commands.executeCommand("battlestation.battles.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("battlestation.testBattleProvider", async (providerId?: string) => {
      if (!providerId) {
        const config = await configService.readConfig();
        const providers = config?.battleProviders?.filter((p) => p.enabled !== false) ?? [];
        if (providers.length === 0) {
          void vscode.window.showInformationMessage("No battle providers configured.");
          return;
        }
        const pick = await vscode.window.showQuickPick(
          providers.map((p) => ({ label: p.name, description: p.command, id: p.id })),
          { title: "Select a Battle Provider to test" }
        );
        if (!pick) return;
        providerId = pick.id;
      }
      await battleTestPanel.open(providerId);
    })
  );
}

export function deactivate() { }


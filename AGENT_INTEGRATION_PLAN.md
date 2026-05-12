# Agentic Integration Plan

Now that Battlestation is a lean, core task launcher, we can integrate it properly with VS Code's emerging AI and agentic API ecosystem. Instead of orchestrating agents itself, Battlestation will act as the **visual launchpad** for prompts/skills, and a **native tool provider (MCP)** to Copilot Chat.

## Phase 1: Auto-Detect Prompts and Skills
We will extend the `ToolDetectionService` and `ConfigService` to discover existing prompt/skill models that VS Code Insiders and Copilot lean heavily on (`.prompt.md`, `.agent.md`, `SKILL.md`).

- [ ] Add `.prompt.md` scanning to `ToolDetectionService` (looking in `.github/prompts` and workspace root).
- [ ] Add `SKILL.md` / `.agent.md` scanning (looking in `.agents/` and `.github/skills/`).
- [ ] Parse YAML frontmatter or XML tags to extract the name and description for these files.
- [ ] Extend the Action schema with new execution types: `prompt` and `skill`.
- [ ] Update `generate-config` flow to populate these as default Actions.
- [ ] Add nice default icons for them (e.g. `sparkle` for Prompts, `hubot` or `beaker` for Skills).

## Phase 2: Launch Prompts / Context via Webview
When the user clicks "Play" on a Prompt or Skill action in the webview, we don't open a terminal. We hand off execution natively to the Copilot Chat view, seeding it with the instruction or prompt context.

- [ ] Update `ActionExecutionService` to intercept `prompt` and `skill` action types.
- [ ] For `prompt` actions: `vscode.commands.executeCommand('workbench.action.chat.open', { query: "@workspace " + promptContent })` or similar VS Code command API.
- [ ] Add a visual notification in the status indicator that the prompt was sent to Chat.
- [ ] Ensure any file arguments required for the prompt can be interpolated or passed cleanly.

## Phase 3: Battlestation as a Copilot Tool (MCP)
With VS Code's new `LanguageModelTool` capability (`vscode.lm.registerTool`), an extension can provide callable tools to the model. We can register an MCP tool that lets Copilot Chat **execute Battlestation actions and workflows** on the user's behalf. 

- [ ] Contribute `languageModelTools` in `package.json` for a tool named `battlestation-run-action`.
- [ ] Implement `vscode.lm.registerTool('battlestation-run-action', ...)` in `extension.ts`.
- [ ] The schema accepts an `actionId` (string).
- [ ] When invoked, the tool calls `actionExecutionService.executeAction(actionId)`.
- [ ] The tool blocks and returns the terminal process output (or job status) strings back to the LLM so Copilot can report the result of the build/test directly in the chat panel.

## Phase 4: Context Group "Packages" (Future Capability)
The ability to visually package a set of files into a named "Context Node" that you can click to inject into Copilot Chat.
- [ ] Allow defining an action of type `context-bundle` with an array of file globs.
- [ ] When clicked, this intercepts and opens Chat, dragging those files into the attach panel.
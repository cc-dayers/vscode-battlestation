---
name: cross-model-review
description: 'Run a read-only second-model review of the current agent''s code changes using a fresh subagent session. Use for subagent review, paranoid review, code review, implementation review, final review pass, or cross-model validation. Best when you want a different model to challenge the current agent''s work without turning the workflow into unbounded ping-pong.'
argument-hint: 'Task summary, changed files or diff scope, acceptance checks, and current validation status'
user-invocable: true
---

# Cross-Model Review

## What This Skill Produces
- A focused, independent review of the current agent's work from a fresh subagent session.
- A findings-first report aimed at bugs, regressions, risky assumptions, edge cases, and missing validation.
- A bounded review loop that usually stops after one pass, or two passes when the first review finds real issues.

## When to Use
- Before merging a non-trivial implementation.
- After the main agent finishes a risky refactor, new feature, migration, or orchestration change.
- When the current agent may have tunnel vision and needs a second opinion.
- When the current agent is stuck chasing its tail and needs an outside diagnosis.

## Avoid When
- The change is tiny and the review cost is higher than the risk.
- You are already on the third review round and the reviewer is mostly nitpicking.
- The only available reviewer has the same model, same context, and same framing. That is weaker than a true second-model pass.

## Core Rules
- Use a different model than the current working model when the environment supports it.
- Start the reviewer in fresh context. Do not dump the entire chat transcript unless the task truly requires it.
- Keep the reviewer read-only. The reviewer critiques; the main agent implements and validates.
- Pass a short spec, acceptance checks, and the touched diff or files. Do not bounce full noisy plans unless necessary.
- Ask for blocking or high-confidence issues first. Style commentary is optional and should not dominate the review.
- Default to one review pass. Run a second pass only after substantive fixes or if risk remains high.

## Workflow
1. Pick the review phase.
   - Default to implementation review after the main agent has already run local validation.
   - Only switch to plan review when the user explicitly asks for a pre-code challenge pass.
2. Build a handoff packet.
   - Task summary.
   - Acceptance checks.
   - What changed or what will change.
   - Current validation status.
   - Changed files or diff scope.
   - Known concerns or questions.
3. Launch the reviewer.
   - Use a subagent or equivalent isolated reviewer flow.
   - Pick a review-oriented agent if one exists.
   - Set the model to something different from the current model when the tool allows it.
   - Tell the reviewer to stay read-only.
4. Require structured output.
   - Findings first, ordered by severity.
   - Only material issues by default.
   - Concrete file or symbol references.
   - Separate open questions from actual findings.
   - Explicitly say no findings if nothing material is wrong.
5. Triage the review.
   - Fix high-confidence issues.
   - Push back on weak or speculative findings.
   - If the reviewer needs more context, provide targeted context instead of the full conversation.
6. Decide whether to loop.
   - Stop after one pass if the review is clean.
   - Run one final follow-up pass after substantive fixes.
   - Stop if the second pass produces mostly repeated or low-value nits.
7. Close the task.
   - Re-run validation after fixes.
   - Summarize what the reviewer caught, what changed, and any residual risk.

## Handoff Packet
Use this structure when briefing the reviewer:

- Task: one paragraph on the user-visible goal.
- Acceptance checks: what must be true when the work is done.
- Scope: touched files, symbols, or diff summary.
- Validation so far: build, tests, lint, repro steps, or known failures.
- Known concerns: risky areas, design tradeoffs, or suspected weak points.
- Constraints: read-only review, focus level, and whether to avoid style nits.

## Reviewer Prompt Template
Use a prompt like this for the reviewer subagent:

```text
You are performing a second-model review of the current agent's work.

Stay read-only. Focus on blocking issues, behavioral regressions, risky assumptions, edge cases, and missing validation. Avoid style nits unless they hide a real bug. Read only the files needed for the touched slice.

Return:
1. Findings first, ordered by severity, with concrete file or symbol references
2. Open questions or assumptions
3. Residual risks or testing gaps
4. "No findings" if nothing material is wrong

Task:
<task summary>

Acceptance checks:
<acceptance checks>

Validation so far:
<build, tests, lint, repro notes>

Touched files or diff scope:
<files or diff summary>

Known concerns:
<optional>
```

## Model and Routing Heuristics
- Use the main agent for implementation and local repair.
- Use the second model for paranoid review, challenge, or alternative diagnosis.
- Prefer explicit handoff lanes so the human is not manually acting as the router on every turn.
- For larger tasks, keep the spec and review notes in short markdown artifacts so future passes can reference them without replaying the whole session.
- If a truly different model is unavailable, say so plainly and use a fresh-context reviewer anyway, but treat the result as lower independence.

## Gotchas
- Diminishing returns usually start after round two.
- Full-plan ping-pong wastes tokens and increases context bleed.
- Same model plus same context is not a meaningful second opinion.
- Reviewers that are allowed to edit code tend to collapse critique and implementation into one muddled pass.
- If the reviewer is not told to focus on blocking issues, it will often pad the output with trivia.
- If the handoff packet is vague, the human ends up doing the routing work manually.

## Completion Criteria
- The review was performed by a fresh reviewer flow.
- A different model was used if the environment made that possible.
- Findings were triaged rather than blindly applied.
- Relevant validation was rerun after fixes.
- The loop stopped before it degraded into repetitive disagreement or style churn.

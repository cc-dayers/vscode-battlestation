import * as assert from 'assert';
import type { Action } from '../../types';
import { filterActionsBySearch, matchesActionSearch } from '../../utils/actionSearch';
import { getEligibleWorkflowActionStats } from '../../utils/workflows';

suite('Action Search', () => {
  test('shared action search matches name, command, and group fields only', () => {
    const action: Action = {
      id: 'action-dev',
      name: 'Run Dev Server',
      command: 'npm run dev',
      type: 'npm',
      group: 'Local Dev',
      workspace: 'apps/web',
    };

    assert.strictEqual(matchesActionSearch(action, 'dev server'), true);
    assert.strictEqual(matchesActionSearch(action, 'npm run dev'), true);
    assert.strictEqual(matchesActionSearch(action, 'local dev'), true);
    assert.strictEqual(matchesActionSearch(action, 'apps/web'), false);
    assert.strictEqual(matchesActionSearch(action, 'npm'), false);
  });

  test('workflow action stats keep eligible and total counts distinct', () => {
    const actions: Action[] = [
      { id: 'action-build', name: 'Build', command: 'npm run build', type: 'npm' },
      { id: 'action-test', name: 'Test', command: 'npm test', type: 'shell' },
      { id: 'action-task', name: 'Compile Task', command: 'workbench.action.tasks.runTask|compile', type: 'task' },
      { id: 'action-vscode', name: 'Open Problems', command: 'workbench.actions.view.problems', type: 'vscode' },
    ];

    const stats = getEligibleWorkflowActionStats(actions);

    assert.strictEqual(stats.totalActionCount, 4);
    assert.strictEqual(stats.eligibleActionCount, 3);
    assert.deepStrictEqual(
      stats.actions.map((action) => action.id),
      ['action-build', 'action-task', 'action-test']
    );
    assert.deepStrictEqual(
      filterActionsBySearch(stats.actions, 'test').map((action) => action.id),
      ['action-test']
    );
  });
});
import * as assert from 'assert';
import {
    getSubgroupCollapseKey,
    getSubgroupHiddenKey,
    isSubgroupHidden,
    toggleSubgroupHiddenKey,
} from '../../utils/subgroupState';

suite('Subgroup State Helpers', () => {
    test('subgroup collapse keys include the secondary grouping mode', () => {
        const workspaceKey = getSubgroupCollapseKey('Apps', 'workspace', 'Portal');
        const typeKey = getSubgroupCollapseKey('Apps', 'type', 'Portal');

        assert.strictEqual(workspaceKey, 'Apps::workspace::Portal');
        assert.strictEqual(typeKey, 'Apps::type::Portal');
        assert.notStrictEqual(workspaceKey, typeKey);
    });

    test('subgroup hidden keys are scoped to the secondary grouping mode', () => {
        const workspaceKey = getSubgroupHiddenKey('workspace', 'Portal');
        const typeKey = getSubgroupHiddenKey('type', 'Portal');

        assert.strictEqual(workspaceKey, 'workspace::Portal');
        assert.strictEqual(typeKey, 'type::Portal');
        assert.notStrictEqual(workspaceKey, typeKey);
    });

    test('subgroup hidden helpers detect and toggle hidden keys', () => {
        const group = { hiddenSubGroups: ['workspace::Portal'] };

        assert.strictEqual(isSubgroupHidden(group, 'workspace', 'Portal'), true);
        assert.strictEqual(isSubgroupHidden(group, 'type', 'Portal'), false);

        const shown = toggleSubgroupHiddenKey(group.hiddenSubGroups, 'workspace', 'Portal');
        assert.deepStrictEqual(shown, []);

        const hidden = toggleSubgroupHiddenKey(shown, 'type', 'npm');
        assert.deepStrictEqual(hidden, ['type::npm']);
    });
});
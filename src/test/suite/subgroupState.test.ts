import * as assert from 'assert';
import { getSubgroupCollapseKey } from '../../utils/subgroupState';

suite('Subgroup State Helpers', () => {
    test('subgroup collapse keys include the secondary grouping mode', () => {
        const workspaceKey = getSubgroupCollapseKey('Apps', 'workspace', 'Portal');
        const typeKey = getSubgroupCollapseKey('Apps', 'type', 'Portal');

        assert.strictEqual(workspaceKey, 'Apps::workspace::Portal');
        assert.strictEqual(typeKey, 'Apps::type::Portal');
        assert.notStrictEqual(workspaceKey, typeKey);
    });
});
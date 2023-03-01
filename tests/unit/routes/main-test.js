import { module, test } from 'qunit';
import { setupTest } from 'drag-drop/tests/helpers';

module('Unit | Route | main', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:main');
    assert.ok(route);
  });
});

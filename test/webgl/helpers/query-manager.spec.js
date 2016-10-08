import test from 'tape-catch';
import queryManager
  from '../../../src/webgl/helpers/query-manager';

test('WebGL helpers#queryManager', t => {
  t.ok(queryManager, 'Imported correctly');
  t.end();
});

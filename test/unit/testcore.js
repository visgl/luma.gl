import {LumaGL} from '../../src';
import test from 'tape-catch';

test('Core#types', t => {
  t.ok(typeof LumaGL === 'function');
  t.end();
});

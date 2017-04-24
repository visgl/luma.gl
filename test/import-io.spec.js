import {loadFiles, loadTextures} from '../';
import test from 'tape-catch';

test('LumaGL#io imports are defined', t => {
  t.ok(typeof loadFiles === 'function', 'loadFiles is defined');
  t.ok(typeof loadTextures === 'function', 'loadTextures is defined');
  t.end();
});

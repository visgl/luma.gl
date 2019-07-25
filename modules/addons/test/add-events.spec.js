import test from 'tape-catch';
import {addEvents} from '@luma.gl/addons';

test('@luma.gl/addons#addEvents', t => {
  t.throws(() => addEvents(), 'addEvents is removed');
  t.end();
});

import test from 'tape-catch';
import {addEvents} from '@luma.gl/addons';

test('@luma.gl/addons#addEvents', t => {
  t.equal(typeof addEvents, 'function', 'addEvents is an object');
  t.end();
});

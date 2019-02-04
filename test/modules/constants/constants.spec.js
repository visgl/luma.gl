import test from 'tape-catch';

import GL from '@luma.gl/constants';

test('@luma.gl/constants', t => {
  t.equal(typeof GL, 'object', '@luma.gl/constants is an object');
  t.end();
});

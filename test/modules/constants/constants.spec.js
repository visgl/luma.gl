import test from 'tape-catch';

import GL from '@luma.gl/constants';
import GL_DEPRECATED from 'luma.gl/constants';

test('@luma.gl/constants', t => {
  t.equal(typeof GL, 'object', '@luma.gl/constants is an object');
  t.end();
});

test('luma.gl/constants (DEPRECATED)', t => {
  t.equal(GL_DEPRECATED, GL, 'luma.gl/constants still importing constants');
  t.end();
});

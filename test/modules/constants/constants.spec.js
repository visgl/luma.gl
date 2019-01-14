import test from 'tape-catch';

import GL from '@luma.gl/constants';

test('@luma.gl/constants', t => {
  t.equal(typeof GL, 'object', '@luma.gl/constants is an object');
  t.end();
});

test('luma.gl/constants (DEPRECATED)', t => {
  t.comment('Intentionally triggering deprecation warning!');
  const GL_DEPRECATED = require('luma.gl/constants');
  t.equal(GL_DEPRECATED, GL, 'luma.gl/constants still correctly importing constants');
  t.end();
});

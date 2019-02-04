import test from 'tape-catch';

import * as main from 'luma.gl';
import * as core from '@luma.gl/core';
import GL from '@luma.gl/constants';

// Check that specific imports still work

test('luma.gl/constants (DEPRECATED)', t => {
  t.comment('Intentionally triggering deprecation warning!');
  const GL_DEPRECATED = require('luma.gl/constants');
  t.equal(GL_DEPRECATED, GL, 'luma.gl/constants still correctly importing constants');
  t.end();
});

test('luma.gl#core exports', t => {
  for (const exportedKey in core) {
    t.ok(
      main[exportedKey] === core[exportedKey],
      `${exportedKey} is reexported properly by luma.gl`
    );
  }
  t.end();
});

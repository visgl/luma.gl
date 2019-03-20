import test from 'tape-catch';

import {window} from '@luma.gl/core';
import {setOverride, getOverrides} from '@luma.gl/core/debug/seer-integration';

test('Seer overrides', t => {
  const uniforms = {
    ONE: 'neo',
    opacity: 0.2,
    viewportSize: [1000, 1000]
  };

  setOverride('model-3', ['ONE'], 'smith');
  getOverrides('model-3', uniforms);
  t.equal(uniforms.ONE, 'neo', 'The one should still be the chosen one');

  window.__SEER_INITIALIZED__ = true;

  setOverride('model-3', ['ONE'], 'smith');
  getOverrides('model-3', uniforms);
  t.equal(uniforms.ONE, 'smith', 'The one should have been sacrified');

  setOverride('model-3', ['viewportSize', 0], 4);
  getOverrides('model-3', uniforms);
  t.equal(uniforms.viewportSize[0], 4, 'Nested values can be overriden too');

  t.end();
});

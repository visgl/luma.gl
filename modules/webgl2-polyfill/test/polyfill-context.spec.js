import polyfillContext from '@luma.gl/webgl2-polyfill';
import test from 'tape-catch';
import {makeSpy} from '@probe.gl/test-utils';

import {fixture} from 'luma.gl/test/setup';

test('WebGL#polyfillContext', t => {
  const {gl, gl2} = fixture;

  t.ok(typeof polyfillContext === 'function', 'polyfillContext defined');

  const extensions = polyfillContext(gl);
  t.ok(extensions, 'extensions were returned');

  if (gl2) {
    const extensions2 = polyfillContext(gl2);
    t.ok(extensions2, 'extensions were returned');
  }

  t.end();
});

test('WebGL#polyfillContext getSupportedExtensions when context is lost', t => {
  const {gl, gl2} = fixture;

  const getSupportedExtensionsSpy = makeSpy(gl, 'getSupportedExtensions');
  getSupportedExtensionsSpy.returns(null);

  const extensions = polyfillContext(gl);
  t.ok(extensions, 'extensions were returned');
  getSupportedExtensionsSpy.restore();

  if (gl2) {
    const getSupportedExtensions2Spy = makeSpy(gl2, 'getSupportedExtensions');
    getSupportedExtensions2Spy.returns(null);
    const extensions2 = polyfillContext(gl2);
    t.ok(extensions2, 'extensions were returned');
    getSupportedExtensions2Spy.restore();
  }

  t.end();
});

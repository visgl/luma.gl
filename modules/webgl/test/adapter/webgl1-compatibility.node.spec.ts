// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {WebGLAdapter} from '../../src/adapter/webgl-adapter';
import {registerWebGL1Compatibility} from '../../src/context/polyfills/webgl1-compatibility-hooks';

test('WebGLAdapter delegates WebGL1 enforcement to an optional compatibility hook', t => {
  const events: boolean[] = [];
  registerWebGL1Compatibility({
    enforceWebGL2(enable) {
      events.push(Boolean(enable));
    }
  });

  const adapter = new WebGLAdapter();
  adapter.enforceWebGL2(true);
  adapter.enforceWebGL2(false);

  t.deepEqual(events, [true, false], 'adapter delegates both enable and disable operations');
  t.end();
});

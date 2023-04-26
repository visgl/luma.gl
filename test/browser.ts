// luma.gl, MIT license
import test from 'tape-promise/tape';

let failed = false;
test.onFinish(window.browserTestDriver_finish);
test.onFailure(() => {
  failed = true;
  window.browserTestDriver_fail();
});

// hack: prevent example imports from starting their own animation loop
globalThis.website = true;

import './modules';
import './render/render.spec';

// luma.gl, MIT license
import test from 'tape-promise/tape';

test.onFinish(window.browserTestDriver_finish);
test.onFailure(() => {
  window.browserTestDriver_fail();
});

// hack: prevent example imports from starting their own animation loop
globalThis.website = true;

// import './modules';
import './render/render.spec';

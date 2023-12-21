// luma.gl, MIT license
import test from 'tape-promise/tape';

const noop = () => {};
test.onFinish(window.browserTestDriver_finish || noop);
test.onFailure(window.browserTestDriver_fail || noop);

// hack: prevent example imports from starting their own animation loop
globalThis.website = true;

import './modules';
// import './render/render.spec';

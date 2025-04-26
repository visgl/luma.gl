// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global window */
import test from 'tape';
import {_enableDOMLogging as enableDOMLogging} from '@probe.gl/test-utils';

// import '@luma.gl/debug';

let failed = false;
if (window.browserTestDriver_finish && window.browserTestDriver_fail) {
  test.onFinish(window.browserTestDriver_finish);
  test.onFailure(() => {
    failed = true;
    window.browserTestDriver_fail();
  });
} else {
  // eslint-disable-next-line no-console
  console.warn('Use Google Chrome for Testing to report test completion.');
}

// tap-browser-color alternative
enableDOMLogging({
  getStyle: message => ({
    background: failed ? '#F28E82' : '#8ECA6C',
    position: 'absolute',
    top: '500px',
    width: '100%'
  })
});

// hack: prevent example imports from starting their own animation loop
globalThis.website = true;

// Register WebGL and WebGPU
import '@luma.gl/test-utils';
// Run tests
import './modules';

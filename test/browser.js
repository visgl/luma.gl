// luma.gl, MIT license
const test = require('tape');
const {_enableDOMLogging: enableDOMLogging} = require('@probe.gl/test-utils');

let failed = false;
test.onFinish(window.browserTestDriver_finish);
test.onFailure(() => {
  failed = true;
  window.browserTestDriver_fail();
});

// tap-browser-color alternative
enableDOMLogging({
  getStyle: (message) => ({
    background: failed ? '#F28E82' : '#8ECA6C',
    position: 'absolute',
    top: '420px',
    width: '100%'
  })
});

// hack: prevent example imports from starting their own animation loop
window.website = true;

test('Browser tests', (t) => {
  require('./modules');
  require('./render');
  t.end();
});

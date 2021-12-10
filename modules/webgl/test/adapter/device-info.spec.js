import test from 'tape-promise/tape';
import {webgl1TestDevice, webgl2TestDevice} from '@luma.gl/test-utils';

test('WebGLDevice#info (unknown)', (t) => {
  t.ok(webgl1TestDevice.info.type);

  if (webgl2TestDevice) {
    t.ok(webgl2TestDevice.info.type);
  }
  t.end();
});

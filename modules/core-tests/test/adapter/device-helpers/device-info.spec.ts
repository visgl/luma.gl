import test from 'tape-promise/tape';
import {getTestDevices} from '@luma.gl/test-utils';

test('WebGLDevice#info (unknown)', async (t) => {
  for (const testDevice of await getTestDevices()) {
    t.ok(testDevice.info.type);
    // TODO check all info fields
  }
  t.end();
});

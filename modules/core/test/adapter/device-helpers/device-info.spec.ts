import {expect, test} from 'vitest';
import { getTestDevices } from '@luma.gl/test-utils';
test('Device#info (unknown)', async () => {
  for (const testDevice of await getTestDevices()) {
    expect(testDevice.info.type).toBeTruthy();
    // TODO check all info fields
  }
});

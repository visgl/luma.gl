import {expect, test} from 'vitest';
import { webgl2Adapter } from '@luma.gl/webgl';

// TODO - duplicates core spec?
test('WebGLDevice#lost (Promise)', async () => {
  const device = await webgl2Adapter.create({
    createCanvasContext: true,
    debug: false
  });

  // Wrap in a promise to make sure tape waits for us
  await new Promise<void>(async resolve => {
    setTimeout(async () => {
      const cause = await device.lost;
      expect(cause.reason, `Context lost: ${cause.message}`).toBe('destroyed');
      resolve();
    }, 0);
    device.loseDevice();
  });
  device.destroy();
});

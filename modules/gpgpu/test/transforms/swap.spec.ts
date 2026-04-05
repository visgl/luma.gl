import {expect, test} from 'vitest';
import {Swap} from '@luma.gl/gpgpu';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

// TODO - these tests could run on NullDevice

test('Swap#constructor', async () => {
  const webglDevice = await getWebGLTestDevice();

  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  expect(swap.current, 'should set the current resource correctly').toBe(current);
  expect(swap.next, 'should set the next resource correctly').toBe(next);
});

test('Swap#destroy', async () => {
  const webglDevice = await getWebGLTestDevice();

  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  expect(swap.current.destroyed, 'should not yet have destroyed the current resource').toBe(false);
  expect(swap.next.destroyed, 'should not yet have destroyed the next resource').toBe(false);

  swap.destroy();

  expect(swap.current.destroyed, 'should destroy the current resource').toBe(true);
  expect(swap.next.destroyed, 'should destroy the next resource').toBe(true);
});

test('Swap#swap', async () => {
  const webglDevice = await getWebGLTestDevice();

  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  swap.swap();

  expect(swap.current, 'should make the next resource the current resource').toBe(next);
  expect(swap.next, 'should reuse the current resource as the next resource').toBe(current);
});

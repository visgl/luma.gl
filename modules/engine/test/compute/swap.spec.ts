import test from 'tape';
import {Swap, SwapFramebuffers} from '../../src/compute/swap';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

// TODO - these tests could run on NullDevice

test('Swap#constructor', async t => {
  const webglDevice = await getWebGLTestDevice();

  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  t.equal(swap.current, current, 'should set the current resource correctly');
  t.equal(swap.next, next, 'should set the next resource correctly');

  t.end();
});

test('Swap#destroy', async t => {
  const webglDevice = await getWebGLTestDevice();

  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  t.equal(swap.current.destroyed, false, 'should not yet have destroyed the current resource');
  t.equal(swap.next.destroyed, false, 'should not yet have destroyed the next resource');

  swap.destroy();

  t.equal(swap.current.destroyed, true, 'should destroy the current resource');
  t.equal(swap.next.destroyed, true, 'should destroy the next resource');

  t.end();
});

test('Swap#swap', async t => {
  const webglDevice = await getWebGLTestDevice();

  const current = webglDevice.createBuffer({byteLength: 1});
  const next = webglDevice.createBuffer({byteLength: 1});
  const swap = new Swap({current, next});

  swap.swap();

  t.equal(swap.current, next, 'should make the next resource the current resource');
  t.equal(swap.next, current, 'should reuse the current resource as the next resource');

  t.end();
});

test('SwapFramebuffers#resize', async t => {
  const webglDevice = await getWebGLTestDevice();

  const swap = new SwapFramebuffers(webglDevice, {
    colorAttachments: ['rgba8unorm'],
    width: 4,
    height: 4
  });

  const currentTexture = swap.current.colorAttachments[0].texture;
  const nextTexture = swap.next.colorAttachments[0].texture;

  let resized = swap.resize({width: 4, height: 4});
  t.equal(resized, false, 'resize with same size returns false');
  t.equal(
    swap.current.colorAttachments[0].texture,
    currentTexture,
    'current framebuffer texture unchanged'
  );
  t.equal(swap.next.colorAttachments[0].texture, nextTexture, 'next framebuffer texture unchanged');

  resized = swap.resize({width: 8, height: 8});
  t.equal(resized, true, 'resize with new size returns true');
  t.equal(swap.current.width, 8, 'current framebuffer width updated');
  t.equal(swap.current.height, 8, 'current framebuffer height updated');
  t.notEqual(
    swap.current.colorAttachments[0].texture,
    currentTexture,
    'current framebuffer texture replaced after resize'
  );

  const newCurrent = swap.current.colorAttachments[0].texture;
  const newNext = swap.next.colorAttachments[0].texture;
  resized = swap.resize({width: 8, height: 8});
  t.equal(resized, false, 'resize with same size again returns false');
  t.equal(
    swap.current.colorAttachments[0].texture,
    newCurrent,
    'current framebuffer texture unchanged after no-op'
  );
  t.equal(
    swap.next.colorAttachments[0].texture,
    newNext,
    'next framebuffer texture unchanged after no-op'
  );

  swap.destroy();

  t.end();
});

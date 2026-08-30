import {describe, expect, it} from 'vitest';
import {Swap, SwapFramebuffers} from '../../src/compute/swap';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

// TODO - these tests could run on NullDevice

describe('Swap', () => {
  it('constructor', async () => {
    const webglDevice = await getWebGLTestDevice();

    const current = webglDevice.createBuffer({byteLength: 1});
    const next = webglDevice.createBuffer({byteLength: 1});
    const swap = new Swap({current, next});

    expect(swap.current, 'should set the current resource correctly').toBe(current);
    expect(swap.next, 'should set the next resource correctly').toBe(next);
  });

  it('destroy', async () => {
    const webglDevice = await getWebGLTestDevice();

    const current = webglDevice.createBuffer({byteLength: 1});
    const next = webglDevice.createBuffer({byteLength: 1});
    const swap = new Swap({current, next});

    expect(swap.current.destroyed, 'should not yet have destroyed the current resource').toBe(
      false
    );
    expect(swap.next.destroyed, 'should not yet have destroyed the next resource').toBe(false);

    swap.destroy();

    expect(swap.current.destroyed, 'should destroy the current resource').toBe(true);
    expect(swap.next.destroyed, 'should destroy the next resource').toBe(true);
  });

  it('swap', async () => {
    const webglDevice = await getWebGLTestDevice();

    const current = webglDevice.createBuffer({byteLength: 1});
    const next = webglDevice.createBuffer({byteLength: 1});
    const swap = new Swap({current, next});

    swap.swap();

    expect(swap.current, 'should make the next resource the current resource').toBe(next);
    expect(swap.next, 'should reuse the current resource as the next resource').toBe(current);
  });

  it('SwapFramebuffers#resize', async () => {
    const webglDevice = await getWebGLTestDevice();

    const swap = new SwapFramebuffers(webglDevice, {
      colorAttachments: ['rgba8unorm'],
      width: 4,
      height: 4
    });

    const currentTexture = swap.current.colorAttachments[0].texture;
    const nextTexture = swap.next.colorAttachments[0].texture;

    let resized = swap.resize({width: 4, height: 4});
    expect(resized, 'resize with same size returns false').toBe(false);
    expect(swap.current.colorAttachments[0].texture, 'current framebuffer texture unchanged').toBe(
      currentTexture
    );
    expect(swap.next.colorAttachments[0].texture, 'next framebuffer texture unchanged').toBe(
      nextTexture
    );

    resized = swap.resize({width: 8, height: 8});
    expect(resized, 'resize with new size returns true').toBe(true);
    expect(currentTexture.destroyed, 'resize destroys the previous current texture').toBe(true);
    expect(nextTexture.destroyed, 'resize destroys the previous next texture').toBe(true);
    expect(swap.current.width, 'current framebuffer width updated').toBe(8);
    expect(swap.current.height, 'current framebuffer height updated').toBe(8);
    expect(
      swap.current.colorAttachments[0].texture,
      'current framebuffer texture replaced after resize'
    ).not.toBe(currentTexture);

    const newCurrent = swap.current.colorAttachments[0].texture;
    const newNext = swap.next.colorAttachments[0].texture;
    resized = swap.resize({width: 8, height: 8});
    expect(resized, 'resize with same size again returns false').toBe(false);
    expect(
      swap.current.colorAttachments[0].texture,
      'current framebuffer texture unchanged after no-op'
    ).toBe(newCurrent);
    expect(
      swap.next.colorAttachments[0].texture,
      'next framebuffer texture unchanged after no-op'
    ).toBe(newNext);

    swap.destroy();
    expect(newCurrent.destroyed, 'destroy releases the current framebuffer texture').toBe(true);
    expect(newNext.destroyed, 'destroy releases the next framebuffer texture').toBe(true);
  });

  it('SwapFramebuffers preserves borrowed attachment ownership', async () => {
    const webglDevice = await getWebGLTestDevice();
    const borrowedTexture = webglDevice.createTexture({
      format: 'rgba8unorm',
      width: 4,
      height: 4
    });
    const swap = new SwapFramebuffers(webglDevice, {
      colorAttachments: [borrowedTexture],
      width: 4,
      height: 4
    });

    swap.destroy();
    expect(borrowedTexture.destroyed, 'destroy does not release a borrowed texture').toBe(false);
    borrowedTexture.destroy();
  });
});

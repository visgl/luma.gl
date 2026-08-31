// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';

import {
  getNullTestDevice,
  getPresentationWebGLTestDevice,
  getWebGLTestDevice,
  getWebGPUTestDevice
} from '@luma.gl/test-utils';

it('WebGLPresentationContext delegates framebuffer sizing and present()', async () => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    expect(
      Boolean('OffscreenCanvas unavailable, skipped WebGL presentation-context test'),
      ''
    ).toBe(true);
    void 0;
    return;
  }

  const defaultCanvasContext = device.getDefaultCanvasContext();
  const defaultCanvas = defaultCanvasContext.canvas as OffscreenCanvas;
  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 64;
  destinationCanvas.height = 32;

  const originalGetContext = destinationCanvas.getContext.bind(destinationCanvas);
  const drawImageCalls: unknown[][] = [];
  destinationCanvas.getContext = ((contextId: '2d', options?: CanvasRenderingContext2DSettings) => {
    const context = originalGetContext(contextId, options);
    if (contextId === '2d' && context) {
      const originalDrawImage = context.drawImage.bind(context);
      context.drawImage = ((...args: Parameters<typeof context.drawImage>) => {
        drawImageCalls.push(args);
        return originalDrawImage(...args);
      }) as typeof context.drawImage;
    }
    return context;
  }) as typeof destinationCanvas.getContext;

  const presentationContext = device.createPresentationContext({canvas: destinationCanvas});
  const framebuffer = presentationContext.getCurrentFramebuffer();

  expect(Boolean(framebuffer), 'presentation context returns a framebuffer').toBe(true);
  expect(defaultCanvas.width, 'default canvas width matches presentation width').toBe(64);
  expect(defaultCanvas.height, 'default canvas height matches presentation height').toBe(32);

  presentationContext.present();

  expect(drawImageCalls.length, 'present copies once into the destination canvas').toBe(1);
  expect(drawImageCalls[0][0], 'present copies from the default canvas').toBe(defaultCanvas);

  void 0;
});

it('WebGLPresentationContext supports sequential presentation contexts', async () => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    expect(
      Boolean('OffscreenCanvas unavailable, skipped sequential presentation-context test'),
      ''
    ).toBe(true);
    void 0;
    return;
  }

  const defaultCanvas = device.getDefaultCanvasContext().canvas as OffscreenCanvas;

  const firstCanvas = document.createElement('canvas');
  firstCanvas.width = 32;
  firstCanvas.height = 16;

  const secondCanvas = document.createElement('canvas');
  secondCanvas.width = 96;
  secondCanvas.height = 48;

  const firstPresentationContext = device.createPresentationContext({canvas: firstCanvas});
  firstPresentationContext.getCurrentFramebuffer();
  firstPresentationContext.present();

  expect(defaultCanvas.width, 'first presentation context resizes default canvas width').toBe(32);
  expect(defaultCanvas.height, 'first presentation context resizes default canvas height').toBe(16);

  const secondPresentationContext = device.createPresentationContext({canvas: secondCanvas});
  secondPresentationContext.getCurrentFramebuffer();
  secondPresentationContext.present();

  expect(defaultCanvas.width, 'second presentation context resizes default canvas width').toBe(96);
  expect(defaultCanvas.height, 'second presentation context resizes default canvas height').toBe(
    48
  );

  void 0;
});

it('WebGLPresentationContext skips present() for zero-sized destinations', async () => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    expect(
      Boolean('OffscreenCanvas unavailable, skipped zero-size presentation-context test'),
      ''
    ).toBe(true);
    void 0;
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 0;
  destinationCanvas.height = 0;

  const presentationContext = device.createPresentationContext({
    canvas: destinationCanvas,
    autoResize: false,
    width: 0,
    height: 0,
    useDevicePixels: false
  });

  expect(
    () => presentationContext.present(),
    'present is a no-op when the presentation canvas is zero-sized'
  ).not.toThrow();

  void 0;
});

it('WebGLPresentationContext fails without a default canvas context', async () => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    expect(Boolean('OffscreenCanvas unavailable, skipped missing-default-context test'), '').toBe(
      true
    );
    void 0;
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 8;
  destinationCanvas.height = 8;

  const originalCanvasContext = device.canvasContext;
  // @ts-expect-error testing failure path
  device.canvasContext = null;

  try {
    expect(
      () => device.createPresentationContext({canvas: destinationCanvas}),
      'constructor requires a default canvas context'
    ).toThrow(/Device has no default CanvasContext/);
  } finally {
    // @ts-expect-error restoring test state
    device.canvasContext = originalCanvasContext;
  }

  void 0;
});

it('WebGLPresentationContext fails when default canvas is not offscreen', async () => {
  const device = await getWebGLTestDevice();
  const destinationCanvas = document.createElement('canvas');

  expect(
    () => device.createPresentationContext({canvas: destinationCanvas}),
    'constructor requires an offscreen default canvas context'
  ).toThrow(/requires the default CanvasContext canvas to be an OffscreenCanvas/);

  void 0;
});

it('WebGLPresentationContext fails when destination canvas has no 2d context', async () => {
  const device = await getPresentationWebGLTestDevice();
  if (!device) {
    expect(
      Boolean('OffscreenCanvas unavailable, skipped destination-context failure test'),
      ''
    ).toBe(true);
    void 0;
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  const originalGetContext = destinationCanvas.getContext.bind(destinationCanvas);

  destinationCanvas.getContext = ((contextId: string, options?: unknown) => {
    if (contextId === '2d') {
      return null;
    }
    return originalGetContext(contextId as any, options as any);
  }) as typeof destinationCanvas.getContext;

  expect(
    () => device.createPresentationContext({canvas: destinationCanvas}),
    'constructor requires a destination 2d context'
  ).toThrow(/Failed to create 2d presentation context/);

  void 0;
});

it('WebGPUPresentationContext renders directly to its destination canvas', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    expect(Boolean('WebGPU unavailable, skipped WebGPU presentation-context test'), '').toBe(true);
    void 0;
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 32;
  destinationCanvas.height = 16;

  const presentationContext = webgpuDevice.createPresentationContext({
    canvas: destinationCanvas,
    width: 32,
    height: 16,
    autoResize: false,
    useDevicePixels: false
  });
  const framebuffer = presentationContext.getCurrentFramebuffer() as any;
  const secondFramebuffer = presentationContext.getCurrentFramebuffer() as any;

  expect(Boolean(framebuffer), 'WebGPU presentation context returns a framebuffer').toBe(true);
  expect(secondFramebuffer, 'WebGPU presentation context reuses its framebuffer wrapper').toBe(
    framebuffer
  );
  expect(
    secondFramebuffer.colorAttachments[0],
    'WebGPU presentation context reuses its texture view wrapper'
  ).toBe(framebuffer.colorAttachments[0]);
  expect(
    secondFramebuffer.colorAttachments[0].texture,
    'WebGPU presentation context reuses its texture wrapper'
  ).toBe(framebuffer.colorAttachments[0].texture);
  expect(destinationCanvas.width, 'destination canvas width is preserved').toBe(32);
  expect(destinationCanvas.height, 'destination canvas height is preserved').toBe(16);

  expect(() => presentationContext.present(), 'present submits without copy step').not.toThrow();

  presentationContext.destroy();
  void 0;
});

it('WebGPUPresentationContext destroy() releases its depth attachment', async () => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    expect(Boolean('WebGPU unavailable, skipped WebGPU depth-attachment cleanup test'), '').toBe(
      true
    );
    void 0;
    return;
  }

  const destinationCanvas = document.createElement('canvas');
  destinationCanvas.width = 32;
  destinationCanvas.height = 16;

  const presentationContext = webgpuDevice.createPresentationContext({
    canvas: destinationCanvas,
    width: 32,
    height: 16,
    autoResize: false,
    useDevicePixels: false
  });

  presentationContext.getCurrentFramebuffer();

  const depthStencilAttachment = (presentationContext as any).depthStencilAttachment as {
    destroy: () => void;
  } | null;
  const colorAttachment = (presentationContext as any).colorAttachment as {
    destroy: () => void;
  } | null;
  const framebuffer = (presentationContext as any).framebuffer as {destroy: () => void} | null;

  expect(
    Boolean(depthStencilAttachment),
    'presentation context creates a depth attachment by default'
  ).toBe(true);
  expect(Boolean(colorAttachment), 'presentation context caches a color attachment wrapper').toBe(
    true
  );
  expect(Boolean(framebuffer), 'presentation context caches a framebuffer wrapper').toBe(true);

  let destroyCallCount = 0;
  if (depthStencilAttachment) {
    const originalDestroy = depthStencilAttachment.destroy.bind(depthStencilAttachment);
    depthStencilAttachment.destroy = () => {
      destroyCallCount++;
      originalDestroy();
    };
  }
  let colorDestroyCallCount = 0;
  if (colorAttachment) {
    const originalDestroy = colorAttachment.destroy.bind(colorAttachment);
    colorAttachment.destroy = () => {
      colorDestroyCallCount++;
      originalDestroy();
    };
  }
  let framebufferDestroyCallCount = 0;
  if (framebuffer) {
    const originalDestroy = framebuffer.destroy.bind(framebuffer);
    framebuffer.destroy = () => {
      framebufferDestroyCallCount++;
      originalDestroy();
    };
  }

  presentationContext.destroy();

  expect(destroyCallCount, 'destroy releases the cached depth attachment').toBe(1);
  expect(colorDestroyCallCount, 'destroy releases the cached color attachment wrapper').toBe(1);
  expect(framebufferDestroyCallCount, 'destroy releases the cached framebuffer wrapper').toBe(1);
  expect(
    (presentationContext as any).depthStencilAttachment,
    'destroy clears the cached depth attachment reference'
  ).toBe(null);
  expect(
    (presentationContext as any).colorAttachment,
    'destroy clears the cached color attachment reference'
  ).toBe(null);
  expect(
    (presentationContext as any).framebuffer,
    'destroy clears the cached framebuffer reference'
  ).toBe(null);

  void 0;
});
it('PresentationContext is unsupported on NullDevice', async () => {
  const nullDevice = await getNullTestDevice();
  expect(
    () => nullDevice.createPresentationContext({width: 1, height: 1}),
    'NullDevice rejects presentation contexts'
  ).toThrow(/not supported/);

  void 0;
});

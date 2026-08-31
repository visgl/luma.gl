// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {luma} from '@luma.gl/core';
import {webgpuAdapter, type WebGPUDevice} from '@luma.gl/webgpu';

import {AnimationLoop, AnimationLoopTemplate, makeAnimationLoop} from '@luma.gl/engine';

it('engine#AnimationLoop constructor', async () => {
  const device = await getWebGLTestDevice();

  expect(Boolean(AnimationLoop), 'AnimationLoop imported').toBe(true);
  const animationLoop = new AnimationLoop({device});
  expect(Boolean(animationLoop), 'AnimationLoop constructor should not throw').toBe(true);
  void 0;
});

it('engine#AnimationLoop uses provided stats object', async () => {
  const device = await getWebGLTestDevice();
  const customStats = luma.stats.get('GPU Time and Memory');
  customStats.reset();
  const frameRate = customStats.get('Frame Rate');
  const beforeFrameRate = frameRate.lastSampleTime;
  const beforeCpuTime = customStats.get('CPU Time').lastSampleTime;
  const beforeGpuTime = customStats.get('GPU Time').lastSampleTime;

  const animationLoop = new AnimationLoop({device, stats: customStats});
  expect(animationLoop.stats, 'AnimationLoop stores provided stats object').toBe(customStats);

  await animationLoop.start();
  await animationLoop.waitForRender();
  await animationLoop.waitForRender();

  let frameRateUpdated = frameRate.lastSampleTime > beforeFrameRate;
  let cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  for (let attempt = 0; (!frameRateUpdated || !cpuTimeUpdated) && attempt < 8; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 16));
    await animationLoop.waitForRender();
    frameRateUpdated = frameRate.lastSampleTime > beforeFrameRate;
    cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  }
  expect(Boolean(frameRateUpdated), 'Frame Rate updates on custom stats object').toBe(true);
  expect(Boolean(cpuTimeUpdated), 'CPU Time updates on custom stats object').toBe(true);
  expect(
    customStats.get('GPU Time').lastSampleTime,
    'GPU Time remains unchanged when no profiled passes are encoded'
  ).toBe(beforeGpuTime);

  animationLoop.stop();
  animationLoop.destroy();
  void 0;
});

it('engine#AnimationLoop start,stop', async () => {
  const device = await getWebGLTestDevice();

  let initializeCalled = 0;
  let renderCalled = 0;
  let finalizeCalled = 0;

  new AnimationLoop({
    device,
    onInitialize: async () => {
      initializeCalled++;
    },
    onRender: ({animationLoop}) => {
      renderCalled++;

      expect(animationLoop.device.isLost, 'isContextLost returns false').toBe(false);

      animationLoop.stop();

      expect(initializeCalled, 'onInitialize called').toBe(1);
      expect(renderCalled, 'onRender called').toBe(1);
      expect(finalizeCalled, 'onFinalize called').toBe(1);

      void 0;
    },
    onFinalize: () => {
      finalizeCalled++;
    }
  }).start();
});

it('engine#AnimationLoop redraw', async () => {
  const device = await getWebGLTestDevice();

  let renderCalled = 0;

  new AnimationLoop({
    device,
    onInitialize: async ({animationLoop}) => {
      animationLoop.redraw();
      animationLoop.stop();

      expect(renderCalled, 'onRender called').toBe(1);

      void 0;
    },
    onRender: () => {
      renderCalled++;
    }
  }).start();
});

it('engine#AnimationLoop passes frame payload from custom animation frame provider', async () => {
  const device = await getWebGLTestDevice();
  const animationFrame = {};
  let scheduledCallback: ((time: DOMHighResTimeStamp, animationFrame?: unknown) => void) | null =
    null;
  let cancelAnimationFrameCallCount = 0;
  const animationFrameProvider = {
    requestAnimationFrame(callback: (time: DOMHighResTimeStamp, animationFrame?: unknown) => void) {
      scheduledCallback = callback;
      return 1;
    },
    cancelAnimationFrame() {
      cancelAnimationFrameCallCount++;
    }
  };
  const animationLoop = new AnimationLoop({
    device,
    animationFrameProvider,
    onRender: ({animationLoop, animationFrame: receivedAnimationFrame}) => {
      expect(receivedAnimationFrame, 'onRender receives frame payload from frame provider').toBe(
        animationFrame
      );
      animationLoop.stop();
    }
  });

  await animationLoop.start();
  scheduledCallback?.(123, animationFrame);

  expect(cancelAnimationFrameCallCount, 'stopping cancels scheduled custom frame').toBe(1);
  animationLoop.destroy();
  device.destroy();
  void 0;
});

it('engine#AnimationLoop should not call initialize more than once', async () => {
  const device = await getWebGLTestDevice();

  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onInitialize: async () => {
      initializeCalled++;
    }
  });
  animationLoop.start();
  animationLoop.start();
  await animationLoop.waitForRender();
  animationLoop.stop();
  expect(initializeCalled, 'onInitialize called').toBe(1);
  void 0;
});

it('engine#AnimationLoop two start()s should only run one loop', async () => {
  const device = await getWebGLTestDevice();

  let renderCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onRender: () => {
      renderCalled++;
    }
  });
  animationLoop.start();
  await animationLoop.waitForRender();
  animationLoop.start();
  await animationLoop.waitForRender();
  await animationLoop.waitForRender();
  animationLoop.stop();
  expect(renderCalled, 'onRender called').toBe(3);
  void 0;
});

it('engine#AnimationLoop start followed immediately by stop() should stop', async () => {
  const device = await getWebGLTestDevice();

  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onInitialize: async () => {
      initializeCalled++;
    }
  });
  animationLoop.start();
  animationLoop.stop();
  await new Promise<void>(resolve => setTimeout(resolve, 100));
  expect(initializeCalled, 'onInitialize called').toBe(0);
  void 0;
});

it('engine#makeAnimationLoop stops after template initialization failure', async () => {
  const device = await getWebGLTestDevice();
  let renderCalled = 0;

  class FailingAnimationLoopTemplate extends AnimationLoopTemplate {
    override async onInitialize(): Promise<unknown> {
      throw new Error('Expected initialization failure');
    }

    override onRender(): void {
      renderCalled++;
    }

    override onFinalize(): void {}
  }

  // biome-ignore lint/suspicious/noConsole: test suppresses expected initialization failure logging.
  const originalConsoleError = console.error;
  // biome-ignore lint/suspicious/noConsole: test suppresses expected initialization failure logging.
  console.error = () => {};
  try {
    const animationLoop = makeAnimationLoop(FailingAnimationLoopTemplate, {
      device
    });
    const startResult = await animationLoop.start();
    expect(startResult, 'Animation loop stops after template initialization failure').toBe(null);
    expect(renderCalled, 'onRender is not called after template initialization failure').toBe(0);
    animationLoop.destroy();
  } finally {
    // biome-ignore lint/suspicious/noConsole: test restores console state after suppressing expected logging.
    console.error = originalConsoleError;
    if (typeof document !== 'undefined') {
      document.getElementById('animation-loop-error')?.remove();
    }
  }

  void 0;
});

it('engine#makeAnimationLoop exposes the active template instance', async () => {
  const device = await getWebGLTestDevice();

  class InspectableAnimationLoopTemplate extends AnimationLoopTemplate {
    override onRender(): void {}
    override onFinalize(): void {}
  }

  const animationLoop = makeAnimationLoop(InspectableAnimationLoopTemplate, {
    device
  });
  expect(animationLoop.getAnimationLoopTemplate(), 'template is absent before initialization').toBe(
    null
  );
  await animationLoop.start();
  expect(
    Boolean(animationLoop.getAnimationLoopTemplate() instanceof InspectableAnimationLoopTemplate),
    'initialized template is exposed'
  ).toBe(true);
  animationLoop.destroy();
  expect(animationLoop.getAnimationLoopTemplate(), 'finalized template is no longer exposed').toBe(
    null
  );
  void 0;
});

it('engine#makeAnimationLoop runs onAfterRender before device submission', async () => {
  const device = await getWebGLTestDevice();
  const frameStages: string[] = [];
  let scheduledCallback: ((time: DOMHighResTimeStamp, animationFrame?: unknown) => void) | null =
    null;
  const animationFrameProvider = {
    requestAnimationFrame(callback: (time: DOMHighResTimeStamp, animationFrame?: unknown) => void) {
      scheduledCallback = callback;
      return 1;
    },
    cancelAnimationFrame() {}
  };

  class OrderedAnimationLoopTemplate extends AnimationLoopTemplate {
    override onRender(): void {
      frameStages.push('template-render');
    }
    override onFinalize(): void {}
  }

  const originalSubmit = device.submit;
  device.submit = commandBuffer => {
    frameStages.push('device-submit');
    originalSubmit.call(device, commandBuffer);
  };
  const animationLoop = makeAnimationLoop(OrderedAnimationLoopTemplate, {
    device,
    animationFrameProvider,
    onAfterRender: animationProps => {
      frameStages.push('after-render');
      animationProps.animationLoop.stop();
    }
  });

  try {
    await animationLoop.start();
    scheduledCallback?.(123);
    expect(
      frameStages,
      'post-render hook runs while the frame command encoder is still open'
    ).toEqual(['template-render', 'after-render', 'device-submit']);
  } finally {
    animationLoop.destroy();
    device.submit = originalSubmit;
  }
  void 0;
});

it('engine#makeAnimationLoop skips device submission when a frame is idle', async () => {
  const device = await getWebGLTestDevice();
  let scheduledCallback: ((time: DOMHighResTimeStamp, animationFrame?: unknown) => void) | null =
    null;
  const animationFrameProvider = {
    requestAnimationFrame(callback: (time: DOMHighResTimeStamp, animationFrame?: unknown) => void) {
      scheduledCallback = callback;
      return 1;
    },
    cancelAnimationFrame() {}
  };

  class IdleAnimationLoopTemplate extends AnimationLoopTemplate {
    override onRender(): boolean {
      return false;
    }
    override onFinalize(): void {}
  }

  let submissionCount = 0;
  const originalSubmit = device.submit;
  device.submit = commandBuffer => {
    submissionCount++;
    originalSubmit.call(device, commandBuffer);
  };
  const animationLoop = makeAnimationLoop(IdleAnimationLoopTemplate, {
    device,
    animationFrameProvider
  });

  try {
    await animationLoop.start();
    scheduledCallback?.(123);
    expect(submissionCount, 'idle frame does not submit an empty command buffer').toBe(0);
  } finally {
    animationLoop.destroy();
    device.submit = originalSubmit;
  }
  void 0;
});

it('engine#AnimationLoop a start/stop/start should not call initialize again', async () => {
  const device = await getWebGLTestDevice();

  let initializeCalled = 0;

  const animationLoop = new AnimationLoop({
    device,
    onInitialize: async () => {
      initializeCalled++;
    }
  });
  animationLoop.start();
  setTimeout(() => animationLoop.stop(), 50);
  setTimeout(() => animationLoop.start(), 100);
  setTimeout(() => {
    expect(initializeCalled, 'onInitialize called').toBe(1);
    animationLoop.stop();
    void 0;
  }, 150);
});

it('engine#AnimationLoop GPU timing graceful fallback', async () => {
  const device = await getWebGLTestDevice();

  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();
  await animationLoop.waitForRender();

  // Stats should exist regardless of timer support
  expect(Boolean(animationLoop.gpuTime), 'gpuTime stat exists').toBe(true);
  expect(Boolean(animationLoop.cpuTime), 'cpuTime stat exists').toBe(true);

  // Device-managed GPU timing should match feature availability
  const hasTimerQuery = device.features.has('timestamp-query') && Boolean(device.props.debug);
  expect(
    device._isDebugGPUTimeEnabled(),
    `device GPU timing enabled when feature ${hasTimerQuery ? 'available' : 'unavailable'}`
  ).toBe(hasTimerQuery);
  expect(
    device.commandEncoder.getTimeProfilingQuerySet()?.props.count || 0,
    'timestamp query set pre-allocates slots for profiling passes'
  ).toBe(hasTimerQuery ? 256 : 0);

  // Destroy should not throw
  animationLoop.stop();
  animationLoop.destroy();
  expect(device._isDebugGPUTimeEnabled(), 'Query cleaned up on destroy').toBe(false);

  void 0;
});

it('engine#AnimationLoop WebGPU timing path avoids backend casts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();
  await animationLoop.waitForRender();

  expect(Boolean(animationLoop.gpuTime), 'gpuTime stat exists').toBe(true);
  expect(Boolean(animationLoop.cpuTime), 'cpuTime stat exists').toBe(true);
  expect(
    device._isDebugGPUTimeEnabled(),
    'device GPU timing follows timestamp-query support and debug flags'
  ).toBe(device.features.has('timestamp-query') && Boolean(device.props.debug));

  animationLoop.stop();
  animationLoop.destroy();
  void 0;
});

it.skip('engine#AnimationLoop debugGPUTime enables GPU timing without full debug', async () => {
  let device: WebGPUDevice | null = null;
  try {
    device = (await luma.createDevice({
      id: 'webgpu-animation-loop-debug-gpu-time',
      type: 'webgpu',
      adapters: [webgpuAdapter],
      createCanvasContext: {width: 1, height: 1},
      debug: false,
      debugGPUTime: true
    })) as WebGPUDevice;
  } catch {
    // Handled below.
  }

  if (!device) {
    void 0;
    void 0;
    return;
  }

  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();
  await animationLoop.waitForRender();

  expect(
    device._isDebugGPUTimeEnabled(),
    'debugGPUTime enables GPU timing query setup when the feature is available'
  ).toBe(device.features.has('timestamp-query'));

  animationLoop.stop();
  animationLoop.destroy();
  device.destroy();
  void 0;
});

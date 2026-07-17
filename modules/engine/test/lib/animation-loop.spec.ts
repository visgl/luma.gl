// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {luma} from '@luma.gl/core';
import {webgpuAdapter, type WebGPUDevice} from '@luma.gl/webgpu';

import {AnimationLoop, AnimationLoopTemplate, makeAnimationLoop} from '@luma.gl/engine';

test('engine#AnimationLoop constructor', async t => {
  const device = await getWebGLTestDevice();

  t.ok(AnimationLoop, 'AnimationLoop imported');
  const animationLoop = new AnimationLoop({device});
  t.ok(animationLoop, 'AnimationLoop constructor should not throw');
  t.end();
});

test('engine#AnimationLoop uses provided stats object', async t => {
  const device = await getWebGLTestDevice();
  const customStats = luma.stats.get('GPU Time and Memory');
  customStats.reset();
  const frameRate = customStats.get('Frame Rate');
  const beforeFrameRate = frameRate.lastSampleTime;
  const beforeCpuTime = customStats.get('CPU Time').lastSampleTime;
  const beforeGpuTime = customStats.get('GPU Time').lastSampleTime;

  const animationLoop = new AnimationLoop({device, stats: customStats});
  t.is(animationLoop.stats, customStats, 'AnimationLoop stores provided stats object');

  await animationLoop.start();
  await animationLoop.waitForRender();
  await animationLoop.waitForRender();

  let cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  for (let attempt = 0; !cpuTimeUpdated && attempt < 8; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 16));
    await animationLoop.waitForRender();
    cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  }
  t.ok(frameRate.lastSampleTime > beforeFrameRate, 'Frame Rate updates on custom stats object');
  t.ok(cpuTimeUpdated, 'CPU Time updates on custom stats object');
  t.equal(
    customStats.get('GPU Time').lastSampleTime,
    beforeGpuTime,
    'GPU Time remains unchanged when no profiled passes are encoded'
  );

  animationLoop.stop();
  animationLoop.destroy();
  t.end();
});

test('engine#AnimationLoop start,stop', async t => {
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

      t.is(animationLoop.device.isLost, false, 'isContextLost returns false');

      animationLoop.stop();

      t.is(initializeCalled, 1, 'onInitialize called');
      t.is(renderCalled, 1, 'onRender called');
      t.is(finalizeCalled, 1, 'onFinalize called');

      t.end();
    },
    onFinalize: () => {
      finalizeCalled++;
    }
  }).start();
});

test('engine#AnimationLoop redraw', async t => {
  const device = await getWebGLTestDevice();

  let renderCalled = 0;

  new AnimationLoop({
    device,
    onInitialize: async ({animationLoop}) => {
      animationLoop.redraw();
      animationLoop.stop();

      t.is(renderCalled, 1, 'onRender called');

      t.end();
    },
    onRender: () => {
      renderCalled++;
    }
  }).start();
});

test('engine#AnimationLoop passes frame payload from custom animation frame provider', async t => {
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
      t.equal(
        receivedAnimationFrame,
        animationFrame,
        'onRender receives frame payload from frame provider'
      );
      animationLoop.stop();
    }
  });

  await animationLoop.start();
  scheduledCallback?.(123, animationFrame);

  t.equal(cancelAnimationFrameCallCount, 1, 'stopping cancels scheduled custom frame');
  animationLoop.destroy();
  t.end();
});

test('engine#AnimationLoop should not call initialize more than once', async t => {
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
  t.is(initializeCalled, 1, 'onInitialize called');
  t.end();
});

test('engine#AnimationLoop two start()s should only run one loop', async t => {
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
  t.is(renderCalled, 3, 'onRender called');
  t.end();
});

test('engine#AnimationLoop start followed immediately by stop() should stop', async t => {
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
  t.is(initializeCalled, 0, 'onInitialize called');
  t.end();
});

test('engine#makeAnimationLoop stops after template initialization failure', async t => {
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
    const animationLoop = makeAnimationLoop(FailingAnimationLoopTemplate, {device});
    const startResult = await animationLoop.start();
    t.is(startResult, null, 'Animation loop stops after template initialization failure');
    t.is(renderCalled, 0, 'onRender is not called after template initialization failure');
    animationLoop.destroy();
  } finally {
    // biome-ignore lint/suspicious/noConsole: test restores console state after suppressing expected logging.
    console.error = originalConsoleError;
    if (typeof document !== 'undefined') {
      document.getElementById('animation-loop-error')?.remove();
    }
  }

  t.end();
});

test('engine#AnimationLoop a start/stop/start should not call initialize again', async t => {
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
    t.is(initializeCalled, 1, 'onInitialize called');
    animationLoop.stop();
    t.end();
  }, 150);
});

test('engine#AnimationLoop GPU timing graceful fallback', async t => {
  const device = await getWebGLTestDevice();

  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();
  await animationLoop.waitForRender();

  // Stats should exist regardless of timer support
  t.ok(animationLoop.gpuTime, 'gpuTime stat exists');
  t.ok(animationLoop.cpuTime, 'cpuTime stat exists');

  // Device-managed GPU timing should match feature availability
  const hasTimerQuery = device.features.has('timestamp-query') && Boolean(device.props.debug);
  t.is(
    device._isDebugGPUTimeEnabled(),
    hasTimerQuery,
    `device GPU timing enabled when feature ${hasTimerQuery ? 'available' : 'unavailable'}`
  );
  t.is(
    device.commandEncoder.getTimeProfilingQuerySet()?.props.count || 0,
    hasTimerQuery ? 256 : 0,
    'timestamp query set pre-allocates slots for profiling passes'
  );

  // Destroy should not throw
  animationLoop.stop();
  animationLoop.destroy();
  t.is(device._isDebugGPUTimeEnabled(), false, 'Query cleaned up on destroy');

  t.end();
});

test('engine#AnimationLoop WebGPU timing path avoids backend casts', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();
  await animationLoop.waitForRender();

  t.ok(animationLoop.gpuTime, 'gpuTime stat exists');
  t.ok(animationLoop.cpuTime, 'cpuTime stat exists');
  t.is(
    device._isDebugGPUTimeEnabled(),
    device.features.has('timestamp-query') && Boolean(device.props.debug),
    'device GPU timing follows timestamp-query support and debug flags'
  );

  animationLoop.stop();
  animationLoop.destroy();
  t.end();
});

test.skip('engine#AnimationLoop debugGPUTime enables GPU timing without full debug', async t => {
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
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();
  await animationLoop.waitForRender();

  t.is(
    device._isDebugGPUTimeEnabled(),
    device.features.has('timestamp-query'),
    'debugGPUTime enables GPU timing query setup when the feature is available'
  );

  animationLoop.stop();
  animationLoop.destroy();
  device.destroy();
  t.end();
});

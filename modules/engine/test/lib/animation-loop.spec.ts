import {expect, test} from 'vitest';
import { getWebGLTestDevice, getWebGPUTestDevice } from '@luma.gl/test-utils';
import { luma } from '@luma.gl/core';
import { webgpuAdapter, type WebGPUDevice } from '@luma.gl/webgpu';
import { AnimationLoop } from '@luma.gl/engine';
test('engine#AnimationLoop constructor', async () => {
  const device = await getWebGLTestDevice();
  expect(AnimationLoop, 'AnimationLoop imported').toBeTruthy();
  const animationLoop = new AnimationLoop({
    device
  });
  expect(animationLoop, 'AnimationLoop constructor should not throw').toBeTruthy();
});
test('engine#AnimationLoop uses provided stats object', async () => {
  const device = await getWebGLTestDevice();
  const customStats = luma.stats.get('GPU Time and Memory');
  customStats.reset();
  const frameRate = customStats.get('Frame Rate');
  const beforeFrameRate = frameRate.lastSampleTime;
  const beforeCpuTime = customStats.get('CPU Time').lastSampleTime;
  const beforeGpuTime = customStats.get('GPU Time').lastSampleTime;
  const animationLoop = new AnimationLoop({
    device,
    stats: customStats
  });
  expect(animationLoop.stats, 'AnimationLoop stores provided stats object').toBe(customStats);
  await animationLoop.start();
  await animationLoop.waitForRender();
  await animationLoop.waitForRender();
  let cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  for (let attempt = 0; !cpuTimeUpdated && attempt < 8; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 16));
    await animationLoop.waitForRender();
    cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  }
  expect(frameRate.lastSampleTime > beforeFrameRate, 'Frame Rate updates on custom stats object').toBeTruthy();
  expect(cpuTimeUpdated, 'CPU Time updates on custom stats object').toBeTruthy();
  expect(customStats.get('GPU Time').lastSampleTime, 'GPU Time remains unchanged when no profiled passes are encoded').toBe(beforeGpuTime);
  animationLoop.stop();
  animationLoop.destroy();
});
test('engine#AnimationLoop start,stop', async () => {
  const device = await getWebGLTestDevice();
  let initializeCalled = 0;
  let renderCalled = 0;
  let finalizeCalled = 0;
  new AnimationLoop({
    device,
    onInitialize: async () => {
      initializeCalled++;
    },
    onRender: ({
      animationLoop
    }) => {
      renderCalled++;
      expect(animationLoop.device.isLost, 'isContextLost returns false').toBe(false);
      animationLoop.stop();
      expect(initializeCalled, 'onInitialize called').toBe(1);
      expect(renderCalled, 'onRender called').toBe(1);
      expect(finalizeCalled, 'onFinalize called').toBe(1);
    },
    onFinalize: () => {
      finalizeCalled++;
    }
  }).start();
});
test('engine#AnimationLoop redraw', async () => {
  const device = await getWebGLTestDevice();
  let renderCalled = 0;
  new AnimationLoop({
    device,
    onInitialize: async ({
      animationLoop
    }) => {
      animationLoop.redraw();
      animationLoop.stop();
      expect(renderCalled, 'onRender called').toBe(1);
    },
    onRender: () => {
      renderCalled++;
    }
  }).start();
});
test('engine#AnimationLoop should not call initialize more than once', async () => {
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
});
test('engine#AnimationLoop two start()s should only run one loop', async () => {
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
});
test('engine#AnimationLoop start followed immediately by stop() should stop', async () => {
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
});
test('engine#AnimationLoop a start/stop/start should not call initialize again', async () => {
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
  }, 150);
});
test('engine#AnimationLoop GPU timing graceful fallback', async () => {
  const device = await getWebGLTestDevice();
  const animationLoop = new AnimationLoop({
    device
  });
  await animationLoop.start();
  await animationLoop.waitForRender();

  // Stats should exist regardless of timer support
  expect(animationLoop.gpuTime, 'gpuTime stat exists').toBeTruthy();
  expect(animationLoop.cpuTime, 'cpuTime stat exists').toBeTruthy();

  // Device-managed GPU timing should match feature availability
  const hasTimerQuery = device.features.has('timestamp-query') && Boolean(device.props.debug);
  expect(device._isDebugGPUTimeEnabled(), `device GPU timing enabled when feature ${hasTimerQuery ? 'available' : 'unavailable'}`).toBe(hasTimerQuery);
  expect(device.commandEncoder.getTimeProfilingQuerySet()?.props.count || 0, 'timestamp query set pre-allocates slots for profiling passes').toBe(hasTimerQuery ? 256 : 0);

  // Destroy should not throw
  animationLoop.stop();
  animationLoop.destroy();
  expect(device._isDebugGPUTimeEnabled(), 'Query cleaned up on destroy').toBe(false);
});
test('engine#AnimationLoop WebGPU timing path avoids backend casts', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const animationLoop = new AnimationLoop({
    device
  });
  await animationLoop.start();
  await animationLoop.waitForRender();
  expect(animationLoop.gpuTime, 'gpuTime stat exists').toBeTruthy();
  expect(animationLoop.cpuTime, 'cpuTime stat exists').toBeTruthy();
  expect(device._isDebugGPUTimeEnabled(), 'device GPU timing follows timestamp-query support and debug flags').toBe(device.features.has('timestamp-query') && Boolean(device.props.debug));
  animationLoop.stop();
  animationLoop.destroy();
});
test('engine#AnimationLoop debugGPUTime enables GPU timing without full debug', async () => {
  let device: WebGPUDevice | null = null;
  try {
    device = (await luma.createDevice({
      id: 'webgpu-animation-loop-debug-gpu-time',
      type: 'webgpu',
      adapters: [webgpuAdapter],
      createCanvasContext: {
        width: 1,
        height: 1
      },
      debug: false,
      debugGPUTime: true
    })) as WebGPUDevice;
  } catch {
    // Handled below.
  }
  if (!device) {
    return;
  }
  const animationLoop = new AnimationLoop({
    device
  });
  await animationLoop.start();
  await animationLoop.waitForRender();
  expect(device._isDebugGPUTimeEnabled(), 'debugGPUTime enables GPU timing query setup when the feature is available').toBe(device.features.has('timestamp-query'));
  animationLoop.stop();
  animationLoop.destroy();
  device.destroy();
});

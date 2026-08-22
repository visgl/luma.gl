// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebGLTestDevice, getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
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

  let frameRateUpdated = frameRate.lastSampleTime > beforeFrameRate;
  let cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  for (let attempt = 0; (!frameRateUpdated || !cpuTimeUpdated) && attempt < 8; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 16));
    await animationLoop.waitForRender();
    frameRateUpdated = frameRate.lastSampleTime > beforeFrameRate;
    cpuTimeUpdated = customStats.get('CPU Time').lastSampleTime > beforeCpuTime;
  }
  t.ok(frameRateUpdated, 'Frame Rate updates on custom stats object');
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
  device.destroy();
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

  const reportedErrors: Error[] = [];
  const animationLoop = makeAnimationLoop(FailingAnimationLoopTemplate, {
    device,
    onError: error => reportedErrors.push(error)
  });
  let startError: Error | null = null;
  try {
    await animationLoop.start();
  } catch (error) {
    startError = error as Error;
  }

  t.equal(startError?.message, 'Expected initialization failure', 'start preserves the error');
  t.equal(reportedErrors.length, 1, 'initialization failure is reported once');
  t.is(renderCalled, 0, 'onRender is not called after template initialization failure');
  if (typeof document !== 'undefined') {
    const errorDisplay = document.querySelector('[data-luma-error-display="true"]');
    t.ok(errorDisplay, 'fatal error is visible over the canvas');
    t.ok(
      errorDisplay?.textContent?.includes('Expected initialization failure'),
      'error display includes the failure message'
    );
  }
  animationLoop.destroy();
  if (typeof document !== 'undefined') {
    t.notOk(
      document.querySelector('[data-luma-error-display="true"]'),
      'destroy removes the error display'
    );
  }

  t.end();
});

test('engine#AnimationLoop reports device promise rejection to an explicit target', async t => {
  if (typeof document === 'undefined') {
    t.comment('DOM is unavailable');
    t.end();
    return;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const expectedError = new Error('<device creation failed>');
  const animationLoop = new AnimationLoop({
    device: Promise.reject(expectedError),
    errorDisplay: {target: container},
    onError: () => {}
  });

  try {
    await animationLoop.start();
  } catch {
    // Expected failure.
  }

  const errorDisplay = container.querySelector('[data-luma-error-display="true"]');
  t.ok(errorDisplay, 'device creation failure is visible without a resolved device');
  t.ok(
    errorDisplay?.textContent?.includes('<device creation failed>'),
    'error is inserted as text rather than HTML'
  );
  t.notOk(errorDisplay?.querySelector('device'), 'error text did not create markup');

  animationLoop.destroy();
  container.remove();
  t.end();
});

test('engine#AnimationLoop briefly displays asynchronous device errors without stopping', async t => {
  if (typeof document === 'undefined') {
    t.comment('DOM is unavailable');
    t.end();
    return;
  }

  const container = document.createElement('div');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  document.body.appendChild(container);
  const device = new NullDevice({createCanvasContext: {canvas}});
  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();

  device.reportError(new Error('<expected asynchronous GPU error>'), device)();

  const errorMessage = container.querySelector('[data-luma-error-message="true"]');
  t.equal(animationLoop._running, true, 'runtime device error does not stop the animation loop');
  t.ok(errorMessage, 'runtime device error is briefly visible over the canvas');
  t.equal(errorMessage?.getAttribute('role'), 'status', 'message has an accessible status role');
  t.equal(
    errorMessage?.textContent,
    '<expected asynchronous GPU error>',
    'message is inserted as text rather than HTML'
  );
  t.equal(errorMessage?.querySelector('expected'), null, 'message text did not create markup');
  t.ok(
    (errorMessage as HTMLElement | null)?.style.transition.includes('opacity'),
    'message is configured to fade out'
  );
  t.notOk(
    container.querySelector('[data-luma-error-display="true"]'),
    'nonfatal error does not create the fatal overlay'
  );

  animationLoop.destroy();
  t.notOk(
    container.querySelector('[data-luma-error-message="true"]'),
    'destroy removes the transient message'
  );
  container.remove();
  device.destroy();
  t.end();
});

test('engine#AnimationLoop defers runtime device errors to DeviceProps.onError', async t => {
  if (typeof document === 'undefined') {
    t.comment('DOM is unavailable');
    t.end();
    return;
  }

  const container = document.createElement('div');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  document.body.appendChild(container);
  const reportedErrors: Error[] = [];
  const device = new NullDevice({
    createCanvasContext: {canvas},
    onError: error => {
      reportedErrors.push(error);
      return true;
    }
  });
  const animationLoop = new AnimationLoop({device});
  await animationLoop.start();

  const expectedError = new Error('Application-owned device error');
  device.reportError(expectedError, device)();

  t.deepEqual(reportedErrors, [expectedError], 'application device error handler is called');
  t.equal(animationLoop._running, true, 'handled device error keeps rendering');
  t.notOk(
    container.querySelector('[data-luma-error-message="true"]'),
    'application device error handler suppresses the default canvas message'
  );

  animationLoop.destroy();
  container.remove();
  device.destroy();
  t.end();
});

test('engine#makeAnimationLoop exposes the active template instance', async t => {
  const device = await getWebGLTestDevice();

  class InspectableAnimationLoopTemplate extends AnimationLoopTemplate {
    override onRender(): void {}
    override onFinalize(): void {}
  }

  const animationLoop = makeAnimationLoop(InspectableAnimationLoopTemplate, {
    device
  });
  t.is(animationLoop.getAnimationLoopTemplate(), null, 'template is absent before initialization');
  await animationLoop.start();
  t.ok(
    animationLoop.getAnimationLoopTemplate() instanceof InspectableAnimationLoopTemplate,
    'initialized template is exposed'
  );
  animationLoop.destroy();
  t.is(animationLoop.getAnimationLoopTemplate(), null, 'finalized template is no longer exposed');
  t.end();
});

test('engine#makeAnimationLoop runs onAfterRender before device submission', async t => {
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
    t.deepEqual(
      frameStages,
      ['template-render', 'after-render', 'device-submit'],
      'post-render hook runs while the frame command encoder is still open'
    );
  } finally {
    animationLoop.destroy();
    device.submit = originalSubmit;
  }
  t.end();
});

test('engine#makeAnimationLoop skips device submission when a frame is idle', async t => {
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
    t.is(submissionCount, 0, 'idle frame does not submit an empty command buffer');
  } finally {
    animationLoop.destroy();
    device.submit = originalSubmit;
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

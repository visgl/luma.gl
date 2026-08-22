// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {nullAdapter} from '@luma.gl/test-utils';
import {Adapter, DeviceCreationError, luma, type Device, type DeviceProps} from '@luma.gl/core';

class RecordingAdapter extends Adapter {
  readonly calls: DeviceProps[] = [];
  supported = true;

  constructor(
    readonly type: string,
    private readonly createImplementation: (props: DeviceProps) => Promise<Device>
  ) {
    super();
  }

  isSupported(): boolean {
    return this.supported;
  }

  isDeviceHandle(): boolean {
    return false;
  }

  async create(props: DeviceProps): Promise<Device> {
    this.calls.push(props);
    return await this.createImplementation(props);
  }

  async attach(): Promise<Device> {
    throw new Error('Not implemented');
  }
}

async function createNullDevice(props: DeviceProps): Promise<Device> {
  const device = await nullAdapter.create({...props, createCanvasContext: true});
  device.info.gpu = 'unknown';
  return device;
}

test('luma#attachDevice', async t => {
  const device = await luma.attachDevice(null, {adapters: [nullAdapter]});
  t.equal(device.type, 'null', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});

test('luma#attachDevice forwards canvas context compatibility props', async t => {
  const device = await luma.attachDevice(null, {
    adapters: [nullAdapter],
    createCanvasContext: {pixelSizeSource: 'css-dpr'}
  });
  t.equal(device.getDefaultCanvasContext().props.pixelSizeSource, 'css-dpr', 'pixelSizeSource ok');
  t.end();
});

test('luma#createDevice', async t => {
  const device = await luma.createDevice({type: 'null', adapters: [nullAdapter]});
  t.equal(device.type, 'null', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});

test('luma#createDevice best-available retries actual creation before WebGL', async t => {
  const webgpuAdapter = new RecordingAdapter('webgpu', async props => {
    throw new Error(`Rejected ${props.featureLevel}`);
  });
  const webglAdapter = new RecordingAdapter('webgl', createNullDevice);

  const device = await luma.createDevice({
    type: 'best-available',
    adapters: [webgpuAdapter, webglAdapter],
    waitForPageLoad: false
  });

  t.deepEqual(
    webgpuAdapter.calls.map(call => call.featureLevel),
    ['core', 'compatibility'],
    'core and compatibility are attempted in order'
  );
  t.equal(webglAdapter.calls.length, 1, 'WebGL is attempted after hardware WebGPU');
  t.equal(device.creationInfo.attempts.length, 2, 'failed attempts are retained on success');
  t.equal(device.creationInfo.selected?.backend, 'webgl', 'selected backend is recorded');
  device.destroy();
  t.end();
});

test('luma#createDevice uses compatibility WebGPU after a core creation failure', async t => {
  const webgpuAdapter = new RecordingAdapter('webgpu', async props => {
    if (props.featureLevel === 'core') {
      throw new Error('Core device request failed');
    }
    return await createNullDevice(props);
  });
  const webglAdapter = new RecordingAdapter('webgl', createNullDevice);

  const device = await luma.createDevice({
    type: 'best-available',
    adapters: [webgpuAdapter, webglAdapter],
    waitForPageLoad: false
  });

  t.deepEqual(
    webgpuAdapter.calls.map(call => call.featureLevel),
    ['core', 'compatibility'],
    'compatibility follows core'
  );
  t.equal(webglAdapter.calls.length, 0, 'successful compatibility does not attempt WebGL');
  t.equal(device.creationInfo.attempts.length, 1, 'the recovered core failure is retained');
  device.destroy();
  t.end();
});

test('luma#createDevice best-available-webgpu uses software last and never WebGL', async t => {
  const webgpuAdapter = new RecordingAdapter('webgpu', async props => {
    if (!props._forceFallbackAdapter) {
      throw new Error(`Rejected ${props.featureLevel}`);
    }
    return await createNullDevice(props);
  });
  const webglAdapter = new RecordingAdapter('webgl', createNullDevice);

  const device = await luma.createDevice({
    type: 'best-available-webgpu',
    adapters: [webgpuAdapter, webglAdapter],
    waitForPageLoad: false
  });

  t.deepEqual(
    webgpuAdapter.calls.map(call => [call.featureLevel, call._forceFallbackAdapter]),
    [
      ['core', false],
      ['compatibility', false],
      ['compatibility', true]
    ],
    'software compatibility WebGPU is the final attempt'
  );
  t.equal(webglAdapter.calls.length, 0, 'WebGL is never attempted');
  t.equal(device.creationInfo.selected?.software, true, 'software selection is recorded');
  device.destroy();
  t.end();
});

test('luma#createDevice explicit backends stay strict', async t => {
  const webgpuAdapter = new RecordingAdapter('webgpu', async () => {
    throw new Error('Strict WebGPU failure');
  });
  const webglAdapter = new RecordingAdapter('webgl', createNullDevice);

  let error: unknown;
  try {
    await luma.createDevice({
      type: 'webgpu',
      adapters: [webgpuAdapter, webglAdapter],
      waitForPageLoad: false
    });
  } catch (caughtError) {
    error = caughtError;
  }

  t.ok(error instanceof DeviceCreationError, 'strict failure is structured');
  t.equal(webgpuAdapter.calls.length, 1, 'strict WebGPU is attempted once');
  t.equal(webglAdapter.calls.length, 0, 'strict WebGPU does not fall back');
  t.end();
});

test('luma#createDevice major performance caveat suppresses software WebGPU', async t => {
  const webgpuAdapter = new RecordingAdapter('webgpu', async () => {
    throw new Error('Hardware unavailable');
  });

  let error: DeviceCreationError | null = null;
  try {
    await luma.createDevice({
      type: 'best-available-webgpu',
      adapters: [webgpuAdapter],
      failIfMajorPerformanceCaveat: true,
      waitForPageLoad: false
    });
  } catch (caughtError) {
    error = caughtError as DeviceCreationError;
  }

  t.ok(error instanceof DeviceCreationError, 'final failure is structured');
  t.deepEqual(
    webgpuAdapter.calls.map(call => call._forceFallbackAdapter),
    [false, false],
    'software request is suppressed'
  );
  t.equal(error?.attempts.length, 2, 'both hardware failures are retained');
  t.end();
});

test('luma#createDevice honors max and compatibility policy starting points', async t => {
  const maxAdapter = new RecordingAdapter('webgpu', async props => {
    if (props.featureLevel !== 'compatibility') {
      throw new Error(`${props.featureLevel} unavailable`);
    }
    return await createNullDevice(props);
  });
  const maxDevice = await luma.createDevice({
    type: 'best-available-webgpu',
    featureLevel: 'max',
    adapters: [maxAdapter],
    waitForPageLoad: false
  });
  t.deepEqual(
    maxAdapter.calls.map(call => call.featureLevel),
    ['max', 'core', 'compatibility'],
    'max degrades through core to compatibility'
  );
  maxDevice.destroy();

  const compatibilityAdapter = new RecordingAdapter('webgpu', createNullDevice);
  const compatibilityDevice = await luma.createDevice({
    type: 'best-available-webgpu',
    featureLevel: 'compatibility',
    adapters: [compatibilityAdapter],
    waitForPageLoad: false
  });
  t.deepEqual(
    compatibilityAdapter.calls.map(call => call.featureLevel),
    ['compatibility'],
    'compatibility starts and succeeds at compatibility'
  );
  compatibilityDevice.destroy();
  t.end();
});

test('luma#createDevice does not select an incidental software adapter as hardware', async t => {
  const container = document.createElement('div');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  document.body.appendChild(container);
  const requestedCanvases: HTMLCanvasElement[] = [];
  const webgpuAdapter = new RecordingAdapter('webgpu', async props => {
    requestedCanvases.push((props.createCanvasContext as {canvas: HTMLCanvasElement}).canvas);
    const device = await createNullDevice(props);
    (device.info as {fallback?: boolean}).fallback = true;
    return device;
  });
  const webglAdapter = new RecordingAdapter('webgl', async props => {
    requestedCanvases.push((props.createCanvasContext as {canvas: HTMLCanvasElement}).canvas);
    return await createNullDevice(props);
  });

  const device = await luma.createDevice({
    type: 'best-available',
    adapters: [webgpuAdapter, webglAdapter],
    createCanvasContext: {canvas},
    _canvasContextOwned: true,
    waitForPageLoad: false
  });

  t.equal(webgpuAdapter.calls.length, 2, 'both hardware profiles reject software devices');
  const [firstCanvas, secondCanvas, webglCanvas] = requestedCanvases;
  t.notEqual(firstCanvas, secondCanvas, 'core rejection replaces the owned canvas');
  t.notEqual(secondCanvas, webglCanvas, 'compatibility rejection replaces the owned canvas');
  t.equal(webglCanvas.parentElement, container, 'WebGL receives the visible replacement canvas');
  t.equal(device.creationInfo.selected?.backend, 'webgl', 'broad fallback prefers WebGL');
  t.equal(device.creationInfo.attempts.length, 2, 'software detections are diagnostic attempts');
  device.destroy();
  container.remove();
  t.end();
});

test('luma#createDevice preserves native attempt phases and causes', async t => {
  const nativeError = new Error('Native requestDevice rejection');
  const webgpuAdapter = new RecordingAdapter('webgpu', async () => {
    throw new DeviceCreationError(
      'Native WebGPU failure',
      [
        {
          backend: 'webgpu',
          featureLevel: 'core',
          software: false,
          phase: 'device-request',
          error: nativeError
        }
      ],
      nativeError
    );
  });

  let error: DeviceCreationError | null = null;
  try {
    await luma.createDevice({
      type: 'webgpu',
      adapters: [webgpuAdapter],
      waitForPageLoad: false
    });
  } catch (caughtError) {
    error = caughtError as DeviceCreationError;
  }

  t.equal(error?.phase, 'device-request', 'the adapter phase is retained');
  t.equal(error?.attempts[0]?.error, nativeError, 'the native error is retained');
  t.equal(error?.cause, nativeError, 'the final cause is the native error');
  t.end();
});

test('luma#createDevice records unavailable adapters without calling create', async t => {
  const webgpuAdapter = new RecordingAdapter('webgpu', createNullDevice);
  webgpuAdapter.supported = false;

  let error: DeviceCreationError | null = null;
  try {
    await luma.createDevice({
      type: 'webgpu',
      adapters: [webgpuAdapter],
      waitForPageLoad: false
    });
  } catch (caughtError) {
    error = caughtError as DeviceCreationError;
  }

  t.equal(webgpuAdapter.calls.length, 0, 'unsupported adapters are not invoked');
  t.equal(error?.phase, 'adapter-selection', 'adapter unavailability has an exact phase');
  t.end();
});

test('luma#registerAdapters', async t => {
  luma.registerAdapters([nullAdapter]);
  const device = await luma.createDevice({type: 'null'});
  t.equal(device.type, 'null', 'info.vendor ok');
  t.equal(device.info.vendor, 'no one', 'info.vendor ok');
  t.equal(device.info.renderer, 'none', 'info.renderer ok');
  t.end();
});

test('luma#getSupportedAdapters', async t => {
  luma.registerAdapters([nullAdapter]);
  const types = luma.getSupportedAdapters();
  t.ok(types.includes('null'), 'null device is supported');
});

test('luma#getBestAvailableAdapterType', async t => {
  luma.registerAdapters([nullAdapter]);
  // Somewhat dummy test, as tests rely on test utils registering webgl and webgpu devices
  // But they might not be supported on all devices.
  const type = luma.getBestAvailableAdapterType();
  t.ok(typeof type === 'string', 'does not crash');
});

// To suppress @typescript-eslint/unbound-method
interface TestHTMLCanvasElement {
  getContext: (contextId: any, options?: unknown) => string;
  originalGetContext?: (contextId: any, options?: unknown) => unknown;
}

test('luma#enforceWebGL2', async t => {
  const prototype = HTMLCanvasElement.prototype as unknown as TestHTMLCanvasElement;

  // Setup mock getContext
  const originalGetContext = prototype.getContext;
  prototype.getContext = function (contextId: any, options?: unknown) {
    return `${contextId}-mock`;
  };
  // Revert mock test completes.
  t.teardown(() => {
    prototype.getContext = originalGetContext;
  });

  t.equal(prototype.getContext('webgl'), 'webgl-mock', 'mocked getContext webgl ok');
  t.equal(
    prototype.getContext('experimental-webgl'),
    'experimental-webgl-mock',
    'mocked getContext experimental-webgl ok'
  );
  t.equal(prototype.getContext('webgl2'), 'webgl2-mock', 'mocked getContext webgl2 ok');

  luma.enforceWebGL2();

  t.true(prototype.originalGetContext, 'originalGetContext ok');
  t.equal(prototype.getContext('webgl'), 'webgl2-mock', 'getContext enforce webgl2 ok');
  t.equal(
    prototype.getContext('experimental-webgl'),
    'webgl2-mock',
    'getContext enforce webgl2 ok'
  );
  t.equal(prototype.getContext('webgl2'), 'webgl2-mock', 'getContext webgl2 ok');

  luma.enforceWebGL2(false);

  t.false(prototype.originalGetContext, 'originalGetContext ok');
  t.equal(prototype.getContext('webgl'), 'webgl-mock', 'mocked getContext revert webgl ok');
  t.equal(
    prototype.getContext('experimental-webgl'),
    'experimental-webgl-mock',
    'mocked getContext revert experimental-webgl ok'
  );
  t.equal(prototype.getContext('webgl2'), 'webgl2-mock', 'mocked getContext webgl2 ok');

  t.end();
});

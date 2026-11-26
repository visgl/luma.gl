// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {afterEach, describe, expect, test, vi} from 'vitest';
import {
  BackendRegistry,
  backendRegistry,
  type BackendModule
} from '../../src/gpu-simple-graph/operation/backend-registry';
import {convertColors} from '../../src/gpu-simple-graph/operations/webgpu/convert-colors';
import * as cpuBackend from '../../src/gpu-simple-graph/operations/cpu/index';
import * as webgpuBackend from '../../src/gpu-simple-graph/operations/webgpu/index';
import * as webglBackend from '../../src/gpu-simple-graph/operations/webgl/index';

afterEach(async () => {
  backendRegistry.clear();
  await backendRegistry.add('cpu', cpuBackend);
});

for (const [deviceType, defaultBackend] of [
  ['webgpu', webgpuBackend],
  ['webgl', webglBackend]
] as const) {
  test(`${deviceType} partial registrations preserve built-in handlers and custom overrides`, async () => {
    const customInterleave = vi.fn();
    await backendRegistry.add(deviceType, {interleave: customInterleave});

    expect(await backendRegistry.get(deviceType, 'interleave')).toBe(customInterleave);
    expect(await backendRegistry.get(deviceType, 'convertColors')).toBe(
      defaultBackend.convertColors
    );
    expect(await backendRegistry.get(deviceType, 'interleave')).toBe(customInterleave);
    await expect(backendRegistry.get(deviceType, 'unknownOperation')).rejects.toThrow(
      `${deviceType} backend does not implement unknownOperation`
    );
  });
}

test('custom backends do not fall back to built-in handlers', async () => {
  await backendRegistry.add('custom', {});
  await expect(backendRegistry.get('custom', 'convertColors')).rejects.toThrow(
    'custom backend does not implement convertColors'
  );
});

describe('BackendRegistry', () => {
  test('loads missing built-ins without replacing a partial registration', async () => {
    const registry = new BackendRegistry();
    const interleave = vi.fn();
    registry.add('webgpu', {interleave});

    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
    expect(() => registry.getSync('webgpu', 'convertColors')).toThrow('does not implement');
    expect(await registry.get('webgpu', 'convertColors')).toBe(convertColors);
    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
    expect(registry.getSync('webgpu', 'convertColors')).toBe(convertColors);
  });

  test('preserves overrides registered while the default backend is loading', async () => {
    const registry = new BackendRegistry();
    const loading = registry.get('webgpu', 'convertColors');
    // Let lookup start the asynchronous backend registration.
    await Promise.resolve();
    const customConvertColors = vi.fn();
    await registry.add('webgpu', {convertColors: customConvertColors});
    await loading;

    expect(registry.getSync('webgpu', 'convertColors')).toBe(customConvertColors);
  });

  test('awaits pending partial registrations before loading missing built-ins', async () => {
    const registry = new BackendRegistry();
    const interleave = vi.fn();
    registry.add('webgpu', Promise.resolve({interleave}));

    expect(await registry.get('webgpu', 'convertColors')).toBe(convertColors);
    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
  });

  test('a later failed registration leaves an earlier handler lookup usable', async () => {
    const registry = new BackendRegistry();
    const handler = vi.fn();
    await registry.add('custom', {handler});
    const lookup = registry.get('custom', 'handler');
    const registration = registry.add('custom', Promise.reject(new Error('registration failed')));
    await expect(registration).rejects.toThrow('registration failed');
    expect(await lookup).toBe(handler);
  });

  test('keeps later registrations pending when an earlier promise resolves', async () => {
    const registry = new BackendRegistry();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    let resolveSecond!: (module: BackendModule) => void;
    const first = registry.add('custom', Promise.resolve({firstHandler}));
    const second = registry.add(
      'custom',
      new Promise<BackendModule>(resolve => {
        resolveSecond = resolve;
      })
    );
    await first;

    expect(() => registry.getSync('custom', 'firstHandler')).toThrow('not loaded yet');
    resolveSecond({secondHandler});
    await second;
    expect(registry.getSync('custom', 'firstHandler')).toBe(firstHandler);
    expect(registry.getSync('custom', 'secondHandler')).toBe(secondHandler);
  });

  test('does not restore cleared entries when a pending registration resolves', async () => {
    const registry = new BackendRegistry();
    const pending = registry.add('custom', Promise.resolve({handler: vi.fn()}));
    registry.clear();
    await pending;

    expect(() => registry.getSync('custom', 'handler')).toThrow('not registered');
  });

  test('does not let an unset optional handler hide the built-in handler', async () => {
    const registry = new BackendRegistry();
    const interleave = vi.fn();
    registry.add('webgpu', {interleave, convertColors: undefined});

    expect(await registry.get('webgpu', 'convertColors')).toBe(convertColors);
    expect(registry.getSync('webgpu', 'convertColors')).toBe(convertColors);
    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
  });

  test('keeps registered handlers visible to getSync while a built-in backend loads', async () => {
    let resolveDefaultModule!: (module: BackendModule) => void;
    const registry = new BackendRegistry({
      defaultModuleLoaders: {
        webgpu: () =>
          new Promise<BackendModule>(resolve => {
            resolveDefaultModule = resolve;
          })
      }
    });
    const interleave = vi.fn();
    const defaultConvertColors = vi.fn();
    registry.add('webgpu', {interleave});

    const loading = registry.get('webgpu', 'convertColors');
    await Promise.resolve();
    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
    resolveDefaultModule({convertColors: defaultConvertColors, interleave: vi.fn()});

    expect(await loading).toBe(defaultConvertColors);
    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
    expect(registry.getSync('webgpu', 'convertColors')).toBe(defaultConvertColors);
  });

  test('keeps registered handlers usable after a failed built-in import', async () => {
    const registry = new BackendRegistry({
      defaultModuleLoaders: {webgpu: () => Promise.reject(new Error('import failed'))}
    });
    const interleave = vi.fn();
    registry.add('webgpu', {interleave});

    await expect(registry.get('webgpu', 'convertColors')).rejects.toThrow('import failed');
    expect(registry.getSync('webgpu', 'interleave')).toBe(interleave);
    expect(await registry.get('webgpu', 'interleave')).toBe(interleave);
  });

  test('keeps an add() made right after the built-in import resolves', async () => {
    const {registry, defaultModule, resolveDefaultModule} = createDeferredDefaultRegistry();
    registry.add('webgpu', {interleave: vi.fn()});
    const loading = registry.get('webgpu', 'convertColors');
    // Let get() reach the pending import.
    await new Promise(resolve => setTimeout(resolve, 0));
    const custom = vi.fn();
    // Runs one microtask after get() resumes from the import.
    defaultModule.then(() => registry.add('webgpu', {custom}));
    resolveDefaultModule({convertColors: vi.fn()});
    await loading;

    expect(registry.getSync('webgpu', 'custom')).toBe(custom);
  });

  test('keeps a clear() made right after the built-in import resolves', async () => {
    const {registry, defaultModule, resolveDefaultModule} = createDeferredDefaultRegistry();
    registry.add('webgpu', {interleave: vi.fn()});
    const loading = registry.get('webgpu', 'convertColors');
    // Let get() reach the pending import.
    await new Promise(resolve => setTimeout(resolve, 0));
    // Runs one microtask after get() resumes from the import.
    defaultModule.then(() => registry.clear());
    resolveDefaultModule({convertColors: vi.fn()});
    await loading;

    expect(() => registry.getSync('webgpu', 'interleave')).toThrow();
  });

  test('shares concurrent built-in loads and retries after failure', async () => {
    const handler = vi.fn();
    const load = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValue({handler});
    const registry = new BackendRegistry({defaultModuleLoaders: {webgpu: load}});
    const results = await Promise.allSettled([
      registry.get('webgpu', 'handler'),
      registry.get('webgpu', 'handler')
    ]);
    expect(results.map(result => result.status)).toEqual(['rejected', 'rejected']);
    expect(load).toHaveBeenCalledTimes(1);
    expect(await registry.get('webgpu', 'handler')).toBe(handler);
    expect(registry.getSync('webgpu', 'handler')).toBe(handler);
    expect(load).toHaveBeenCalledTimes(2);
  });

  test('a cleared import finishes without populating the new registry', async () => {
    const {registry, resolveDefaultModule} = createDeferredDefaultRegistry();
    const loading = registry.get('webgpu', 'convertColors');
    await Promise.resolve();
    registry.clear();
    const handler = vi.fn();
    await registry.add('webgpu', {custom: handler});
    resolveDefaultModule({convertColors});
    expect(await loading).toBe(convertColors);
    expect(() => registry.getSync('webgpu', 'convertColors')).toThrow('does not implement');
    expect(registry.getSync('webgpu', 'custom')).toBe(handler);
  });

  test('reports missing custom backends and unimplemented operations', async () => {
    const registry = new BackendRegistry();
    await expect(registry.get('custom', 'missing')).rejects.toThrow('not registered');
    await expect(registry.get('webgpu', 'missing')).rejects.toThrow('does not implement');
  });
});

/** Creates a registry whose WebGPU built-in import resolves when the test calls the resolver. */
function createDeferredDefaultRegistry() {
  let resolveDefaultModule!: (module: BackendModule) => void;
  const defaultModule = new Promise<BackendModule>(resolve => {
    resolveDefaultModule = resolve;
  });
  const registry = new BackendRegistry({defaultModuleLoaders: {webgpu: () => defaultModule}});
  return {registry, defaultModule, resolveDefaultModule};
}

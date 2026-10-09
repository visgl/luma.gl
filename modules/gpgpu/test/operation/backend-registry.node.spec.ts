// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {BackendRegistry, type BackendModule} from '../../src/operation/backend-registry';
import {convertColors} from '../../src/operations/webgpu/convert-colors';

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

  test('reports missing custom backends and unimplemented operations', async () => {
    const registry = new BackendRegistry();
    await expect(registry.get('custom', 'missing')).rejects.toThrow('not registered');
    await expect(registry.get('webgpu', 'missing')).rejects.toThrow('does not implement');
  });
});

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import path from 'node:path';
import {buildSync} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, test} from 'vitest';
import {
  getMobileExamplePixelRatio,
  isMobileExampleViewport
} from '../../website/src/react-luma/utils/mobile-example-pixel-ratio';

describe('example graphics backend tab semantics', () => {
  test('renders native, labeled tabs with backend capability badges', () => {
    const html = renderBackendTabs();

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="Graphics backend"');
    expect(html).toContain('<button type="button" role="tab"');
    expect(html).toContain('data-luma-device-tab="webgpu-core"');
    expect(html).toContain('data-luma-device-tab-selected="true"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('CORE');
  });

  test('marks unsupported backends natively disabled and preserves their status badge', () => {
    const html = renderBackendTabs();

    expect(html).toContain('data-luma-device-tab="webgl"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('N/A');
  });

  test('keeps only the selected, enabled backend in the document tab order', () => {
    const html = renderBackendTabs('webgpu-max');

    expect(getBackendTabMarkup(html, 'webgpu-core')).toContain('tabindex="-1"');
    expect(getBackendTabMarkup(html, 'webgpu-max')).toContain('tabindex="0"');
    expect(getBackendTabMarkup(html, 'webgl')).toContain('tabindex="-1"');
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });

  test('never puts a disabled selected backend in the document tab order', () => {
    const html = renderBackendTabs('webgl');

    expect(getBackendTabMarkup(html, 'webgl')).toContain('tabindex="-1"');
    expect(html).not.toContain('tabindex="0"');
  });
});

describe('compact example graphics backend selection', () => {
  test('keeps a labeled native picker alongside desktop backend tabs', () => {
    const html = renderDevicePicker();

    expect(html).toContain('data-luma-device-tabs=""');
    expect(html).toContain('data-luma-device-menu=""');
    expect(html).toContain('data-luma-device-menu-indicator=""');
    expect(html).toContain('<select aria-label="Graphics backend"');
    expect(html).toContain('data-luma-device-select=""');
    expect(html).toContain('<option value="webgpu-core" selected="">WebGPU CORE</option>');
    expect(html).toContain('<option value="webgpu-max">WebGPU MAX</option>');
    expect(html).toContain('<option value="webgpu-compatibility">WebGPU COMPAT</option>');
    expect(html).toContain('<option value="webgl">WebGL2</option>');
  });
});

describe('high-density mobile example rendering', () => {
  test('recognizes responsive mobile examples consistently across their shared controls', () => {
    const matchedQueries: string[] = [];
    const viewport = {
      matchMedia: (query: string) => {
        matchedQueries.push(query);
        return {matches: true} as MediaQueryList;
      }
    };

    expect(isMobileExampleViewport(viewport)).toBe(true);
    expect(matchedQueries).toEqual([
      '(max-width: 700px), (max-height: 500px) and (pointer: coarse)'
    ]);
    expect(isMobileExampleViewport({matchMedia: () => ({matches: false}) as MediaQueryList})).toBe(
      false
    );
  });

  test('keeps desktop and ordinary-density phones at exact native resolution', () => {
    expect(
      getMobileExamplePixelRatio({
        devicePixelRatio: 3,
        height: 900,
        mobile: false,
        width: 1440
      })
    ).toBe(true);
    expect(
      getMobileExamplePixelRatio({
        devicePixelRatio: 2,
        height: 844,
        mobile: true,
        width: 390
      })
    ).toBe(true);
    expect(
      getMobileExamplePixelRatio({
        devicePixelRatio: 3,
        height: 300,
        mobile: true,
        width: 200
      })
    ).toBe(true);
  });

  test('prevents large 3x phone canvases from exhausting tab memory', () => {
    expect(
      getMobileExamplePixelRatio({
        devicePixelRatio: 3,
        height: 844,
        mobile: true,
        width: 390
      })
    ).toBe(2);

    const largePhonePixelRatio = getMobileExamplePixelRatio({
      devicePixelRatio: 3,
      height: 1000,
      mobile: true,
      width: 700
    });
    expect(largePhonePixelRatio).toBeGreaterThanOrEqual(1);
    expect(largePhonePixelRatio).toBeLessThan(2);
    expect(700 * 1000 * Number(largePhonePixelRatio) ** 2).toBeCloseTo(1_500_000, 5);
  });
});

function renderBackendTabs(selectedItem: string = 'webgpu-core'): string {
  const build = buildSync({
    entryPoints: [path.join(process.cwd(), 'website/src/react-luma/components/tabs.jsx')],
    outdir: path.join(process.cwd(), '.luma-device-tabs-memory'),
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    external: ['react', 'clsx']
  });
  const javascript = build.outputFiles.find(output => output.path.endsWith('.js'));
  if (!javascript) {
    throw new Error('Expected an in-memory graphics-backend tab bundle.');
  }

  const require = createRequire(import.meta.url);
  const bundledModule: {exports: Record<string, React.ComponentType<any>>} = {exports: {}};
  new Function('require', 'module', 'exports', javascript.text)(
    require,
    bundledModule,
    bundledModule.exports
  );
  const {Tab, Tabs} = bundledModule.exports;

  return renderToStaticMarkup(
    React.createElement(
      Tabs,
      {label: 'Graphics backend', selectedItem},
      React.createElement(Tab, {
        key: 'webgpu-core',
        title: 'WebGPU',
        tag: 'webgpu-core',
        badge: 'CORE'
      }),
      React.createElement(Tab, {
        key: 'webgpu-max',
        title: 'WebGPU',
        tag: 'webgpu-max',
        badge: 'MAX'
      }),
      React.createElement(Tab, {
        key: 'webgl',
        title: 'WebGL2',
        tag: 'webgl',
        disabled: true,
        unavailableBadge: 'N/A'
      })
    )
  );
}

function renderDevicePicker(): string {
  const build = buildSync({
    entryPoints: [path.join(process.cwd(), 'website/src/react-luma/components/device-tabs.tsx')],
    outdir: path.join(process.cwd(), '.luma-device-picker-memory'),
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    external: [
      'react',
      'clsx',
      '@docusaurus/BrowserOnly',
      '../store/device-store',
      '../../../../examples/example-theme'
    ]
  });
  const javascript = build.outputFiles.find(output => output.path.endsWith('.js'));
  if (!javascript) {
    throw new Error('Expected an in-memory compact graphics-backend picker bundle.');
  }

  const require = createRequire(import.meta.url);
  const bundledModule: {exports: Record<string, React.ComponentType<any>>} = {exports: {}};
  const requireTestDependency = (dependency: string): unknown => {
    if (dependency === '@docusaurus/BrowserOnly') {
      return {default: ({children}: {children: () => React.ReactNode}) => children()};
    }
    if (dependency === '../store/device-store') {
      return {
        canCreateDeviceType: async () => true,
        useStore: (selector: (state: Record<string, unknown>) => unknown) =>
          selector({
            deviceType: 'webgpu-core',
            deviceError: null,
            setDeviceType: async () => undefined
          })
      };
    }
    if (dependency === '../../../../examples/example-theme') {
      return {applyExampleTheme: () => undefined};
    }
    return require(dependency);
  };

  new Function('require', 'module', 'exports', javascript.text)(
    requireTestDependency,
    bundledModule,
    bundledModule.exports
  );
  return renderToStaticMarkup(React.createElement(bundledModule.exports.DeviceTabsPriv));
}

function getBackendTabMarkup(html: string, backend: string): string {
  const buttonMarkup = html.match(
    new RegExp(`<button[^>]*data-luma-device-tab="${backend}"[^>]*>`)
  );
  expect(buttonMarkup).not.toBeNull();
  return buttonMarkup?.[0] || '';
}

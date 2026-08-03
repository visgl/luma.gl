// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import path from 'node:path';
import {buildSync} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, test} from 'vitest';

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

function renderBackendTabs(selectedItem: string = 'webgpu-core'): string {
  const build = buildSync({
    entryPoints: [path.join(process.cwd(), 'website/src/react-luma/components/tabs.jsx')],
    outdir: path.join(process.cwd(), '.luma-device-tabs-memory'),
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
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

function getBackendTabMarkup(html: string, backend: string): string {
  const buttonMarkup = html.match(
    new RegExp(`<button[^>]*data-luma-device-tab="${backend}"[^>]*>`)
  );
  expect(buttonMarkup).not.toBeNull();
  return buttonMarkup?.[0] || '';
}

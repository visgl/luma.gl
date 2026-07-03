// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {isBrowser} from '@probe.gl/env';
import FontAtlasManager, {type FontSettings} from '../../src/text-2d/atlas/font-atlas-manager';

function createImageData(width: number, height: number): ImageData {
  return new ImageData(width, height);
}

function hideOffscreenCanvas(): () => void {
  const globalObject = globalThis as typeof globalThis & {
    OffscreenCanvas?: typeof OffscreenCanvas;
  };
  return replaceGlobalValue(globalObject, 'OffscreenCanvas', undefined);
}

function replaceGlobalValue<TObject extends object, TKey extends PropertyKey>(
  object: TObject,
  key: TKey,
  value: unknown
): () => void {
  const previousDescriptor = Object.getOwnPropertyDescriptor(object, key);
  Object.defineProperty(object, key, {
    configurable: true,
    enumerable: previousDescriptor?.enumerable ?? true,
    writable: true,
    value
  });
  return () => restoreObjectDescriptor(object, key, previousDescriptor);
}

function restoreObjectDescriptor<TObject extends object, TKey extends PropertyKey>(
  object: TObject,
  key: TKey,
  previousDescriptor?: PropertyDescriptor
): void {
  if (previousDescriptor) {
    Object.defineProperty(object, key, previousDescriptor);
    return;
  }
  delete (object as TObject & Record<TKey, unknown>)[key];
}

function createFontSettings(fontFamily: string, props: FontSettings = {}): FontSettings {
  return {
    fontFamily,
    fontSize: 16,
    buffer: 2,
    characterSet: 'AB',
    ...props
  };
}

test('FontAtlasManager prefers OffscreenCanvas and records rebuild metrics', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const manager = new FontAtlasManager();
  manager.setProps(createFontSettings('font-atlas-offscreen'));

  t.ok(manager.atlas?.pages[0] instanceof OffscreenCanvas, 'OffscreenCanvas backs the atlas');
  t.equal(manager.metrics?.cacheStatus, 'rebuild', 'first atlas build is a rebuild');
  t.equal(manager.metrics?.usedOffscreenCanvas, true, 'metrics report the selected backend');
  t.equal(manager.metrics?.glyphCount, 2, 'metrics report processed glyph count');
  t.ok((manager.metrics?.totalBuildTimeMs ?? -1) >= 0, 'total build time is recorded');
  t.ok((manager.metrics?.mappingBuildTimeMs ?? -1) >= 0, 'mapping build time is recorded');
  t.end();
});

test('FontAtlasManager falls back to DOM canvas and reports cache hits', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const restoreGlobals = hideOffscreenCanvas();
  try {
    const manager = new FontAtlasManager();
    const props = createFontSettings('font-atlas-dom-cache');
    manager.setProps(props);
    const cachedManager = new FontAtlasManager();
    cachedManager.setProps(props);

    t.ok(cachedManager.atlas?.pages[0] instanceof HTMLCanvasElement, 'DOM canvas backs the atlas');
    t.equal(
      cachedManager.metrics?.cacheStatus,
      'hit',
      'repeat font settings reuse the cached atlas'
    );
    t.equal(
      cachedManager.metrics?.usedOffscreenCanvas,
      false,
      'metrics report DOM canvas fallback'
    );
    t.equal(cachedManager.metrics?.totalBuildTimeMs, 0, 'cache hits avoid rebuild work');
    t.equal(cachedManager.metrics?.glyphCount, 0, 'cache hits process no new glyphs');
    t.equal(
      cachedManager.buildMetrics?.cacheStatus,
      'rebuild',
      'last real build metrics survive cache hits on fresh managers'
    );
    t.end();
  } finally {
    restoreGlobals();
  }
});

test('FontAtlasManager reports incremental extensions and bitmap timing', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const manager = new FontAtlasManager();
  manager.setProps(createFontSettings('font-atlas-incremental', {characterSet: 'AB'}));
  manager.setProps(createFontSettings('font-atlas-incremental', {characterSet: 'ABC'}));

  t.equal(manager.metrics?.cacheStatus, 'incremental', 'new glyphs extend the cached atlas');
  t.equal(manager.metrics?.glyphCount, 1, 'only newly requested glyphs are processed');
  t.equal(manager.metrics?.sdfGenerationTimeMs, 0, 'bitmap atlases report neutral SDF time');
  t.ok((manager.metrics?.bitmapDrawTimeMs ?? -1) >= 0, 'bitmap draw time is recorded');
  t.end();
});

test('FontAtlasManager exposes SDF timing with a custom renderer', t => {
  if (!isBrowser()) {
    t.end();
    return;
  }

  const manager = new FontAtlasManager();
  manager.setProps({
    ...createFontSettings('font-atlas-sdf', {sdf: true}),
    getFontRenderer: () => ({
      measure: () => ({advance: 8, width: 8, ascent: 10, descent: 2}),
      draw: () => ({data: createImageData(12, 12), left: 2, top: 2})
    })
  });

  t.equal(manager.metrics?.cacheStatus, 'rebuild', 'SDF atlas still reports a rebuild');
  t.ok((manager.metrics?.sdfGenerationTimeMs ?? -1) >= 0, 'SDF generation timing is present');
  t.ok((manager.metrics?.bitmapDrawTimeMs ?? -1) >= 0, 'bitmap upload timing is present');
  t.end();
});

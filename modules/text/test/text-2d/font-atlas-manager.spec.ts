// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import FontAtlasManager, {type FontSettings} from '../../src/text-2d/font-atlas-manager';

type CanvasContextStub = {
  font: string;
  fillStyle: string;
  textBaseline: CanvasTextBaseline;
  textAlign: CanvasTextAlign;
  measureText: (character: string) => TextMetrics;
  fillText: (character: string, x: number, y: number) => void;
  getImageData: (x: number, y: number, width: number, height: number) => ImageData;
  putImageData: (
    imageData: ImageData,
    dx: number,
    dy: number,
    dirtyX?: number,
    dirtyY?: number,
    dirtyWidth?: number,
    dirtyHeight?: number
  ) => void;
};

class CanvasStub {
  width: number;
  height: number;
  readonly context = createContextStub();

  constructor(width = 0, height = 0) {
    this.width = width;
    this.height = height;
  }

  getContext(): CanvasContextStub {
    return this.context;
  }
}

class OffscreenCanvasStub extends CanvasStub {}

function createContextStub(): CanvasContextStub {
  return {
    font: '',
    fillStyle: '',
    textBaseline: 'alphabetic',
    textAlign: 'left',
    measureText: (character: string) =>
      ({
        width: character.length * 8,
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 2,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: character.length * 8,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 2
      }) as TextMetrics,
    fillText: () => {},
    getImageData: (_x: number, _y: number, width: number, height: number) =>
      createImageData(width, height),
    putImageData: () => {}
  };
}

function createImageData(width: number, height: number): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height
  } as ImageData;
}

function installCanvasGlobals({
  useOffscreenCanvas,
  useDocumentCanvas
}: {
  useOffscreenCanvas: boolean;
  useDocumentCanvas: boolean;
}): () => void {
  const globalObject = globalThis as typeof globalThis & {
    OffscreenCanvas?: typeof OffscreenCanvas;
    document?: Document;
  };
  const previousOffscreenCanvas = globalObject.OffscreenCanvas;
  const previousDocument = globalObject.document;

  if (useOffscreenCanvas) {
    globalObject.OffscreenCanvas = OffscreenCanvasStub as unknown as typeof OffscreenCanvas;
  } else {
    delete globalObject.OffscreenCanvas;
  }
  if (useDocumentCanvas) {
    globalObject.document = {
      createElement: () => new CanvasStub() as unknown as HTMLCanvasElement
    } as Document;
  } else {
    delete globalObject.document;
  }

  return () => {
    if (previousOffscreenCanvas) {
      globalObject.OffscreenCanvas = previousOffscreenCanvas;
    } else {
      delete globalObject.OffscreenCanvas;
    }
    if (previousDocument) {
      globalObject.document = previousDocument;
    } else {
      delete globalObject.document;
    }
  };
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
  const restoreGlobals = installCanvasGlobals({useOffscreenCanvas: true, useDocumentCanvas: true});
  try {
    const manager = new FontAtlasManager();
    manager.setProps(createFontSettings('font-atlas-offscreen'));

    t.ok(manager.atlas?.data instanceof OffscreenCanvasStub, 'OffscreenCanvas backs the atlas');
    t.equal(manager.metrics?.cacheStatus, 'rebuild', 'first atlas build is a rebuild');
    t.equal(manager.metrics?.usedOffscreenCanvas, true, 'metrics report the selected backend');
    t.equal(manager.metrics?.glyphCount, 2, 'metrics report processed glyph count');
    t.ok((manager.metrics?.totalBuildTimeMs ?? -1) >= 0, 'total build time is recorded');
    t.ok((manager.metrics?.mappingBuildTimeMs ?? -1) >= 0, 'mapping build time is recorded');
    t.end();
  } finally {
    restoreGlobals();
  }
});

test('FontAtlasManager falls back to DOM canvas and reports cache hits', t => {
  const restoreGlobals = installCanvasGlobals({useOffscreenCanvas: false, useDocumentCanvas: true});
  try {
    const manager = new FontAtlasManager();
    const props = createFontSettings('font-atlas-dom-cache');
    manager.setProps(props);
    const cachedManager = new FontAtlasManager();
    cachedManager.setProps(props);

    t.ok(cachedManager.atlas?.data instanceof CanvasStub, 'DOM canvas backs the atlas');
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
  const restoreGlobals = installCanvasGlobals({useOffscreenCanvas: true, useDocumentCanvas: false});
  try {
    const manager = new FontAtlasManager();
    manager.setProps(createFontSettings('font-atlas-incremental', {characterSet: 'AB'}));
    manager.setProps(createFontSettings('font-atlas-incremental', {characterSet: 'ABC'}));

    t.equal(manager.metrics?.cacheStatus, 'incremental', 'new glyphs extend the cached atlas');
    t.equal(manager.metrics?.glyphCount, 1, 'only newly requested glyphs are processed');
    t.equal(manager.metrics?.sdfGenerationTimeMs, 0, 'bitmap atlases report neutral SDF time');
    t.ok((manager.metrics?.bitmapDrawTimeMs ?? -1) >= 0, 'bitmap draw time is recorded');
    t.end();
  } finally {
    restoreGlobals();
  }
});

test('FontAtlasManager exposes SDF timing with a custom renderer', t => {
  const restoreGlobals = installCanvasGlobals({useOffscreenCanvas: true, useDocumentCanvas: false});
  try {
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
  } finally {
    restoreGlobals();
  }
});

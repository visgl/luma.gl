// test/texture-memory-layout.tape.ts
import test from 'tape';
import {getTextureImageView, setTextureImageData, textureFormatDecoder} from '../../../src'; // '@luma.gl/core';

const ALIGN_256 = 256;

function makeLayout(opts: {
  format:
    | 'r8unorm'
    | 'rgba8unorm'
    | 'bgra8unorm'
    | 'rgba8uint'
    | 'r16uint'
    | 'rgba16uint'
    | 'rgba16float'
    | 'r32uint'
    | 'rgba32uint'
    | 'r32float'
    | 'rgba32float';
  width: number;
  rows: number;
  layers?: number;
  alignment?: number;
}) {
  const {format, width, rows, layers = 1, alignment = ALIGN_256} = opts;
  const layout = textureFormatDecoder.computeMemoryLayout({
    format,
    width,
    height: rows,
    depth: layers,
    byteAlignment: alignment
  });
  return {layout, format};
}

test('alignment & sizes (rgba8unorm, width=3, rows=2)', t => {
  const {layout} = makeLayout({format: 'rgba8unorm', width: 3, rows: 2});
  t.equal(layout.bytesPerRow, 256, 'bytesPerRow aligned to 256');
  t.equal(layout.bytesPerImage, 256 * 2, 'bytesPerImage = bytesPerRow * rows');
  t.equal(layout.byteLength, 256 * 2 * 1, 'byteLength = bytesPerImage * layers');
  t.equal(layout.rowsPerImage, 2, 'rowsPerImage = 2');
  t.equal(layout.depthOrArrayLayers, 1, 'layers = 1');
  t.end();
});

test('getTextureImageView types & element lengths', t => {
  {
    const {layout} = makeLayout({format: 'rgba8unorm', width: 3, rows: 2});
    const buf = new ArrayBuffer(layout.byteLength);
    const view = getTextureImageView(buf, layout, 'rgba8unorm', 0);
    t.equal(view.constructor.name, 'Uint8Array', 'rgba8unorm -> Uint8Array');
    t.equal(view.length, layout.bytesPerImage / 1, 'elements = bytesPerImage / 1');
  }
  {
    const {layout} = makeLayout({format: 'rgba16float', width: 4, rows: 3});
    const buf = new ArrayBuffer(layout.byteLength);
    const view = getTextureImageView(buf, layout, 'rgba16float', 0);
    t.equal(view.constructor.name, 'Uint16Array', 'rgba16float -> Uint16Array');
    t.equal(view.length, layout.bytesPerImage / 2, 'elements = bytesPerImage / 2');
  }
  {
    const {layout} = makeLayout({format: 'rgba32float', width: 2, rows: 2});
    const buf = new ArrayBuffer(layout.byteLength);
    const view = getTextureImageView(buf, layout, 'rgba32float', 0);
    t.equal(view.constructor.name, 'Float32Array', 'rgba32float -> Float32Array');
    t.equal(view.length, layout.bytesPerImage / 4, 'elements = bytesPerImage / 4');
  }
  t.end();
});

test('multi-layer writes do not bleed across layers (rgba8unorm)', t => {
  const {layout} = makeLayout({format: 'rgba8unorm', width: 2, rows: 2, layers: 2});
  const buf = new ArrayBuffer(layout.byteLength);

  // Write 7s into layer 1
  const v1 = getTextureImageView(buf, layout, 'rgba8unorm', 1) as Uint8Array;
  const data1 = new Uint8Array(v1.length).fill(7);
  setTextureImageData(buf, layout, 'rgba8unorm', data1, 1);

  const v0 = getTextureImageView(buf, layout, 'rgba8unorm', 0) as Uint8Array;

  // Quick spot checks
  t.ok(
    v0.slice(0, 64).every(x => x === 0),
    'layer 0 remains zero-initialized'
  );
  t.ok(
    v1.slice(0, 64).every(x => x === 7),
    'layer 1 filled with 7s'
  );
  t.end();
});

test('setTextureImageData clamps to view length (r8unorm)', t => {
  const {layout} = makeLayout({format: 'r8unorm', width: 4, rows: 1});
  const buf = new ArrayBuffer(layout.byteLength);
  const view = getTextureImageView(buf, layout, 'r8unorm', 0) as Uint8Array;

  const big = new Uint8Array(view.length + 1024).fill(9);
  setTextureImageData(buf, layout, 'r8unorm', big, 0);

  t.ok(
    view.every(x => x === 9),
    'entire view written with 9s'
  );
  t.end();
});

test('no double offset on write (r32float)', t => {
  const {layout} = makeLayout({format: 'r32float', width: 1, rows: 1, layers: 2});
  const buf = new ArrayBuffer(layout.byteLength);

  const layer1 = getTextureImageView(buf, layout, 'r32float', 1) as Float32Array;
  const layer0 = getTextureImageView(buf, layout, 'r32float', 0) as Float32Array;

  const data = new Float32Array(layer1.length);
  data[0] = 1.25;
  data[1] = 2.5;
  setTextureImageData(buf, layout, 'r32float', data, 1);

  t.equal(layer1[0], 1.25, 'layer1 first element matches');
  t.equal(layer1[1], 2.5, 'layer1 second element matches');
  t.equal(layer0[0], 0, 'layer0 unaffected [0]');
  t.equal(layer0[1], 0, 'layer0 unaffected [1]');
  t.end();
});

test('padding: tiny width -> large bytesPerRow; lengths reflect padding (rgba8unorm)', t => {
  const {layout} = makeLayout({format: 'rgba8unorm', width: 1, rows: 3});
  t.equal(layout.bytesPerRow, 256, 'row padded to 256');
  t.equal(layout.bytesPerImage, 256 * 3, 'bytesPerImage = 256 * rows');
  const buf = new ArrayBuffer(layout.byteLength);
  const view = getTextureImageView(buf, layout, 'rgba8unorm', 0) as Uint8Array;
  t.equal(view.length, layout.bytesPerImage, 'Uint8Array length equals bytesPerImage');
  t.end();
});

test('bgra8unorm typed view & length', t => {
  const {layout} = makeLayout({format: 'bgra8unorm', width: 5, rows: 2});
  const buf = new ArrayBuffer(layout.byteLength);
  const view = getTextureImageView(buf, layout, 'bgra8unorm', 0) as Uint8Array;
  t.equal(view.constructor.name, 'Uint8Array', 'bgra8unorm -> Uint8Array');
  t.equal(view.length, layout.bytesPerImage, 'length equals bytesPerImage');
  t.end();
});

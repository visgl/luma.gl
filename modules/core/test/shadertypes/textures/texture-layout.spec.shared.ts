import {expect, test} from 'vitest';
import { getTextureImageView, setTextureImageData, textureFormatDecoder } from '../../../src';
const ALIGN_256 = 256;
function makeLayout(opts: {
  format: 'r8unorm' | 'rgba8unorm' | 'bgra8unorm' | 'rgba8uint' | 'r16uint' | 'rgba16uint' | 'rgba16float' | 'r32uint' | 'rgba32uint' | 'r32float' | 'rgba32float';
  width: number;
  rows: number;
  layers?: number;
  alignment?: number;
}) {
  const {
    format,
    width,
    rows,
    layers = 1,
    alignment = ALIGN_256
  } = opts;
  const layout = textureFormatDecoder.computeMemoryLayout({
    format,
    width,
    height: rows,
    depth: layers,
    byteAlignment: alignment
  });
  return {
    layout,
    format
  };
}
export function registerTextureLayoutTests(): void {
  test('alignment & sizes (rgba8unorm, width=3, rows=2)', () => {
    const {
      layout
    } = makeLayout({
      format: 'rgba8unorm',
      width: 3,
      rows: 2
    });
    expect(layout.bytesPerRow, 'bytesPerRow aligned to 256').toBe(256);
    expect(layout.bytesPerImage, 'bytesPerImage = bytesPerRow * rows').toBe(256 * 2);
    expect(layout.byteLength, 'byteLength = bytesPerImage * layers').toBe(256 * 2 * 1);
    expect(layout.rowsPerImage, 'rowsPerImage = 2').toBe(2);
    expect(layout.depthOrArrayLayers, 'layers = 1').toBe(1);
  });
  test('getTextureImageView types & element lengths', () => {
    {
      const {
        layout
      } = makeLayout({
        format: 'rgba8unorm',
        width: 3,
        rows: 2
      });
      const buf = new ArrayBuffer(layout.byteLength);
      const view = getTextureImageView(buf, layout, 'rgba8unorm', 0);
      expect(view.constructor.name, 'rgba8unorm -> Uint8Array').toBe('Uint8Array');
      expect(view.length, 'elements = bytesPerImage / 1').toBe(layout.bytesPerImage / 1);
    }
    {
      const {
        layout
      } = makeLayout({
        format: 'rgba16float',
        width: 4,
        rows: 3
      });
      const buf = new ArrayBuffer(layout.byteLength);
      const view = getTextureImageView(buf, layout, 'rgba16float', 0);
      expect(view.constructor.name, 'rgba16float -> Uint16Array').toBe('Uint16Array');
      expect(view.length, 'elements = bytesPerImage / 2').toBe(layout.bytesPerImage / 2);
    }
    {
      const {
        layout
      } = makeLayout({
        format: 'rgba32float',
        width: 2,
        rows: 2
      });
      const buf = new ArrayBuffer(layout.byteLength);
      const view = getTextureImageView(buf, layout, 'rgba32float', 0);
      expect(view.constructor.name, 'rgba32float -> Float32Array').toBe('Float32Array');
      expect(view.length, 'elements = bytesPerImage / 4').toBe(layout.bytesPerImage / 4);
    }
    {
      const {
        layout
      } = makeLayout({
        format: 'r32uint',
        width: 2,
        rows: 1
      });
      const buf = new ArrayBuffer(layout.byteLength);
      const view = getTextureImageView(buf, layout, 'r32uint', 0);
      expect(view.constructor.name, 'r32uint -> Uint32Array').toBe('Uint32Array');
    }
  });
  test('multi-layer writes do not bleed across layers (rgba8unorm)', () => {
    const {
      layout
    } = makeLayout({
      format: 'rgba8unorm',
      width: 2,
      rows: 2,
      layers: 2
    });
    const buf = new ArrayBuffer(layout.byteLength);
    const v1 = getTextureImageView(buf, layout, 'rgba8unorm', 1) as Uint8Array;
    const data1 = new Uint8Array(v1.length).fill(7);
    setTextureImageData(buf, layout, 'rgba8unorm', data1, 1);
    const v0 = getTextureImageView(buf, layout, 'rgba8unorm', 0) as Uint8Array;
    expect(v0.slice(0, 64).every(x => x === 0), 'layer 0 remains zero-initialized').toBeTruthy();
    expect(v1.slice(0, 64).every(x => x === 7), 'layer 1 filled with 7s').toBeTruthy();
  });
  test('setTextureImageData clamps to view length (r8unorm)', () => {
    const {
      layout
    } = makeLayout({
      format: 'r8unorm',
      width: 4,
      rows: 1
    });
    const buf = new ArrayBuffer(layout.byteLength);
    const view = getTextureImageView(buf, layout, 'r8unorm', 0) as Uint8Array;
    const big = new Uint8Array(view.length + 1024).fill(9);
    setTextureImageData(buf, layout, 'r8unorm', big, 0);
    expect(view.every(x => x === 9), 'entire view written with 9s').toBeTruthy();
  });
  test('no double offset on write (r32float)', () => {
    const {
      layout
    } = makeLayout({
      format: 'r32float',
      width: 1,
      rows: 1,
      layers: 2
    });
    const buf = new ArrayBuffer(layout.byteLength);
    const layer1 = getTextureImageView(buf, layout, 'r32float', 1) as Float32Array;
    const layer0 = getTextureImageView(buf, layout, 'r32float', 0) as Float32Array;
    const data = new Float32Array(layer1.length);
    data[0] = 1.25;
    data[1] = 2.5;
    setTextureImageData(buf, layout, 'r32float', data, 1);
    expect(layer1[0], 'layer1 first element matches').toBe(1.25);
    expect(layer1[1], 'layer1 second element matches').toBe(2.5);
    expect(layer0[0], 'layer0 unaffected [0]').toBe(0);
    expect(layer0[1], 'layer0 unaffected [1]').toBe(0);
  });
  test('padding: tiny width -> large bytesPerRow; lengths reflect padding (rgba8unorm)', () => {
    const {
      layout
    } = makeLayout({
      format: 'rgba8unorm',
      width: 1,
      rows: 3
    });
    expect(layout.bytesPerRow, 'row padded to 256').toBe(256);
    expect(layout.bytesPerImage, 'bytesPerImage = 256 * rows').toBe(256 * 3);
    const buf = new ArrayBuffer(layout.byteLength);
    const view = getTextureImageView(buf, layout, 'rgba8unorm', 0) as Uint8Array;
    expect(view.length, 'Uint8Array length equals bytesPerImage').toBe(layout.bytesPerImage);
  });
  test('bgra8unorm typed view & length', () => {
    const {
      layout
    } = makeLayout({
      format: 'bgra8unorm',
      width: 5,
      rows: 2
    });
    const buf = new ArrayBuffer(layout.byteLength);
    const view = getTextureImageView(buf, layout, 'bgra8unorm', 0) as Uint8Array;
    expect(view.constructor.name, 'bgra8unorm -> Uint8Array').toBe('Uint8Array');
    expect(view.length, 'length equals bytesPerImage').toBe(layout.bytesPerImage);
  });
  test('unsupported formats throw', () => {
    const {
      layout
    } = makeLayout({
      format: 'rgba8unorm',
      width: 1,
      rows: 1
    });
    expect(() => getTextureImageView(new ArrayBuffer(layout.byteLength), layout, 'bc1-rgba-unorm' as never, 0), 'unsupported formats throw').toThrow(/Unsupported format/);
  });
}

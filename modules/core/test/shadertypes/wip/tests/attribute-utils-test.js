import { describe, it } from '../mocha-support.js';
import { createBuffersAndAttributesFromArrays}  from '../../dist/1.x/webgpu-utils.module.js';
import { assertArrayEqual, assertEqual, assertDeepEqual, assertTruthy, assertFalsy } from '../assert.js';
import { testWithDevice, readBuffer } from '../webgpu.js';

/* global GPUBufferUsage */
/* global GPUBuffer */

function assertInterleaveEquals(actual, expected, offset, numComponents, stride) {
  for (let off = offset; off < actual.length; off += stride) {
    const expectedOff = Math.floor(off / stride) * numComponents;
    const a = actual.slice(off, off + numComponents);
    const e = expected.slice(expectedOff, expectedOff + numComponents);
    assertArrayEqual(a, e, `actual at ${off}, expected at ${expectedOff}`);
  }
}

describe('attribute-utils-tests', () => {

  describe('createBuffersAndAttributesFromArrays', () => {

    it('simple native arrays', testWithDevice(async device => {
      const r = [1, 0, 0, 1];
      const y = [1, 1, 0, 1];
      const g = [0, 1, 0, 1];
      const c = [0, 1, 1, 1];
      const b = [0, 0, 1, 1];
      const m = [1, 0, 1, 1];
      const arrays = {
        position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
        normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
        texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
        color: [
          r, r, r, r,
          y, y, y, y,
          g, g, g, g,
          c, c, c, c,
          b, b, b, b,
          m, m, m, m,
        ].flat(),
        indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
      };
      const buffersAndAttributes = createBuffersAndAttributesFromArrays(device, arrays, {
        usage: GPUBufferUsage.COPY_SRC,
      });

      const f32Stride = 3 + 3 + 2 + 4;

      assertEqual(buffersAndAttributes.numElements, 36);
      assertTruthy(buffersAndAttributes.indexBuffer instanceof GPUBuffer);
      assertEqual(buffersAndAttributes.indexBuffer.size, 36 * 4);
      assertEqual(buffersAndAttributes.indexBuffer.usage, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.indexFormat, 'uint32');
      assertEqual(buffersAndAttributes.buffers.length, 1);
      assertEqual(buffersAndAttributes.buffers[0].size, 24 * f32Stride * 4);
      assertEqual(buffersAndAttributes.buffers[0].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);
      assertDeepEqual(buffersAndAttributes.bufferLayouts, [
        {
          stepMode: 'vertex',
          arrayStride: f32Stride * 4,
          attributes: [
            { shaderLocation: 0, offset:  0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x2' },
            { shaderLocation: 3, offset: 32, format: 'float32x4' },
          ],
        },
      ]);

      // TODO: buffers?
      {
        const u8 = await readBuffer(device, buffersAndAttributes.buffers[0]);
        const f32 = new Float32Array(u8.buffer);

        assertInterleaveEquals(f32, arrays.position, 0, 3, f32Stride);
        assertInterleaveEquals(f32, arrays.normal, 3, 3, f32Stride);
        assertInterleaveEquals(f32, arrays.texcoord, 6, 2, f32Stride);
        assertInterleaveEquals(f32, arrays.color, 8, 4, f32Stride);
      }
    }));

    it('simple typed arrays', testWithDevice(async device => {
      const r = [255,   0,   0, 255];
      const y = [255, 255,   0, 255];
      const g = [  0, 255,   0, 255];
      const c = [  0, 255, 255, 255];
      const b = [  0,   0, 255, 255];
      const m = [255,   0, 255, 255];
      const arrays = {
        position: new Float32Array([1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1]),
        normal: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]),
        texcoord: new Float32Array([1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1]),
        color: new Uint8Array([
          r, r, r, r,
          y, y, y, y,
          g, g, g, g,
          c, c, c, c,
          b, b, b, b,
          m, m, m, m,
        ].flat()),
        indices: new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23]),
      };
      const buffersAndAttributes = createBuffersAndAttributesFromArrays(device, arrays, {
        usage: GPUBufferUsage.COPY_SRC,
      });

      const f32Stride = 3 + 3 + 2 + 1;

      assertEqual(buffersAndAttributes.numElements, 36);
      assertTruthy(buffersAndAttributes.indexBuffer instanceof GPUBuffer);
      assertEqual(buffersAndAttributes.indexBuffer.size, 36 * 2);
      assertEqual(buffersAndAttributes.indexBuffer.usage, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.indexFormat, 'uint16');
      assertEqual(buffersAndAttributes.buffers.length, 1);
      assertEqual(buffersAndAttributes.buffers[0].size, 24 * f32Stride * 4);
      assertEqual(buffersAndAttributes.buffers[0].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);
      assertDeepEqual(buffersAndAttributes.bufferLayouts, [
        {
          stepMode: 'vertex',
          arrayStride: f32Stride * 4,
          attributes: [
            { shaderLocation: 0, offset:  0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x2' },
            { shaderLocation: 3, offset: 32, format: 'unorm8x4' },
          ],
        },
      ]);

      // TODO: buffers?
      {
        const u8 = await readBuffer(device, buffersAndAttributes.buffers[0]);
        const f32 = new Float32Array(u8.buffer);

        assertInterleaveEquals(f32, arrays.position, 0, 3, f32Stride);
        assertInterleaveEquals(f32, arrays.normal, 3, 3, f32Stride);
        assertInterleaveEquals(f32, arrays.texcoord, 6, 2, f32Stride);
        assertInterleaveEquals(u8, arrays.color, 8 * 4, 4, f32Stride * 4);
      }
    }));

    it('full spec arrays', testWithDevice(async device => {
      const r = [255,   0,   0, 255];
      const y = [255, 255,   0, 255];
      const g = [  0, 255,   0, 255];
      const c = [  0, 255, 255, 255];
      const b = [  0,   0, 255, 255];
      const m = [255,   0, 255, 255];
      const arrays = {
        position: {
          data: new Float32Array([1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1]),
        },
        normal: {
          data: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]),
        },
        texcoord: {
          data: new Float32Array([1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1]),
        },
        color: {
          data: new Uint8Array([
            r, r, r, r,
            y, y, y, y,
            g, g, g, g,
            c, c, c, c,
            b, b, b, b,
            m, m, m, m,
          ].flat()),
        },
        other: {
          data: new Uint32Array([
            11, 11, 11, 11,
            22, 22, 22, 22,
            33, 33, 33, 33,
            44, 44, 44, 44,
            55, 55, 55, 55,
            66, 66, 66, 66,
          ]),
          numComponents: 1,
        },
        indices: new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23]),
      };
      const buffersAndAttributes = createBuffersAndAttributesFromArrays(device, arrays, {
        usage: GPUBufferUsage.COPY_SRC,
      });

      const f32Stride = 3 + 3 + 2 + 1 + 1;

      assertEqual(buffersAndAttributes.numElements, 36);
      assertTruthy(buffersAndAttributes.indexBuffer instanceof GPUBuffer);
      assertEqual(buffersAndAttributes.indexBuffer.size, 36 * 2);
      assertEqual(buffersAndAttributes.indexBuffer.usage, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.indexFormat, 'uint16');
      assertEqual(buffersAndAttributes.buffers.length, 1);
      assertEqual(buffersAndAttributes.buffers[0].size, 24 * f32Stride * 4);
      assertEqual(buffersAndAttributes.buffers[0].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);
      assertDeepEqual(buffersAndAttributes.bufferLayouts, [
        {
          stepMode: 'vertex',
          arrayStride: f32Stride * 4,
          attributes: [
            { shaderLocation: 0, offset:  0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x2' },
            { shaderLocation: 3, offset: 32, format: 'unorm8x4' },
            { shaderLocation: 4, offset: 36, format: 'uint32' },
          ],
        },
      ]);

      // TODO: buffers?
      {
        const u8 = await readBuffer(device, buffersAndAttributes.buffers[0]);
        const f32 = new Float32Array(u8.buffer);
        const u32 = new Uint32Array(u8.buffer);

        assertInterleaveEquals(f32, arrays.position.data, 0, 3, f32Stride);
        assertInterleaveEquals(f32, arrays.normal.data, 3, 3, f32Stride);
        assertInterleaveEquals(f32, arrays.texcoord.data, 6, 2, f32Stride);
        assertInterleaveEquals(u8, arrays.color.data, 8 * 4, 4, f32Stride * 4);
        assertInterleaveEquals(u32, arrays.other.data, 9, 1, f32Stride);
      }
    }));

    it('simple native arrays (non-interleaved)', testWithDevice(async device => {
      const r = [1, 0, 0, 1];
      const y = [1, 1, 0, 1];
      const g = [0, 1, 0, 1];
      const c = [0, 1, 1, 1];
      const b = [0, 0, 1, 1];
      const m = [1, 0, 1, 1];
      const arrays = {
        position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
        normal: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
        texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
        color: [
          r, r, r, r,
          y, y, y, y,
          g, g, g, g,
          c, c, c, c,
          b, b, b, b,
          m, m, m, m,
        ].flat(),
        indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
      };
      const buffersAndAttributes = createBuffersAndAttributesFromArrays(device, arrays, {
        usage: GPUBufferUsage.COPY_SRC,
        interleave: false,
      });

      const kNumVerts = arrays.position.length / 3;
      const kNumElements = arrays.indices.length;

      assertEqual(buffersAndAttributes.numElements, kNumElements);
      assertTruthy(buffersAndAttributes.indexBuffer instanceof GPUBuffer);
      assertEqual(buffersAndAttributes.indexBuffer.size, kNumElements * 4);
      assertEqual(buffersAndAttributes.indexBuffer.usage, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.indexFormat, 'uint32');
      assertEqual(buffersAndAttributes.buffers.length, 4);

      assertEqual(buffersAndAttributes.buffers[0].size, kNumVerts * 12);
      assertEqual(buffersAndAttributes.buffers[1].size, kNumVerts * 12);
      assertEqual(buffersAndAttributes.buffers[2].size, kNumVerts * 8);
      assertEqual(buffersAndAttributes.buffers[3].size, kNumVerts * 16);

      assertEqual(buffersAndAttributes.buffers[0].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.buffers[1].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.buffers[2].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);
      assertEqual(buffersAndAttributes.buffers[3].usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC);

      assertDeepEqual(buffersAndAttributes.bufferLayouts, [
        { stepMode: 'vertex', arrayStride: 12, attributes: [ { shaderLocation: 0, offset:  0, format: 'float32x3' } ] },
        { stepMode: 'vertex', arrayStride: 12, attributes: [ { shaderLocation: 1, offset:  0, format: 'float32x3' } ] },
        { stepMode: 'vertex', arrayStride:  8, attributes: [ { shaderLocation: 2, offset:  0, format: 'float32x2' } ] },
        { stepMode: 'vertex', arrayStride: 16, attributes: [ { shaderLocation: 3, offset:  0, format: 'float32x4' } ] },
      ]);

      const bufferContents = await Promise.all(buffersAndAttributes.buffers.map(buffer => readBuffer(device, buffer)));
      bufferContents.push(await readBuffer(device, buffersAndAttributes.indexBuffer));

      Object.entries(arrays).forEach(([name, array], ndx) => {
        const view = new (ndx === 4 ? Uint32Array : Float32Array)(bufferContents[ndx].buffer);
        assertArrayEqual(view, array, name);
      });
    }));

    it('sizes (non-interleaved), stepMode: "instance"', testWithDevice(async device => {
      const numInstances = 100;
      const buffersAndAttributes = createBuffersAndAttributesFromArrays(device, {
        matrix: {
          data: numInstances * 16,
          type: Float32Array,
          numComponents: 16,
        },
        color: {
          data: numInstances * 4,
          type: Uint8Array,
        },
      }, { stepMode: 'instance', interleave: false, shaderLocation: 4 });

      const kNumVerts = numInstances;
      const kNumElements = numInstances;

      assertEqual(buffersAndAttributes.numElements, kNumElements);
      assertFalsy(buffersAndAttributes.indexBuffer);
      assertEqual(buffersAndAttributes.buffers.length, 2);

      assertEqual(buffersAndAttributes.buffers[0].size, kNumVerts * 16 * 4);
      assertEqual(buffersAndAttributes.buffers[1].size, kNumVerts * 4);

      assertEqual(buffersAndAttributes.buffers[0].usage, GPUBufferUsage.VERTEX);
      assertEqual(buffersAndAttributes.buffers[1].usage, GPUBufferUsage.VERTEX);

      assertDeepEqual(buffersAndAttributes.bufferLayouts, [
        {
          stepMode: 'instance',
          arrayStride: 64,
          attributes: [
            { shaderLocation: 4, offset:  0, format: 'float32x4' },
            { shaderLocation: 5, offset: 16, format: 'float32x4' },
            { shaderLocation: 6, offset: 32, format: 'float32x4' },
            { shaderLocation: 7, offset: 48, format: 'float32x4' },
          ],
        },
        {
          stepMode: 'instance',
          arrayStride:  4,
          attributes: [
            { shaderLocation: 8, offset:  0, format: 'unorm8x4' },
          ],
        },
      ]);

    }));

  });
    // TODO: test interleave
    // TODO: test stepMode
    // TODO: test passing in type works
    // TODO: test non-interleaved? (should this be offset?)
    // TODO: test non-normalized
    // TODO: test uint8x3 fails
    // TODO: test shaderLocations as array? (do I care about this feature?)

});
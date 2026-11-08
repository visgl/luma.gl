// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {Geometry} from '@math.gl/geometry';
import {vertexFormatDecoder} from '@luma.gl/core';
import type {GPUVectorModelInput} from '../model/gpu-vector-model-batches';
import {GPUGeometry, makeGPUGeometry} from './gpu-geometry';
import {GPUVectorGeometry} from './gpu-vector-geometry';

/**
 * Interleaves and uploads CPU geometry for use with GPUVectorModel.
 * The returned geometry owns its uploaded buffers; call destroy() after all models stop using it.
 */
export function makeGPUVectorGeometry(device: Device, geometry: Geometry): GPUVectorGeometry {
  const gpuGeometry = makeGPUGeometry(device, geometry);
  try {
    const vectorGeometry = makeGPUVectorGeometryFromGPUGeometry(gpuGeometry);
    vectorGeometry.destroy = () => gpuGeometry.destroy();
    return vectorGeometry;
  } catch (error) {
    gpuGeometry.destroy();
    throw error;
  }
}

/** Borrows legacy geometry storage as typed vector views for Model's input adapter. */
export function makeGPUVectorGeometryFromGPUGeometry(geometry: GPUGeometry): GPUVectorGeometry {
  const attributes: Record<string, GPUVectorModelInput> = {};
  for (const [name, buffer] of Object.entries(geometry.attributes)) {
    const bufferLayout = geometry.bufferLayout.find(layout => layout.name === name);
    const format = bufferLayout?.format;
    const byteStride =
      bufferLayout?.byteStride ??
      (format ? vertexFormatDecoder.getVertexFormatInfo(format).byteLength : 0);
    const length =
      geometry.indices && byteStride
        ? Math.floor(buffer.byteLength / byteStride)
        : geometry.vertexCount;
    attributes[name] = {
      name,
      format,
      length,
      byteStride,
      rowByteLength: byteStride,
      bufferLayout,
      data: [
        {
          buffer,
          byteOffset: 0,
          length,
          format,
          byteStride,
          rowByteLength: byteStride
        }
      ]
    };
  }
  if (geometry.indices) {
    // Legacy attributes may have different spare capacity; expose their common addressable rows.
    const length = Math.min(...Object.values(attributes).map(vector => vector.length));
    for (const [name, vector] of Object.entries(attributes)) {
      attributes[name] = {...vector, length, data: vector.data.map(chunk => ({...chunk, length}))};
    }
  }
  const buffer = geometry.indices;
  const byteStride = buffer?.indexType === 'uint32' ? 4 : buffer?.indexType === 'uint8' ? 1 : 2;
  const length = buffer ? buffer.byteLength / byteStride : 0;
  const indices: GPUVectorModelInput | null = buffer
    ? {
        name: 'indices',
        format: buffer.indexType,
        length,
        byteStride,
        rowByteLength: byteStride,
        data: [
          {
            buffer,
            byteOffset: 0,
            length,
            format: buffer.indexType,
            byteStride,
            rowByteLength: byteStride
          }
        ]
      }
    : null;
  return new GPUVectorGeometry({
    attributes,
    indices,
    topology: geometry.topology,
    vertexCount: geometry.vertexCount,
    bufferLayout: geometry.bufferLayout
  });
}

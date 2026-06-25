// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Binding, Buffer, BufferLayout, ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {validateGPUInputVectors, type GPUInputSchema} from './gpu-input-schema';
import type {GPUData} from '../table/gpu-data';
import type {GPURecordBatch} from '../table/gpu-record-batch';
import type {GPUTable} from '../table/gpu-table';

type GPUBuffer = Buffer | DynamicBuffer;

/** Draw-ready table buffers for one preserved GPU record batch. */
export type GPUTableShaderBindingBatch = {
  /** Buffer-valued attributes keyed by BufferLayout name, ready for Model.setAttributes(). */
  attributes: Record<string, GPUBuffer>;
  /** Vertex buffers ordered to match the returned BufferLayout array. */
  attributeBuffers: GPUBuffer[];
  /** Storage ranges keyed by shader binding name, ready for Model.setBindings(). */
  bindings: Record<string, Binding>;
};

/** Draw-ready shader inputs resolved from one GPU table. */
export type GPUTableShaderBindings = {
  /** Attribute layouts selected from the table for the requested shader inputs. */
  bufferLayout: BufferLayout[];
  /** One draw-ready buffer set per preserved table batch. */
  batches: GPUTableShaderBindingBatch[];
};

/**
 * Resolves one GPU table into batch-preserving attribute and storage-buffer inputs.
 *
 * The function returns binding resources rather than backend bind groups. A Model
 * or RenderPipeline owns bind-group creation because the concrete pipeline owns
 * the backend layout and bind-group cache.
 */
export function getShaderBindingsFromGPUTable(
  table: GPUTable,
  gpuInputSchema: GPUInputSchema,
  shaderLayout: ShaderLayout
): GPUTableShaderBindings {
  validateGPUInputVectors('getShaderBindingsFromGPUTable()', gpuInputSchema, table.gpuVectors);

  const shaderAttributeNames = new Set(shaderLayout.attributes.map(attribute => attribute.name));
  const storageBindingNames = new Set(
    shaderLayout.bindings
      .filter(binding => binding.type === 'storage' || binding.type === 'read-only-storage')
      .map(binding => binding.name)
  );

  const attributeLayouts = gpuInputSchema.flatMap(input => {
    if (!input.attributeName || !shaderAttributeNames.has(input.attributeName)) {
      return [];
    }
    const layout = table.bufferLayout.find(
      candidateLayout => candidateLayout.name === input.columnName
    );
    if (!layout) {
      throw new Error(
        'getShaderBindingsFromGPUTable() GPU input "' +
          input.columnName +
          '" requires a table buffer layout'
      );
    }
    return [getShaderAttributeBufferLayout(layout, input.attributeName)];
  });
  const bindingInputs = gpuInputSchema.filter(
    input => input.bindingName && storageBindingNames.has(input.bindingName)
  );

  return {
    bufferLayout: attributeLayouts,
    batches: table.batches.map(batch =>
      getGPUTableShaderBindingBatch(batch, attributeLayouts, bindingInputs)
    )
  };
}

function getGPUTableShaderBindingBatch(
  batch: GPURecordBatch,
  bufferLayout: BufferLayout[],
  bindingInputs: GPUInputSchema
): GPUTableShaderBindingBatch {
  const attributes: Record<string, GPUBuffer> = {};
  const attributeBuffers: GPUBuffer[] = [];
  for (const layout of bufferLayout) {
    const data = batch.gpuData[layout.name];
    if (!data) {
      throw new Error(
        'getShaderBindingsFromGPUTable() batch is missing GPUData "' + layout.name + '"'
      );
    }
    attributes[layout.name] = data.buffer;
    attributeBuffers.push(data.buffer);
  }

  const bindings: Record<string, Binding> = {};
  for (const input of bindingInputs) {
    const bindingName = input.bindingName;
    if (!bindingName) {
      continue;
    }
    const data = batch.gpuData[input.columnName];
    if (!data) {
      throw new Error(
        'getShaderBindingsFromGPUTable() batch is missing GPUData "' + input.columnName + '"'
      );
    }
    bindings[bindingName] = getGPUDataBinding(data);
  }

  return {attributes, attributeBuffers, bindings};
}

function getBufferLayoutAttributeNames(bufferLayout: BufferLayout): string[] {
  return bufferLayout.attributes?.map(attribute => attribute.attribute) ?? [bufferLayout.name];
}

function getShaderAttributeBufferLayout(
  bufferLayout: BufferLayout,
  attributeName: string
): BufferLayout {
  if (bufferLayout.attributes) {
    if (!getBufferLayoutAttributeNames(bufferLayout).includes(attributeName)) {
      throw new Error(
        'getShaderBindingsFromGPUTable() buffer layout "' +
          bufferLayout.name +
          '" does not contain shader attribute "' +
          attributeName +
          '"'
      );
    }
    return bufferLayout;
  }
  if (bufferLayout.name === attributeName) {
    return bufferLayout;
  }
  if (!bufferLayout.format) {
    throw new Error(
      'getShaderBindingsFromGPUTable() buffer layout "' +
        bufferLayout.name +
        '" cannot map shader attribute "' +
        attributeName +
        '" without a format'
    );
  }
  return {
    name: bufferLayout.name,
    stepMode: bufferLayout.stepMode,
    byteStride: bufferLayout.byteStride,
    attributes: [{attribute: attributeName, format: bufferLayout.format, byteOffset: 0}]
  };
}

function getGPUDataBinding(data: GPUData): Binding {
  return {
    buffer: data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer,
    offset: data.byteOffset,
    size: data.valueByteLength ?? data.valueLength * data.byteStride
  };
}

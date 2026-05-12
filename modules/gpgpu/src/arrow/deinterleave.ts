// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArrowGPUVector} from '@luma.gl/arrow';
import {Buffer, type Device, type VertexFormat} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';

const WORKGROUP_SIZE = 64;

type DeinterleaveArrowType = arrow.Int | arrow.Float | arrow.FixedSizeList<arrow.Int | arrow.Float>;

/** Options for {@link deinterleave}. */
export type ArrowGPUDeinterleaveProps = {
  /** Name assigned to the returned packed vector. Defaults to the selected attribute name. */
  name?: string;
};

/**
 * Extracts one attribute from an interleaved binary GPU vector into a new packed GPU vector.
 *
 * The returned vector owns the generated output buffer. This initial implementation supports raw
 * 32-bit storage formats.
 */
export function deinterleave(
  source: ArrowGPUVector<arrow.Binary>,
  attributeName: string,
  props: ArrowGPUDeinterleaveProps = {}
): ArrowGPUVector<DeinterleaveArrowType> {
  const device = source.buffer.device as Device;
  if (device.type !== 'webgpu') {
    throw new Error('deinterleave requires a WebGPU device');
  }
  if (!arrow.DataType.isBinary(source.type)) {
    throw new Error('deinterleave requires an interleaved ArrowGPUVector<Binary>');
  }
  if (!source.bufferLayout?.attributes) {
    throw new Error('deinterleave requires source.bufferLayout.attributes');
  }

  const attribute = source.bufferLayout.attributes.find(
    layout => layout.attribute === attributeName
  );
  if (!attribute) {
    throw new Error(`deinterleave could not find attribute "${attributeName}"`);
  }

  const formatInfo = getVertexFormatInfo(attribute.format);
  const sourceByteOffset = source.byteOffset + attribute.byteOffset;
  if (sourceByteOffset % 4 !== 0 || source.byteStride % 4 !== 0) {
    throw new Error('deinterleave currently requires 32-bit aligned attributes');
  }
  const logicalByteLength = source.length * formatInfo.byteLength;
  const outputBuffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    byteLength: logicalByteLength
  });
  const sourceShader = getDeinterleaveShader({
    shaderType: formatInfo.shaderType,
    components: formatInfo.components,
    length: source.length,
    sourceElementOffset: sourceByteOffset / 4,
    sourceElementStride: source.byteStride / 4
  });

  const computation = new Computation(device, {
    source: sourceShader,
    shaderLayout: {
      bindings: [
        {name: 'source', type: 'storage', group: 0, location: 0},
        {name: 'target', type: 'storage', group: 0, location: 1}
      ]
    }
  });

  computation.setBindings({source: source.buffer, target: outputBuffer});
  const computePass = device.beginComputePass({});
  computation.dispatch(computePass, Math.ceil(source.length / WORKGROUP_SIZE));
  computePass.end();
  device.submit();
  computation.destroy();

  return new ArrowGPUVector<any>({
    type: 'buffer',
    name: props.name || attributeName,
    buffer: outputBuffer,
    arrowType: formatInfo.arrowType,
    length: source.length,
    byteStride: formatInfo.byteLength,
    ownsBuffer: true
  } as any);
}

function getVertexFormatInfo(format: VertexFormat): {
  arrowType: DeinterleaveArrowType;
  byteLength: number;
  components: number;
  shaderType: 'f32' | 'i32' | 'u32';
} {
  const components = getVertexFormatComponents(format);
  const scalarType = getVertexFormatArrowScalarType(format);
  const byteLength = components * getArrowScalarByteLength(scalarType);
  if (byteLength % 4 !== 0) {
    throw new Error(`deinterleave currently requires 32-bit attribute formats, got ${format}`);
  }
  return {
    arrowType:
      components === 1
        ? scalarType
        : new arrow.FixedSizeList(components, new arrow.Field('value', scalarType)),
    byteLength,
    components,
    shaderType: getArrowShaderType(scalarType)
  };
}

function getVertexFormatComponents(format: VertexFormat): number {
  const match = format.match(/x([234])/);
  return match ? Number(match[1]) : 1;
}

function getVertexFormatArrowScalarType(format: VertexFormat): arrow.Int | arrow.Float {
  const scalarFormat = format.replace(/x[234](-webgl)?$/, '');
  switch (scalarFormat) {
    case 'float32':
      return new arrow.Float32();
    case 'float16':
      return new arrow.Float16();
    case 'uint8':
    case 'unorm8':
      return new arrow.Uint8();
    case 'sint8':
    case 'snorm8':
      return new arrow.Int8();
    case 'uint16':
    case 'unorm16':
      return new arrow.Uint16();
    case 'sint16':
    case 'snorm16':
      return new arrow.Int16();
    case 'uint32':
      return new arrow.Uint32();
    case 'sint32':
      return new arrow.Int32();
    default:
      throw new Error(`deinterleave does not support vertex format ${format}`);
  }
}

function getArrowScalarByteLength(type: arrow.Int | arrow.Float): number {
  if (arrow.DataType.isInt(type)) {
    return type.bitWidth / 8;
  }
  switch (type.precision) {
    case arrow.Precision.HALF:
      return 2;
    case arrow.Precision.SINGLE:
      return 4;
    default:
      throw new Error('deinterleave does not support float64 attributes');
  }
}

function getArrowShaderType(type: arrow.Int | arrow.Float): 'f32' | 'i32' | 'u32' {
  if (arrow.DataType.isFloat(type)) {
    if (type.precision === arrow.Precision.SINGLE) {
      return 'f32';
    }
    throw new Error('deinterleave currently supports only float32 storage attributes');
  }
  if (type.bitWidth === 32) {
    return type.isSigned ? 'i32' : 'u32';
  }
  throw new Error('deinterleave currently supports only 32-bit storage attributes');
}

function getDeinterleaveShader({
  shaderType,
  components,
  length,
  sourceElementOffset,
  sourceElementStride
}: {
  shaderType: 'f32' | 'i32' | 'u32';
  components: number;
  length: number;
  sourceElementOffset: number;
  sourceElementStride: number;
}): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read> source: array<${shaderType}>;
@group(0) @binding(1) var<storage, read_write> target: array<${shaderType}>;

@compute @workgroup_size(${WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) id: vec3<u32>
) {
  let rowIndex = id.x;
  if (rowIndex >= ${length}u) {
    return;
  }

  let sourceRowOffset = ${sourceElementOffset}u + rowIndex * ${sourceElementStride}u;
  let targetRowOffset = rowIndex * ${components}u;
  for (var elementIndex = 0u; elementIndex < ${components}u; elementIndex = elementIndex + 1u) {
    target[targetRowOffset + elementIndex] = source[sourceRowOffset + elementIndex];
  }
}
`;
}

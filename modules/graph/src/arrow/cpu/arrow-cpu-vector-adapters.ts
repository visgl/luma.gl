// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {CPUData, CPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';
import {
  BufferType,
  Data,
  DataType,
  Field,
  FixedSizeList,
  List,
  Float16,
  Float32,
  Int32,
  Uint32,
  Int16,
  Uint16,
  Int8,
  Uint8,
  Vector
} from 'apache-arrow';
import {getGPUVectorFormatFromArrowDataType} from '../gpu/arrow-gpu-vector-adapters';
import {
  getArrowDataBufferSource,
  getArrowVariableLengthAttributeDataBufferSource,
  getArrowGPUDataReadbackMetadata
} from '../gpu/arrow-gpu-data';
import type {
  AttributeArrowType,
  VariableLengthAttributeArrowType
} from '../arrow-utils/arrow-types';

/** Borrow Arrow numeric payloads while normalizing sliced list offsets and validity to chunk-local rows. */
export function makeCPUVectorFromArrow(vector: Vector, options: {name?: string} = {}): CPUVector {
  const format = getGPUVectorFormatFromArrowDataType(vector.type);
  const info = getGPUVectorFormatInfo(format);
  const data = vector.data.map(chunk => {
    // CPUData stores parent validity only; reject nullable nested elements rather than dropping it.
    const validateChildren = (data: Data): void => {
      for (const child of data.children) {
        assert(child.nullCount === 0);
        validateChildren(child);
      }
    };
    validateChildren(chunk);
    const metadata = getArrowGPUDataReadbackMetadata(chunk);
    if (metadata?.kind === 'fixed-size-list') assert(!metadata.childNullCount);
    const variable = DataType.isList(chunk.type);
    const buffer = variable
      ? getArrowVariableLengthAttributeDataBufferSource(
          chunk as Data<VariableLengthAttributeArrowType>
        )
      : getArrowDataBufferSource(chunk as Data<AttributeArrowType>);
    const offsets =
      metadata?.kind === 'variable-length-attribute' ? metadata.valueOffsets : undefined;
    return new CPUData({
      buffer,
      format,
      length: chunk.length,
      valueLength: variable ? buffer.byteLength / info.elementByteLength : undefined,
      valueOffsets: offsets,
      nullBitmap: metadata?.nullBitmap
    });
  });
  return new CPUVector({name: options.name, format, data});
}

/** Reconstruct numeric Arrow vectors, preserving CPU chunk boundaries and parent-row validity. */
export function makeArrowVectorFromCPUVector(vector: CPUVector): Vector {
  const info = getGPUVectorFormatInfo(vector.format);
  const scalar =
    info.signedDataType === 'float16'
      ? new Float16()
      : info.signedDataType === 'float32'
        ? new Float32()
        : info.signedDataType === 'sint32'
          ? new Int32()
          : info.signedDataType === 'uint32'
            ? new Uint32()
            : info.signedDataType === 'sint16'
              ? new Int16()
              : info.signedDataType === 'uint16'
                ? new Uint16()
                : info.signedDataType === 'sint8'
                  ? new Int8()
                  : new Uint8();
  assert(
    !info.normalized &&
      ['float16', 'float32', 'sint32', 'uint32', 'sint16', 'uint16', 'sint8', 'uint8'].includes(
        info.signedDataType
      )
  );
  const width = info.components * (info.listSize ?? 1);
  const element =
    width === 1 ? scalar : new FixedSizeList(width, new Field('value', scalar, false));
  const variable = info.vertexList || info.valueList;
  const type = variable ? new List(new Field('value', element, false)) : element;
  const ValueType = scalar.ArrayType;
  const chunks = vector.data.map(chunk => {
    const count = variable ? chunk.valueLength : chunk.length;
    let bytes: Uint8Array;
    if (chunk.byteStride === info.byteLength && chunk.rowByteLength === info.byteLength)
      bytes = new Uint8Array(chunk.buffer, chunk.byteOffset, count * info.byteLength);
    else {
      bytes = new Uint8Array(count * info.byteLength);
      for (let index = 0; index < count; index++)
        bytes.set(
          new Uint8Array(
            chunk.buffer,
            chunk.byteOffset + index * chunk.byteStride,
            info.byteLength
          ),
          index * info.byteLength
        );
    }
    // Typed Arrow arrays require aligned payloads; strided packing already produces aligned bytes.
    if (bytes.byteOffset % ValueType.BYTES_PER_ELEMENT) bytes = bytes.slice();
    const values = new ValueType(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength / ValueType.BYTES_PER_ELEMENT
    );
    const primitive = new Data(scalar, 0, count * width, 0, {[BufferType.DATA]: values});
    const rows = width === 1 ? primitive : new Data(element, 0, count, 0, {}, [primitive]);
    const nullCount = chunk.nullBitmap
      ? Array.from({length: chunk.length}, (_, index) =>
          chunk.nullBitmap![index >> 3] & (1 << (index & 7)) ? 0 : 1
        ).reduce<number>((sum, value) => sum + value, 0)
      : 0;
    if (variable) {
      assert(chunk.valueOffsets && chunk.valueOffsets.length === chunk.length + 1);
      return new Data(
        type,
        0,
        chunk.length,
        nullCount,
        {[BufferType.OFFSET]: chunk.valueOffsets, [BufferType.VALIDITY]: chunk.nullBitmap},
        [rows]
      );
    }
    return width === 1
      ? new Data(scalar, 0, chunk.length, nullCount, {
          [BufferType.DATA]: values,
          [BufferType.VALIDITY]: chunk.nullBitmap
        })
      : new Data(element, 0, chunk.length, nullCount, {[BufferType.VALIDITY]: chunk.nullBitmap}, [
          primitive
        ]);
  });
  return new Vector(chunks.length ? chunks : [new Data(type, 0, 0, 0)]);
}

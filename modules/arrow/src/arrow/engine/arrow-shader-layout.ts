// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  AttributeShaderType,
  BufferLayout,
  ShaderLayout,
  SignedDataType,
  VertexFormat
} from '@luma.gl/core';
import {shaderTypeDecoder, vertexFormatDecoder} from '@luma.gl/core';
import {getAttributeLayoutFromBufferSchema, type BufferSchema} from '@luma.gl/engine';
import {Table, Vector} from 'apache-arrow';
import {getArrowPaths, getArrowVectorByPath} from '../arrow-utils/arrow-paths';
import {getArrowColumnInfo, getInstanceColumnInfo} from '../arrow-utils/arrow-column-info';
import {
  isInstanceArrowType,
  type ArrowColumnInfo,
  type AttributeArrowType
} from '../arrow-utils/arrow-types';
import {getArrowMatrixVectorInfo} from '../vectors/arrow-matrix-vector';

/** Options that control Arrow column to GPU vertex format selection. */
export type ArrowVertexFormatOptions = {
  /** Allow WebGL-only 3-component 8/16-bit integer vertex formats. */
  allowWebGLOnlyFormats?: boolean;
};

/** Source options for deriving a BufferLayout from Arrow data and a ShaderLayout. */
export type ArrowBufferLayoutOptions = ArrowVertexFormatOptions & {
  /** Arrow vectors keyed by shader attribute name. */
  arrowVectors?: Record<string, Vector>;
  /** Arrow table containing columns referenced by shader attribute name or arrowPaths. */
  arrowTable?: Table;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
};

type ArrowBufferLayoutSource =
  | {
      type: 'table';
      arrowTable: Table;
      arrowTablePaths: Set<string>;
      arrowPaths?: Record<string, string>;
    }
  | {type: 'vectors'; arrowVectors: Record<string, Vector>};

/**
 * Returns the GPU vertex format needed to expose one Arrow column to one shader attribute.
 *
 * The shader type describes what the shader can consume. The Arrow column info
 * describes the memory representation that will be uploaded.
 */
export function getArrowVertexFormat(
  columnInfo: ArrowColumnInfo,
  shaderType: AttributeShaderType,
  options?: ArrowVertexFormatOptions
): VertexFormat {
  const shaderTypeInfo = shaderTypeDecoder.getAttributeShaderTypeInfo(shaderType);

  if (columnInfo.components !== shaderTypeInfo.components) {
    throw new Error(
      `Arrow column has ${columnInfo.components} components but shader attribute ${shaderType} expects ${shaderTypeInfo.components}`
    );
  }

  switch (shaderTypeInfo.primitiveType) {
    case 'f32':
      return getFloatShaderVertexFormat(columnInfo, shaderType, false, options);
    case 'f16':
      return getFloatShaderVertexFormat(columnInfo, shaderType, true, options);
    case 'i32':
      return getIntegerShaderVertexFormat(columnInfo, shaderType, true, options);
    case 'u32':
      return getIntegerShaderVertexFormat(columnInfo, shaderType, false, options);
    default:
      throw new Error(`Unsupported shader attribute type ${shaderType}`);
  }
}

/**
 * Builds a BufferLayout by matching shader attributes to Arrow table columns or vectors.
 *
 * The canonical overload is shader-layout first with either `arrowTable` or
 * `arrowVectors` supplied in the options object.
 */
export function getArrowBufferLayout(
  shaderLayout: ShaderLayout,
  options: ArrowBufferLayoutOptions
): BufferLayout[];
export function getArrowBufferLayout(
  firstArgument: ShaderLayout,
  secondArgument: ArrowBufferLayoutOptions
): BufferLayout[] {
  const {shaderLayout, options, source} = normalizeArrowBufferLayoutArguments(
    firstArgument,
    secondArgument
  );
  const bufferLayout: BufferLayout[] = [];
  const matrixSelections = getArrowMatrixBufferLayouts(shaderLayout, source);

  for (const attribute of shaderLayout.attributes) {
    const matrixSelection = matrixSelections.get(attribute.name);
    if (matrixSelection) {
      if (matrixSelection.firstAttributeName === attribute.name) {
        bufferLayout.push(matrixSelection.layout);
      }
      continue;
    }

    const columnInfo = getArrowColumnInfoFromSource(source, attribute.name);
    if (!columnInfo) {
      continue;
    }

    bufferLayout.push({
      name: attribute.name,
      format: getArrowVertexFormat(columnInfo, attribute.type, options),
      ...(attribute.stepMode ? {stepMode: attribute.stepMode} : {})
    });
  }

  return bufferLayout;
}

type ArrowMatrixBufferLayoutSelection = {
  firstAttributeName: string;
  layout: BufferLayout;
};

function getArrowMatrixBufferLayouts(
  shaderLayout: ShaderLayout,
  source: ArrowBufferLayoutSource
): Map<string, ArrowMatrixBufferLayoutSelection> {
  const matrixSelections = new Map<string, ArrowMatrixBufferLayoutSelection>();
  if (source.type !== 'table') {
    return matrixSelections;
  }

  const attributesByArrowPath = new Map<string, ShaderLayout['attributes']>();
  for (const attribute of shaderLayout.attributes) {
    const arrowPath = source.arrowPaths?.[attribute.name] || attribute.name;
    const pathAttributes = attributesByArrowPath.get(arrowPath) || [];
    pathAttributes.push(attribute);
    attributesByArrowPath.set(arrowPath, pathAttributes);
  }

  for (const [arrowPath, attributes] of attributesByArrowPath) {
    if (attributes.length <= 1) {
      continue;
    }

    const vector = getArrowVectorByPath(source.arrowTable, arrowPath);
    const matrixInfo = getArrowMatrixVectorInfo(vector);
    if (!matrixInfo) {
      throw new Error(
        `Arrow column "${arrowPath}" maps to multiple shader attributes but is not a recognized matrix vector`
      );
    }
    if (attributes.length !== matrixInfo.columns) {
      throw new Error(
        `Arrow matrix column "${arrowPath}" expects ${matrixInfo.columns} shader vector attributes`
      );
    }

    const declaredStepModes = new Set(
      attributes.map(attribute => attribute.stepMode).filter(Boolean)
    );
    if (declaredStepModes.size > 1) {
      throw new Error(`Arrow matrix column "${arrowPath}" requires matching attribute step modes`);
    }

    const format = `float32x${matrixInfo.rows}` as VertexFormat;
    for (const attribute of attributes) {
      const attributeInfo = shaderTypeDecoder.getAttributeShaderTypeInfo(attribute.type);
      if (attributeInfo.primitiveType !== 'f32' || attributeInfo.components !== matrixInfo.rows) {
        throw new Error(
          `Arrow matrix column "${arrowPath}" requires vec${matrixInfo.rows}<f32> shader attributes`
        );
      }
    }

    const firstAttributeName = attributes[0].name;
    const schema: BufferSchema = Object.fromEntries(
      attributes.map((attribute, columnIndex) => [
        attribute.name,
        {
          format,
          elementOffset: columnIndex * matrixInfo.columnStride
        }
      ])
    );
    const layout = getAttributeLayoutFromBufferSchema({
      name: arrowPath,
      byteStride: matrixInfo.byteStride,
      bytesPerElement: Float32Array.BYTES_PER_ELEMENT,
      schema,
      ...(attributes[0].stepMode ? {stepMode: attributes[0].stepMode} : {})
    });
    const selection = {firstAttributeName, layout};
    for (const attribute of attributes) {
      matrixSelections.set(attribute.name, selection);
    }
  }

  return matrixSelections;
}

function normalizeArrowBufferLayoutArguments(
  firstArgument: ShaderLayout,
  secondArgument: ArrowBufferLayoutOptions
): {
  shaderLayout: ShaderLayout;
  options: ArrowBufferLayoutOptions;
  source: ArrowBufferLayoutSource;
} {
  const shaderLayout = firstArgument;
  const options = secondArgument;
  const hasArrowTable = Boolean(options.arrowTable);
  const hasArrowVectors = Boolean(options.arrowVectors);

  if (hasArrowTable === hasArrowVectors) {
    throw new Error('getArrowBufferLayout requires exactly one of arrowTable or arrowVectors');
  }

  return {
    shaderLayout,
    options,
    source: hasArrowTable
      ? {
          type: 'table',
          arrowTable: options.arrowTable!,
          arrowTablePaths: new Set(getArrowPaths(options.arrowTable!)),
          arrowPaths: options.arrowPaths
        }
      : {type: 'vectors', arrowVectors: options.arrowVectors!}
  };
}

function getArrowColumnInfoFromSource(
  source: ArrowBufferLayoutSource,
  attributeName: string
): ArrowColumnInfo | null {
  switch (source.type) {
    case 'vectors': {
      const vector = source.arrowVectors[attributeName];
      return vector ? getArrowColumnInfoFromVector(vector) : null;
    }

    case 'table': {
      const hasExplicitPath = Boolean(
        source.arrowPaths && Object.prototype.hasOwnProperty.call(source.arrowPaths, attributeName)
      );
      const arrowPath = source.arrowPaths?.[attributeName] || attributeName;

      if (!hasExplicitPath && !source.arrowTablePaths.has(arrowPath)) {
        return null;
      }

      const columnInfo = getArrowColumnInfo(source.arrowTable, arrowPath);
      if (!columnInfo) {
        throw new Error(`Arrow column "${arrowPath}" is not compatible with shader attributes`);
      }
      return columnInfo;
    }

    default:
      throw new Error('Unknown Arrow buffer layout source');
  }
}

function getArrowColumnInfoFromVector(vector: Vector): ArrowColumnInfo {
  if (!isInstanceArrowType(vector.type)) {
    throw new Error('Arrow vector is not compatible with shader attributes');
  }
  return getInstanceColumnInfo(vector as Vector<AttributeArrowType>);
}

function getFloatShaderVertexFormat(
  columnInfo: ArrowColumnInfo,
  shaderType: AttributeShaderType,
  shaderUsesF16: boolean,
  options?: ArrowVertexFormatOptions
): VertexFormat {
  switch (columnInfo.signedDataType) {
    case 'float32':
      if (shaderUsesF16) {
        throw new Error(
          `Arrow float32 columns cannot be used with ${shaderType}; use float16 or normalized integer columns for f16 shader attributes`
        );
      }
      return vertexFormatDecoder.makeVertexFormat('float32', columnInfo.components);
    case 'float16':
      return makePortableVertexFormat('float16', columnInfo.components, false, shaderType, options);
    case 'sint8':
    case 'sint16':
      return makePortableVertexFormat(
        columnInfo.signedDataType,
        columnInfo.components,
        true,
        shaderType,
        options
      );
    case 'uint8':
    case 'uint16':
      return makePortableVertexFormat(
        columnInfo.signedDataType,
        columnInfo.components,
        true,
        shaderType,
        options
      );
    case 'sint32':
    case 'uint32':
      throw new Error(
        `Arrow ${columnInfo.signedDataType} columns cannot be used with ${shaderType}; WebGPU has no normalized 32-bit integer vertex format`
      );
    default:
      throw new Error(`Unsupported Arrow data type ${columnInfo.signedDataType}`);
  }
}

function getIntegerShaderVertexFormat(
  columnInfo: ArrowColumnInfo,
  shaderType: AttributeShaderType,
  signed: boolean,
  options?: ArrowVertexFormatOptions
): VertexFormat {
  if (columnInfo.signedDataType.startsWith('float')) {
    throw new Error(`Arrow ${columnInfo.signedDataType} columns cannot be used with ${shaderType}`);
  }

  if (isSignedIntegerDataType(columnInfo.signedDataType) !== signed) {
    throw new Error(
      `Arrow ${columnInfo.signedDataType} column signedness does not match ${shaderType}`
    );
  }

  return makePortableVertexFormat(
    columnInfo.signedDataType,
    columnInfo.components,
    false,
    shaderType,
    options
  );
}

function makePortableVertexFormat(
  signedDataType: SignedDataType,
  components: 1 | 2 | 3 | 4,
  normalized: boolean,
  shaderType: AttributeShaderType,
  options?: ArrowVertexFormatOptions
): VertexFormat {
  try {
    const vertexFormat = vertexFormatDecoder.makeVertexFormat(
      signedDataType,
      components,
      normalized
    );
    if (vertexFormat.endsWith('-webgl') && !options?.allowWebGLOnlyFormats) {
      throw new Error(`WebGL-only vertex format ${vertexFormat}`);
    }
    return vertexFormat;
  } catch (error) {
    if (!options?.allowWebGLOnlyFormats) {
      throw new Error(
        `Arrow ${signedDataType}x${components} cannot be used with ${shaderType} in portable WebGPU layouts`
      );
    }

    if (components === 3) {
      return makeWebGLOnlyVertexFormat(signedDataType, normalized);
    }

    throw error;
  }
}

function makeWebGLOnlyVertexFormat(
  signedDataType: SignedDataType,
  normalized: boolean
): VertexFormat {
  switch (signedDataType) {
    case 'sint8':
      return normalized ? 'snorm8x3-webgl' : 'sint8x3-webgl';
    case 'uint8':
      return normalized ? 'unorm8x3-webgl' : 'uint8x3-webgl';
    case 'sint16':
      return normalized ? 'snorm16x3-webgl' : 'sint16x3-webgl';
    case 'uint16':
      return normalized ? 'unorm16x3-webgl' : 'uint16x3-webgl';
    default:
      throw new Error(`No WebGL-only 3-component vertex format for ${signedDataType}`);
  }
}

function isSignedIntegerDataType(signedDataType: SignedDataType): boolean {
  switch (signedDataType) {
    case 'sint8':
    case 'sint16':
    case 'sint32':
      return true;
    case 'uint8':
    case 'uint16':
    case 'uint32':
      return false;
    default:
      throw new Error(`Arrow ${signedDataType} is not an integer type`);
  }
}

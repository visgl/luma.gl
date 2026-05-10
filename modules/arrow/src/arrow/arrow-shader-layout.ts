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
import * as arrow from 'apache-arrow';
import {getArrowPaths} from './arrow-paths';
import {getArrowColumnInfo, getInstanceColumnInfo} from './arrow-column-info';
import {isInstanceArrowType, type ArrowColumnInfo, type AttributeArrowType} from './arrow-types';

export type ArrowVertexFormatOptions = {
  /** Allow WebGL-only 3-component 8/16-bit integer vertex formats. */
  allowWebGLOnlyFormats?: boolean;
};

export type ArrowBufferLayoutOptions = ArrowVertexFormatOptions & {
  /** Arrow vectors keyed by shader attribute name. */
  arrowVectors?: Record<string, arrow.Vector>;
  /** Arrow table containing columns referenced by shader attribute name or arrowPaths. */
  arrowTable?: arrow.Table;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** @deprecated Use arrowPaths. */
  attributeNameToArrowPath?: Record<string, string>;
};

type ArrowBufferLayoutSource =
  | {
      type: 'table';
      arrowTable: arrow.Table;
      arrowTablePaths: Set<string>;
      arrowPaths?: Record<string, string>;
    }
  | {type: 'vectors'; arrowVectors: Record<string, arrow.Vector>};

/** Returns the vertex format needed to expose one Arrow column to one shader attribute. */
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

/** Builds a BufferLayout that maps matching Arrow columns to shader attributes. */
export function getArrowBufferLayout(
  shaderLayout: ShaderLayout,
  options: ArrowBufferLayoutOptions
): BufferLayout[];
/** @deprecated Use getArrowBufferLayout(shaderLayout, {arrowTable, arrowPaths}). */
export function getArrowBufferLayout(
  arrowTable: arrow.Table,
  shaderLayout: ShaderLayout,
  options?: ArrowBufferLayoutOptions
): BufferLayout[];
export function getArrowBufferLayout(
  firstArgument: ShaderLayout | arrow.Table,
  secondArgument: ShaderLayout | ArrowBufferLayoutOptions,
  thirdArgument?: ArrowBufferLayoutOptions
): BufferLayout[] {
  const {shaderLayout, options, source} = normalizeArrowBufferLayoutArguments(
    firstArgument,
    secondArgument,
    thirdArgument
  );
  const bufferLayout: BufferLayout[] = [];

  for (const attribute of shaderLayout.attributes) {
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

function normalizeArrowBufferLayoutArguments(
  firstArgument: ShaderLayout | arrow.Table,
  secondArgument: ShaderLayout | ArrowBufferLayoutOptions,
  thirdArgument?: ArrowBufferLayoutOptions
): {
  shaderLayout: ShaderLayout;
  options: ArrowBufferLayoutOptions;
  source: ArrowBufferLayoutSource;
} {
  if (firstArgument instanceof arrow.Table) {
    const arrowTable = firstArgument;
    const shaderLayout = secondArgument as ShaderLayout;
    const options = thirdArgument || {};

    if (options.arrowTable || options.arrowVectors) {
      throw new Error(
        'Do not provide arrowTable or arrowVectors when using the legacy table overload'
      );
    }

    return {
      shaderLayout,
      options,
      source: {
        type: 'table',
        arrowTable,
        arrowTablePaths: new Set(getArrowPaths(arrowTable)),
        arrowPaths: options.arrowPaths || options.attributeNameToArrowPath
      }
    };
  }

  const shaderLayout = firstArgument;
  const options = secondArgument as ArrowBufferLayoutOptions;
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

function getArrowColumnInfoFromVector(vector: arrow.Vector): ArrowColumnInfo {
  if (!isInstanceArrowType(vector.type)) {
    throw new Error('Arrow vector is not compatible with shader attributes');
  }
  return getInstanceColumnInfo(vector as arrow.Vector<AttributeArrowType>);
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

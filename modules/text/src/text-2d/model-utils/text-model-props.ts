// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ModelProps} from '@luma.gl/engine';
import {
  assertModelGPUVectorInputs,
  type GPUVector,
  type ModelGPUInputSchema,
  type ModelGPUInputVectors,
  type ValueList,
  type VertexList
} from '@luma.gl/tables';
import type {FontAtlas, FontSettings} from '../atlas/font-atlas-manager';
import type {CharacterMapping} from '../atlas/text-utils';

const TEXT_DICTIONARY_INDEX_FORMATS = [
  'sint8',
  'sint16',
  'sint32',
  'uint8',
  'uint16',
  'uint32'
] as const;
const TEXT_FORMATS = ['value-list<uint8>', ...TEXT_DICTIONARY_INDEX_FORMATS] as const;

/** Prepared GPU inputs consumed by attribute-backed 2D text models. */
export const TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA = [
  {
    name: 'positions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    name: 'texts',
    kind: 'text',
    required: true,
    formats: TEXT_FORMATS
  },
  {
    name: 'colors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4', 'vertex-list<unorm8x4>']
  },
  {
    name: 'angles',
    kind: 'scalars',
    required: false,
    formats: ['float32']
  },
  {
    name: 'sizes',
    kind: 'scalars',
    required: false,
    formats: ['float32']
  },
  {
    name: 'pixelOffsets',
    kind: 'positions',
    required: false,
    formats: ['float32x2']
  },
  {
    name: 'clipRects',
    kind: 'positions',
    required: false,
    formats: ['sint16x4']
  }
] as const satisfies ModelGPUInputSchema;

/** Prepared GPU inputs consumed by storage-backed 2D text models. */
export const TEXT_STORAGE_GPU_INPUT_SCHEMA = [
  {
    name: 'positions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    name: 'texts',
    kind: 'text',
    required: true,
    formats: TEXT_FORMATS
  },
  {
    name: 'colors',
    kind: 'colors',
    required: false,
    formats: ['unorm8x4']
  },
  {
    name: 'angles',
    kind: 'scalars',
    required: false,
    formats: ['float32']
  },
  {
    name: 'sizes',
    kind: 'scalars',
    required: false,
    formats: ['float32']
  },
  {
    name: 'pixelOffsets',
    kind: 'positions',
    required: false,
    formats: ['float32x2']
  },
  {
    name: 'textAnchors',
    kind: 'scalars',
    required: false,
    formats: ['uint8']
  },
  {
    name: 'alignmentBaselines',
    kind: 'scalars',
    required: false,
    formats: ['uint8']
  },
  {
    name: 'clipRects',
    kind: 'positions',
    required: false,
    formats: ['sint16x4']
  }
] as const satisfies ModelGPUInputSchema;

/** Prepared GPU inputs consumed by dictionary storage-backed 2D text models. */
export const TEXT_DICTIONARY_GPU_INPUT_SCHEMA = [
  {
    name: 'positions',
    kind: 'positions',
    required: true,
    formats: ['float32x2']
  },
  {
    name: 'texts',
    kind: 'text',
    required: true,
    formats: TEXT_DICTIONARY_INDEX_FORMATS
  },
  ...TEXT_STORAGE_GPU_INPUT_SCHEMA.slice(2)
] as const satisfies ModelGPUInputSchema;

/** GPUVector inputs shared by all 2D text model preparation paths. */
export interface TextInputProps extends ModelProps {
  /** GPU-resident label origins aligned one-for-one with `texts`; each row is `[x, y]`. */
  positions: GPUVector<'float32x2'>;
  /** GPU-resident UTF-8 value bytes or dictionary row keys aligned row-for-row with `positions`. */
  texts: GPUVector<
    ValueList<'uint8'> | 'sint8' | 'sint16' | 'sint32' | 'uint8' | 'uint16' | 'uint32'
  >;
  /** Optional GPU per-row angles in degrees. */
  angles?: GPUVector<'float32'>;
  /** Optional GPU per-row deck-style text sizes. */
  sizes?: GPUVector<'float32'>;
  /** Optional GPU per-row pixel offsets; each row is `[x, y]`. */
  pixelOffsets?: GPUVector<'float32x2'>;
  /**
   * Optional GPU packed per-label clip rectangles `[x, y, width, height]`.
   * Negative width or height disables clipping on that axis.
   */
  clipRects?: GPUVector<'sint16x4'>;
  /** Character set for atlas generation. Pass `'auto'` when the adapter should derive it. */
  characterSet?: FontSettings['characterSet'] | 'auto';
  /** Font atlas generation settings. */
  fontSettings?: FontSettings;
  /** Multiplier applied to the atlas font size for one-line baseline layout. */
  lineHeight?: number;
  /** Optional deterministic mapping, mainly useful when atlas generation is managed externally. */
  characterMapping?: CharacterMapping;
  /** Optional prebuilt atlas for texture binding when `characterMapping` is injected. */
  fontAtlas?: FontAtlas;
}

/** GPUVector inputs for attribute-backed 2D text preparation. */
export interface TextAttributeInputProps extends TextInputProps {
  /** Optional GPU packed RGBA8 text colors aligned with label rows or label characters. */
  colors?: GPUVector<'unorm8x4' | VertexList<'unorm8x4'>>;
}

/** GPUVector inputs for storage-backed 2D text preparation. */
export interface TextStorageInputProps extends Omit<TextInputProps, 'texts'> {
  /** GPU-resident UTF-8 value bytes or dictionary row keys aligned row-for-row with `positions`. */
  texts: TextInputProps['texts'];
  /** Optional GPU packed RGBA8 text colors aligned with label rows. */
  colors?: GPUVector<'unorm8x4'>;
  /** Optional GPU per-row text anchor enum: 0=start, 1=middle, 2=end. */
  textAnchors?: GPUVector<'uint8'>;
  /** Optional GPU per-row alignment baseline enum: 0=center, 1=top, 2=bottom. */
  alignmentBaselines?: GPUVector<'uint8'>;
  /** Constant fallback color used when `colors` is absent. */
  color?: [number, number, number, number];
  /** Constant fallback angle in degrees used when `angles` is absent. */
  angle?: number;
  /** Constant fallback deck-style text size used when `sizes` is absent. */
  size?: number;
  /** Constant fallback pixel offset used when `pixelOffsets` is absent. */
  pixelOffset?: [number, number];
  /** Constant fallback text anchor used when `textAnchors` is absent. */
  textAnchor?: 'start' | 'middle' | 'end';
  /** Constant fallback alignment baseline used when `alignmentBaselines` is absent. */
  alignmentBaseline?: 'center' | 'top' | 'bottom';
}

/** GPUVector inputs for compressed dictionary storage-backed 2D text preparation. */
export interface TextDictionaryInputProps extends Omit<TextStorageInputProps, 'texts'> {
  /** GPU-resident dictionary row keys aligned row-for-row with `positions`. */
  texts: GPUVector<'sint8' | 'sint16' | 'sint32' | 'uint8' | 'uint16' | 'uint32'>;
}

/** Validates prepared attribute text GPU vectors before building render state. */
export function assertTextAttributeGPUVectorInputs(props: TextAttributeInputProps): void {
  assertTextGPUVectorInputs('TextAttributeModel', TEXT_ATTRIBUTE_GPU_INPUT_SCHEMA, props);
}

/** Validates prepared storage text GPU vectors before building render state. */
export function assertTextStorageGPUVectorInputs(props: TextStorageInputProps): void {
  assertTextGPUVectorInputs('TextStorageModel', TEXT_STORAGE_GPU_INPUT_SCHEMA, props);
}

/** Validates prepared dictionary text GPU vectors before building render state. */
export function assertTextDictionaryGPUVectorInputs(props: TextDictionaryInputProps): void {
  assertTextGPUVectorInputs('TextDictionaryModel', TEXT_DICTIONARY_GPU_INPUT_SCHEMA, props);
}

function assertTextGPUVectorInputs(
  modelName: string,
  schema: ModelGPUInputSchema,
  props: TextInputProps
): void {
  const vectors = Object.fromEntries(
    schema.map(input => [input.name, props[input.name as keyof TextInputProps]])
  ) as ModelGPUInputVectors;
  assertModelGPUVectorInputs(modelName, schema, vectors);
  const rowCount = props.positions.length;
  for (const input of schema) {
    const vector = vectors[input.name];
    if (!vector) {
      continue;
    }
    if (vector.length !== rowCount) {
      throw new Error(
        `${modelName} ${input.name} rows must match positions rows (${vector.length} !== ${rowCount})`
      );
    }
  }
}

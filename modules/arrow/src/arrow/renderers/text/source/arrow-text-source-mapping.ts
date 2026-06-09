// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch, Table, Vector} from 'apache-arrow';
import type {ArrowUtf8TextVector} from '../preparation';
import {getArrowPaths, getArrowVectorByPath} from '../../../arrow-utils/arrow-paths';

/** Raw Arrow table or record batch accepted by text source mapping helpers. */
export type ArrowTextSourceData = Table | RecordBatch;
/** Arrow row color column type: one packed RGBA8 color per text row. */
export type RowColorColumnDataType = import('apache-arrow').FixedSizeList<
  import('apache-arrow').Uint8
>;
/** Arrow character color column type: one packed RGBA8 color per glyph in each text row. */
export type CharacterColorDataType = import('apache-arrow').List<RowColorColumnDataType>;
/** Raw Arrow text column selector accepted by text source mapping helpers. */
export type ArrowTextColumnSelector<TypeT extends import('apache-arrow').DataType> =
  | string
  | Vector<TypeT>;
/** Optional raw Arrow text column selector; `null` explicitly disables the column. */
export type OptionalArrowTextColumnSelector<TypeT extends import('apache-arrow').DataType> =
  | ArrowTextColumnSelector<TypeT>
  | null
  | undefined;
/** Raw Arrow selectors keyed by text preparation input names. */
export type ArrowTextSourceVectorSelectors = {
  /** Label origins. Defaults to `positions`. */
  positions?: ArrowTextColumnSelector<
    import('apache-arrow').FixedSizeList<import('apache-arrow').Float32>
  >;
  /** UTF-8 labels. Defaults to `texts`. */
  texts?: string | ArrowUtf8TextVector;
  /** Clip rectangles. Defaults to `clipRects`; `null` disables them. */
  clipRects?: OptionalArrowTextColumnSelector<
    import('apache-arrow').FixedSizeList<import('apache-arrow').Int16>
  >;
  /** Row/character colors. Defaults to `colors`; `null` disables them. */
  colors?: OptionalArrowTextColumnSelector<RowColorColumnDataType | CharacterColorDataType>;
  /** Row angles. Defaults to `angles`; `null` disables them. */
  angles?: OptionalArrowTextColumnSelector<import('apache-arrow').Float32>;
  /** Row sizes. Defaults to `sizes`; `null` disables them. */
  sizes?: OptionalArrowTextColumnSelector<import('apache-arrow').Float32>;
  /** Pixel offsets. Defaults to `pixelOffsets`; `null` disables them. */
  pixelOffsets?: OptionalArrowTextColumnSelector<
    import('apache-arrow').FixedSizeList<import('apache-arrow').Float32>
  >;
  /** Row text anchor enum values. Defaults to `textAnchors`; `null` disables them. */
  textAnchors?: OptionalArrowTextColumnSelector<import('apache-arrow').Uint8>;
  /** Row alignment baseline enum values. Defaults to `alignmentBaselines`; `null` disables them. */
  alignmentBaselines?: OptionalArrowTextColumnSelector<import('apache-arrow').Uint8>;
};
/** Resolved raw Arrow vectors consumed by text preparation helpers. */
export type ArrowTextMappedSourceVectors = {
  positions: Vector<import('apache-arrow').FixedSizeList<import('apache-arrow').Float32>>;
  texts: ArrowUtf8TextVector;
  clipRects?: Vector<import('apache-arrow').FixedSizeList<import('apache-arrow').Int16>>;
  colors?: Vector<RowColorColumnDataType | CharacterColorDataType>;
  angles?: Vector<import('apache-arrow').Float32>;
  sizes?: Vector<import('apache-arrow').Float32>;
  pixelOffsets?: Vector<import('apache-arrow').FixedSizeList<import('apache-arrow').Float32>>;
  textAnchors?: Vector<import('apache-arrow').Uint8>;
  alignmentBaselines?: Vector<import('apache-arrow').Uint8>;
};
/** Props for resolving raw Arrow text source columns. */
export type ResolveArrowTextSourceVectorsProps = {
  /** Raw Arrow table or record batch containing same-name or selected source columns. */
  data?: ArrowTextSourceData | null;
  /** Explicit raw Arrow column selectors keyed by text preparation inputs. */
  selectors?: ArrowTextSourceVectorSelectors;
};

/** Resolves raw Arrow text source vectors before GPU upload and glyph preparation. */
export function resolveArrowTextSourceVectors(
  props: ResolveArrowTextSourceVectorsProps = {}
): ArrowTextMappedSourceVectors {
  const selectors = props.selectors ?? {};
  const table = getArrowTextSourceTable(props.data);
  const availablePaths = new Set(table ? getArrowPaths(table) : []);
  const positions = resolveRequiredArrowTextSourceVector(
    'positions',
    selectors.positions,
    table,
    availablePaths
  );
  const texts = resolveRequiredArrowTextSourceVector(
    'texts',
    selectors.texts,
    table,
    availablePaths
  );
  const clipRects = resolveOptionalArrowTextSourceVector(
    'clipRects',
    selectors.clipRects,
    table,
    availablePaths
  );
  const colors = resolveOptionalArrowTextSourceVector(
    'colors',
    selectors.colors,
    table,
    availablePaths
  );
  const angles = resolveOptionalArrowTextSourceVector(
    'angles',
    selectors.angles,
    table,
    availablePaths
  );
  const sizes = resolveOptionalArrowTextSourceVector(
    'sizes',
    selectors.sizes,
    table,
    availablePaths
  );
  const pixelOffsets = resolveOptionalArrowTextSourceVector(
    'pixelOffsets',
    selectors.pixelOffsets,
    table,
    availablePaths
  );
  const textAnchors = resolveOptionalArrowTextSourceVector(
    'textAnchors',
    selectors.textAnchors,
    table,
    availablePaths
  );
  const alignmentBaselines = resolveOptionalArrowTextSourceVector(
    'alignmentBaselines',
    selectors.alignmentBaselines,
    table,
    availablePaths
  );

  return {
    positions,
    texts,
    ...(clipRects ? {clipRects} : {}),
    ...(colors ? {colors} : {}),
    ...(angles ? {angles} : {}),
    ...(sizes ? {sizes} : {}),
    ...(pixelOffsets ? {pixelOffsets} : {}),
    ...(textAnchors ? {textAnchors} : {}),
    ...(alignmentBaselines ? {alignmentBaselines} : {})
  };
}

function getArrowTextSourceTable(data: ArrowTextSourceData | null | undefined): Table | undefined {
  if (!data) {
    return undefined;
  }
  return data instanceof Table ? data : new Table([data]);
}

function resolveRequiredArrowTextSourceVector<TypeT extends import('apache-arrow').DataType>(
  inputName: 'positions' | 'texts',
  selector: ArrowTextColumnSelector<TypeT> | undefined,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector<TypeT> {
  const vector = resolveArrowTextSourceVector(inputName, selector, table, availablePaths);
  if (!vector) {
    throw new Error(`ArrowTextRenderer source mapping requires ${inputName}`);
  }
  return vector as Vector<TypeT>;
}

function resolveOptionalArrowTextSourceVector<TypeT extends import('apache-arrow').DataType>(
  inputName:
    | 'clipRects'
    | 'colors'
    | 'angles'
    | 'sizes'
    | 'pixelOffsets'
    | 'textAnchors'
    | 'alignmentBaselines',
  selector: OptionalArrowTextColumnSelector<TypeT>,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector<TypeT> | undefined {
  if (selector === null) {
    return undefined;
  }
  return resolveArrowTextSourceVector(inputName, selector, table, availablePaths) as
    | Vector<TypeT>
    | undefined;
}

function resolveArrowTextSourceVector(
  inputName: keyof ArrowTextSourceVectorSelectors,
  selector: ArrowTextColumnSelector<import('apache-arrow').DataType> | undefined,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector | undefined {
  if (selector instanceof Vector) {
    return selector;
  }

  const columnPath = selector ?? inputName;
  if (!table) {
    if (selector === undefined && inputName !== 'positions' && inputName !== 'texts') {
      return undefined;
    }
    throw new Error(
      `ArrowTextRenderer source selector "${inputName}" requires data to resolve column "${columnPath}"`
    );
  }
  if (!availablePaths.has(columnPath)) {
    if (selector === undefined && inputName !== 'positions' && inputName !== 'texts') {
      return undefined;
    }
    throw new Error(
      `ArrowTextRenderer source column "${columnPath}" for "${inputName}" is missing`
    );
  }

  return getArrowVectorByPath(table, columnPath);
}

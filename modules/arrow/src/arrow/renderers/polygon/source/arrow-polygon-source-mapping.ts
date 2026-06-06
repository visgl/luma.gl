// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch, Table, Vector, type DataType} from 'apache-arrow';
import type {
  ArrowPolygonColorType,
  ArrowPolygonInputType,
  ArrowPolygonSourceVectors
} from '@math.gl/geoarrow';
import {getArrowPaths, getArrowVectorByPath} from '../../../core/arrow-paths';

/** Raw Arrow table or record batch accepted by polygon source mapping helpers. */
export type ArrowPolygonSourceData = Table | RecordBatch;
/** Raw Arrow polygon column selector accepted by polygon source mapping helpers. */
export type ArrowPolygonColumnSelector<TypeT extends DataType = DataType> = string | Vector<TypeT>;
/** Optional raw Arrow polygon column selector; `null` explicitly disables the column. */
export type OptionalArrowPolygonColumnSelector<TypeT extends DataType = DataType> =
  | ArrowPolygonColumnSelector<TypeT>
  | null
  | undefined;
/** Raw Arrow selectors keyed by polygon preparation input names. */
export type ArrowPolygonSourceVectorSelectors = {
  /** Source polygon geometry column. Defaults to `polygons`. */
  polygons?: ArrowPolygonColumnSelector<ArrowPolygonInputType>;
  /** Source row/vertex color column. Defaults to `colors`; `null` disables it. */
  colors?: OptionalArrowPolygonColumnSelector<ArrowPolygonColorType>;
};
/** Props for resolving raw Arrow polygon source columns. */
export type ResolveArrowPolygonSourceVectorsProps = {
  /** Raw Arrow table or record batch containing same-name or selected source columns. */
  data?: ArrowPolygonSourceData | null;
  /** Explicit raw Arrow column selectors keyed by polygon preparation inputs. */
  selectors?: ArrowPolygonSourceVectorSelectors;
};

/** Resolves raw Arrow polygon source vectors before GPU tessellation/preparation. */
export function resolveArrowPolygonSourceVectors(
  props: ResolveArrowPolygonSourceVectorsProps = {}
): ArrowPolygonSourceVectors {
  const selectors = props.selectors ?? {};
  const table = getArrowPolygonSourceTable(props.data);
  const availablePaths = new Set(table ? getArrowPaths(table) : []);
  const polygons = resolveRequiredArrowPolygonSourceVector(
    selectors.polygons,
    table,
    availablePaths
  );
  const colors = resolveOptionalArrowPolygonSourceVector(selectors.colors, table, availablePaths);
  return colors ? {polygons, colors} : {polygons};
}

function getArrowPolygonSourceTable(
  data: ArrowPolygonSourceData | null | undefined
): Table | undefined {
  if (!data) {
    return undefined;
  }
  return data instanceof Table ? data : new Table([data]);
}

function resolveRequiredArrowPolygonSourceVector(
  selector: ArrowPolygonColumnSelector<ArrowPolygonInputType> | undefined,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector<ArrowPolygonInputType> {
  const vector = resolveArrowPolygonSourceVector('polygons', selector, table, availablePaths);
  if (!vector) {
    throw new Error('ArrowPolygonRenderer source mapping requires polygons');
  }
  return vector as Vector<ArrowPolygonInputType>;
}

function resolveOptionalArrowPolygonSourceVector(
  selector: OptionalArrowPolygonColumnSelector<ArrowPolygonColorType>,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector<ArrowPolygonColorType> | undefined {
  if (selector === null) {
    return undefined;
  }
  return resolveArrowPolygonSourceVector('colors', selector, table, availablePaths) as
    | Vector<ArrowPolygonColorType>
    | undefined;
}

function resolveArrowPolygonSourceVector(
  inputName: 'polygons' | 'colors',
  selector: ArrowPolygonColumnSelector | undefined,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector | undefined {
  if (selector instanceof Vector) {
    return selector;
  }

  const columnPath = selector ?? inputName;
  if (!table) {
    if (selector === undefined && inputName === 'colors') {
      return undefined;
    }
    throw new Error(
      `ArrowPolygonRenderer source selector "${inputName}" requires data to resolve column "${columnPath}"`
    );
  }
  if (!availablePaths.has(columnPath)) {
    if (selector === undefined && inputName === 'colors') {
      return undefined;
    }
    throw new Error(
      `ArrowPolygonRenderer source column "${columnPath}" for "${inputName}" is missing`
    );
  }

  return getArrowVectorByPath(table, columnPath);
}

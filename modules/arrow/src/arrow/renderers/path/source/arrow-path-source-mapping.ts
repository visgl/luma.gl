// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RecordBatch, Table, Vector, type DataType} from 'apache-arrow';
import type {GPUInputDeclaration, GPUInputSchema} from '@luma.gl/tables';
import type {ArrowPathSourceVectors} from '../conversion/arrow-path-gpu-vectors';
import {getArrowPaths, getArrowVectorByPath} from '../../../arrow-utils/arrow-paths';

type ArrowVectorDataType<VectorT extends Vector> =
  VectorT extends Vector<infer TypeT> ? TypeT : DataType;
type ArrowPathSourceInputName = keyof ArrowPathMappedSourceVectors;

/** Raw Arrow table or record batch accepted by path source mapping helpers. */
export type ArrowPathSourceData = Table | RecordBatch;
/** Raw Arrow column selector accepted by path source mapping helpers. */
export type ArrowColumnSelector<TypeT extends DataType = DataType> = string | Vector<TypeT>;
/** Optional raw Arrow column selector accepted by path source mapping helpers. */
export type OptionalArrowColumnSelector<TypeT extends DataType = DataType> =
  | ArrowColumnSelector<TypeT>
  | null
  | undefined;
/** Raw Arrow selectors keyed by source-mappable path-family GPU input names. */
export type ArrowPathSourceVectorSelectors = {
  /** Source path coordinate column. Defaults to `paths`. */
  paths?: ArrowColumnSelector<ArrowVectorDataType<ArrowPathSourceVectors['paths']>>;
  /** Source path color column. Defaults to `colors`; `null` disables it. */
  colors?: OptionalArrowColumnSelector<
    ArrowVectorDataType<NonNullable<ArrowPathSourceVectors['colors']>>
  >;
  /** Source path width column. Defaults to `widths`; `null` disables it. */
  widths?: OptionalArrowColumnSelector<
    ArrowVectorDataType<NonNullable<ArrowPathSourceVectors['widths']>>
  >;
  /** Source path timestamp column. Defaults to `timestamps`; `null` disables it. */
  timestamps?: OptionalArrowColumnSelector<
    ArrowVectorDataType<NonNullable<ArrowPathSourceVectors['timestamps']>>
  >;
};
/** Schema-bearing Arrow path-family model constructor accepted by source mapping helpers. */
export type ArrowPathSourceMappingModel = {
  /** Runtime prepared GPU input contract. */
  readonly gpuInputSchema: GPUInputSchema;
  /** Constructor name used in mapping errors when available. */
  readonly name?: string;
};
/** Props for resolving raw Arrow path-family source columns. */
export type ResolveArrowPathSourceVectorsProps = {
  /** Raw Arrow table or record batch containing same-name or selected source columns. */
  data?: ArrowPathSourceData | null;
  /** Explicit raw Arrow column selectors keyed by declared source-mappable inputs. */
  selectors?: ArrowPathSourceVectorSelectors;
};
/** Source-mapped raw Arrow path vectors before source-only inputs such as `closed` are added. */
export type ArrowPathMappedSourceVectors = Omit<ArrowPathSourceVectors, 'closed'>;

/** Resolves raw Arrow path-family source vectors from one schema-bearing model declaration. */
export function resolveArrowPathSourceVectors(
  model: ArrowPathSourceMappingModel,
  props: ResolveArrowPathSourceVectorsProps = {}
): ArrowPathMappedSourceVectors {
  const modelName = model.name || 'PathModel';
  const selectors = props.selectors || {};
  const table = getArrowPathSourceTable(props.data);
  const availablePaths = new Set(table ? getArrowPaths(table) : []);
  const sourceMappableInputs = getArrowPathSourceMappableInputs(model.gpuInputSchema);

  assertArrowPathSourceSelectors(modelName, sourceMappableInputs, selectors);

  const sourceVectors: Partial<ArrowPathMappedSourceVectors> = {};
  for (const input of sourceMappableInputs) {
    if (!isArrowPathSourceInputName(input.columnName)) {
      throw new Error(
        `${modelName} source mapping does not support GPU input "${input.columnName}"`
      );
    }
    const vector = resolveArrowPathSourceVector(
      modelName,
      input,
      selectors[input.columnName],
      table,
      availablePaths
    );
    if (vector) {
      setArrowPathSourceVector(sourceVectors, input.columnName, vector);
    }
  }

  if (!sourceVectors.paths) {
    throw new Error(`${modelName} source mapping requires paths`);
  }

  return sourceVectors as ArrowPathMappedSourceVectors;
}

function getArrowPathSourceTable(data: ArrowPathSourceData | null | undefined): Table | undefined {
  if (!data) {
    return undefined;
  }
  return data instanceof Table ? data : new Table([data]);
}

function getArrowPathSourceMappableInputs(schema: GPUInputSchema): GPUInputDeclaration[] {
  return schema.filter(input => !input.internal);
}

function assertArrowPathSourceSelectors(
  modelName: string,
  sourceMappableInputs: GPUInputDeclaration[],
  selectors: ArrowPathSourceVectorSelectors
): void {
  const sourceMappableInputNames = new Set(sourceMappableInputs.map(input => input.columnName));
  for (const [inputName, selector] of Object.entries(selectors)) {
    if (selector !== undefined && !sourceMappableInputNames.has(inputName)) {
      throw new Error(
        `${modelName} source selector "${inputName}" is not declared as source-mappable`
      );
    }
  }
}

function resolveArrowPathSourceVector(
  modelName: string,
  input: GPUInputDeclaration,
  selector: OptionalArrowColumnSelector,
  table: Table | undefined,
  availablePaths: Set<string>
): Vector | undefined {
  if (selector === null) {
    if (input.required) {
      throw new Error(`${modelName} source selector "${input.columnName}" cannot be null`);
    }
    return undefined;
  }
  if (selector instanceof Vector) {
    return selector;
  }

  const columnPath = selector ?? input.columnName;
  if (!table) {
    if (selector === undefined && !input.required) {
      return undefined;
    }
    throw new Error(
      `${modelName} source selector "${input.columnName}" requires data to resolve column "${columnPath}"`
    );
  }
  if (!availablePaths.has(columnPath)) {
    if (selector === undefined && !input.required) {
      return undefined;
    }
    throw new Error(
      `${modelName} source column "${columnPath}" for "${input.columnName}" is missing`
    );
  }

  return getArrowVectorByPath(table, columnPath);
}

function isArrowPathSourceInputName(inputName: string): inputName is ArrowPathSourceInputName {
  return (
    inputName === 'paths' ||
    inputName === 'colors' ||
    inputName === 'widths' ||
    inputName === 'timestamps'
  );
}

function setArrowPathSourceVector<InputName extends ArrowPathSourceInputName>(
  sourceVectors: Partial<ArrowPathMappedSourceVectors>,
  inputName: InputName,
  vector: Vector
): void {
  sourceVectors[inputName] = vector as ArrowPathMappedSourceVectors[InputName];
}

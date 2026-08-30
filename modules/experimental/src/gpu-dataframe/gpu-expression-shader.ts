// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import type {GPUDataFrame} from './gpu-data-frame';
import type {GPUDataFrameDerivedColumn} from './gpu-data-frame-query';
import type {
  GPUExpression,
  GPUExpressionBinaryOperator,
  GPUExpressionNode,
  GPUExpressionValue
} from './gpu-expression';

const MINIMUM_SINT32 = -0x80000000;
const MAXIMUM_SINT32 = 0x7fffffff;
const MAXIMUM_UINT32 = 0xffffffff;

/** Portable scalar memory formats accepted by generated dataframe filter kernels. @internal */
export type GPUQueryScalarFormat = 'float32' | 'sint32' | 'uint32';

/** One deduplicated source vector and optional validity sidecar consumed by a predicate. @internal */
export type GPUQueryExpressionColumn = {
  name: string;
  format: GPUQueryScalarFormat;
  nullable: boolean;
  index: number;
};

/** One fixed-size literal or caller-controlled parameter stored outside shader source. @internal */
export type GPUQueryExpressionControl = {
  name?: string;
  value: GPUExpressionValue;
  format: GPUQueryScalarFormat | 'boolean';
  index: number;
};

/** One selected numeric expression materialized into a source-aligned GPU vector. @internal */
export type GPUQueryExpressionOutput = {
  name: string;
  format: GPUQueryScalarFormat;
  nullable: boolean;
  value: string;
  valid: string;
  index: number;
};

/** Closed WGSL statements and metadata required by a graph-native dataframe predicate. @internal */
export type GPUQueryExpressionShaderPlan = {
  columns: readonly GPUQueryExpressionColumn[];
  controls: readonly GPUQueryExpressionControl[];
  outputs: readonly GPUQueryExpressionOutput[];
  statements: readonly string[];
  condition: string;
};

type GPUQueryValueFormat = GPUQueryScalarFormat | 'boolean';

type GPUQueryExpressionShaderValue = {
  format: GPUQueryValueFormat;
  value: string;
  valid: string;
  nullable: boolean;
};

type GPUQueryExpressionConstant = {
  format: GPUQueryScalarFormat;
  value: number;
};

/** Lowers immutable expressions without embedding user-controlled identifiers or values in WGSL. */
export function makeGPUQueryExpressionShaderPlan<T extends GPUTypeMap>(
  source: GPUDataFrame<T>,
  predicates: readonly GPUExpression<boolean, string>[],
  derivedColumns: readonly GPUDataFrameDerivedColumn[] = [],
  selectedColumns: readonly string[] = [],
  allowEmptyPredicates = false
): GPUQueryExpressionShaderPlan {
  if (predicates.length === 0 && derivedColumns.length === 0 && !allowEmptyPredicates) {
    throw new Error('GPUDataFrame filtering requires at least one predicate');
  }

  const planner = new GPUQueryExpressionShaderPlanner(source, derivedColumns);
  const outputs = selectedColumns.flatMap(name => {
    const derived = derivedColumns.find(column => column.name === name);
    if (!derived) {
      return [];
    }
    const expression = planner.emitDerived(derived);
    if (expression.format === 'boolean') {
      throw new Error('GPUDataFrame derived columns require numeric expressions');
    }
    return [
      {
        name,
        format: expression.format,
        nullable: expression.nullable,
        value: expression.value,
        valid: expression.valid,
        index: 0
      }
    ];
  });
  outputs.forEach((output, index) => {
    output.index = index;
  });
  const conditions = predicates.map(predicate => {
    const expression = planner.emit(predicate.node, 'boolean');
    if (expression.format !== 'boolean') {
      throw new Error('GPUDataFrame filter expressions must produce boolean values');
    }
    return `(${expression.valid} && ${expression.value})`;
  });

  return {
    columns: planner.columns,
    controls: planner.controls,
    outputs,
    statements: planner.statements,
    condition: conditions.join(' && ') || 'true'
  };
}

/** Packs validated default or per-encoding values into paired scalar and validity control words. */
export function encodeGPUQueryExpressionControls(
  controls: readonly GPUQueryExpressionControl[],
  parameters: Readonly<Record<string, GPUExpressionValue>>
): Uint32Array {
  const words = new Uint32Array(controls.length * 2);
  const floatingPointWords = new Float32Array(words.buffer);

  for (const control of controls) {
    const value =
      control.name !== undefined && Object.prototype.hasOwnProperty.call(parameters, control.name)
        ? parameters[control.name]
        : control.value;
    const valueIndex = control.index * 2;
    const validityIndex = valueIndex + 1;
    if (value === null) {
      words[validityIndex] = 0;
      continue;
    }

    if (control.format === 'boolean') {
      if (typeof value !== 'boolean') {
        throw new Error('GPUDataFrame boolean parameters require boolean values');
      }
      words[valueIndex] = value ? 1 : 0;
      words[validityIndex] = 1;
      continue;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('GPUDataFrame numeric parameters require finite numeric values');
    }
    if (control.format === 'float32') {
      if (!Number.isFinite(Math.fround(value))) {
        throw new Error('GPUDataFrame numeric parameters must fit their float32 column');
      }
      floatingPointWords[valueIndex] = value;
    } else {
      const minimum = control.format === 'sint32' ? MINIMUM_SINT32 : 0;
      const maximum = control.format === 'sint32' ? MAXIMUM_SINT32 : MAXIMUM_UINT32;
      if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error('GPUDataFrame numeric parameters must fit their integer column');
      }
      words[valueIndex] = value >>> 0;
    }
    words[validityIndex] = 1;
  }

  return words;
}

/** Stateful closed-AST compiler that assigns only generated numeric WGSL identifiers. */
class GPUQueryExpressionShaderPlanner<T extends GPUTypeMap> {
  readonly columns: GPUQueryExpressionColumn[] = [];
  readonly controls: GPUQueryExpressionControl[] = [];
  readonly statements: string[] = [];

  private readonly source: GPUDataFrame<T>;
  private readonly columnsByName = new Map<string, GPUQueryExpressionColumn>();
  private readonly constantsByName = new Map<string, GPUQueryExpressionConstant>();
  private readonly derivedByName: ReadonlyMap<string, GPUDataFrameDerivedColumn>;
  private readonly derivedValues = new Map<string, GPUQueryExpressionShaderValue>();
  private readonly resolvingDerived = new Set<string>();
  private expressionCount = 0;

  constructor(source: GPUDataFrame<T>, derivedColumns: readonly GPUDataFrameDerivedColumn[]) {
    this.source = source;
    this.derivedByName = new Map(derivedColumns.map(column => [column.name, column]));
  }

  emitDerived(column: GPUDataFrameDerivedColumn): GPUQueryExpressionShaderValue {
    const existing = this.derivedValues.get(column.name);
    if (existing) {
      return existing;
    }
    if (this.resolvingDerived.has(column.name)) {
      throw new Error('GPUDataFrame derived column references a cyclic expression');
    }
    this.resolvingDerived.add(column.name);
    try {
      const inferred = this.inferFormat(column.expression.node);
      if (inferred === 'boolean') {
        throw new Error('GPUDataFrame derived columns require numeric expressions');
      }
      if (column.format && inferred && column.format !== inferred) {
        throw new Error('GPUDataFrame derived column format does not match its expression');
      }
      const expression = this.emit(column.expression.node, column.format ?? inferred ?? 'float32');
      if (
        expression.format === 'boolean' ||
        (column.format && expression.format !== column.format)
      ) {
        throw new Error('GPUDataFrame derived column format does not match its expression');
      }
      this.derivedValues.set(column.name, expression);
      return expression;
    } finally {
      this.resolvingDerived.delete(column.name);
    }
  }

  emit(node: GPUExpressionNode, expected?: GPUQueryValueFormat): GPUQueryExpressionShaderValue {
    switch (node.kind) {
      case 'column':
        return this.emitColumn(node.name, expected);
      case 'literal':
        return this.emitControl(node.value, undefined, expected);
      case 'parameter':
        return this.emitControl(node.value, node.name, expected);
      case 'unary':
        return this.emitUnary(node.operator, node.operand, expected);
      case 'binary':
        return this.emitBinary(node.operator, node.left, node.right, expected);
      default:
        throw new Error('GPUDataFrame expression contains an unsupported operation');
    }
  }

  private emitColumn(name: string, expected?: GPUQueryValueFormat): GPUQueryExpressionShaderValue {
    const derived = this.derivedByName.get(name);
    if (derived) {
      const expression = this.emitDerived(derived);
      if (expected && expected !== expression.format && expected !== 'boolean') {
        throw new Error('GPUDataFrame expression combines incompatible scalar column formats');
      }
      return expression;
    }
    const constant = this.getConstant(name);
    if (constant) {
      if (expected && expected !== constant.format && expected !== 'boolean') {
        throw new Error('GPUDataFrame expression combines incompatible scalar column formats');
      }
      return this.emitControl(constant.value, undefined, constant.format);
    }
    const column = this.getColumn(name);
    if (expected && expected !== column.format && expected !== 'boolean') {
      throw new Error('GPUDataFrame expression combines incompatible scalar column formats');
    }
    const value = `input${column.index}[INPUT_${column.index}_OFFSET + index]`;
    const valid = column.nullable
      ? `validity${column.index}[VALIDITY_${column.index}_OFFSET + index] != 0u`
      : 'true';
    return this.addValue(column.format, value, valid, column.nullable);
  }

  private emitControl(
    value: GPUExpressionValue,
    name: string | undefined,
    expected?: GPUQueryValueFormat
  ): GPUQueryExpressionShaderValue {
    const inferred = typeof value === 'boolean' ? 'boolean' : (expected ?? 'float32');
    if (value !== null && (typeof value === 'boolean') !== (inferred === 'boolean')) {
      throw new Error('GPUDataFrame expression combines incompatible literal and column formats');
    }
    const control: GPUQueryExpressionControl = {
      ...(name !== undefined ? {name} : {}),
      value,
      format: inferred,
      index: this.controls.length
    };
    this.controls.push(control);
    const valueWord = `queryControls[CONTROL_OFFSET + ${control.index * 2}u]`;
    const validity = `queryControls[CONTROL_OFFSET + ${control.index * 2 + 1}u] != 0u`;
    const decoded =
      inferred === 'float32'
        ? `bitcast<f32>(${valueWord})`
        : inferred === 'sint32'
          ? `bitcast<i32>(${valueWord})`
          : inferred === 'boolean'
            ? `${valueWord} != 0u`
            : valueWord;
    return this.addValue(inferred, decoded, validity, value === null || name !== undefined);
  }

  private emitUnary(
    operator: 'not' | 'is-valid' | 'is-null' | 'negate',
    operandNode: GPUExpressionNode,
    expected?: GPUQueryValueFormat
  ): GPUQueryExpressionShaderValue {
    switch (operator) {
      case 'not': {
        const operand = this.emit(operandNode, 'boolean');
        this.assertBoolean(operand);
        return this.addValue('boolean', `!${operand.value}`, operand.valid, operand.nullable);
      }
      case 'is-valid': {
        const operand = this.emit(operandNode, this.inferFormat(operandNode));
        return this.addValue('boolean', operand.valid, 'true');
      }
      case 'is-null': {
        const operand = this.emit(operandNode, this.inferFormat(operandNode));
        return this.addValue('boolean', `!${operand.valid}`, 'true');
      }
      case 'negate': {
        const format = this.inferFormat(operandNode) ?? expected ?? 'float32';
        if (format === 'boolean' || format === 'uint32') {
          throw new Error('GPUDataFrame negation requires a signed numeric expression');
        }
        const operand = this.emit(operandNode, format);
        return this.addValue(format, `-${operand.value}`, operand.valid, operand.nullable);
      }
      default:
        throw new Error('GPUDataFrame expression contains an unsupported unary operation');
    }
  }

  private emitBinary(
    operator: GPUExpressionBinaryOperator,
    leftNode: GPUExpressionNode,
    rightNode: GPUExpressionNode,
    expected?: GPUQueryValueFormat
  ): GPUQueryExpressionShaderValue {
    if (operator === 'and' || operator === 'or') {
      const left = this.emit(leftNode, 'boolean');
      const right = this.emit(rightNode, 'boolean');
      this.assertBoolean(left);
      this.assertBoolean(right);
      const value =
        operator === 'and'
          ? `(${left.value} && ${right.value})`
          : `(${left.value} || ${right.value})`;
      const decisiveLeft = operator === 'and' ? `!${left.value}` : left.value;
      const decisiveRight = operator === 'and' ? `!${right.value}` : right.value;
      const valid = `(${left.valid} && ${right.valid}) || (${left.valid} && ${decisiveLeft}) || (${right.valid} && ${decisiveRight})`;
      return this.addValue('boolean', value, valid, left.nullable || right.nullable);
    }

    const leftFormat = this.inferFormat(leftNode);
    const rightFormat = this.inferFormat(rightNode);
    if (leftFormat && rightFormat && leftFormat !== rightFormat) {
      throw new Error('GPUDataFrame expression combines incompatible scalar column formats');
    }
    const arithmetic =
      operator === 'add' ||
      operator === 'subtract' ||
      operator === 'multiply' ||
      operator === 'divide';
    const format =
      leftFormat ?? rightFormat ?? (expected !== 'boolean' ? expected : undefined) ?? 'float32';
    if (
      format === 'boolean' &&
      (arithmetic || (operator !== 'equal' && operator !== 'not-equal'))
    ) {
      throw new Error('GPUDataFrame comparison requires numeric expressions');
    }
    const left = this.emit(leftNode, format);
    const right = this.emit(rightNode, format);
    const symbol = getGPUQueryBinaryOperator(operator);
    const value = `(${left.value} ${symbol} ${right.value})`;
    const valid = `${left.valid} && ${right.valid}`;
    return this.addValue(
      arithmetic ? format : 'boolean',
      value,
      valid,
      left.nullable || right.nullable
    );
  }

  private inferFormat(node: GPUExpressionNode): GPUQueryValueFormat | undefined {
    switch (node.kind) {
      case 'column':
        return this.derivedByName.has(node.name)
          ? this.emitDerived(this.derivedByName.get(node.name)!).format
          : (this.getConstant(node.name)?.format ?? this.getColumn(node.name).format);
      case 'literal':
      case 'parameter':
        return typeof node.value === 'boolean' ? 'boolean' : undefined;
      case 'unary':
        return node.operator === 'negate' ? this.inferFormat(node.operand) : 'boolean';
      case 'binary':
        if (
          node.operator === 'add' ||
          node.operator === 'subtract' ||
          node.operator === 'multiply' ||
          node.operator === 'divide'
        ) {
          const left = this.inferFormat(node.left);
          const right = this.inferFormat(node.right);
          if (left && right && left !== right) {
            throw new Error('GPUDataFrame expression combines incompatible scalar column formats');
          }
          return left ?? right;
        }
        return 'boolean';
      default:
        throw new Error('GPUDataFrame expression contains an unsupported operation');
    }
  }

  /** Resolves trusted table-wide scalar values without creating source-vector bindings. */
  private getConstant(name: string): GPUQueryExpressionConstant | undefined {
    const existing = this.constantsByName.get(name);
    if (existing) {
      return existing;
    }
    const constant = this.source.table.gpuConstants[name];
    if (!constant) {
      return undefined;
    }
    const format = constant.format;
    if (format !== 'float32' && format !== 'sint32' && format !== 'uint32') {
      throw new Error(`GPUDataFrame constant column "${name}" requires a 32-bit scalar format`);
    }
    const value = constant.value[0];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`GPUDataFrame constant column "${name}" requires a finite scalar value`);
    }
    const resolved = {format, value};
    this.constantsByName.set(name, resolved);
    return resolved;
  }

  private getColumn(name: string): GPUQueryExpressionColumn {
    const existing = this.columnsByName.get(name);
    if (existing) {
      return existing;
    }

    const field = this.source.schema.fields.find(candidate => candidate.name === name);
    const vector = this.source.table.gpuVectors[name];
    if (
      !field ||
      (!vector &&
        (this.source.batches.length > 0 || this.source.table.gpuConstants[name] !== undefined))
    ) {
      throw new Error(`GPUDataFrame expression column "${name}" is not a GPU vector`);
    }
    const format = vector?.format ?? field.format;
    if (format !== 'float32' && format !== 'sint32' && format !== 'uint32') {
      throw new Error(`GPUDataFrame expression column "${name}" requires a 32-bit scalar format`);
    }
    const nullable = field.nullable === true;
    if (nullable && this.source.numRows > 0 && !this.source.validity[name as keyof T & string]) {
      throw new Error(`GPUDataFrame nullable column "${name}" requires an explicit validity mask`);
    }
    const column = {name, format, nullable, index: this.columns.length};
    this.columns.push(column);
    this.columnsByName.set(name, column);
    return column;
  }

  private addValue(
    format: GPUQueryValueFormat,
    source: string,
    validity: string,
    nullable = false
  ): GPUQueryExpressionShaderValue {
    const index = this.expressionCount++;
    const value = `expression${index}Value`;
    const valid = `expression${index}Valid`;
    const type = getGPUQueryShaderType(format);
    this.statements.push(`let ${value}: ${type} = ${source};`);
    this.statements.push(`let ${valid}: bool = ${validity};`);
    return {format, value, valid, nullable};
  }

  private assertBoolean(expression: GPUQueryExpressionShaderValue): void {
    if (expression.format !== 'boolean') {
      throw new Error('GPUDataFrame boolean operations require boolean expressions');
    }
  }
}

/** Converts a closed scalar format to the corresponding native WGSL scalar type. @internal */
export function getGPUQueryShaderType(format: GPUQueryValueFormat): 'f32' | 'i32' | 'u32' | 'bool' {
  switch (format) {
    case 'float32':
      return 'f32';
    case 'sint32':
      return 'i32';
    case 'uint32':
      return 'u32';
    case 'boolean':
      return 'bool';
    default:
      throw new Error('GPUDataFrame expression contains an unsupported scalar format');
  }
}

/** Maps only known discriminants to WGSL operators without accepting application shader text. */
function getGPUQueryBinaryOperator(operator: GPUExpressionBinaryOperator): string {
  switch (operator) {
    case 'add':
      return '+';
    case 'subtract':
      return '-';
    case 'multiply':
      return '*';
    case 'divide':
      return '/';
    case 'equal':
      return '==';
    case 'not-equal':
      return '!=';
    case 'greater-than':
      return '>';
    case 'greater-than-or-equal':
      return '>=';
    case 'less-than':
      return '<';
    case 'less-than-or-equal':
      return '<=';
    default:
      throw new Error('GPUDataFrame expression contains an unsupported binary operation');
  }
}

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUTypeMap} from '@luma.gl/tables';
import type {LuDataFrame} from './lu-data-frame';
import type {LuDataFrameDerivedColumn} from './lu-data-frame-query';
import type {
  LuExpression,
  LuExpressionBinaryOperator,
  LuExpressionNode,
  LuExpressionValue
} from './lu-expression';

const MINIMUM_SINT32 = -0x80000000;
const MAXIMUM_SINT32 = 0x7fffffff;
const MAXIMUM_UINT32 = 0xffffffff;

/** Portable scalar memory formats accepted by generated dataframe filter kernels. @internal */
export type LuQueryScalarFormat = 'float32' | 'sint32' | 'uint32';

/** One deduplicated source vector and optional validity sidecar consumed by a predicate. @internal */
export type LuQueryExpressionColumn = {
  name: string;
  format: LuQueryScalarFormat;
  nullable: boolean;
  index: number;
};

/** One fixed-size literal or caller-controlled parameter stored outside shader source. @internal */
export type LuQueryExpressionControl = {
  name?: string;
  value: LuExpressionValue;
  format: LuQueryScalarFormat | 'boolean';
  index: number;
};

/** One selected numeric expression materialized into a source-aligned GPU vector. @internal */
export type LuQueryExpressionOutput = {
  name: string;
  format: LuQueryScalarFormat;
  nullable: boolean;
  value: string;
  valid: string;
  index: number;
};

/** Closed WGSL statements and metadata required by a graph-native dataframe predicate. @internal */
export type LuQueryExpressionShaderPlan = {
  columns: readonly LuQueryExpressionColumn[];
  controls: readonly LuQueryExpressionControl[];
  outputs: readonly LuQueryExpressionOutput[];
  statements: readonly string[];
  condition: string;
};

type LuQueryValueFormat = LuQueryScalarFormat | 'boolean';

type LuQueryExpressionShaderValue = {
  format: LuQueryValueFormat;
  value: string;
  valid: string;
  nullable: boolean;
};

type LuQueryExpressionConstant = {
  format: LuQueryScalarFormat;
  value: number;
};

/** Lowers immutable expressions without embedding user-controlled identifiers or values in WGSL. */
export function makeLuQueryExpressionShaderPlan<T extends GPUTypeMap>(
  source: LuDataFrame<T>,
  predicates: readonly LuExpression<boolean, string>[],
  derivedColumns: readonly LuDataFrameDerivedColumn[] = [],
  selectedColumns: readonly string[] = [],
  allowEmptyPredicates = false
): LuQueryExpressionShaderPlan {
  if (predicates.length === 0 && derivedColumns.length === 0 && !allowEmptyPredicates) {
    throw new Error('LuDataFrame filtering requires at least one predicate');
  }

  const planner = new LuQueryExpressionShaderPlanner(source, derivedColumns);
  const outputs = selectedColumns.flatMap(name => {
    const derived = derivedColumns.find(column => column.name === name);
    if (!derived) {
      return [];
    }
    const expression = planner.emitDerived(derived);
    if (expression.format === 'boolean') {
      throw new Error('LuDataFrame derived columns require numeric expressions');
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
      throw new Error('LuDataFrame filter expressions must produce boolean values');
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
export function encodeLuQueryExpressionControls(
  controls: readonly LuQueryExpressionControl[],
  parameters: Readonly<Record<string, LuExpressionValue>>
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
        throw new Error('LuDataFrame boolean parameters require boolean values');
      }
      words[valueIndex] = value ? 1 : 0;
      words[validityIndex] = 1;
      continue;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('LuDataFrame numeric parameters require finite numeric values');
    }
    if (control.format === 'float32') {
      if (!Number.isFinite(Math.fround(value))) {
        throw new Error('LuDataFrame numeric parameters must fit their float32 column');
      }
      floatingPointWords[valueIndex] = value;
    } else {
      const minimum = control.format === 'sint32' ? MINIMUM_SINT32 : 0;
      const maximum = control.format === 'sint32' ? MAXIMUM_SINT32 : MAXIMUM_UINT32;
      if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error('LuDataFrame numeric parameters must fit their integer column');
      }
      words[valueIndex] = value >>> 0;
    }
    words[validityIndex] = 1;
  }

  return words;
}

/** Stateful closed-AST compiler that assigns only generated numeric WGSL identifiers. */
class LuQueryExpressionShaderPlanner<T extends GPUTypeMap> {
  readonly columns: LuQueryExpressionColumn[] = [];
  readonly controls: LuQueryExpressionControl[] = [];
  readonly statements: string[] = [];

  private readonly source: LuDataFrame<T>;
  private readonly columnsByName = new Map<string, LuQueryExpressionColumn>();
  private readonly constantsByName = new Map<string, LuQueryExpressionConstant>();
  private readonly derivedByName: ReadonlyMap<string, LuDataFrameDerivedColumn>;
  private readonly derivedValues = new Map<string, LuQueryExpressionShaderValue>();
  private readonly resolvingDerived = new Set<string>();
  private expressionCount = 0;

  constructor(source: LuDataFrame<T>, derivedColumns: readonly LuDataFrameDerivedColumn[]) {
    this.source = source;
    this.derivedByName = new Map(derivedColumns.map(column => [column.name, column]));
  }

  emitDerived(column: LuDataFrameDerivedColumn): LuQueryExpressionShaderValue {
    const existing = this.derivedValues.get(column.name);
    if (existing) {
      return existing;
    }
    if (this.resolvingDerived.has(column.name)) {
      throw new Error('LuDataFrame derived column references a cyclic expression');
    }
    this.resolvingDerived.add(column.name);
    try {
      const inferred = this.inferFormat(column.expression.node);
      if (inferred === 'boolean') {
        throw new Error('LuDataFrame derived columns require numeric expressions');
      }
      if (column.format && inferred && column.format !== inferred) {
        throw new Error('LuDataFrame derived column format does not match its expression');
      }
      const expression = this.emit(column.expression.node, column.format ?? inferred ?? 'float32');
      if (
        expression.format === 'boolean' ||
        (column.format && expression.format !== column.format)
      ) {
        throw new Error('LuDataFrame derived column format does not match its expression');
      }
      this.derivedValues.set(column.name, expression);
      return expression;
    } finally {
      this.resolvingDerived.delete(column.name);
    }
  }

  emit(node: LuExpressionNode, expected?: LuQueryValueFormat): LuQueryExpressionShaderValue {
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
        throw new Error('LuDataFrame expression contains an unsupported operation');
    }
  }

  private emitColumn(name: string, expected?: LuQueryValueFormat): LuQueryExpressionShaderValue {
    const derived = this.derivedByName.get(name);
    if (derived) {
      const expression = this.emitDerived(derived);
      if (expected && expected !== expression.format && expected !== 'boolean') {
        throw new Error('LuDataFrame expression combines incompatible scalar column formats');
      }
      return expression;
    }
    const constant = this.getConstant(name);
    if (constant) {
      if (expected && expected !== constant.format && expected !== 'boolean') {
        throw new Error('LuDataFrame expression combines incompatible scalar column formats');
      }
      return this.emitControl(constant.value, undefined, constant.format);
    }
    const column = this.getColumn(name);
    if (expected && expected !== column.format && expected !== 'boolean') {
      throw new Error('LuDataFrame expression combines incompatible scalar column formats');
    }
    const value = `input${column.index}[INPUT_${column.index}_OFFSET + index]`;
    const valid = column.nullable
      ? `validity${column.index}[VALIDITY_${column.index}_OFFSET + index] != 0u`
      : 'true';
    return this.addValue(column.format, value, valid, column.nullable);
  }

  private emitControl(
    value: LuExpressionValue,
    name: string | undefined,
    expected?: LuQueryValueFormat
  ): LuQueryExpressionShaderValue {
    const inferred = typeof value === 'boolean' ? 'boolean' : (expected ?? 'float32');
    if (value !== null && (typeof value === 'boolean') !== (inferred === 'boolean')) {
      throw new Error('LuDataFrame expression combines incompatible literal and column formats');
    }
    const control: LuQueryExpressionControl = {
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
    operandNode: LuExpressionNode,
    expected?: LuQueryValueFormat
  ): LuQueryExpressionShaderValue {
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
          throw new Error('LuDataFrame negation requires a signed numeric expression');
        }
        const operand = this.emit(operandNode, format);
        return this.addValue(format, `-${operand.value}`, operand.valid, operand.nullable);
      }
      default:
        throw new Error('LuDataFrame expression contains an unsupported unary operation');
    }
  }

  private emitBinary(
    operator: LuExpressionBinaryOperator,
    leftNode: LuExpressionNode,
    rightNode: LuExpressionNode,
    expected?: LuQueryValueFormat
  ): LuQueryExpressionShaderValue {
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
      throw new Error('LuDataFrame expression combines incompatible scalar column formats');
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
      throw new Error('LuDataFrame comparison requires numeric expressions');
    }
    const left = this.emit(leftNode, format);
    const right = this.emit(rightNode, format);
    const symbol = getLuQueryBinaryOperator(operator);
    const value = `(${left.value} ${symbol} ${right.value})`;
    const valid = `${left.valid} && ${right.valid}`;
    return this.addValue(
      arithmetic ? format : 'boolean',
      value,
      valid,
      left.nullable || right.nullable
    );
  }

  private inferFormat(node: LuExpressionNode): LuQueryValueFormat | undefined {
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
            throw new Error('LuDataFrame expression combines incompatible scalar column formats');
          }
          return left ?? right;
        }
        return 'boolean';
      default:
        throw new Error('LuDataFrame expression contains an unsupported operation');
    }
  }

  /** Resolves trusted table-wide scalar values without creating source-vector bindings. */
  private getConstant(name: string): LuQueryExpressionConstant | undefined {
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
      throw new Error(`LuDataFrame constant column "${name}" requires a 32-bit scalar format`);
    }
    const value = constant.value[0];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`LuDataFrame constant column "${name}" requires a finite scalar value`);
    }
    const resolved = {format, value};
    this.constantsByName.set(name, resolved);
    return resolved;
  }

  private getColumn(name: string): LuQueryExpressionColumn {
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
      throw new Error(`LuDataFrame expression column "${name}" is not a GPU vector`);
    }
    const format = vector?.format ?? field.format;
    if (format !== 'float32' && format !== 'sint32' && format !== 'uint32') {
      throw new Error(`LuDataFrame expression column "${name}" requires a 32-bit scalar format`);
    }
    const nullable = field.nullable === true;
    if (nullable && this.source.numRows > 0 && !this.source.validity[name as keyof T & string]) {
      throw new Error(`LuDataFrame nullable column "${name}" requires an explicit validity mask`);
    }
    const column = {name, format, nullable, index: this.columns.length};
    this.columns.push(column);
    this.columnsByName.set(name, column);
    return column;
  }

  private addValue(
    format: LuQueryValueFormat,
    source: string,
    validity: string,
    nullable = false
  ): LuQueryExpressionShaderValue {
    const index = this.expressionCount++;
    const value = `expression${index}Value`;
    const valid = `expression${index}Valid`;
    const type = getLuQueryShaderType(format);
    this.statements.push(`let ${value}: ${type} = ${source};`);
    this.statements.push(`let ${valid}: bool = ${validity};`);
    return {format, value, valid, nullable};
  }

  private assertBoolean(expression: LuQueryExpressionShaderValue): void {
    if (expression.format !== 'boolean') {
      throw new Error('LuDataFrame boolean operations require boolean expressions');
    }
  }
}

/** Converts a closed scalar format to the corresponding native WGSL scalar type. @internal */
export function getLuQueryShaderType(format: LuQueryValueFormat): 'f32' | 'i32' | 'u32' | 'bool' {
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
      throw new Error('LuDataFrame expression contains an unsupported scalar format');
  }
}

/** Maps only known discriminants to WGSL operators without accepting application shader text. */
function getLuQueryBinaryOperator(operator: LuExpressionBinaryOperator): string {
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
      throw new Error('LuDataFrame expression contains an unsupported binary operation');
  }
}

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {PROJParameter, PROJStringAst} from '@math.gl/crs';
import {invertProjectionProgram, type ProjectionOperation} from './projection-program';

export type ProjectionPlanningReason = {
  readonly code:
    | 'invalid-definition'
    | 'unsupported-parameter'
    | 'unsupported-operation'
    | 'unsupported-dimensions'
    | 'unsupported-coordinate-system'
    | 'unsupported-datum'
    | 'unsupported-conversion'
    | 'datum-transformation-required'
    | 'bounds-required'
    | 'unsupported-unit'
    | 'incompatible-units'
    | 'crs-requires-provider'
    | 'provider-unavailable'
    | 'approximation-failed';
  readonly step?: number;
  readonly parameter?: string;
  readonly message: string;
};

type Unit = {factor: number; dimension: 'linear' | 'angular'};

// Factors and pipeline semantics: https://proj.org/en/stable/operations/conversions/unitconvert.html
const UNITS: Record<string, Unit> = {
  m: {factor: 1, dimension: 'linear'},
  km: {factor: 1000, dimension: 'linear'},
  cm: {factor: 0.01, dimension: 'linear'},
  mm: {factor: 0.001, dimension: 'linear'},
  ft: {factor: 0.3048, dimension: 'linear'},
  'us-ft': {factor: 1200 / 3937, dimension: 'linear'},
  rad: {factor: 1, dimension: 'angular'},
  deg: {factor: Math.PI / 180, dimension: 'angular'},
  grad: {factor: Math.PI / 200, dimension: 'angular'}
};

/** Deliberately bounded PROJ subset. Every token is consumed or produces an explicit decline. */
export function lowerProjectionPipeline(
  definition: PROJStringAst
): {operations: ProjectionOperation[]} | {reason: ProjectionPlanningReason} {
  const steps: PROJParameter[][] = [];
  let parameters: PROJParameter[] = [];
  for (const parameter of definition.parameters) {
    if (parameter.name === 'step') {
      if (parameter.value !== undefined) {
        return decline('invalid-definition', 'step must be a flag');
      }
      steps.push(parameters);
      parameters = [];
    } else {
      parameters.push(parameter);
    }
  }
  steps.push(parameters);
  const header = steps.shift();
  if (
    !header ||
    header.length !== 1 ||
    header[0].name !== 'proj' ||
    header[0].value !== 'pipeline'
  ) {
    return decline('unsupported-parameter', 'expected +proj=pipeline without global parameters');
  }
  if (steps.length === 0 || steps.some(step => step.length === 0)) {
    return decline('invalid-definition', 'pipeline requires nonempty steps');
  }

  const operations: ProjectionOperation[] = [];
  let previousUnit: Unit | undefined;
  for (const [step, tokens] of steps.entries()) {
    const values = new Map<string, string | undefined>();
    for (const token of tokens) {
      if (values.has(token.name)) {
        return decline('invalid-definition', 'duplicate parameter', step, token.name);
      }
      values.set(token.name, token.value);
    }
    const method = values.get('proj');
    if (!method) {
      return decline('invalid-definition', 'step requires a projection method', step, 'proj');
    }
    const supported =
      method === 'axisswap'
        ? ['proj', 'inv', 'order']
        : method === 'unitconvert'
          ? ['proj', 'inv', 'xy_in', 'xy_out']
          : method === 'affine'
            ? ['proj', 'inv', 's11', 's22', 'xoff', 'yoff']
            : null;
    if (!supported) {
      return decline(
        'unsupported-operation',
        `unsupported operation: ${method ?? '(missing)'}`,
        step
      );
    }
    for (const [name, value] of values) {
      if (!supported.includes(name)) {
        return decline(
          'unsupported-parameter',
          'parameter is not supported by the 2D lowering',
          step,
          name
        );
      }
      if ((name === 'inv') !== (value === undefined)) {
        return decline('invalid-definition', 'expected a value, or a bare inv flag', step, name);
      }
    }

    const stage: ProjectionOperation[] = [];
    const inverse = values.has('inv');
    if (method === 'axisswap') {
      const axes = values.get('order')?.split(',');
      if (axes && axes.length > 2) {
        return decline('unsupported-dimensions', 'only two axes are supported', step, 'order');
      }
      const order = axes?.map(Number);
      if (
        !order ||
        order.length !== 2 ||
        !axes?.every(axis => /^[+-]?[12]$/.test(axis)) ||
        !order.every(
          value => Number.isInteger(value) && Math.abs(value) >= 1 && Math.abs(value) <= 2
        ) ||
        Math.abs(order[0]) === Math.abs(order[1])
      ) {
        return decline(
          'invalid-definition',
          'order must permute the two signed axes',
          step,
          'order'
        );
      }
      stage.push({type: 'axis', order: Math.abs(order[0]) === 1 ? [0, 1] : [1, 0]});
      if (order.some(value => value < 0)) {
        stage.push({
          type: 'affine',
          scale: [Math.sign(order[0]), Math.sign(order[1])],
          offset: [0, 0]
        });
      }
    } else if (method === 'unitconvert') {
      const inputName = values.get('xy_in') ?? 'm';
      const outputName = values.get('xy_out') ?? 'm';
      const inputUnit = getUnit(inputName);
      const outputUnit = getUnit(outputName);
      if (!inputUnit || !outputUnit) {
        return decline(
          'unsupported-unit',
          'unit is not a supported name or positive linear factor',
          step
        );
      }
      if (inputUnit.dimension !== outputUnit.dimension) {
        return decline(
          'incompatible-units',
          'cannot convert between angular and linear units',
          step
        );
      }
      const sourceUnit = inverse ? outputUnit : inputUnit;
      if (
        previousUnit &&
        (previousUnit.dimension !== sourceUnit.dimension ||
          previousUnit.factor !== sourceUnit.factor)
      ) {
        return decline('incompatible-units', 'adjacent unit conversions disagree', step);
      }
      previousUnit = inverse ? inputUnit : outputUnit;
      stage.push({type: 'unit', factor: inputUnit.factor / outputUnit.factor});
    } else {
      const scaleX = getNumber(values.get('s11'), 1);
      const scaleY = getNumber(values.get('s22'), 1);
      const offsetX = getNumber(values.get('xoff'), 0);
      const offsetY = getNumber(values.get('yoff'), 0);
      if (
        ![scaleX, scaleY, offsetX, offsetY].every(Number.isFinite) ||
        scaleX === 0 ||
        scaleY === 0
      ) {
        return decline(
          'invalid-definition',
          'affine parameters must be finite and invertible',
          step
        );
      }
      stage.push({type: 'affine', scale: [scaleX, scaleY], offset: [offsetX, offsetY]});
    }
    operations.push(
      ...(inverse
        ? invertProjectionProgram({precision: 'double-single', operations: stage}).operations
        : stage)
    );
  }
  return {operations};
}

function getUnit(name: string): Unit | undefined {
  if (Object.hasOwn(UNITS, name)) {
    return UNITS[name];
  }
  const factor = getNumber(name, Number.NaN);
  return factor > 0 && Number.isFinite(factor) ? {factor, dimension: 'linear'} : undefined;
}

function getNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  // Decimal PROJ numbers, including exponent notation; reject hex and empty values.
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) ? Number(value) : Number.NaN;
}

function decline(
  code: ProjectionPlanningReason['code'],
  message: string,
  step?: number,
  parameter?: string
): {reason: ProjectionPlanningReason} {
  return {reason: {code, message, step, parameter}};
}

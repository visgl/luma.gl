// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ShaderModule} from '@luma.gl/shadertools';
import {GEOSPATIAL_INTEGER_FP64_ARITHMETIC_MODULE} from '../geospatial/geospatial-utils';
import {evaluateProjectionPlan, findProjectionPatch, packProjectionPlan} from './projection-plan';
import {getProjectionShaderFunctions} from './projection-shader';
import {getProjectionProgramMetadata, type ProjectionProgramMetadata} from './projection-metadata';
import type {ProjectionCoordinates, ProjectionPlan, ProjectionPrecision} from './types';

/** Explicit operations; adaptive inversion requires a separately validated inverse plan. */
export type ProjectionOperation =
  | {type: 'axis'; order: readonly [0, 1] | readonly [1, 0]}
  | {type: 'unit'; factor: number; inverse?: boolean}
  | {type: 'affine'; scale: ProjectionCoordinates; offset: ProjectionCoordinates; inverse?: boolean}
  | {type: 'adaptive'; plan: ProjectionPlan; inversePlan?: ProjectionPlan};

/** A two-dimensional operation sequence. Precision applies through intermediate coordinates. */
export type ProjectionProgram = {
  operations: readonly ProjectionOperation[];
  precision: ProjectionPrecision;
  /** Absolute origin subtracted only at the final local-f32 output boundary. Defaults to zero. */
  destinationOrigin?: ProjectionCoordinates;
};

export type ProjectionInputFormat = 'float32x2' | 'float32x4' | 'uint32x4';

/** Caller embeds this source and binds the parameter buffer, retaining submission ownership. */
export type ProjectionShader = {
  source: string;
  modules: ShaderModule[];
  defines: Record<string, boolean>;
  entryPoint: string;
  bindingName: string;
  inputType: 'vec2f' | 'vec4f' | 'vec4u';
  outputType: 'vec2f' | 'vec4f';
};

/** CPU-compiled static shader and packed parameters; owns no GPU resources. */
export class CompiledProjection {
  readonly precision: ProjectionPrecision;
  readonly inputFormat: ProjectionInputFormat;
  readonly destinationOrigin: ProjectionCoordinates;
  readonly metadata: ProjectionProgramMetadata;
  private readonly parameterWords: Uint32Array;
  private readonly shaderSource: string;

  constructor(program: ProjectionProgram, inputFormat: ProjectionInputFormat = 'float32x2') {
    this.precision = program.precision;
    this.inputFormat = inputFormat;
    this.destinationOrigin = [...(program.destinationOrigin ?? [0, 0])];
    const compiled = compileProgram(program, inputFormat);
    this.parameterWords = compiled.parameters;
    this.shaderSource = compiled.source;
    this.metadata = getProjectionProgramMetadata(program, inputFormat);
  }

  /** Returns a copy so callers cannot mutate this compiled program's parameter snapshot. */
  packParameters(): Uint32Array {
    return this.parameterWords.slice();
  }

  /** Namespace permits several independent transformations in one consumer shader. */
  getShader(options: {namespace?: string; parameterOffset?: number} = {}): ProjectionShader {
    const namespace = options.namespace ?? 'projection';
    const parameterOffset = options.parameterOffset ?? 0;
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(namespace) || namespace.includes('__')) {
      throw new Error('projection namespace must be a simple identifier');
    }
    if (
      !Number.isSafeInteger(parameterOffset) ||
      parameterOffset < 0 ||
      parameterOffset + this.parameterWords.length > 0x100000000
    ) {
      throw new Error('projection parameter offset must be a uint32 word offset');
    }
    const prefix = `projection_${namespace}`;
    return {
      source: this.shaderSource.replace(/PROGRAM|PARAMETER_OFFSET/g, token =>
        token === 'PROGRAM' ? prefix : `${parameterOffset}u`
      ),
      modules: [GEOSPATIAL_INTEGER_FP64_ARITHMETIC_MODULE],
      defines: {LUMA_FP64_INTEGER_ARITHMETIC: true},
      entryPoint: `${prefix}_project`,
      bindingName: `${prefix}_parameters`,
      inputType:
        this.inputFormat === 'uint32x4'
          ? 'vec4u'
          : this.inputFormat === 'float32x4'
            ? 'vec4f'
            : 'vec2f',
      outputType: this.precision === 'double-single' ? 'vec4f' : 'vec2f'
    };
  }

  /** Only numeric parameters may change without recompiling consumers. */
  isCompatible(other: CompiledProjection): boolean {
    return (
      this.shaderSource === other.shaderSource &&
      this.parameterWords.length === other.parameterWords.length
    );
  }
}

export function compileProjectionProgram(
  program: ProjectionProgram,
  options: {inputFormat?: ProjectionInputFormat} = {}
): CompiledProjection {
  return new CompiledProjection(program, options.inputFormat);
}

/** Reverses stage order; an adaptive polynomial is never assumed to be its own inverse. */
export function invertProjectionProgram(
  program: ProjectionProgram,
  options: {destinationOrigin?: ProjectionCoordinates} = {}
): ProjectionProgram {
  return {
    precision: program.precision,
    destinationOrigin: options.destinationOrigin ?? [0, 0],
    operations: [...program.operations].reverse().map(operation => {
      switch (operation.type) {
        case 'axis':
          return {...operation, order: [...operation.order]};
        case 'unit':
          return {...operation, inverse: !operation.inverse};
        case 'affine':
          return {...operation, inverse: !operation.inverse};
        case 'adaptive':
          if (!operation.inversePlan) {
            throw new Error('adaptive inversion requires an inverse projection plan');
          }
          return {type: 'adaptive', plan: operation.inversePlan, inversePlan: operation.plan};
      }
    })
  };
}

/** Binary64 reference, returning absolute coordinates. This is not a GPU rounding simulator. */
export function evaluateProjectionProgram(
  program: ProjectionProgram,
  coordinates: ProjectionCoordinates
): {position: ProjectionCoordinates; valid: boolean} {
  let position: ProjectionCoordinates = coordinates;
  for (const operation of program.operations) {
    if (!position.every(Number.isFinite)) {
      return {position: [0, 0], valid: false};
    }
    switch (operation.type) {
      case 'axis':
        position = [position[operation.order[0]], position[operation.order[1]]];
        break;
      case 'unit':
        position = operation.inverse
          ? [position[0] / operation.factor, position[1] / operation.factor]
          : [position[0] * operation.factor, position[1] * operation.factor];
        break;
      case 'affine':
        position = operation.inverse
          ? [
              (position[0] - operation.offset[0]) / operation.scale[0],
              (position[1] - operation.offset[1]) / operation.scale[1]
            ]
          : [
              position[0] * operation.scale[0] + operation.offset[0],
              position[1] * operation.scale[1] + operation.offset[1]
            ];
        break;
      case 'adaptive':
        if (findProjectionPatch(operation.plan, position) < 0) {
          return {position: [0, 0], valid: false};
        }
        position = evaluateProjectionPlan(operation.plan, position);
        break;
    }
  }
  return position.every(Number.isFinite)
    ? {position, valid: true}
    : {position: [0, 0], valid: false};
}

function compileProgram(
  program: ProjectionProgram,
  inputFormat: ProjectionInputFormat
): {source: string; parameters: Uint32Array} {
  if (
    !['local-f32', 'double-single'].includes(program.precision) ||
    !['float32x2', 'float32x4', 'uint32x4'].includes(inputFormat)
  ) {
    throw new Error('unsupported projection precision or input format');
  }
  const words: number[] = [];
  const appendNumber = (value: number): void => {
    const high = Math.fround(value);
    const low = Math.fround(value - high);
    if (!Number.isFinite(value) || !Number.isFinite(high) || (value !== 0 && high === 0)) {
      throw new Error('projection parameters must fit the double-single exponent range');
    }
    words.push(...new Uint32Array(Float32Array.of(high, low).buffer));
  };
  for (const value of program.destinationOrigin ?? [0, 0]) {
    appendNumber(value);
  }
  const functions: string[] = [];
  const stages: string[] = [];
  for (const [index, operation] of program.operations.entries()) {
    const offset = words.length;
    const scalar = (wordOffset: number): string => `PROGRAM_scalar(${wordOffset}u)`;
    switch (operation.type) {
      case 'axis':
        if (
          !(
            (operation.order[0] === 0 && operation.order[1] === 1) ||
            (operation.order[0] === 1 && operation.order[1] === 0)
          )
        ) {
          throw new Error('projection axes must be a permutation');
        }
        stages.push(`value = ${operation.order[0] === 0 ? 'value' : 'value.zwxy'};`);
        break;
      case 'unit':
      case 'affine': {
        const scale: ProjectionCoordinates =
          operation.type === 'unit' ? [operation.factor, operation.factor] : operation.scale;
        const translation: ProjectionCoordinates =
          operation.type === 'unit' ? [0, 0] : operation.offset;
        if (scale.some(value => value === 0)) {
          throw new Error('projection scale must be invertible');
        }
        for (const value of [...scale, ...translation]) {
          appendNumber(value);
        }
        const transform = (coordinate: string, axis: number): string =>
          operation.inverse
            ? `div_fp64(sub_fp64(${coordinate}, ${scalar(offset + 4 + axis * 2)}), ${scalar(offset + axis * 2)})`
            : `sum_fp64(mul_fp64(${coordinate}, ${scalar(offset + axis * 2)}), ${scalar(offset + 4 + axis * 2)})`;
        stages.push(`value = vec4f(${transform('value.xy', 0)}, ${transform('value.zw', 1)});`);
        break;
      }
      case 'adaptive': {
        if (operation.plan.precision !== 'double-single' || operation.plan.patches.length === 0) {
          throw new Error('program adaptive stages require double-single projection plans');
        }
        for (const word of packProjectionPlan(operation.plan)) {
          words.push(word);
        }
        const boundsOffset = words.length;
        for (const [boundIndex, value] of operation.plan.bounds.entries()) {
          const high = Math.fround(value);
          let low = Math.fround(value - high);
          // Round bounds inward: a rounded split must never expand the exact binary64 domain.
          const rounded = high + low;
          if ((boundIndex < 2 && rounded < value) || (boundIndex >= 2 && rounded > value)) {
            low = nextFloat32(low, boundIndex < 2);
          }
          words.push(...new Uint32Array(Float32Array.of(high, low).buffer));
        }
        const rawInput = index === 0 && inputFormat === 'uint32x4';
        let source = getProjectionShaderFunctions({
          precise: rawInput,
          doubleSingle: true,
          doubleSingleInput: !rawInput,
          patchCount: operation.plan.patches.length,
          planOffset: offset,
          inputBoundsOffset: boundsOffset
        });
        // Namespace declared symbols, leaving arithmetic dependencies shared across all stages.
        const symbols = [
          ...source.matchAll(/\b(?:fn|struct|const)\s+([A-Za-z_][A-Za-z0-9_]*)/g)
        ].map(match => match[1]);
        const names = new Set(symbols);
        source = source.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, name =>
          names.has(name) ? `PROGRAM_stage${index}_${name}` : name
        );
        source = source.replace(
          '@group(0) @binding(auto) var<storage, read> projectionPlans: array<u32>;',
          ''
        );
        source = source.replace(
          /projectionPlans\[([^\]]+)\]/g,
          'PROGRAM_parameters[PARAMETER_OFFSET + $1]'
        );
        functions.push(source);
        const argument = rawInput
          ? `PROGRAM_stage${index}_makeRawPoint(position.x, position.y, position.z, position.w)`
          : 'value';
        stages.push(`let stage${index} = PROGRAM_stage${index}_project(${argument}, 0xffffffffu);
  if (stage${index}.valid == 0u) { return invalid; }
  value = stage${index}.position;`);
        break;
      }
      default:
        throw new Error('unsupported projection operation');
    }
    stages.push('if (!PROGRAM_finite(value)) { return invalid; }');
  }
  const inputType =
    inputFormat === 'uint32x4' ? 'vec4u' : inputFormat === 'float32x4' ? 'vec4f' : 'vec2f';
  const outputType = program.precision === 'double-single' ? 'vec4f' : 'vec2f';
  const initial =
    inputFormat === 'uint32x4'
      ? 'vec4f(sub_fp64u32_to_fp64(position.yx, vec2u(0u)), sub_fp64u32_to_fp64(position.wz, vec2u(0u)))'
      : inputFormat === 'float32x4'
        ? 'vec4f(normalize_fp64(position.xy), normalize_fp64(position.zw))'
        : 'vec4f(position.x, 0.0, position.y, 0.0)';
  const rawAdaptive = inputFormat === 'uint32x4' && program.operations[0]?.type === 'adaptive';
  const source = `
@group(0) @binding(auto) var<storage, read> PROGRAM_parameters: array<u32>;
struct PROGRAM_Result { position: ${outputType}, valid: u32 }
fn PROGRAM_scalar(offset: u32) -> vec2f {
  return vec2f(bitcast<f32>(PROGRAM_parameters[PARAMETER_OFFSET + offset]), bitcast<f32>(PROGRAM_parameters[PARAMETER_OFFSET + offset + 1u]));
}
fn PROGRAM_finite(value: vec4f) -> bool { return is_finite_fp64(value.xy) && is_finite_fp64(value.zw); }
${functions.join('\n')}
fn PROGRAM_project(position: ${inputType}, inputValidity: u32) -> PROGRAM_Result {
  let invalid = PROGRAM_Result(${outputType}(0.0), 0u);
  if (inputValidity == 0u) { return invalid; }
  var value = ${rawAdaptive ? 'vec4f(0.0)' : initial};
  if (!PROGRAM_finite(value)) { return invalid; }
  ${stages.join('\n  ')}
  ${
    program.precision === 'double-single'
      ? 'return PROGRAM_Result(value, 1u);'
      : `let localX = sub_fp64(value.xy, PROGRAM_scalar(0u));
  let localY = sub_fp64(value.zw, PROGRAM_scalar(2u));
  let local = vec2f(localX.x + localX.y, localY.x + localY.y);
  if (!PROGRAM_finite(vec4f(local.x, 0.0, local.y, 0.0))) { return invalid; }
  return PROGRAM_Result(local, 1u);`
  }
}`;
  return {source, parameters: Uint32Array.from(words)};
}

function nextFloat32(value: number, increase: boolean): number {
  if (value === 0) {
    return increase ? 2 ** -149 : -(2 ** -149);
  }
  const words = new Uint32Array(Float32Array.of(value).buffer);
  words[0] += value > 0 === increase ? 1 : -1;
  return new Float32Array(words.buffer)[0];
}

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {WGSLShaderAssembler, type PlatformInfo} from '@luma.gl/shadertools';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  indexProjectionPlan,
  evaluateProjectionProgram,
  invertProjectionProgram,
  GPUProjectionProgram,
  type ProjectionProgram
} from '@luma.gl/experimental/gpu-project';

const nativeProgram: ProjectionProgram = {
  precision: 'double-single',
  operations: [
    {type: 'axis', order: [1, 0]},
    {type: 'unit', factor: Math.PI / 180},
    {type: 'affine', scale: [2, -3], offset: [1_000_000.125, -2_000_000.25]}
  ]
};

describe('projection programs', () => {
  it('owns only parameter storage and updates it without compiling, submitting, or reading back', () => {
    const device = new NullDevice({});
    Object.defineProperty(device, 'type', {value: 'webgpu'});
    Object.defineProperty(device.limits, 'maxComputeWorkgroupsPerDimension', {value: 65_535});
    const graph = new GPUCommandGraph(device);
    const input = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
    const output = device.createBuffer({byteLength: 32, usage: Buffer.STORAGE});
    const positions = graph.createDataView(
      graph.importBuffer({id: 'input', byteLength: input.byteLength, usage: input.usage}, input),
      {format: 'float32x2', length: 2}
    );
    const destination = graph.createDataView(
      graph.importBuffer(
        {id: 'output', byteLength: output.byteLength, usage: output.usage},
        output
      ),
      {format: 'float32x4', length: 2}
    );
    const makeProjection = (factor: number) =>
      compileProjectionProgram({precision: 'double-single', operations: [{type: 'unit', factor}]});
    const submit = vi.spyOn(device, 'submit');
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const contributor = new GPUProjectionProgram({
      projection: makeProjection(2),
      positions,
      output: destination
    });
    expect(createBuffer).not.toHaveBeenCalled();
    contributor.addToGraph(graph);
    expect(createBuffer).toHaveBeenCalledTimes(1);
    const parameters = createBuffer.mock.results[0].value;
    const write = vi.spyOn(parameters, 'write');
    const read = vi.spyOn(parameters, 'readAsync');
    contributor.updateProjection(makeProjection(3));
    expect(write).toHaveBeenCalledExactlyOnceWith(makeProjection(3).packParameters());
    expect(read).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    expect(() => contributor.addToGraph(graph)).toThrow(/already registered/);
    expect(() =>
      contributor.updateProjection(
        compileProjectionProgram({precision: 'local-f32', operations: [{type: 'unit', factor: 3}]})
      )
    ).toThrow(/layout/);
    expect(
      () => new GPUProjectionProgram({projection: makeProjection(2), positions, output: positions})
    ).toThrow(/float32x4/);
    contributor.destroy();
    contributor.destroy();
    expect(parameters.destroyed).toBe(true);
    expect(input.destroyed).toBe(false);
    expect(output.destroyed).toBe(false);
    expect(() => contributor.updateProjection(makeProjection(4))).toThrow(/destroyed/);
    vi.restoreAllMocks();
    input.destroy();
    output.destroy();
    device.destroy();
  });

  it('inverts noncommuting operations in reverse order', () => {
    const coordinates = [-122.123, 37.456] as const;
    const forward = evaluateProjectionProgram(nativeProgram, coordinates);
    expect(forward.valid).toBe(true);
    const inverse = invertProjectionProgram(nativeProgram);
    expect(inverse.operations.map(operation => operation.type)).toEqual(['affine', 'unit', 'axis']);
    const restored = evaluateProjectionProgram(inverse, forward.position);
    expect(restored.position[0]).toBeCloseTo(coordinates[0], 7);
    expect(restored.position[1]).toBeCloseTo(coordinates[1], 7);
    expect(invertProjectionProgram(inverse).operations).toEqual(
      nativeProgram.operations.map(operation =>
        operation.type === 'axis' ? operation : {...operation, inverse: false}
      )
    );
  });

  it('requires an explicit inverse adaptive plan and respects inverse domains', () => {
    const plan = compileProjectionPlan({
      projection: position => [2 * position[0] + 100, 3 * position[1] + 200],
      bounds: [-1, -1, 1, 1],
      degree: 1,
      precision: 'double-single',
      tolerance: 1e-8
    });
    const inversePlan = compileProjectionPlan({
      projection: position => [(position[0] - 100) / 2, (position[1] - 200) / 3],
      bounds: [98, 197, 102, 203],
      degree: 1,
      precision: 'double-single',
      tolerance: 1e-8
    });
    expect(() =>
      invertProjectionProgram({precision: 'double-single', operations: [{type: 'adaptive', plan}]})
    ).toThrow(/inverse/);
    const program: ProjectionProgram = {
      precision: 'double-single',
      operations: [{type: 'adaptive', plan, inversePlan}]
    };
    const inverse = invertProjectionProgram(program);
    const projected = evaluateProjectionProgram(program, [0.25, -0.5]);
    const restored = evaluateProjectionProgram(inverse, projected.position);
    expect(restored.position[0]).toBeCloseTo(0.25, 12);
    expect(restored.position[1]).toBeCloseTo(-0.5, 12);
    expect(evaluateProjectionProgram(inverse, [0, 0]).valid).toBe(false);
  });

  it('emits static operations and stable parameter layouts', () => {
    const first = compileProjectionProgram(nativeProgram);
    const second = compileProjectionProgram({
      ...nativeProgram,
      operations: [
        {type: 'axis', order: [1, 0]},
        {type: 'unit', factor: 100},
        {type: 'affine', scale: [4, 5], offset: [6, 7]}
      ]
    });
    expect(first.isCompatible(second)).toBe(true);
    expect(first.packParameters()).not.toEqual(second.packParameters());
    expect(first.getShader().source).not.toMatch(/switch|for\s*\(/);
    expect(first.getShader().source).not.toContain(String(Math.PI / 180));
    expect(
      first.isCompatible(compileProjectionProgram(invertProjectionProgram(nativeProgram)))
    ).toBe(false);
    expect(
      first.isCompatible(compileProjectionProgram({...nativeProgram, precision: 'local-f32'}))
    ).toBe(false);
    expect(
      first.isCompatible(compileProjectionProgram(nativeProgram, {inputFormat: 'uint32x4'}))
    ).toBe(false);
  });

  it('keeps integer-controlled arithmetic for inline consumers of getShader()', () => {
    const shader = compileProjectionProgram(nativeProgram).getShader();
    expect(shader.defines).toEqual({LUMA_FP64_INTEGER_ARITHMETIC: true});
    expect(shader.modules.map(module => module.name)).toEqual(['fp64arithmetic']);
    // Inline consumers need no fp64 uniforms.
    expect(shader.modules[0].uniformTypes).toBeUndefined();
    const platformInfo: PlatformInfo = {
      type: 'webgpu',
      gpu: 'nvidia',
      shaderLanguage: 'wgsl',
      shaderLanguageVersion: 300,
      features: new Set()
    };
    const assembled = new WGSLShaderAssembler().assembleWGSLShader({
      platformInfo,
      source: shader.source,
      modules: shader.modules,
      defines: shader.defines
    }).source;
    expect(assembled).toContain('fn fp64_accumulate_f32_integer');
  });

  it('calls each heavy fp64 helper from one site in adaptive stages', () => {
    const plan = compileProjectionPlan({
      projection: position => [
        2 * position[0] + 100 + position[1] ** 2 * 0.01,
        3 * position[1] + 200
      ],
      bounds: [-1, -1, 1, 1],
      degree: 2,
      precision: 'double-single',
      tolerance: 1e-6
    });
    const routedPlan = indexProjectionPlan(
      compileProjectionPlan({
        projection: position => [Math.sin(position[0]), Math.cos(position[1])],
        bounds: [-2, -2, 2, 2],
        precision: 'double-single',
        degree: 2,
        tolerance: 0.001
      })
    );
    expect(routedPlan.routingIndex!.length).toBeGreaterThan(1);
    for (const [label, stagePlan] of [
      ['scan', plan],
      ['routed', routedPlan]
    ] as const) {
      const program: ProjectionProgram = {
        precision: 'double-single',
        operations: [{type: 'adaptive', plan: stagePlan}]
      };
      for (const inputFormat of ['uint32x4', 'float32x4', 'float32x2'] as const) {
        const name = `${label}/${inputFormat}`;
        const source = compileProjectionProgram(program, {inputFormat}).getShader().source;
        // Count call sites across the whole stage, excluding the function definitions.
        const count = (callee: string) =>
          (source.match(new RegExp(`\\b${callee}\\(`, 'g'))?.length ?? 0) -
          (source.match(new RegExp(`\\bfn ${callee}\\(`, 'g'))?.length ?? 0);
        expect(count('projection_projection_stage0_projectionPatchContains'), name).toBe(1);
        const projectStart = source.indexOf('fn projection_projection_stage0_project(');
        const project = source.slice(projectStart, source.indexOf('\n}', projectStart));
        const countInProject = (pattern: RegExp) => project.match(pattern)?.length ?? 0;
        expect(countInProject(/div_fp64\(/g), name).toBe(1);
        expect(countInProject(/sum_fp64\(/g), name).toBe(1);
        expect(countInProject(/evaluateProjectionPolynomialFP64\(/g), name).toBe(1);
        expect(
          countInProject(/sub_fp64u32_to_fp64\(|projectionDestinationOriginFP64\(/g),
          name
        ).toBe(1);
        // Helpers that project() no longer calls are not emitted.
        expect(source, name).not.toContain('normalizeProjectionPositionFP64');
        if (inputFormat === 'uint32x4') {
          expect(source, name).not.toContain('projectionSourceOffsetFP64');
          expect(source, name).not.toContain('projectionDestinationOriginFP64');
        }
      }
    }
  });

  it('snapshots parameters and supports independent shader namespaces and buffer offsets', () => {
    const program: ProjectionProgram = {
      precision: 'local-f32',
      destinationOrigin: [100, 200],
      operations: [{type: 'unit', factor: 2}]
    };
    const compiled = compileProjectionProgram(program);
    const parameters = compiled.packParameters();
    parameters.fill(0);
    expect(compiled.packParameters()).not.toEqual(parameters);
    program.operations = [];
    expect(compiled.getShader().source).toContain('mul_fp64');
    const shader = compiled.getShader({namespace: 'consumer', parameterOffset: 64});
    expect(shader.entryPoint).toBe('projection_consumer_project');
    expect(shader.source).toContain('64u + offset');
    expect(shader.source).not.toContain('PROGRAM');
    expect(() => compiled.getShader({namespace: 'bad-name'})).toThrow();
    expect(() => compiled.getShader({parameterOffset: -1})).toThrow();
  });

  it('rejects singular or unrepresentable parameters before GPU work', () => {
    for (const factor of [0, NaN, Infinity, 1e300, Number.MIN_VALUE]) {
      expect(() =>
        compileProjectionProgram({precision: 'double-single', operations: [{type: 'unit', factor}]})
      ).toThrow();
    }
    const plan = compileProjectionPlan({projection: position => position, bounds: [-1, -1, 1, 1]});
    expect(() =>
      compileProjectionProgram({precision: 'double-single', operations: [{type: 'adaptive', plan}]})
    ).toThrow(/double-single/);
  });

  it('distinguishes valid zero, invalid input, and out-of-domain rows', () => {
    const identity: ProjectionProgram = {precision: 'double-single', operations: []};
    expect(evaluateProjectionProgram(identity, [0, 0])).toEqual({position: [0, 0], valid: true});
    expect(evaluateProjectionProgram(identity, [NaN, 0])).toEqual({position: [0, 0], valid: false});
  });
});

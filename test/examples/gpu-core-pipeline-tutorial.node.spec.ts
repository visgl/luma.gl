// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

import {
  evaluateGPUCoreTutorial,
  GPU_CORE_TUTORIAL_DEFAULT_FLAGS,
  GPU_CORE_TUTORIAL_VALUES
} from '../../website/src/components/docs/gpu-core-pipeline-model';
import {
  GPU_CORE_COMPILER_RESOURCES,
  GPU_CORE_COMPILER_STAGES,
  planGPUCoreExecutionSlices
} from '../../website/src/components/docs/gpu-core-compiler-model';

describe('GPU Core pipeline tutorial', () => {
  test('explains the default stable compaction result', () => {
    expect(
      evaluateGPUCoreTutorial(GPU_CORE_TUTORIAL_VALUES, GPU_CORE_TUTORIAL_DEFAULT_FLAGS)
    ).toEqual({
      flags: [1, 0, 1, 0, 1, 0, 0, 1],
      offsets: [0, 1, 1, 2, 2, 3, 3, 3],
      compactedValues: [8, 5, 9, 4],
      compactedSourceIndices: [0, 2, 4, 7],
      instanceCount: 4
    });
  });

  test('normalizes nonzero flags and handles empty output', () => {
    expect(evaluateGPUCoreTutorial([4, 7, 2], [9, -1, 0])).toEqual({
      flags: [1, 1, 0],
      offsets: [0, 1, 2],
      compactedValues: [4, 7],
      compactedSourceIndices: [0, 1],
      instanceCount: 2
    });
    expect(evaluateGPUCoreTutorial([4, 7, 2], [0, 0, 0])).toEqual({
      flags: [0, 0, 0],
      offsets: [0, 0, 0],
      compactedValues: [],
      compactedSourceIndices: [],
      instanceCount: 0
    });
  });

  test('rejects mismatched source and flag lengths', () => {
    expect(() => evaluateGPUCoreTutorial([1, 2], [1])).toThrow(/same length/);
  });

  test('places the compact lab on the overview and the full comparison on the tutorial route', () => {
    const overviewSource = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/README.md'),
      'utf8'
    );
    const tutorialSource = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/tutorial.md'),
      'utf8'
    );
    const componentSource = readFileSync(
      path.join(process.cwd(), 'website/src/components/docs/gpu-core-pipeline-tutorial.tsx'),
      'utf8'
    );

    expect(overviewSource).toContain('<GPUCorePipelineTutorial compact />');
    expect(overviewSource).toContain('The small WebGPU leap behind GPU Core');
    expect(overviewSource).toContain('Compute shaders and storage buffers');
    expect(overviewSource).toContain('GPU-writable indirect draw and dispatch arguments');
    expect(overviewSource).toContain('new GPUCommandGraph(device');
    expect(overviewSource).toContain('.addToGraph(graph)');
    expect(tutorialSource).toContain('<GPUCorePipelineTutorial />');
    expect(tutorialSource).toContain('Terminology in one minute');
    expect(tutorialSource).toMatch(
      /\*\*Read\/write hazard \(resource conflict\)\*\*[\s\S]*ordering rule inferred from data access/
    );
    expect(tutorialSource).toMatch(/\*\*Resource\*\*[\s\S]*buffer or texture/);
    expect(tutorialSource).toContain('Translate familiar WebGPU concepts');
    expect(tutorialSource).toMatch(/\*\*GPU Core\*\*[\s\S]*\*\*GPU Graph\*\*/);
    expect(tutorialSource).toMatch(/\*\*Graph compilation\*\*[\s\S]*\*\*shader compilation\*\*/);
    expect(tutorialSource).toMatch(/\*\*batch or chunk\*\*[\s\S]*\*\*execution slice\*\*/);
    expect(componentSource).toMatch(/Manual WebGPU and GPU Core/);
    expect(componentSource).toMatch(/mask, exclusive scan,[\s\S]*stable scatter/);
    expect(componentSource).toContain("['Composed'");
    expect(componentSource).toMatch(/\['Declared',[\s\S]*addToGraph\(\) expands compaction/);
    expect(componentSource).toContain('drawIndirect');
  });

  test('exposes every compiler view and a real non-overlapping alias example', () => {
    expect(GPU_CORE_COMPILER_STAGES.map(stage => stage.id)).toEqual([
      'declared',
      'hazards',
      'schedule',
      'lifetimes',
      'allocations',
      'encoded',
      'slices'
    ]);
    const allocationC = GPU_CORE_COMPILER_RESOURCES.filter(resource => resource.allocation === 'C');
    expect(allocationC.map(resource => resource.id)).toEqual(['scan-scratch', 'style-scratch']);
    expect(allocationC[0].lastNode).toBeLessThan(allocationC[1].firstNode);
  });

  test('plans frame slices only at node boundaries and surfaces oversized steps', () => {
    const slices = planGPUCoreExecutionSlices(1_100_000);
    expect(slices.map(slice => slice.nodeIds)).toEqual([
      ['classify'],
      ['scan-blocks', 'scan-carry'],
      ['scatter'],
      ['style', 'instances', 'render']
    ]);
    expect(slices.every(slice => !slice.oversized)).toBe(true);

    const constrained = planGPUCoreExecutionSlices(256_000);
    expect(constrained.filter(slice => slice.oversized).map(slice => slice.nodeIds)).toEqual([
      ['classify'],
      ['scan-blocks'],
      ['scatter']
    ]);
  });

  test('connects the compiler anatomy, execution lab, glossary, and trace walkthrough', () => {
    const concepts = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/concepts.md'),
      'utf8'
    );
    const recipes = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/recipes.md'),
      'utf8'
    );
    const tutorial = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/tutorial.md'),
      'utf8'
    );
    const trace = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-trace.md'),
      'utf8'
    );

    expect(concepts).toContain('<GPUCoreCompilerAnatomy />');
    expect(recipes).toContain('<GPUCoreExecutionLab />');
    expect(tutorial).toContain('<GPUCoreTerm term="hazard" />');
    expect(trace).toContain('<GPUTracePipelineWalkthrough />');
  });
});

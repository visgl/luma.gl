import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraphExecutionBudgetController,
  getGPUCommandGraphExecutionPlan,
  type GPUCommandGraphExecutionPlanStep,
  type GPUCommandGraphNodePreflight
} from '@luma.gl/gpgpu/gpu-core';

function makeNode(
  id: string,
  maximumInvocationCount: number,
  publication?: GPUCommandGraphNodePreflight['publication'],
  condition?: GPUCommandGraphNodePreflight['condition']
): GPUCommandGraphNodePreflight {
  return {
    id,
    type: 'compute',
    operation: 'TestPartition',
    commandCount: maximumInvocationCount > 0 ? 1 : 0,
    maximumWorkgroupCount: 0,
    maximumInvocationCount,
    readByteLength: maximumInvocationCount * 4,
    writeByteLength: maximumInvocationCount * 2,
    ...(publication ? {publication} : {}),
    ...(condition ? {condition} : {})
  };
}

it('GPUCommandGraph execution planning respects multidimensional budgets', () => {
  const plan = getGPUCommandGraphExecutionPlan(
    {
      nodes: [
        makeNode('initialize', 0),
        makeNode('partition-0', 300, undefined, {
          id: 'partition-active',
          source: 'cpu',
          mode: 'skip'
        }),
        makeNode('partition-1', 400),
        makeNode('oversized-partition', 900),
        makeNode('finalize', 0)
      ],
      annotatedNodeCount: 5
    },
    {
      maximumInvocationCount: 700,
      maximumCommandCount: 2,
      maximumReadByteLength: 2800,
      maximumWriteByteLength: 1400
    }
  );

  expect(plan.stepCount, 'plans three queue submissions').toBe(3);
  expect(plan.nodeCount, 'retains every scheduled node').toBe(5);
  expect(plan.maximumInvocationCount, 'reports complete invocation bounds').toBe(1600);
  expect(plan.conditionalNodeCount, 'retains conservative conditional-node bounds').toBe(1);
  expect(plan.steps[0].conditionalNodeCount, 'reports conditions per submission step').toBe(1);
  expect(plan.readByteLength, 'reports complete read bounds').toBe(6400);
  expect(
    plan.steps.map(step => [step.firstNodeIndex, step.nextNodeIndex]),
    'keeps dependency order while packing bounded ranges'
  ).toEqual([
    [0, 3],
    [3, 4],
    [4, 5]
  ]);
  expect(plan.steps[0].commandCount, 'packs commands up to the budget').toBe(2);
  expect(
    Boolean(plan.steps[1].exceedsBudget),
    'allows one indivisible oversized node to make progress'
  ).toBe(true);
  expect(plan.oversizedStepCount, 'summarizes oversized work before execution').toBe(1);
  expect(Boolean(Object.isFrozen(plan)), 'freezes the plan').toBe(true);
  expect(Boolean(Object.isFrozen(plan.steps)), 'freezes the step list').toBe(true);
  expect(Boolean(Object.isFrozen(plan.steps[0])), 'freezes individual steps').toBe(true);
});

it('GPUCommandGraph execution planning rejects invalid budgets', () => {
  const preflight = {nodes: [makeNode('partition', 1)], annotatedNodeCount: 1};
  expect(
    () =>
      getGPUCommandGraphExecutionPlan(preflight, {
        maximumInvocationCount: 0
      }),
    'rejects a zero invocation budget'
  ).toThrow(/maximumInvocationCount must be a positive safe integer/);
  expect(
    () =>
      getGPUCommandGraphExecutionPlan(preflight, {
        maximumInvocationCount: 1,
        maximumReadByteLength: Number.POSITIVE_INFINITY
      }),
    'rejects a non-finite byte budget'
  ).toThrow(/maximumReadByteLength must be a positive safe integer/);
});

it('GPUCommandGraph execution planning controls coherent partial publication', () => {
  const preflight = {
    nodes: [
      makeNode('summary-work', 300),
      makeNode('summary-ready', 0, {id: 'summary', completeness: 'partial'}),
      makeNode('histogram-work', 300),
      makeNode('histogram-ready', 0, {id: 'histogram', completeness: 'partial'}),
      makeNode('profile-work', 300)
    ],
    annotatedNodeCount: 5
  };
  const budget = {maximumInvocationCount: 1000};
  const atomicPlan = getGPUCommandGraphExecutionPlan(preflight, budget, {
    latencyPriority: 'background'
  });
  expect(atomicPlan.stepCount, 'keeps intermediate results private by default').toBe(1);
  expect(atomicPlan.publicationCount, 'does not surface undeclared application publication').toBe(
    0
  );
  expect(atomicPlan.latencyPriority, 'retains explicit scheduling urgency').toBe('background');
  expect(Boolean(atomicPlan.steps[0].publishable), 'always publishes the completed graph').toBe(
    true
  );

  const progressivePlan = getGPUCommandGraphExecutionPlan(preflight, budget, {
    latencyPriority: 'interactive',
    publicationPolicy: 'progressive'
  });
  expect(progressivePlan.stepCount, 'ends steps at coherent intermediate boundaries').toBe(3);
  expect(progressivePlan.publicationCount, 'reports every surfaced intermediate result').toBe(2);
  expect(
    progressivePlan.steps.map(step => step.publications.map(publication => publication.id)),
    'identifies exactly which result became safe after each queue completion'
  ).toEqual([['summary'], ['histogram'], []]);
  expect(
    Boolean(progressivePlan.steps.every(step => step.publishable)),
    'marks intermediate boundaries and final completion as publishable'
  ).toBe(true);
  expect(
    Boolean(progressivePlan.steps.every(step => step.latencyPriority === 'interactive')),
    'propagates latency priority to every scheduler-visible step'
  ).toBe(true);
});

it('GPUCommandGraph execution budget controller learns from saturated measured steps', () => {
  const controller = new GPUCommandGraphExecutionBudgetController({
    initialBudget: {
      maximumInvocationCount: 1000,
      maximumCommandCount: 10,
      maximumReadByteLength: 4000
    },
    targetStepMilliseconds: 10,
    responsiveness: 1,
    maximumAdjustmentFactor: 2
  });
  const makeStep = (
    maximumInvocationCount: number,
    commandCount: number,
    readByteLength: number
  ): GPUCommandGraphExecutionPlanStep => ({
    stepIndex: 0,
    firstNodeIndex: 0,
    nextNodeIndex: 1,
    nodeCount: 1,
    commandCount,
    maximumInvocationCount,
    readByteLength,
    writeByteLength: 0,
    conditionalNodeCount: 0,
    exceedsBudget: false,
    latencyPriority: 'normal',
    publications: [],
    publishable: false
  });

  const slowObservation = controller.observeStep(makeStep(1000, 10, 4000), 20);
  expect(slowObservation.scale, 'halves the future envelope after a saturated slow step').toBe(0.5);
  expect(
    controller.budget.maximumInvocationCount,
    'scales invocation limits for the next execution'
  ).toBe(500);
  expect(controller.budget.maximumReadByteLength, 'scales memory-traffic limits coherently').toBe(
    2000
  );

  const fastObservation = controller.observeStep(makeStep(500, 5, 2000), 2.5);
  expect(fastObservation.scale, 'recovers conservatively after a saturated fast step').toBe(1);
  controller.reset();
  const partialObservation = controller.observeStep(makeStep(250, 2, 1000), 2.5);
  expect(
    partialObservation.scale,
    'does not inflate the budget from a proportionally fast partial tail step'
  ).toBe(1);
  expect(controller.sampleCount, 'reset clears prior empirical samples').toBe(1);
});

it('GPUCommandGraph execution latency priorities select queue-time targets', () => {
  const makeController = (
    latencyPriority: 'interactive' | 'normal' | 'background'
  ): GPUCommandGraphExecutionBudgetController =>
    new GPUCommandGraphExecutionBudgetController({
      initialBudget: {maximumInvocationCount: 1000},
      latencyPriority
    });
  expect(makeController('interactive').targetStepMilliseconds, 'prioritizes low latency').toBe(4);
  expect(makeController('normal').targetStepMilliseconds, 'uses the balanced default').toBe(8);
  expect(makeController('background').targetStepMilliseconds, 'favors background throughput').toBe(
    16
  );
});

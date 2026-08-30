// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUCommandGraphExecutionBudgetController,
  getGPUCommandGraphExecutionPlan,
  type GPUCommandGraphExecutionPlanStep,
  type GPUCommandGraphNodePreflight
} from '@luma.gl/gpgpu/gpu-core';
import test from 'test/utils/vitest-tape';

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

test('GPUCommandGraph execution planning respects multidimensional budgets', t => {
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

  t.equal(plan.stepCount, 3, 'plans three queue submissions');
  t.equal(plan.nodeCount, 5, 'retains every scheduled node');
  t.equal(plan.maximumInvocationCount, 1600, 'reports complete invocation bounds');
  t.equal(plan.conditionalNodeCount, 1, 'retains conservative conditional-node bounds');
  t.equal(plan.steps[0].conditionalNodeCount, 1, 'reports conditions per submission step');
  t.equal(plan.readByteLength, 6400, 'reports complete read bounds');
  t.deepEqual(
    plan.steps.map(step => [step.firstNodeIndex, step.nextNodeIndex]),
    [
      [0, 3],
      [3, 4],
      [4, 5]
    ],
    'keeps dependency order while packing bounded ranges'
  );
  t.equal(plan.steps[0].commandCount, 2, 'packs commands up to the budget');
  t.ok(plan.steps[1].exceedsBudget, 'allows one indivisible oversized node to make progress');
  t.equal(plan.oversizedStepCount, 1, 'summarizes oversized work before execution');
  t.ok(Object.isFrozen(plan), 'freezes the plan');
  t.ok(Object.isFrozen(plan.steps), 'freezes the step list');
  t.ok(Object.isFrozen(plan.steps[0]), 'freezes individual steps');
  t.end();
});

test('GPUCommandGraph execution planning rejects invalid budgets', t => {
  const preflight = {nodes: [makeNode('partition', 1)], annotatedNodeCount: 1};
  t.throws(
    () =>
      getGPUCommandGraphExecutionPlan(preflight, {
        maximumInvocationCount: 0
      }),
    /maximumInvocationCount must be a positive safe integer/,
    'rejects a zero invocation budget'
  );
  t.throws(
    () =>
      getGPUCommandGraphExecutionPlan(preflight, {
        maximumInvocationCount: 1,
        maximumReadByteLength: Number.POSITIVE_INFINITY
      }),
    /maximumReadByteLength must be a positive safe integer/,
    'rejects a non-finite byte budget'
  );
  t.end();
});

test('GPUCommandGraph execution planning controls coherent partial publication', t => {
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
  t.equal(atomicPlan.stepCount, 1, 'keeps intermediate results private by default');
  t.equal(atomicPlan.publicationCount, 0, 'does not surface undeclared application publication');
  t.equal(atomicPlan.latencyPriority, 'background', 'retains explicit scheduling urgency');
  t.ok(atomicPlan.steps[0].publishable, 'always publishes the completed graph');

  const progressivePlan = getGPUCommandGraphExecutionPlan(preflight, budget, {
    latencyPriority: 'interactive',
    publicationPolicy: 'progressive'
  });
  t.equal(progressivePlan.stepCount, 3, 'ends steps at coherent intermediate boundaries');
  t.equal(progressivePlan.publicationCount, 2, 'reports every surfaced intermediate result');
  t.deepEqual(
    progressivePlan.steps.map(step => step.publications.map(publication => publication.id)),
    [['summary'], ['histogram'], []],
    'identifies exactly which result became safe after each queue completion'
  );
  t.ok(
    progressivePlan.steps.every(step => step.publishable),
    'marks intermediate boundaries and final completion as publishable'
  );
  t.ok(
    progressivePlan.steps.every(step => step.latencyPriority === 'interactive'),
    'propagates latency priority to every scheduler-visible step'
  );
  t.end();
});

test('GPUCommandGraph execution budget controller learns from saturated measured steps', t => {
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
  t.equal(slowObservation.scale, 0.5, 'halves the future envelope after a saturated slow step');
  t.equal(
    controller.budget.maximumInvocationCount,
    500,
    'scales invocation limits for the next execution'
  );
  t.equal(controller.budget.maximumReadByteLength, 2000, 'scales memory-traffic limits coherently');

  const fastObservation = controller.observeStep(makeStep(500, 5, 2000), 2.5);
  t.equal(fastObservation.scale, 1, 'recovers conservatively after a saturated fast step');
  controller.reset();
  const partialObservation = controller.observeStep(makeStep(250, 2, 1000), 2.5);
  t.equal(
    partialObservation.scale,
    1,
    'does not inflate the budget from a proportionally fast partial tail step'
  );
  t.equal(controller.sampleCount, 1, 'reset clears prior empirical samples');
  t.end();
});

test('GPUCommandGraph execution latency priorities select queue-time targets', t => {
  const makeController = (
    latencyPriority: 'interactive' | 'normal' | 'background'
  ): GPUCommandGraphExecutionBudgetController =>
    new GPUCommandGraphExecutionBudgetController({
      initialBudget: {maximumInvocationCount: 1000},
      latencyPriority
    });
  t.equal(makeController('interactive').targetStepMilliseconds, 4, 'prioritizes low latency');
  t.equal(makeController('normal').targetStepMilliseconds, 8, 'uses the balanced default');
  t.equal(makeController('background').targetStepMilliseconds, 16, 'favors background throughput');
  t.end();
});

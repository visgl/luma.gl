export type GPUCoreCompilerStageId =
  | 'declared'
  | 'hazards'
  | 'schedule'
  | 'lifetimes'
  | 'allocations'
  | 'encoded'
  | 'slices';

export type GPUCoreCompilerNode = {
  id: string;
  label: string;
  kind: 'compute' | 'render';
  reads: readonly string[];
  writes: readonly string[];
  invocations?: number;
  dispatches?: number;
  draws?: number;
  output: string;
  code: string;
};

export type GPUCoreCompilerResource = {
  id: string;
  ownership: 'imported' | 'transient';
  firstNode: number;
  lastNode: number;
  allocation: string;
  byteLength: number;
};

export type GPUCoreCompilerStage = {
  id: GPUCoreCompilerStageId;
  label: string;
  explanation: string;
};

export const GPU_CORE_COMPILER_STAGES: readonly GPUCoreCompilerStage[] = [
  {
    id: 'declared',
    label: 'Declared graph',
    explanation:
      'Contributors have expanded into nodes and logical resources. The application has not recorded any GPU commands yet.'
  },
  {
    id: 'hazards',
    label: 'Derived hazards',
    explanation:
      'Declared reads and writes imply ordering edges. A writer must finish before a later reader or writer touches the same resource range.'
  },
  {
    id: 'schedule',
    label: 'Execution order',
    explanation:
      'Compilation chooses a stable topological order that satisfies explicit dependencies and inferred resource hazards.'
  },
  {
    id: 'lifetimes',
    label: 'Resource lifetimes',
    explanation:
      'Every transient is live from its first scheduled use through its last. Imported resources remain caller-owned.'
  },
  {
    id: 'allocations',
    label: 'Aliasing plan',
    explanation:
      'Compatible transients with non-overlapping lifetimes may share physical storage. Logical identities remain distinct.'
  },
  {
    id: 'encoded',
    label: 'Encoded work',
    explanation:
      'The compiled plan records compute and render work into a caller-owned command encoder and reports actual dispatches and draws.'
  },
  {
    id: 'slices',
    label: 'Frame slices',
    explanation:
      'A budgeted execution advances only legal node boundaries. Oversized indivisible nodes run alone so execution can still make progress.'
  }
];

export const GPU_CORE_COMPILER_NODES: readonly GPUCoreCompilerNode[] = [
  {
    id: 'classify',
    label: 'Classify visible',
    kind: 'compute',
    reads: ['source'],
    writes: ['flags'],
    invocations: 1_000_000,
    dispatches: 1,
    output: 'One visibility flag per source row',
    code: "graph.addComputePass({id: 'classify', resources: [read(source), write(flags)]});"
  },
  {
    id: 'scan-blocks',
    label: 'Scan blocks',
    kind: 'compute',
    reads: ['flags'],
    writes: ['offsets', 'scan-scratch'],
    invocations: 1_000_000,
    dispatches: 1,
    output: 'Local prefixes and block totals',
    code: "new GPUScan({input: flags, output: offsets}).addToGraph(graph);"
  },
  {
    id: 'scan-carry',
    label: 'Apply scan carry',
    kind: 'compute',
    reads: ['scan-scratch', 'offsets'],
    writes: ['offsets'],
    invocations: 4_096,
    dispatches: 2,
    output: 'Globally valid stable output positions',
    code: '// contributed by GPUScan: scan block totals, then add carries'
  },
  {
    id: 'scatter',
    label: 'Scatter and count',
    kind: 'compute',
    reads: ['source', 'flags', 'offsets'],
    writes: ['visible-ids', 'draw-args'],
    invocations: 1_000_000,
    dispatches: 1,
    output: 'Packed IDs and a GPU-written indirect count',
    code: "new GPUCompaction({input: source, flags, output: visibleIds, count}).addToGraph(graph);"
  },
  {
    id: 'style',
    label: 'Prepare visible style',
    kind: 'compute',
    reads: ['visible-ids'],
    writes: ['style-scratch'],
    invocations: 160_000,
    dispatches: 1,
    output: 'Per-visible-row style attributes',
    code: "graph.addComputePass({id: 'style', resources: [read(visibleIds), write(styleScratch)]});"
  },
  {
    id: 'instances',
    label: 'Finalize instances',
    kind: 'compute',
    reads: ['style-scratch'],
    writes: ['instance-data'],
    invocations: 160_000,
    dispatches: 1,
    output: 'Renderer-ready instance records',
    code: "graph.addComputePass({id: 'instances', resources: [read(styleScratch), write(instances)]});"
  },
  {
    id: 'render',
    label: 'Render visible',
    kind: 'render',
    reads: ['visible-ids', 'instance-data', 'draw-args'],
    writes: [],
    draws: 1,
    output: 'One indirect render draw',
    code: 'drawCommands.draw(renderPass, 0);'
  }
];

export const GPU_CORE_COMPILER_RESOURCES: readonly GPUCoreCompilerResource[] = [
  {id: 'source', ownership: 'imported', firstNode: 0, lastNode: 3, allocation: 'source', byteLength: 4_000_000},
  {id: 'flags', ownership: 'transient', firstNode: 0, lastNode: 3, allocation: 'A', byteLength: 4_000_000},
  {id: 'offsets', ownership: 'transient', firstNode: 1, lastNode: 3, allocation: 'B', byteLength: 4_000_000},
  {id: 'scan-scratch', ownership: 'transient', firstNode: 1, lastNode: 2, allocation: 'C', byteLength: 16_384},
  {id: 'visible-ids', ownership: 'transient', firstNode: 3, lastNode: 6, allocation: 'D', byteLength: 4_000_000},
  {id: 'draw-args', ownership: 'imported', firstNode: 3, lastNode: 6, allocation: 'draw-args', byteLength: 16},
  {id: 'style-scratch', ownership: 'transient', firstNode: 4, lastNode: 5, allocation: 'C', byteLength: 16_384},
  {id: 'instance-data', ownership: 'imported', firstNode: 5, lastNode: 6, allocation: 'instances', byteLength: 5_120_000}
];

export const GPUGRAPH_HAZARD_EDGES = [
  ['classify', 'scan-blocks', 'flags · RAW'],
  ['scan-blocks', 'scan-carry', 'offsets · RAW/WAW'],
  ['scan-carry', 'scatter', 'offsets · RAW'],
  ['scatter', 'style', 'visible-ids · RAW'],
  ['style', 'instances', 'style-scratch · RAW'],
  ['instances', 'render', 'instance-data · RAW'],
  ['scatter', 'render', 'draw-args · RAW']
] as const;

export type GPUCoreExecutionSlice = {
  index: number;
  nodeIds: readonly string[];
  invocationCount: number;
  oversized: boolean;
};

/** Builds deterministic node-boundary slices for the teaching visualizer. */
export function planGPUCoreExecutionSlices(maximumInvocationCount: number): GPUCoreExecutionSlice[] {
  const slices: GPUCoreExecutionSlice[] = [];
  let nodeIds: string[] = [];
  let invocationCount = 0;

  for (const node of GPU_CORE_COMPILER_NODES) {
    const nodeInvocationCount = node.invocations ?? 0;
    if (nodeIds.length && invocationCount + nodeInvocationCount > maximumInvocationCount) {
      slices.push({index: slices.length, nodeIds, invocationCount, oversized: false});
      nodeIds = [];
      invocationCount = 0;
    }
    nodeIds.push(node.id);
    invocationCount += nodeInvocationCount;
    if (nodeInvocationCount > maximumInvocationCount) {
      slices.push({index: slices.length, nodeIds, invocationCount, oversized: true});
      nodeIds = [];
      invocationCount = 0;
    }
  }

  if (nodeIds.length) {
    slices.push({index: slices.length, nodeIds, invocationCount, oversized: false});
  }
  return slices;
}

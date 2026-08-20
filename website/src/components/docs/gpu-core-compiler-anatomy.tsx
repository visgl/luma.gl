import React, {type ReactNode, useId, useMemo, useState} from 'react';

import {
  GPU_CORE_COMPILER_NODES,
  GPU_CORE_COMPILER_RESOURCES,
  GPU_CORE_COMPILER_STAGES,
  GPUGRAPH_HAZARD_EDGES,
  planGPUCoreExecutionSlices,
  type GPUCoreCompilerNode,
  type GPUCoreCompilerStageId
} from './gpu-core-compiler-model';

const NUMBER_FORMAT = new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1});

/** Interactive, deterministic view of the command-graph compilation lifecycle. */
export function GPUCoreCompilerAnatomy(): ReactNode {
  const [activeStageIdentifier, setActiveStageIdentifier] =
    useState<GPUCoreCompilerStageId>('declared');
  const [selectedNodeIdentifier, setSelectedNodeIdentifier] = useState('scatter');
  const [maximumInvocationCount, setMaximumInvocationCount] = useState(1_100_000);
  const panelIdentifier = useId();
  const activeStage = GPU_CORE_COMPILER_STAGES.find(stage => stage.id === activeStageIdentifier)!;
  const selectedNode = GPU_CORE_COMPILER_NODES.find(node => node.id === selectedNodeIdentifier)!;
  const slices = useMemo(
    () => planGPUCoreExecutionSlices(maximumInvocationCount),
    [maximumInvocationCount]
  );

  return (
    <section className="gpu-core-anatomy" aria-label="Interactive anatomy of a compiled GPU Core">
      <header>
        <div>
          <span className="gpu-core-tutorial__eyebrow">Interactive compiler anatomy</span>
          <h3>Follow one graph from declaration to encoded work</h3>
          <p>
            Choose a compilation view, then select a node to connect its code, resources,
            dependencies, work estimate, and bounded output.
          </p>
        </div>
      </header>

      <nav className="gpu-core-anatomy__stages" aria-label="Compilation views" role="tablist">
        {GPU_CORE_COMPILER_STAGES.map((stage, stageIndex) => (
          <button
            aria-controls={panelIdentifier}
            aria-selected={stage.id === activeStageIdentifier}
            id={`${panelIdentifier}-${stage.id}`}
            key={stage.id}
            onClick={() => setActiveStageIdentifier(stage.id)}
            role="tab"
            type="button"
          >
            <small>{stageIndex + 1}</small>
            {stage.label}
          </button>
        ))}
      </nav>

      <div
        aria-labelledby={`${panelIdentifier}-${activeStageIdentifier}`}
        className="gpu-core-anatomy__stage-panel"
        id={panelIdentifier}
        role="tabpanel"
      >
        <strong>{activeStage.label}</strong>
        <p>{activeStage.explanation}</p>
      </div>

      {activeStageIdentifier === 'lifetimes' || activeStageIdentifier === 'allocations' ? (
        <ResourceLifetimeView allocationView={activeStageIdentifier === 'allocations'} />
      ) : activeStageIdentifier === 'hazards' ? (
        <HazardView selectedNodeIdentifier={selectedNodeIdentifier} onSelect={setSelectedNodeIdentifier} />
      ) : activeStageIdentifier === 'slices' ? (
        <SliceView
          maximumInvocationCount={maximumInvocationCount}
          onMaximumInvocationCountChange={setMaximumInvocationCount}
          selectedNodeIdentifier={selectedNodeIdentifier}
          onSelect={setSelectedNodeIdentifier}
          slices={slices}
        />
      ) : (
        <NodeSequenceView
          mode={activeStageIdentifier}
          selectedNodeIdentifier={selectedNodeIdentifier}
          onSelect={setSelectedNodeIdentifier}
        />
      )}

      <NodeInspector node={selectedNode} />
    </section>
  );
}

function NodeSequenceView({
  mode,
  onSelect,
  selectedNodeIdentifier
}: {
  mode: GPUCoreCompilerStageId;
  onSelect: (identifier: string) => void;
  selectedNodeIdentifier: string;
}): ReactNode {
  return (
    <ol className={`gpu-core-anatomy__nodes gpu-core-anatomy__nodes--${mode}`}>
      {GPU_CORE_COMPILER_NODES.map((node, nodeIndex) => (
        <li key={node.id}>
          <button
            aria-pressed={node.id === selectedNodeIdentifier}
            className={`gpu-core-anatomy__node gpu-core-anatomy__node--${node.kind}`}
            onClick={() => onSelect(node.id)}
            type="button"
          >
            <small>{mode === 'declared' ? node.kind : `step ${nodeIndex + 1}`}</small>
            <strong>{node.label}</strong>
            {mode === 'encoded' ? (
              <span>
                {node.draws ? `${node.draws} draw` : `${node.dispatches ?? 0} dispatch${node.dispatches === 1 ? '' : 'es'}`}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ol>
  );
}

function HazardView({
  onSelect,
  selectedNodeIdentifier
}: {
  onSelect: (identifier: string) => void;
  selectedNodeIdentifier: string;
}): ReactNode {
  return (
    <div className="gpu-core-anatomy__hazards">
      {GPUGRAPH_HAZARD_EDGES.map(([from, to, reason]) => {
        const fromNode = GPU_CORE_COMPILER_NODES.find(node => node.id === from)!;
        const toNode = GPU_CORE_COMPILER_NODES.find(node => node.id === to)!;
        return (
          <div className="gpu-core-anatomy__hazard" key={`${from}-${to}-${reason}`}>
            <button aria-pressed={from === selectedNodeIdentifier} onClick={() => onSelect(from)} type="button">
              {fromNode.label}
            </button>
            <span>→ <code>{reason}</code> →</span>
            <button aria-pressed={to === selectedNodeIdentifier} onClick={() => onSelect(to)} type="button">
              {toNode.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ResourceLifetimeView({allocationView}: {allocationView: boolean}): ReactNode {
  return (
    <div className="gpu-core-anatomy__lifetimes" role="img" aria-label="Logical resource lifetimes across seven scheduled nodes">
      <div className="gpu-core-anatomy__lifetime-axis" aria-hidden="true">
        <span />
        {GPU_CORE_COMPILER_NODES.map((node, index) => <small key={node.id}>{index + 1}</small>)}
      </div>
      {GPU_CORE_COMPILER_RESOURCES.map(resource => (
        <div className="gpu-core-anatomy__lifetime" key={resource.id}>
          <strong>{resource.id}</strong>
          <div className="gpu-core-anatomy__lifetime-track">
            <span
              className={`gpu-core-anatomy__lifetime-bar gpu-core-anatomy__lifetime-bar--${resource.ownership}`}
              style={{
                gridColumn: `${resource.firstNode + 1} / ${resource.lastNode + 2}`,
                ...(allocationView && resource.ownership === 'transient'
                  ? ({'--allocation-index': resource.allocation.charCodeAt(0) - 64} as React.CSSProperties)
                  : {})
              }}
            >
              {allocationView ? `allocation ${resource.allocation}` : resource.ownership}
            </span>
          </div>
        </div>
      ))}
      {allocationView ? (
        <p>
          <code>scan-scratch</code> and <code>style-scratch</code> both use physical allocation C;
          their lifetimes do not overlap.
        </p>
      ) : null}
    </div>
  );
}

function SliceView({
  maximumInvocationCount,
  onMaximumInvocationCountChange,
  onSelect,
  selectedNodeIdentifier,
  slices
}: {
  maximumInvocationCount: number;
  onMaximumInvocationCountChange: (value: number) => void;
  onSelect: (identifier: string) => void;
  selectedNodeIdentifier: string;
  slices: ReturnType<typeof planGPUCoreExecutionSlices>;
}): ReactNode {
  return (
    <div className="gpu-core-anatomy__slice-view">
      <label>
        Invocation budget: <strong>{NUMBER_FORMAT.format(maximumInvocationCount)}</strong>
        <input
          max={2_400_000}
          min={128_000}
          onChange={event => onMaximumInvocationCountChange(Number(event.currentTarget.value))}
          step={128_000}
          type="range"
          value={maximumInvocationCount}
        />
      </label>
      <div className="gpu-core-anatomy__slices">
        {slices.map(slice => (
          <section className={slice.oversized ? 'gpu-core-anatomy__slice--oversized' : undefined} key={slice.index}>
            <header><strong>Frame {slice.index + 1}</strong><span>{NUMBER_FORMAT.format(slice.invocationCount)} invocations</span></header>
            <div>
              {slice.nodeIds.map(nodeIdentifier => {
                const node = GPU_CORE_COMPILER_NODES.find(candidate => candidate.id === nodeIdentifier)!;
                return <button aria-pressed={nodeIdentifier === selectedNodeIdentifier} key={nodeIdentifier} onClick={() => onSelect(nodeIdentifier)} type="button">{node.label}</button>;
              })}
            </div>
            {slice.oversized ? <small>Indivisible step exceeds the requested budget and runs alone.</small> : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function NodeInspector({node}: {node: GPUCoreCompilerNode}): ReactNode {
  return (
    <section className="gpu-core-anatomy__inspector" aria-live="polite">
      <header><span>Selected node</span><strong>{node.label}</strong></header>
      <div className="gpu-core-anatomy__facts">
        <div><span>Reads</span><strong>{node.reads.join(', ') || 'none'}</strong></div>
        <div><span>Writes</span><strong>{node.writes.join(', ') || 'none'}</strong></div>
        <div><span>Work</span><strong>{node.draws ? `${node.draws} draw` : `${NUMBER_FORMAT.format(node.invocations ?? 0)} invocations`}</strong></div>
        <div><span>Publishes</span><strong>{node.output}</strong></div>
      </div>
      <pre><code>{node.code}</code></pre>
    </section>
  );
}

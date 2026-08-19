import Link from '@docusaurus/Link';
import React, {type ReactNode, useId, useMemo, useState} from 'react';

import {
  evaluateGPUCoreTutorial,
  GPU_CORE_TUTORIAL_DEFAULT_FLAGS,
  GPU_CORE_TUTORIAL_VALUES,
  type GPUCoreTutorialStageId
} from './gpu-core-pipeline-model';

type TutorialStage = {
  identifier: GPUCoreTutorialStageId;
  label: string;
  operation: string;
  explanation: string;
  output: string;
};

const TUTORIAL_STAGES: readonly TutorialStage[] = [
  {
    identifier: 'source',
    label: 'Source',
    operation: 'Application data',
    explanation:
      'Eight source records already live in a GPU buffer. Their original row indices remain their stable identities.',
    output: 'sourceIds and source values'
  },
  {
    identifier: 'mask',
    label: 'Mask',
    operation: 'Application compute node or GPUMask',
    explanation:
      'One flag per source row records a keep or discard decision. Click a source value to change this stage.',
    output: 'one canonical 0/1 flag per source row'
  },
  {
    identifier: 'scan',
    label: 'Scan',
    operation: 'GPUScan (exclusive)',
    explanation:
      'The exclusive prefix sum counts selected rows before each source row. A selected row now knows its stable destination index without an atomic append.',
    output: 'one destination offset per source row'
  },
  {
    identifier: 'scatter',
    label: 'Scatter',
    operation: 'GPUCompaction scatter pass',
    explanation:
      'Selected rows write to their scanned offsets. The output is dense and remains in source order, so later GPU work visits only retained rows.',
    output: 'packed source IDs and a bounded count'
  },
  {
    identifier: 'draw',
    label: 'Indirect draw',
    operation: 'DrawCommandBuffer',
    explanation:
      'The GPU writes the compacted count directly into instanceCount. A fixed drawIndirect call consumes it without waiting for JavaScript to inspect the selection.',
    output: 'a standard WebGPU indirect draw record'
  }
];

const MANUAL_WEBGPU_CODE = `const encoder = device.createCommandEncoder();

encodeMaskPass(encoder, source, flags);
encodeExclusiveScanPasses(encoder, flags, offsets, scratch);
encodeScatterPass(encoder, sourceIds, flags, offsets, visibleIds);
encodeDrawCountPass(encoder, flags, offsets, indirectArguments);

const pass = encoder.beginRenderPass(renderPassDescriptor);
pass.setPipeline(renderPipeline);
pass.setBindGroup(0, renderBindings);
pass.drawIndirect(indirectArguments, 0);
pass.end();

device.queue.submit([encoder.finish()]);`;

const GPU_GRAPH_CODE = `const graph = new GPUCommandGraph(device, {
  id: 'visible-instances'
});

const sourceIds = graph.importGPUData('source-ids', sourceIdsData);
const flags = graph.importGPUData('visibility-flags', flagsData);
const visibleIds = graph.importGPUData('visible-ids', visibleIdsData);
const commandViews = drawCommands.importToGraph(graph);

new GPUCompaction({
  input: sourceIds,
  flags,
  output: visibleIds,
  count: commandViews.instanceCounts
}).addToGraph(graph);

const compiled = graph.compile();
compiled.encode(encoder, {parameters: undefined});
drawCommands.draw(renderPass, 0);`;

export type GPUCorePipelineTutorialProps = {
  compact?: boolean;
};

/** Interactive explanation of mask, scan, stable scatter, and indirect drawing. */
export function GPUCorePipelineTutorial({
  compact = false
}: GPUCorePipelineTutorialProps): ReactNode {
  const [selectionFlags, setSelectionFlags] = useState<number[]>([
    ...GPU_CORE_TUTORIAL_DEFAULT_FLAGS
  ]);
  const [activeStageIdentifier, setActiveStageIdentifier] =
    useState<GPUCoreTutorialStageId>('mask');
  const stagePanelIdentifier = useId();
  const result = useMemo(
    () => evaluateGPUCoreTutorial(GPU_CORE_TUTORIAL_VALUES, selectionFlags),
    [selectionFlags]
  );
  const activeStage = TUTORIAL_STAGES.find(
    stage => stage.identifier === activeStageIdentifier
  )!;
  const isDefaultSelection = selectionFlags.every(
    (flag, sourceIndex) => flag === GPU_CORE_TUTORIAL_DEFAULT_FLAGS[sourceIndex]
  );

  const toggleSource = (sourceIndex: number): void => {
    setSelectionFlags(previousFlags =>
      previousFlags.map((flag, currentSourceIndex) =>
        currentSourceIndex === sourceIndex ? (flag ? 0 : 1) : flag
      )
    );
  };

  return (
    <section
      className={`gpu-core-tutorial${compact ? ' gpu-core-tutorial--compact' : ''}`}
      aria-label="Interactive GPU Core compaction tutorial"
    >
      <header className="gpu-core-tutorial__header">
        <div>
          <span className="gpu-core-tutorial__eyebrow">Interactive dataflow</span>
          <h3>From a sparse decision to one indirect draw</h3>
          <p>
            Select source rows, then follow the GPU-resident values through mask, exclusive scan,
            stable scatter, and the final indirect command.
          </p>
        </div>
        <button
          className="button button--secondary button--sm"
          disabled={isDefaultSelection}
          onClick={() => setSelectionFlags([...GPU_CORE_TUTORIAL_DEFAULT_FLAGS])}
          type="button"
        >
          Reset selection
        </button>
      </header>

      <nav className="gpu-core-tutorial__stage-tabs" aria-label="Pipeline stages" role="tablist">
        {TUTORIAL_STAGES.map((stage, stageIndex) => (
          <React.Fragment key={stage.identifier}>
            {stageIndex > 0 ? <span aria-hidden="true">→</span> : null}
            <button
              aria-controls={stagePanelIdentifier}
              aria-selected={stage.identifier === activeStageIdentifier}
              className="gpu-core-tutorial__stage-tab"
              id={`${stagePanelIdentifier}-${stage.identifier}`}
              onClick={() => setActiveStageIdentifier(stage.identifier)}
              role="tab"
              type="button"
            >
              <small>{stageIndex + 1}</small>
              {stage.label}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div
        aria-labelledby={`${stagePanelIdentifier}-${activeStageIdentifier}`}
        className="gpu-core-tutorial__stage-detail"
        id={stagePanelIdentifier}
        role="tabpanel"
      >
        <div>
          <span>Operation</span>
          <strong>{activeStage.operation}</strong>
        </div>
        <p>{activeStage.explanation}</p>
        <div>
          <span>Publishes</span>
          <strong>{activeStage.output}</strong>
        </div>
      </div>

      <div className="gpu-core-tutorial__dataflow" aria-live="polite">
        <TutorialRow
          active={activeStageIdentifier === 'source'}
          label="Source value"
          note="Click to keep or discard"
        >
          {GPU_CORE_TUTORIAL_VALUES.map((value, sourceIndex) => (
            <button
              aria-label={`${selectionFlags[sourceIndex] ? 'Discard' : 'Keep'} source row ${sourceIndex}, value ${value}`}
              aria-pressed={Boolean(selectionFlags[sourceIndex])}
              className="gpu-core-tutorial__source-cell"
              key={sourceIndex}
              onClick={() => toggleSource(sourceIndex)}
              type="button"
            >
              <small>#{sourceIndex}</small>
              <strong>{value}</strong>
            </button>
          ))}
        </TutorialRow>

        <TutorialRow
          active={activeStageIdentifier === 'mask'}
          label="Keep mask"
          note="0 discards · 1 keeps"
        >
          {result.flags.map((flag, sourceIndex) => (
            <TutorialCell key={sourceIndex} selected={Boolean(flag)}>
              {flag}
            </TutorialCell>
          ))}
        </TutorialRow>

        <TutorialRow
          active={activeStageIdentifier === 'scan'}
          label="Exclusive scan"
          note="selected rows before this row"
        >
          {result.offsets.map((offset, sourceIndex) => (
            <TutorialCell key={sourceIndex} selected={Boolean(result.flags[sourceIndex])}>
              {offset}
            </TutorialCell>
          ))}
        </TutorialRow>

        <TutorialRow
          active={activeStageIdentifier === 'scatter'}
          label="Packed output"
          note={`${result.instanceCount} valid ${result.instanceCount === 1 ? 'row' : 'rows'}`}
        >
          {GPU_CORE_TUTORIAL_VALUES.map((_, outputIndex) => {
            const compactedValue = result.compactedValues[outputIndex];
            const compactedSourceIndex = result.compactedSourceIndices[outputIndex];
            return (
              <TutorialCell key={outputIndex} selected={compactedValue !== undefined}>
                {compactedValue === undefined ? (
                  <span aria-hidden="true">·</span>
                ) : (
                  <>
                    <small>#{compactedSourceIndex}</small>
                    {compactedValue}
                  </>
                )}
              </TutorialCell>
            );
          })}
        </TutorialRow>
      </div>

      <div
        className={`gpu-core-tutorial__indirect${activeStageIdentifier === 'draw' ? ' gpu-core-tutorial__indirect--active' : ''}`}
      >
        <div>
          <span>vertexCount</span>
          <strong>6</strong>
        </div>
        <div className="gpu-core-tutorial__indirect-count">
          <span>instanceCount</span>
          <strong>{result.instanceCount}</strong>
          <small>GPU-written</small>
        </div>
        <div>
          <span>firstVertex</span>
          <strong>0</strong>
        </div>
        <div>
          <span>firstInstance</span>
          <strong>0</strong>
        </div>
        <code>drawIndirect(buffer, 0)</code>
      </div>

      {compact ? (
        <p className="gpu-core-tutorial__continue">
          <Link to="/docs/api-reference/experimental/gpu-core/tutorial">
            Continue with the complete tutorial and WebGPU comparison →
          </Link>
        </p>
      ) : (
        <>
          <ComparisonSection />
          <CompilationSection />
        </>
      )}
    </section>
  );
}

function TutorialRow({
  active,
  children,
  label,
  note
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  note: string;
}): ReactNode {
  return (
    <div
      className={`gpu-core-tutorial__row${active ? ' gpu-core-tutorial__row--active' : ''}`}
    >
      <div className="gpu-core-tutorial__row-label">
        <strong>{label}</strong>
        <small>{note}</small>
      </div>
      <div className="gpu-core-tutorial__cells">{children}</div>
    </div>
  );
}

function TutorialCell({
  children,
  selected = false
}: {
  children: ReactNode;
  selected?: boolean;
}): ReactNode {
  return (
    <span
      className={`gpu-core-tutorial__cell${selected ? ' gpu-core-tutorial__cell--selected' : ''}`}
    >
      {children}
    </span>
  );
}

function ComparisonSection(): ReactNode {
  return (
    <section className="gpu-core-tutorial__comparison" aria-labelledby="gpu-core-comparison-title">
      <div className="gpu-core-tutorial__section-heading">
        <span className="gpu-core-tutorial__eyebrow">Same GPU work, different ownership</span>
        <h3 id="gpu-core-comparison-title">Manual WebGPU and GPU Core</h3>
        <p>
          GPU Core does not replace WGSL or submission. It makes the intermediate resources,
          hazards, reusable operations, and bounded outputs explicit enough to compile and inspect.
          These excerpts focus on scheduling; buffer creation, shaders, and render setup are
          intentionally omitted.
        </p>
      </div>

      <div className="gpu-core-tutorial__code-grid">
        <CodePanel
          code={MANUAL_WEBGPU_CODE}
          label="Manual WebGPU scheduling"
          note="The application coordinates every pass, scratch allocation, binding, and output field."
        />
        <CodePanel
          code={GPU_GRAPH_CODE}
          label="GPU Core composition"
          note="The application declares durable resources and intent; contributors expand into scheduled passes."
          primary
        />
      </div>

      <div className="gpu-core-tutorial__ownership-grid">
        <OwnershipCard
          label="Application still owns"
          values={['WGSL semantics', 'persistent source buffers', 'command submission', 'render pipelines']}
        />
        <OwnershipCard
          label="Graph compilation owns"
          values={['hazard ordering', 'transient allocation', 'stable scheduling', 'validation and estimates']}
          primary
        />
      </div>
    </section>
  );
}

function CodePanel({
  code,
  label,
  note,
  primary = false
}: {
  code: string;
  label: string;
  note: string;
  primary?: boolean;
}): ReactNode {
  return (
    <article
      className={`gpu-core-tutorial__code-panel${primary ? ' gpu-core-tutorial__code-panel--primary' : ''}`}
    >
      <header>
        <strong>{label}</strong>
        <small>{note}</small>
      </header>
      <pre>
        <code>{code}</code>
      </pre>
    </article>
  );
}

function OwnershipCard({
  label,
  primary = false,
  values
}: {
  label: string;
  primary?: boolean;
  values: readonly string[];
}): ReactNode {
  return (
    <article
      className={`gpu-core-tutorial__ownership-card${primary ? ' gpu-core-tutorial__ownership-card--primary' : ''}`}
    >
      <strong>{label}</strong>
      <ul>
        {values.map(value => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </article>
  );
}

function CompilationSection(): ReactNode {
  const steps = [
    ['Composed', 'The application combines its mask node with a GPUCompaction contributor.'],
    ['Declared', 'addToGraph() expands compaction into logical resources, scan nodes, and scatter nodes.'],
    ['Scheduled', 'Read-after-write and write-after-read hazards derive the legal pass order.'],
    ['Allocated', 'Scan offsets are transient; source, packed output, and draw arguments remain borrowed.'],
    ['Encoded', 'The immutable plan records into the command encoder supplied by the application.']
  ] as const;

  return (
    <section className="gpu-core-tutorial__compilation" aria-labelledby="gpu-core-compiler-title">
      <div className="gpu-core-tutorial__section-heading">
        <span className="gpu-core-tutorial__eyebrow">From composition to commands</span>
        <h3 id="gpu-core-compiler-title">From declared intent to an executable plan</h3>
      </div>
      <ol>
        {steps.map(([label, explanation]) => (
          <li key={label}>
            <strong>{label}</strong>
            <span>{explanation}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

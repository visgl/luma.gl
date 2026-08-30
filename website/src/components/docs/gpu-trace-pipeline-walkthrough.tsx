import React, {type ReactNode, useId, useState} from 'react';

type TraceWalkthroughStage = {
  id: string;
  label: string;
  operation: string;
  explanation: string;
  activeSpans: readonly number[];
  showOffsets?: boolean;
  showDensity?: boolean;
  showIndirect?: boolean;
};

const TRACE_STAGES: readonly TraceWalkthroughStage[] = [
  {id: 'index', label: 'Temporal index', operation: 'GPUTraceTemporalIndex', explanation: 'Choose persistent trace-time partitions that overlap the viewport; panning does not move their boundaries.', activeSpans: [0, 1, 2, 3, 4, 5]},
  {id: 'candidates', label: 'Candidates', operation: 'Index query', explanation: 'Publish a bounded, stable source-ordered candidate list shared by rendering, labels, dependencies, analytics, and picking.', activeSpans: [0, 1, 2, 3, 4, 5]},
  {id: 'mask', label: 'Visibility mask', operation: 'GPUMask', explanation: 'Apply time, lane, classification, duration, hierarchy, and selected-path policies without changing canonical span identity.', activeSpans: [0, 2, 3, 5]},
  {id: 'scan', label: 'Output positions', operation: 'GPUScan', explanation: 'Exclusive scan gives every visible candidate a stable packed output position.', activeSpans: [0, 2, 3, 5], showOffsets: true},
  {id: 'compact', label: 'Compacted spans', operation: 'GPUCompaction', explanation: 'Scatter only accepted canonical IDs into the bounded exact-span output.', activeSpans: [0, 2, 3, 5]},
  {id: 'lod', label: 'Semantic LOD', operation: 'GPUTracePixelMipmap', explanation: 'Keep wide exact spans while small marks become representative spans or stable trace-coordinate density.', activeSpans: [0, 3, 5], showDensity: true},
  {id: 'indirect', label: 'Indirect commands', operation: 'DrawCommandBuffer', explanation: 'GPU-written counts become draw arguments. JavaScript does not download the visible span list.', activeSpans: [0, 3, 5], showDensity: true, showIndirect: true},
  {id: 'render', label: 'Final render', operation: 'Renderer-owned graph nodes', explanation: 'Exact spans, density, selected dependencies, and labels render from the same canonical selection generation.', activeSpans: [0, 3, 5], showDensity: true, showIndirect: true}
];

const TRACE_SPANS = [
  {lane: 0, start: 2, width: 42, color: 'blue'},
  {lane: 0, start: 48, width: 7, color: 'orange'},
  {lane: 1, start: 12, width: 9, color: 'purple'},
  {lane: 1, start: 25, width: 56, color: 'blue'},
  {lane: 2, start: 4, width: 5, color: 'orange'},
  {lane: 2, start: 18, width: 70, color: 'purple'}
] as const;

/** Guided, lightweight explanation of the trace viewer's GPU-resident selection pipeline. */
export function GPUTracePipelineWalkthrough(): ReactNode {
  const [stageIndex, setStageIndex] = useState(0);
  const panelIdentifier = useId();
  const stage = TRACE_STAGES[stageIndex];
  const visibleOffsets = TRACE_SPANS.map((_, index) => stage.activeSpans.filter(activeIndex => activeIndex < index).length);

  return (
    <section className="gpu-trace-walkthrough" aria-label="How the GPU trace viewer works">
      <header>
        <div>
          <span className="gpu-core-tutorial__eyebrow">Guided architecture</span>
          <h3>How one view becomes bounded GPU work</h3>
          <p>Step through the same candidate, mask, scan, compaction, LOD, and indirect-rendering contracts used by the full example.</p>
        </div>
        <span>{stageIndex + 1} / {TRACE_STAGES.length}</span>
      </header>
      <nav aria-label="Trace pipeline stages" role="tablist">
        {TRACE_STAGES.map((candidate, index) => (
          <button aria-controls={panelIdentifier} aria-selected={index === stageIndex} id={`${panelIdentifier}-${candidate.id}`} key={candidate.id} onClick={() => setStageIndex(index)} role="tab" type="button">{candidate.label}</button>
        ))}
      </nav>
      <div aria-labelledby={`${panelIdentifier}-${stage.id}`} className="gpu-trace-walkthrough__explanation" id={panelIdentifier} role="tabpanel">
        <strong>{stage.operation}</strong><p>{stage.explanation}</p>
      </div>
      <div className="gpu-trace-walkthrough__canvas" role="img" aria-label={`${stage.label}: ${stage.activeSpans.length} active example spans`}>
        {[0, 1, 2].map(lane => <span className="gpu-trace-walkthrough__lane" key={lane} style={{top: `${lane * 32 + 8}px`}} />)}
        {TRACE_SPANS.map((span, index) => {
          const active = stage.activeSpans.includes(index);
          return (
            <span className={`gpu-trace-walkthrough__span gpu-trace-walkthrough__span--${span.color}${active ? ' gpu-trace-walkthrough__span--active' : ''}`} key={index} style={{left: `${span.start}%`, top: `${span.lane * 32 + 11}px`, width: `${span.width}%`}}>
              {stage.showOffsets && active ? <small>{visibleOffsets[index]}</small> : null}
            </span>
          );
        })}
        {stage.showDensity ? <span className="gpu-trace-walkthrough__density" style={{left: '48%', top: '13px', width: '12%'}}>density</span> : null}
      </div>
      {stage.showIndirect ? (
        <div className="gpu-trace-walkthrough__command"><code>instanceCount = {stage.activeSpans.length}</code><span>GPU-written</span></div>
      ) : null}
      <footer>
        <button disabled={stageIndex === 0} onClick={() => setStageIndex(index => index - 1)} type="button">Previous</button>
        <button disabled={stageIndex === TRACE_STAGES.length - 1} onClick={() => setStageIndex(index => index + 1)} type="button">Next stage</button>
      </footer>
    </section>
  );
}

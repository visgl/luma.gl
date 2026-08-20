import React, {type ReactNode, useMemo, useState} from 'react';

import {planGPUCoreExecutionSlices} from './gpu-core-compiler-model';

const NUMBER_FORMAT = new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1});

/** Small live lab for CPU conditions, bounded execution, and visible validation failure. */
export function GPUCoreExecutionLab(): ReactNode {
  const [analysisEnabled, setAnalysisEnabled] = useState(true);
  const [maximumInvocationCount, setMaximumInvocationCount] = useState(1_100_000);
  const [outputCapacity, setOutputCapacity] = useState(4);
  const requiredCapacity = 4;
  const slices = useMemo(() => planGPUCoreExecutionSlices(maximumInvocationCount), [maximumInvocationCount]);
  const valid = outputCapacity >= requiredCapacity;

  return (
    <section className="gpu-core-execution-lab" aria-label="Conditional and budgeted execution lab">
      <header>
        <span className="gpu-core-tutorial__eyebrow">Interactive execution policy</span>
        <h3>Skip, slice, and reject work before it surprises the frame</h3>
        <p>These controls change parameters and a legal execution plan; they do not rebuild graph topology.</p>
      </header>
      <div className="gpu-core-execution-lab__controls">
        <label className="gpu-core-execution-lab__switch">
          <input checked={analysisEnabled} onChange={event => setAnalysisEnabled(event.currentTarget.checked)} type="checkbox" />
          <span>Optional analysis</span>
        </label>
        <label>
          Per-frame invocation budget <strong>{NUMBER_FORMAT.format(maximumInvocationCount)}</strong>
          <input max={2_400_000} min={128_000} onChange={event => setMaximumInvocationCount(Number(event.currentTarget.value))} step={128_000} type="range" value={maximumInvocationCount} />
        </label>
        <label>
          Output capacity <strong>{outputCapacity}</strong>
          <input max={6} min={1} onChange={event => setOutputCapacity(Number(event.currentTarget.value))} step={1} type="range" value={outputCapacity} />
        </label>
      </div>
      <div className="gpu-core-execution-lab__status">
        <div><span>Condition</span><strong>{analysisEnabled ? 'analysis branch encoded' : 'analysis branch skipped'}</strong></div>
        <div><span>Execution</span><strong>{slices.length} frame {slices.length === 1 ? 'slice' : 'slices'}</strong></div>
        <div><span>Validation</span><strong className={valid ? undefined : 'gpu-core-execution-lab__error'}>{valid ? 'ready to encode' : `capacity ${outputCapacity} is below required ${requiredCapacity}`}</strong></div>
      </div>
      {!analysisEnabled ? <p className="gpu-core-execution-lab__warning">Skipped writers do not clear retained output. Condition the dependent readers or version the result.</p> : null}
      {!valid ? <p className="gpu-core-execution-lab__error-panel" role="alert"><strong>Encoding blocked.</strong> Increase output capacity or reduce the bounded request. The graph reports this contract failure before submission.</p> : null}
    </section>
  );
}

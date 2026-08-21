import React, {type ReactNode} from 'react';
import {DocumentationExampleCard} from './documentation-example-card';

export type GPUExampleCardProps = {
  demonstrates: readonly string[];
  input: string;
  gpuOutput: string;
  cpuReadback: string;
  execution: string;
  compatibility: string;
  fullPageHref?: string;
  sourceHref?: string;
  inspectorHref?: string;
  presets?: readonly {label: string; href: string}[];
};

/** Shared context and actions for GPU-backed documentation examples. */
export function GPUExampleCard(props: GPUExampleCardProps): ReactNode {
  return (
    <DocumentationExampleCard
      rows={[
        {label: 'Demonstrates', value: props.demonstrates.join(' · ')},
        {label: 'Input', value: props.input},
        {label: 'GPU output', value: props.gpuOutput},
        {label: 'CPU readback', value: props.cpuReadback},
        {label: 'Execution', value: props.execution},
        {label: 'Compatibility', value: props.compatibility}
      ]}
      fullPageHref={props.fullPageHref}
      sourceHref={props.sourceHref}
      inspectorHref={props.inspectorHref}
      inspectorLabel="Inspect graph"
      actions={props.presets}
    />
  );
}

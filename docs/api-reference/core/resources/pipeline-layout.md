import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# PipelineLayout

<CoreDocsTabs group="resources" active="pipeline-layout" />

`PipelineLayout` describes the binding groups available to a render or compute pipeline.

<DocumentationContract
  title="PipelineLayout"
  rows={[
    {label: 'Creation', value: 'Device.createPipelineLayout()'},
    {label: 'Ownership', value: 'Explicit application-owned Core resource'},
    {label: 'Usage', value: 'Shared render and compute pipeline binding contract'},
    {label: 'Lifecycle', value: 'Create before dependent pipelines; destroy with the owning subsystem'},
    {label: 'Compatibility', value: 'Explicit on WebGPU; adapted where supported on WebGL'},
    {label: 'Cost', value: 'Prefer stable reusable layouts over per-frame creation'}
  ]}
/>

## Common mistake

The pipeline layout and shader binding declarations must describe compatible groups, bindings,
visibility, and resource types.

## Related workflow

See [GPU bindings](/docs/api-guide/gpu/gpu-bindings) and [`ShaderLayout`](/docs/api-reference/core/shader-layout).

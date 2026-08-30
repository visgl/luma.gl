import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# CommandBuffer

<CoreDocsTabs group="resources" active="command-buffer" />

`CommandBuffer` is an immutable recorded unit of GPU work produced by a
[`CommandEncoder`](./command-encoder). Submit it through the owning `Device`.

<DocumentationContract
  title="CommandBuffer"
  rows={[
    {label: 'Creation', value: 'Finish a CommandEncoder'},
    {label: 'Ownership', value: 'Owned by the creating device and application'},
    {label: 'Usage', value: 'Submit recorded copy, compute, and render commands'},
    {label: 'Lifecycle', value: 'Record once; submission behavior is backend-specific'},
    {label: 'Compatibility', value: 'Native WebGPU concept with portable luma.gl abstraction'},
    {label: 'Cost', value: 'Recording groups work; submission remains an explicit queue boundary'}
  ]}
/>

## Common mistake

Do not mutate resources or layouts as if finishing the encoder changed the recorded command
contract. Build a new command buffer when the operation sequence changes.

## Related workflow

See [GPU commands](/docs/api-guide/gpu/gpu-commands).

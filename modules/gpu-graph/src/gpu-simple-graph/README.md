# GPUSimpleGraph prototype

A graph-shaped interface to the existing GPGPU evaluator, for exploring a small shared CPU/WebGL/WebGPU execution model.

```typescript
import {GPUDataEvaluator, add, multiply} from '@luma.gl/gpgpu';
import {GPUSimpleGraph} from '@luma.gl/gpu-graph/gpu-simple-graph';

const graph = new GPUSimpleGraph(device, {id: 'scale-and-offset'});
const values = graph.add('values', GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1}));
const doubled = graph.add('doubled', multiply(values, 2));
graph.add('result', add(doubled, 1));

const compiled = graph.compile({outputs: ['result']});
console.table(compiled.nodes);
const {result} = await compiled.run();
// result is a GPUVector, ready for subsequent GPU consumers.
```

## Behavior

- `add(id, evaluator)` registers a value and returns the same evaluator.
- `compile({outputs})` snapshots selected outputs and their reachable dependencies. By default, the last registered value is the output. Compilation allocates no GPU resources.
- `compiled.nodes` exposes the evaluator dependency plan in dependency order. Existing arithmetic fusion can eliminate named intermediate values from this plan.
- `run()` delegates to the evaluator backends and returns named GPUVectors. CPU readback remains explicit through the evaluators.
- GPUVectorEvaluator values preserve physical chunk boundaries.
- Repeated runs reuse evaluator caches. Evaluators and results remain caller-owned; destroy the evaluators when the results are no longer needed.
- `clear()` resets registration metadata. Previously compiled snapshots remain usable.

## Prototype limits

This prototype inherits evaluator backend support and submission behavior. It does not provide GPUGraph transient allocation, deferred submission, dynamic input rebinding, indirect execution, or graph-wide cancellation. Concurrent runs over shared evaluator objects are unsupported. Unsupported backend operations propagate errors; there is no added CPU fallback.

The next experiment is a shared operation plan that both this executor and GPUGraph can lower, followed by buffer and texture transform operations with parent-controlled submission.

# GPUCommandGraph Design

## Status and scope

This document records the design position of `GPUCommandGraph`, compares it with established GPU
graph APIs, and identifies criteria for evolving the experimental API. It complements the
[`GPUCommandGraph` reference](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph),
which remains the source for current behavior and examples.

The comparison was last reviewed in August 2026. External APIs continue to evolve, so their linked
primary documentation takes precedence over this summary.

`GPUCommandGraph` is a reusable WebGPU command-planning layer. It describes compute, render, and
copy work; derives an execution order from declared resource uses; plans transient lifetimes; and
records the resulting work into a caller-owned `CommandEncoder`. It is not a functional expression
graph, a queue, or a reusable native WebGPU command buffer.

## Design position

The closest conceptual peer is [Daxa TaskGraph](https://wiki.daxa.dev/taskgraph/): both APIs use
virtual resources, declared accesses, a definition/finalization split, repeated execution,
automatic synchronization planning, and transient reuse. CUDA, SYCL, and OpenCL graphs provide the
most useful lifecycle and mutability comparisons, while Taskflow provides useful node-handle,
composition, and visualization ergonomics.

There is one important platform boundary. A WebGPU command buffer can be submitted only once, so a
compiled luma.gl graph must invoke its JavaScript callbacks and record new commands for every
encoding. Compilation amortizes dependency analysis, transient allocation, and node-owned GPU
object creation, but does not provide CUDA-style native graph replay. See the
[WebGPU command-buffer specification](https://www.w3.org/TR/webgpu/#command-buffers).

## Comparable APIs

| API | Primary model | Construction and execution | Most relevant lessons for luma.gl |
| --- | --- | --- | --- |
| `GPUCommandGraph` | WebGPU command and resource plan | Explicit definition, `compile()`, then repeated encoding into caller-owned command encoders | Preserve explicit submission and ownership; make every declared resource contract enforceable. |
| [CUDA Graphs](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/cuda-graphs.html) | Native GPU execution DAG | Explicit graph construction or stream capture, instantiation, then low-overhead launch | Keep definition and executable phases distinct; use node handles; separate topology changes from executable parameter updates. |
| [SYCL Graph](https://intel.github.io/llvm/syclgraph/SYCLGraphUsageGuide.html) | Portable command-group graph | Explicit construction or queue recording, finalization, submission, and optional executable updates | Typed dynamic parameters and node-level updates provide a cleaner model than a graph-wide unstructured parameter bag. |
| [OpenCL command buffers](https://registry.khronos.org/OpenCL/specs/unified/refpages/man/html/cl_khr_command_buffer.html) | Recorded command buffer with explicit synchronization points | Record, finalize, and repeatedly enqueue; layered extensions add [mutable dispatch](https://registry.khronos.org/OpenCL/specs/unified/refpages/man/html/cl_khr_command_buffer_mutable_dispatch.html) and [multi-device execution](https://registry.khronos.org/OpenCL/sdk/3.0/docs/man/html/cl_khr_command_buffer_multi_device.html) | Return stable command handles and design immutable topology separately from mutable dispatch values. |
| [Daxa TaskGraph](https://wiki.daxa.dev/taskgraph/) | Vulkan task/render graph | Declare virtual resources and task attachments, complete the graph, rebind persistent resources, and execute repeatedly | Scope runtime resource access to declared task attachments; expose why synchronization and reordering occurred. |
| [Taskflow CUDA Graph](https://taskflow.github.io/taskflow/GPUTasking.html) | C++ task graph over CUDA Graphs | Create typed task handles, connect them with `precede()` or `succeed()`, instantiate, run, and export DOT | Prefer node handles over string dependencies and make graph structure directly inspectable. |

These APIs solve related but not identical problems. CUDA, SYCL, and OpenCL can use backend support
to replay previously prepared work. Daxa and `GPUCommandGraph` are also resource planners: their
callbacks record work while the compiled plan supplies resource state and synchronization. Taskflow
is additionally a heterogeneous CPU/GPU task system. Features should be adopted only when their
semantics can be expressed honestly on WebGPU.

## Feature comparison

| Criterion | `GPUCommandGraph` | CUDA Graphs | SYCL Graph | OpenCL command buffer | Daxa TaskGraph | Taskflow CUDA Graph |
| --- | --- | --- | --- | --- | --- | --- |
| Graph contents | Compute, render, copy or encoder-level nodes | Kernels, copies, memory operations, host, event, semaphore, child, and conditional nodes | SYCL command groups, including kernels, copies, and host tasks subject to graph support | Supported recorded OpenCL commands | Arbitrary Vulkan recording tasks with declared attachments | CUDA kernels and memory operations inside a wider CPU task graph |
| Construction | Explicit builder only | Explicit API or stream capture | Explicit API or queue record/replay | Explicit recording API | Explicit task builder | Explicit task builder |
| Final artifact | Reusable plan that re-encodes work | Native executable graph | Executable graph | Executable command buffer | Completed reusable task graph | CUDA executable graph wrapper |
| Repeated execution | New WebGPU commands are encoded each time | Native graph launch | Executable graph submission | Re-enqueue recorded commands | Task callbacks run against a reused plan | Native CUDA graph launch |
| Dependency model | Resource hazards plus string `dependsOn` IDs | Explicit node edges or captured stream/event order | Explicit node edges or recorded queue dependencies | Explicit synchronization-point wait lists | Resource-attachment hazards and task order | Typed task handles with precedence edges |
| Resource contract | Declared uses drive validation, scheduling, and lifetime planning | Kernel and operation parameters; dependencies are explicit | Accessors can express dependencies; USM use needs explicit ordering | Memory objects belong to recorded commands; synchronization is explicit | Task attachments declare resource access and state | CUDA operation parameters; task edges are explicit |
| Transient memory | Graph-owned buffers and textures reuse compatible non-overlapping lifetimes | Graph allocation/free nodes can enable memory reuse | Normally application or runtime managed | Normally application managed | Transient resources can be memory-aliased | Inherited from CUDA or application code |
| Per-execution values | Graph-wide typed `parameters` plus ID-keyed import overrides | Executable-node and whole-graph update APIs | Dynamic parameters, dynamic command groups, and executable updates | Mutable-dispatch extension | Persistent task resources can be rebound before execution | CUDA task or executable update APIs |
| Node identity | Required string ID; add methods return `void` | Stable node handles | Stable node handles | Optional mutable-command handles | Named tasks and attachment indices | Stable typed task handles |
| Composition | Contributors flatten nodes into one graph | Child graph nodes and graph cloning | Graph recording and executable graph submission | Layered multi-device/remapping support | Multiple task graphs can coordinate through resources and queues | Module tasks compose task graphs |
| Dynamic control flow | Outside the graph; indirect GPU commands cover bounded GPU decisions | Conditional nodes and device graph launch | Dynamic command-group selection; host orchestration for broader control flow | Outside the base command buffer | Normally expressed by task-graph variants or task code | CPU condition tasks; CUDA capabilities underneath |
| Submission ownership | Caller owns encoder finishing and queue submission | Graph launches into a caller-selected stream | Caller submits executable graph to a queue | Caller enqueues command buffer | TaskGraph can submit or coordinate queue work | Caller/executor runs the CUDA graph |
| Multi-device or multi-queue | One WebGPU device and its queue | Stream and multi-device CUDA facilities outside one ordinary graph | Backend and queue dependent | Optional multi-device extension | Multiple Vulkan queues and task graphs | Heterogeneous outer Taskflow plus CUDA devices |
| Host work | Kept outside the graph | Host nodes are supported | Host tasks are supported subject to graph restrictions | Host-interacting commands are deliberately restricted | CPU callbacks record GPU work; they are not scheduled host nodes | CPU tasks and GPU graphs compose directly |
| Inspection | Aggregate allocation stats, node order, CPU/GPU timing summaries | Graph queries and debug output | Runtime-dependent graph diagnostics | Command-buffer and mutable-command queries | Validation and task/resource metadata | DOT export and task inspection |
| Portability target | WebGPU only | NVIDIA CUDA | SYCL backends | OpenCL implementations with extensions | Vulkan through Daxa | CUDA for GPU subgraphs |

## Design criteria

The following criteria are intended to guide reviews of additions and breaking changes. “Direction”
describes the intended contract, not necessarily behavior implemented today.

| Criterion | Current design | Direction |
| --- | --- | --- |
| Truthful abstraction | Compilation prepares a reusable plan, but every `encode()` records new WebGPU commands. | Documentation and naming must not imply native replay or CUDA-equivalent launch-overhead reduction. |
| Definition lifecycle | A mutable definition can be compiled once. | Make finalization transactional: a failed compilation must not leave an otherwise reusable definition ambiguously frozen. |
| Execution ownership | The application supplies the command encoder and submits it. | Preserve explicit encoder, submission, presentation, and synchronization ownership. |
| Backend scope | WebGPU only. | Do not weaken the model to imitate WebGL or CPU execution; use GPGPU evaluators for portable value operations. |
| Node identity | Strings identify nodes and explicit dependencies. | Return opaque node handles from add methods; retain strings as stable diagnostic labels. |
| Ordering semantics | Hazards are inferred in declaration order and combined with explicit dependencies. | Document declaration order as semantically meaningful; expose each compiled edge and its reason. |
| Resource access | Nodes declare resource uses, but runtime resolver calls are not scoped to those declarations. | Make declarations enforceable capabilities for each node. Undeclared graph-resource resolution must fail immediately. |
| Node-local compatibility | Individual uses are validated against descriptors. | Reject incompatible overlapping uses within one node before encoding. |
| Buffer hazard precision | Hazards are conservative at whole-handle granularity. | Preserve the safe default; consider explicit byte-range tracking only with clear alias and binding semantics. |
| Texture hazard precision | Mip, layer, and aspect ranges are tracked through graph views. | Preserve subresource precision and prevent callbacks from widening a declared view into whole-texture access. |
| Transient ownership | The compiled graph owns physical transient allocations. | Keep transient resources non-escaping and make logical-to-physical reuse inspectable. |
| Imported ownership | Imports are borrowed and may be replaced compatibly per encoding. | Preserve caller ownership and validate every concrete replacement before node recording starts. |
| Runtime parameters | One `Parameters` value is visible to every node. | Keep a simple graph-wide option, while allowing typed node-local dynamic values when they improve encapsulation. |
| Resource rebinding | Overrides are keyed by resource ID strings. | Add a handle-keyed or compiled binding-set API without removing readable IDs from diagnostics. |
| Contributor composition | Contributors add resources and nodes directly to the parent graph. | Add scopes or namespaces before adopting nested executable graphs; avoid manual prefix conventions as the only collision defense. |
| Conditional work | Structural conditions are handled by application graph selection; GPU counts use indirect commands. | Prefer indirect dispatch/draw and compiled graph variants. Add graph conditionals only if WebGPU semantics and resource lifetimes remain explicit. |
| Pass ownership | The graph owns compute and render pass lifecycles; copy nodes access the command encoder. | Keep managed paths narrow. Mark arbitrary encoder and caller-framebuffer callbacks as explicit opaque escape hatches. |
| Readback | Never implicit. | Preserve explicit, bounded, caller-requested readback. Diagnostics must not change normal graph execution. |
| Failure behavior | Construction, compilation, and binding checks fail at several lifecycle phases. | Define which failures leave the definition, compiled graph, and command encoder reusable; make cleanup exception-safe. |
| Concurrent use | Multiple encodings share graph-owned transients and are submitted through WebGPU's queue model. | Document encoding and submission ordering requirements, especially for frame IDs, history resources, and graph variants. |
| Inspection | Inspector snapshots expose order, aggregate memory, counters, and timings. | Add a structural snapshot with nodes, edges, edge reasons, resources, lifetimes, aliases, and contributor groups. |
| Performance evidence | CPU encode, GPU timing, and memory reuse are measured separately. | Compare against equivalent direct WebGPU encoding and report what compilation actually amortizes. |
| Runtime cost | Validation and resolution occur on every encoding. | Precompute contract metadata during compilation and keep per-resolution checks constant-time and concise. |

## Proposal: enforce node resource contracts

### Problem

Resource declarations are currently the compiler's source of truth for three different concerns:

1. validating that a logical resource supports the requested use;
2. adding read/write dependencies; and
3. computing transient first/last-use intervals.

The executable context nevertheless exposes graph-wide `getBuffer()`, `getTexture()`,
`getTextureView()`, and `getExternalTexture()` functions. A callback can resolve a same-graph
resource that its node did not declare. An undeclared imported resource then has no inferred
hazards, while an undeclared transient can be missing from the allocation plan or can have an
incorrect aliasing lifetime. This makes the declarations advisory at the point where they need to
be an invariant.

The graph cannot inspect bind groups or arbitrary objects captured by user callbacks. The
enforceable boundary is therefore narrower: every graph handle resolved through the executable
context must be covered by that node's declared uses. Documentation must continue to prohibit
capturing concrete graph imports as a way to bypass rebinding and scheduling.

### Target invariant

For every executable node:

- a buffer may be resolved only when that node declares the underlying `GraphBufferHandle` or one
  of its `GraphDataView`s;
- because current buffer hazards are handle-granular, a declared buffer view grants resolution of
  its underlying handle, but not of a different graph buffer;
- `getTexture(handle)` requires a whole-texture declaration;
- `getTextureView(view)` requires that exact normalized graph view or a whole-texture declaration;
- declaring one texture view must not grant access to unrelated mips, layers, or aspects;
- an external texture may be resolved only when its handle is declared by that render node;
- graph-managed render and resolve attachments are added to the contract automatically; and
- a contract violation names the graph, node, and logical resource, then aborts that encoding. The
  caller must discard the partially recorded command encoder.

### Minimal API-compatible implementation

The first implementation does not need to change the public callback shape.

1. During compilation, normalize each node's declared resources and generated attachment uses into
   a compact `CompiledNodeResourceContract`.
2. Store constant-time sets for permitted buffer handles, whole-texture handles, texture views, and
   external-texture handles beside each compiled node.
3. Create a node-scoped encode context before calling `getRenderPassProps()` or `encode()`.
4. Wrap the existing resolver functions with contract checks. The underlying physical resource
   caches and binding validation remain graph-wide.
5. Validate duplicate and overlapping declarations while building the contract. Exact duplicate
   uses may be coalesced; incompatible simultaneous uses must be rejected.
6. Keep error strings concise and put detailed invariant explanations in adjacent source comments.

The compiled contract should use normalized handle identity rather than string IDs. IDs remain
labels and binding keys; they must not become the authority for access control.

### Stronger follow-up API

A later breaking revision can make valid code easier to write by naming declared attachments and
returning a typed resource interface to the callback, following the spirit of Daxa task
attachments:

```ts
graph.addComputePass({
  id: 'update',
  resources: {
    source: {buffer: source, usage: 'storage-read'},
    target: {buffer: target, usage: 'storage-write'}
  },
  compile: ({device}) => ({
    encode: ({computePass, resources}) => {
      computation.setBindings({
        source: resources.source.buffer,
        target: resources.target.buffer
      });
      computation.dispatch(computePass);
    }
  })
});
```

This shape can infer callback resource names and types, reduce repeated handle references, and make
undeclared access unavailable by construction. It should follow, rather than block, enforcement of
the existing array-based API.

### Compatibility and rollout

1. Inventory every first-party graph node and compare resolver calls with declared resources.
2. Add contract normalization and tests without changing scheduling or allocation behavior.
3. Run first-party examples in strict mode and correct missing declarations.
4. Enable strict enforcement by default while the API remains experimental. Avoid a permanent
   production `off` switch that would make allocation safety configuration-dependent.
5. Document the command-encoder discard rule for callback and contract failures.
6. Consider the typed named-resource form only after the minimal invariant is stable.

### Verification plan

Unit tests should cover:

- declared buffer handles and views;
- undeclared imported and transient buffers;
- whole-texture declarations versus exact texture-view declarations;
- unrelated mip, layer, and aspect access;
- external textures;
- generated render and resolve attachments;
- `getRenderPassProps()` as well as compute, render, and copy encode callbacks;
- duplicate compatible uses and incompatible overlapping uses;
- contributor-composed nodes and shared canonical handles;
- cleanup and pass closure after a violation; and
- unchanged schedules, transient reuse statistics, and first-party output for valid graphs.

Add one real-WebGPU regression test that proves a corrected declaration produces the same GPU
result. Measure encoding overhead before and after enforcement; resolver checks should remain
constant-time and should not change GPU timing.

The repository-wide completion gates are `yarn lint fix`, `yarn build`, and `yarn test`. Focused
node and headless graph tests can run earlier, but do not replace those gates for a shared API
change.

### Completion criteria

The contract work is complete when:

- every first-party resolver call is backed by a declared use;
- undeclared resolver access fails with graph, node, and resource identity;
- texture-view access cannot silently widen the scheduled subresource range;
- transient allocation planning and runtime resolution use the same normalized contract;
- valid existing graphs retain their node order, results, and ownership behavior; and
- the structural inspector can eventually report the same normalized uses used for enforcement.

## Deliberate non-goals

- Emulating native CUDA graph replay on WebGPU.
- Hiding queue submission, presentation, or readback.
- Inferring actual shader access by reflecting arbitrary bind groups or callback closures.
- Adding CPU host tasks to the GPU command graph.
- Introducing dynamic allocation or unbounded output growth during encoding.
- Treating graph conditionals as a substitute for indirect dispatch, indirect draw, or explicit
  application graph selection.

## Related documentation

- [`GPUCommandGraph` reference](/docs/api-reference/experimental/gpu-primitives/gpu-command-graph)
- [GPU Primitives and Command Graphs](/docs/api-reference/experimental/gpu-primitives)
- [Choosing a GPU Data-Processing API](/docs/api-guide/gpu/gpu-data-processing)
- [`GPUTextureHistory`](/docs/api-reference/experimental/gpu-primitives/gpu-texture-history)

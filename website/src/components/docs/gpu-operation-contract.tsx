import React, {type ReactNode} from 'react';

type OperationContract = {
  problem: string;
  readsWrites: string;
  ownership: string;
  output: string;
  work: string;
  chunks: string;
  execution: string;
  neighborhood: string;
  cost: string;
  mistake: string;
};

const COMMON = {
  callerOwned: 'Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.',
  noSubmission: 'May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned.',
  bounded: 'Capacity is fixed at compilation; counts and diagnostics report incomplete or overflowed output.',
  preserveChunks: 'Preserves declared views and source identity; it does not implicitly concatenate or repack chunks.'
} as const;

export const GPUGRAPH_OPERATION_CONTRACTS = {
  'gpu-incremental-execution': {
    problem: 'Update analytical results over changing batches without repeating unchanged source work.',
    readsWrites: 'Batch graphs read borrowed inputs and write cached partials; the merge writes caller-owned outputs.',
    ownership: 'The executor owns cached partial buffers and temporary graphs; sources and final outputs remain borrowed.',
    output: 'GPU-resident analytical results plus computed, reused, removed, command, and cache-byte counters.',
    work: 'Only new or invalidated batches execute; each changed snapshot merges all live partials.',
    chunks: 'Preserves source batches and their chunk topology; only explicit derived candidates may be staged.',
    execution: 'update() owns submission and commits its cache only after successful synchronous submission.',
    neighborhood: 'versioned batches → batch-local graph operations → cached partials → live merge.',
    cost: 'Persistent storage scales with live partials; merge cost scales with live partial count.',
    mistake: 'Bump revisions for buffer writes and shared parameter changes; byte mutations are not inferred.'
  },
  'gpu-command-graph': {
    problem: 'Compose reusable compute, copy, and render work into one validated execution plan.',
    readsWrites: 'Nodes declare every logical resource range they read or write.',
    ownership: 'Imports remain caller-owned; compiled graphs own transients and node-created state.',
    output: 'Immutable topology and capacities with per-encoding parameters and compatible imports.',
    work: 'Node estimates report logical nodes, physical passes, commands, bytes, and invocations.',
    chunks: 'Graph vectors preserve ordered chunks; each contributor documents its support.',
    execution: 'CPU predicates, GPU indirect conditions, and resumable execution plans are first-class.',
    neighborhood: 'application resources and contributors → GPUCommandGraph → caller encoder and submission.',
    cost: 'Compilation is reusable; recompile only when topology, capacities, formats, or requirements change.',
    mistake: 'Do not encode, submit, or map hidden work inside a contributor.'
  },
  'gpu-operation': {
    problem: 'Describe GPU work semantically before selecting concrete backend commands.',
    readsWrites: 'Operations name logical inputs and outputs through metadata or typed properties.',
    ownership: 'Semantic operations own no GPU resources and perform no command submission.',
    output: 'An inspectable operation tree that a backend compiler can lower.',
    work: 'Metadata describes logical work; the selected lowering determines physical commands.',
    chunks: 'Logical shapes remain explicit and are not implicitly combined or repacked.',
    execution: 'A GPUProgramCompiler selects and records the executable realization.',
    neighborhood: 'application intent → GPUOperation tree → backend lowering → command graph.',
    cost: 'Semantic construction is CPU-only; execution cost belongs to the chosen lowering.',
    mistake: 'Do not embed WebGPU resources or dispatch policy in a semantic operation.'
  },
  'gpu-operation-metadata': {
    problem: 'Expose logical workload and constraints without decoding shaders or bindings.',
    readsWrites: 'Names logical inputs and outputs rather than concrete graph buffer uses.',
    ownership: 'Metadata is immutable descriptive state owned by its operation.',
    output: 'Planner-readable input, output, workload, and constraint records.',
    work: 'Reports problem size while leaving command counts and dispatch geometry to lowering.',
    chunks: 'Shape metadata describes logical data; physical chunk handling remains explicit.',
    execution: 'Consumed during planning and inspection, with no GPU work of its own.',
    neighborhood: 'GPUOperation metadata → planner decisions → backend lowering report.',
    cost: 'Small CPU-side records retained for diagnostics and planning.',
    mistake: 'Do not encode a selected workgroup shape as backend-independent workload metadata.'
  },
  'gpu-control-flow-operation': {
    problem: 'Represent bounded loops and conditional branches in a backend-independent program.',
    readsWrites: 'Predicates reference logical uint32 scalar state; child operations declare data use.',
    ownership: 'Control operations own semantic hierarchy but no buffers or command submission.',
    output: 'A bounded operation subtree with explicit predicate and iteration semantics.',
    work: 'Maximum iterations provide a static upper bound for backend planning.',
    chunks: 'Child operations retain their declared logical shapes and chunk behavior.',
    execution: 'WebGPU lowers runtime predicates to bounded GPU-gated indirect dispatch sequences.',
    neighborhood: 'logical predicate + operation body → control-flow lowering → conditioned nodes.',
    cost: 'Bounded lowering may materialize commands for every possible iteration.',
    mistake: 'Do not model an unbounded device loop or read predicates back between iterations.'
  },
  'gpu-operation-lowering': {
    problem: 'Retain which semantic operation produced each executable command node.',
    readsWrites: 'Records identities and paths without changing declared graph resource uses.',
    ownership: 'The compiler owns the immutable provenance report.',
    output: 'Operation paths paired with lowered command-node identifiers and types.',
    work: 'One small provenance record per emitted semantic command node.',
    chunks: 'Does not alter logical or physical data partitioning.',
    execution: 'Produced during lowering and consumed by inspectors and planners.',
    neighborhood: 'operation tree → command-node emission → lowering report and diagnostics.',
    cost: 'Linear CPU bookkeeping in the number of lowered nodes.',
    mistake: 'Do not discard semantic identity once a backend command is selected.'
  },
  'gpu-program': {
    problem: 'Compose typed semantic GPU state and operations independently of an execution backend.',
    readsWrites: 'Operations reference program-owned logical scalars and vectors.',
    ownership: 'The program owns semantic declarations; compiled graphs own backend transients.',
    output: 'An immutable-view operation tree and typed logical value inventory.',
    work: 'Program construction performs no GPU work; lowering determines the command workload.',
    chunks: 'Vectors preserve their declared length and format without implicit packing.',
    execution: 'GPUProgramCompiler validates bindings and lowers the program for WebGPU.',
    neighborhood: 'typed logical values + operations → GPUProgram → backend compiler.',
    cost: 'CPU-only semantic construction plus backend-specific compilation cost.',
    mistake: 'Do not treat GPUProgram as an executable command graph or submission owner.'
  },
  'gpu-program-lowering': {
    problem: 'Map semantic operation types to backend-specific executable realizations.',
    readsWrites: 'Resolves logical values into backend views and preserves operation resource intent.',
    ownership: 'The backend compiler owns its registry, capabilities, and lowering decisions.',
    output: 'A command graph plus immutable value, provenance, and decision reports.',
    work: 'Visits the bounded semantic tree and emits the selected command nodes.',
    chunks: 'Lowerers must explicitly preserve or transform logical storage boundaries.',
    execution: 'WebGPU lowering uses command nodes; another backend may choose native graph forms.',
    neighborhood: 'GPUProgram + bindings + capabilities → lowering registry → executable graph.',
    cost: 'Linear planning overhead plus backend pipeline compilation.',
    mistake: 'Do not let semantic operations mutate a backend graph directly.'
  },
  'webgpu-runtime-control': {
    problem: 'Execute bounded semantic predicates without CPU readback on WebGPU.',
    readsWrites: 'Gate updates read logical predicate scalars and write indirect dispatch arguments.',
    ownership: 'The compiled graph owns gate buffers; logical predicate state remains program-owned.',
    output: 'Conditioned compute nodes whose direct dispatches become GPU-controlled indirect work.',
    work: 'One small gate update per conditioned command plus the enabled command workload.',
    chunks: 'Conditioning changes execution only and does not repack data.',
    execution: 'Compiler support nodes run outside semantic predicate decoration scopes.',
    neighborhood: 'uint32 predicate → dispatch gate → conditioned compute command.',
    cost: 'Adds bounded gate dispatches while avoiding queue synchronization and readback.',
    mistake: 'Do not infer exact dispatch geometry from a workload estimate.'
  },
  'gpu-program-pcg': {
    problem: 'Express preconditioned conjugate gradient as one portable semantic GPU program.',
    readsWrites: 'Reads external CSR and vector state while updating logical solver vectors and scalars.',
    ownership: 'External inputs remain caller-owned; compiler-created scratch and gates are graph-owned.',
    output: 'A bounded approximate solution with GPU-resident convergence state.',
    work: 'Initialization plus bounded iterations of SpMV, reductions, scalar math, and vector updates.',
    chunks: 'The baseline program uses explicit dense vectors and one CSR matrix domain.',
    execution: 'WebGPU lowers convergence to a bounded GPU-gated command sequence.',
    neighborhood: 'CSR system + solver settings → semantic PCG → backend command graph.',
    cost: 'Maximum iterations bound graph size; active work falls after convergence.',
    mistake: 'Do not synchronize residual state through the CPU between solver iterations.'
  },
  'compositional-architecture': {
    problem: 'Compose higher-level GPU algorithms from a shared set of execution primitives.',
    readsWrites: 'Each composed contributor declares its own resource reads and writes to the graph.',
    ownership: 'Ownership remains explicit at primitive and graph boundaries.',
    output: 'A reusable graph topology whose stages retain their individual contracts.',
    work: 'The sum of contributed stages, with shared planners providing optimization leverage.',
    chunks: COMMON.preserveChunks,
    execution: 'Composition preserves graph conditions, budgets, encoding, and submission boundaries.',
    neighborhood: 'GPU primitives → composed algorithms → application-owned execution.',
    cost: 'Extra stages can add dispatches until benchmark-driven fusion is introduced.',
    mistake: 'Do not create a private execution subsystem when existing graph primitives compose cleanly.'
  },
  'gpu-value-arena': {
    problem: 'Pack many small GPU-produced values into one graph-owned buffer.',
    readsWrites: 'Scalar operations read and write stable typed slots in the shared arena buffer.',
    ownership: 'The command graph owns the arena buffer; GPUScalar objects borrow logical slots.',
    output: 'Stable word-aligned offsets for float32, uint32, and sint32 logical values.',
    work: 'Allocation is CPU-side graph construction; consumers contribute the GPU work.',
    chunks: 'Not applicable; the arena stores individual fixed-width scalar slots.',
    execution: 'The graph materializes the arena before compilation and owns its execution lifetime.',
    neighborhood: 'GPUScalar declarations → GPUValueArena → scalar, reduction, and control operations.',
    cost: 'One bounded storage buffer and four bytes per declared scalar.',
    mistake: 'Do not allocate one physical buffer per logical scalar.'
  },
  'gpu-value-arena-finalization': {
    problem: 'Materialize the packed scalar arena only after graph contributors finish declaring values.',
    readsWrites: 'Finalization sizes and creates storage; later nodes access their declared slots.',
    ownership: 'The compiled graph owns the materialized transient arena buffer.',
    output: 'One exactly sized allocation with stable preassigned slot offsets.',
    work: 'A graph-compilation bookkeeping step with no standalone GPU dispatch.',
    chunks: 'Not applicable to scalar arena materialization.',
    execution: 'Occurs once per compiled topology before encoding or submission.',
    neighborhood: 'scalar declarations → arena finalization → compiled graph bindings.',
    cost: 'Linear bookkeeping in the number of scalar declarations.',
    mistake: 'Do not finalize the arena before all contributors have declared their scalar state.'
  },
  'gpu-scalar': {
    problem: 'Represent one typed GPU-resident value without implying one physical buffer.',
    readsWrites: 'Consumers load or store the scalar through its arena slot.',
    ownership: 'A GPUScalar borrows its graph-owned GPUValueArena and owns no buffer.',
    output: 'A stable typed logical reference with byte and word offsets.',
    work: 'No commands by itself; scalar-producing and consuming operations contribute work.',
    chunks: 'Not applicable to one logical scalar value.',
    execution: 'Remains GPU-resident across graph stages and conditioned branches.',
    neighborhood: 'reduction or scalar operation → GPUScalar → arithmetic, gating, or indirect work.',
    cost: 'Four arena bytes per scalar plus no additional binding.',
    mistake: 'Do not read a scalar back to the CPU merely to feed the next GPU stage.'
  },
  'gpu-scalar-operation': {
    problem: 'Perform arithmetic and comparisons on arena-backed scalar values.',
    readsWrites: 'Reads one or two scalar slots and writes one compatible output slot.',
    ownership: 'All scalars borrow one caller-selected graph arena.',
    output: 'One typed arithmetic value or uint32 comparison result.',
    work: 'One single-invocation compute pass per scalar expression.',
    chunks: 'Not applicable to scalar operations.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUScalar operands → GPUScalarCompute → coefficients, predicates, or counters.',
    cost: 'One dispatch per unfused expression in the baseline implementation.',
    mistake: 'Do not mix scalar arenas or incompatible operand and output formats.'
  },
  'gpu-reduction-substrate': {
    problem: 'Reduce large float32 domains into graph-resident scalar results.',
    readsWrites: 'Reads one or two packed vectors, writes transient partials and one arena scalar.',
    ownership: COMMON.callerOwned,
    output: 'One float32 scalar containing an identity, square, or multiply-mapped sum.',
    work: 'A logarithmic hierarchy of linear reduction passes.',
    chunks: 'Consumes explicit packed views; callers define cross-chunk composition.',
    execution: 'Supports a shared GPU dispatch gate without hidden submission or readback.',
    neighborhood: 'vectors → hierarchical reduction → GPUScalar arithmetic and solver control.',
    cost: 'Linear memory traffic plus one progressively smaller pass per hierarchy level.',
    mistake: 'Do not force a large reduction through one workgroup or one CPU readback.'
  },
  'gpu-cg-integration': {
    problem: 'Compose graph-resident conjugate-gradient state and iteration control.',
    readsWrites: 'Reads matrix-action inputs and solver vectors; updates vectors and arena scalars.',
    ownership: 'Caller-owned vectors surround graph-owned transient vectors and scalar state.',
    output: 'A fixed-budget solution update whose convergence state remains on the GPU.',
    work: 'Per iteration: matrix-vector action, dot products, scalar arithmetic, and vector updates.',
    chunks: 'Solver vectors are explicit packed views with caller-defined partitioning.',
    execution: 'GPU scalar predicates update indirect dispatch gates for later iterations.',
    neighborhood: 'SpMV contributor + scalar/reduction primitives → conjugate-gradient execution.',
    cost: 'Fixed maximum iteration work, with converged iterations gated on the GPU.',
    mistake: 'Do not read residuals to the CPU between iterations.'
  },
  'gpu-transient-lifetimes': {
    problem: 'Reuse compatible physical storage for large logical transients with disjoint lifetimes.',
    readsWrites: 'The planner consumes declared lifetimes and emits allocation assignments.',
    ownership: 'Logical resources remain graph-owned; compiled allocations follow the plan.',
    output: 'Deterministic logical-to-physical assignments with peak-byte accounting.',
    work: 'CPU-side interval planning over declared transient requests.',
    chunks: 'Chunk identity remains logical and is not implicitly repacked.',
    execution: 'Planning occurs at graph compilation and never changes an encoding topology.',
    neighborhood: 'graph resource lifetimes → planner → compiled transient allocations.',
    cost: 'Planner bookkeeping versus reduced peak GPU memory for heavyweight scratch.',
    mistake: 'Do not recycle tiny arena slots when stable offsets are more valuable than negligible savings.'
  },
  'gpu-strategy-selection': {
    problem: 'Select a deterministic GPU implementation from workload and device capabilities.',
    readsWrites: 'Consumes CPU-known workload metadata and device features; it touches no GPU resources.',
    ownership: 'Candidates and workload metadata remain caller-owned.',
    output: 'One immutable strategy decision with identifier, score, reason, and details.',
    work: 'Evaluates each supported candidate once during graph construction.',
    chunks: 'Chunk behavior is defined by the selected operation implementation.',
    execution: 'Selection precedes graph compilation and performs no encoding or submission.',
    neighborhood: 'workload + device → strategy selector → operation-specific graph contributor.',
    cost: 'Linear CPU work in the small candidate list.',
    mistake: 'Do not hide strategy selection inside a public API that changes the operation contract.'
  },
  'gpu-adaptive-reduction': {
    problem: 'Choose an efficient reduction hierarchy for the input size and device.',
    readsWrites: 'The selected reduction reads packed values and writes partials plus a scalar result.',
    ownership: COMMON.callerOwned,
    output: 'The same reduction result independent of the chosen execution strategy.',
    work: 'Linear input work with strategy-selected workgroup size and elements per thread.',
    chunks: 'Operates on explicit packed views; cross-chunk reduction remains explicit.',
    execution: 'Strategy selection is CPU-side; contributed reduction work remains graph-managed.',
    neighborhood: 'input shape + device → reduction strategy → hierarchical reduction.',
    cost: 'Memory traffic and hierarchy depth, tuned against available parallelism.',
    mistake: 'Do not assume the largest workgroup or most elements per thread is always fastest.'
  },
  'gpu-adaptive-spmv-execution': {
    problem: 'Multiply a CSR matrix by a dense vector using a row-shape-aware execution family.',
    readsWrites: 'Reads CSR offsets, columns, values, and the input vector; writes one value per row.',
    ownership: COMMON.callerOwned,
    output: 'A dense float32 vector with one matrix-vector product result per CSR row.',
    work: 'Linear nonzero traversal plus optional long-row partial reduction.',
    chunks: 'One logical CSR domain with independently chunked offsets, nonzeros, vector, and output.',
    execution: 'Selects scalar, subgroup, workgroup, or long-row graph passes before compilation.',
    neighborhood: 'CSR matrix + vector → GPUAdaptiveSpMV → iterative sparse solver.',
    cost: 'Nonzero count, row imbalance, memory locality, and reduction strategy dominate.',
    mistake: 'Do not use one row kernel shape for both tiny and extremely long sparse rows.'
  },
  'gpu-coo-to-csr': {
    problem: 'Convert row-sorted COO entries into offset-delimited CSR rows on the GPU.',
    readsWrites: 'Reads COO row, column, and value arrays; writes CSR offsets, columns, and values.',
    ownership: COMMON.callerOwned,
    output: 'CSR structure preserving sorted entry order, empty rows, and duplicate coordinates.',
    work: 'Linear entry copies plus one lower-bound search per output row boundary.',
    chunks: 'Independent source and output chunks preserve one logical sorted COO/CSR domain.',
    execution: COMMON.noSubmission,
    neighborhood: 'sorted COO → GPUCOOToCSR → adaptive SpMV or sparse solver.',
    cost: 'Entry copies plus rows times logarithmic row-boundary search.',
    mistake: 'Do not pass unsorted COO rows or assume duplicate coordinates are merged.'
  },
  'gpu-preconditioned-conjugate-gradient': {
    problem: 'Accelerate conjugate-gradient convergence with a reusable preconditioner.',
    readsWrites: 'Reads sparse matrix and residual state; writes preconditioned vectors and solver scalars.',
    ownership: 'Caller-owned matrix and solution surround graph-owned iterative scratch.',
    output: 'A fixed-budget approximate solution with GPU-resident convergence control.',
    work: 'One preconditioner application plus sparse products and reductions per iteration.',
    chunks: 'Independent CSR and vector chunks share one logical system; scratch follows the right-hand side topology.',
    execution: 'Later iterations can be disabled by GPU indirect convergence gates.',
    neighborhood: 'CSR matrix + right-hand side + preconditioner → PCG → solution vector.',
    cost: 'Iteration count times SpMV, preconditioner, vector-update, and reduction costs.',
    mistake: 'Do not choose a preconditioner whose application costs more than the iterations it saves.'
  },
  'gpu-texture-history': {
    problem: 'Retain temporal texture state without sampling and writing one physical texture simultaneously.',
    readsWrites: 'A graph reads the previous role and writes the current role; advance() swaps them.',
    ownership: 'The history owns exactly two textures; compiled graphs borrow their bindings.',
    output: 'Descriptor-identical alternating textures with stable logical graph identifiers.',
    work: 'No GPU commands or copies by itself; rotation is a CPU-side reference swap.',
    chunks: 'Not applicable to texture history.',
    execution: 'Conditioned writers must explicitly preserve or invalidate skipped history.',
    neighborhood: 'previous texture → temporal compute/render → GPUTextureHistory.advance() → next frame.',
    cost: 'Two persistent textures at the configured extent and format.',
    mistake: 'Do not sample and write the same physical texture in one temporal step.'
  },
  'gpu-mask': {
    problem: 'Combine independent source-aligned boolean decisions.',
    readsWrites: 'Reads one or more packed uint32 masks; writes one canonical 0/1 mask.',
    ownership: 'Inputs and output are caller-owned; the operation allocates no persistent result.',
    output: 'Exact and source-aligned; output length matches the inputs.',
    work: 'One compute pass per nonempty chunk and one invocation per row.',
    chunks: 'Preserved; matching vector topology is required.',
    execution: 'Participates as ordinary graph nodes; it has no custom resumable plan.',
    neighborhood: 'predicate masks → GPUMask → scan, compaction, or source-aligned consumer.',
    cost: 'Every source row is visited even if very few rows remain selected.',
    mistake: 'Do not compact before every consumer when several source-aligned operations can reuse one mask.'
  },
  'gpu-scan': {
    problem: 'Give each row the sum contributed before it, or through it in inclusive mode.',
    readsWrites: 'Reads packed uint32 values and optional segment flags; writes packed prefixes.',
    ownership: 'Input, flags, and output are caller-owned; hierarchical scratch is graph-owned transient storage.',
    output: 'Exact, source-aligned, and modulo 2^32.',
    work: 'Linear reads/writes plus bounded hierarchical block-summary and offset passes.',
    chunks: 'Input and flags align by logical row; atomic and vector views and independent output capacity topologies may be mixed.',
    execution: 'Can sit inside a conditioned branch; standalone scan has no resumable plan.',
    neighborhood: 'counts or flags → GPUScan → offsets, cumulative values, or compaction scatter.',
    cost: 'The complete input and hierarchy summaries are processed even when the final count is small.',
    mistake: 'Do not confuse exclusive output positions with inclusive cumulative totals.'
  },
  'gpu-segmented-scan': {
    problem: 'Compute independent prefix sums over offset-delimited packed segments.',
    readsWrites: 'Reads packed uint32 values and segment offsets; writes source-aligned prefixes.',
    ownership: COMMON.callerOwned,
    output: 'One exclusive or inclusive prefix per input row, reset at each segment boundary.',
    work: 'One workgroup per segment in the baseline implementation.',
    chunks: 'Consumes one packed value domain with explicit CSR-style offsets.',
    execution: COMMON.noSubmission,
    neighborhood: 'segment offsets + values → GPUSegmentedScan → local ranks or offsets.',
    cost: 'Large or highly skewed segments limit parallelism in the baseline kernel.',
    mistake: 'Do not omit the terminal offset or assume prefixes continue across segments.'
  },
  'gpu-galloping-search': {
    problem: 'Resolve many ordered lower-bound queries while reusing locality between neighbors.',
    readsWrites: 'Reads sorted values, optional order, queries, and segments; writes lower bounds and validation bits.',
    ownership: 'Inputs, outputs, and validation storage are caller-owned; operation state is graph-owned.',
    output: 'One exact lower-bound position per valid query; malformed queries are reported.',
    work: 'One binary-search seed per tile, then exponential probes and bounded finishing searches.',
    chunks: 'Global segment ranges cross independent value, query, descriptor, and output chunks.',
    execution: 'Can sit inside a conditioned branch; it has no custom resumable plan.',
    neighborhood: 'sorted secondary index + ordered queries → GPUGallopingSearch → range selection or join.',
    cost: 'Benefits depend on ordered queries and locality; unrelated searches may not beat binary search.',
    mistake: 'Do not apply galloping search to unsorted inputs or unordered query batches.'
  },
  'gpu-compaction': {
    problem: 'Turn a sparse keep/discard decision into a stable dense work list.',
    readsWrites: 'Reads source IDs and flags; writes packed IDs plus one valid-row count.',
    ownership: 'Inputs, output capacity, and count are caller-owned; offsets are graph-owned transients.',
    output: 'Bounded; only the count-named prefix is valid, with source order preserved.',
    work: 'One hierarchical exclusive scan plus scatter/count work over the input domain.',
    chunks: 'Preserved as one logical sequence; matching vector topology is required.',
    execution: 'Can sit inside a conditioned branch; standalone compaction has no resumable plan.',
    neighborhood: 'mask and IDs → GPUCompaction → indirect compute, drawing, or dense analysis.',
    cost: 'Scan and scatter visit the input domain even when the compacted result is small.',
    mistake: 'Do not treat unused output capacity beyond the GPU-written count as valid rows.'
  },
  'gpu-scatter': {
    problem: 'Place packed fixed-width source rows at uint32-selected destination indices.',
    readsWrites: 'Reads source rows and indices; writes caller-provided destination rows.',
    ownership: COMMON.callerOwned,
    output: 'A fixed-capacity destination with out-of-range indices ignored.',
    work: 'One invocation per index and one 32-bit-word copy loop per source row.',
    chunks: 'Independent source, index, and destination chunks; destination indices are global.',
    execution: COMMON.noSubmission,
    neighborhood: 'source rows + destination indices → GPUScatter → sparse or reordered output.',
    cost: 'Memory bandwidth and row width dominate; duplicate destinations may contend.',
    mistake: 'Do not expect deterministic results when multiple source rows target one destination.'
  },
  'gpu-gather': {
    problem: 'Select or reorder packed fixed-width rows through uint32 source indices.',
    readsWrites: 'Reads source rows and indices; writes caller-provided destination rows.',
    ownership: COMMON.callerOwned,
    output: 'One destination row per index, with out-of-range indices producing zero-filled rows.',
    work: 'One index traversal per nonempty source chunk; each matched row is copied as 32-bit words.',
    chunks: 'Independent source, index, and output partitions; indices address global rows without packing.',
    execution: COMMON.noSubmission,
    neighborhood: 'source rows + source indices → GPUGather → selected or reordered packed rows.',
    cost: 'Index traversal grows with source chunk count; each pass uses at most three storage bindings.',
    mistake: 'Do not use typed gather for variable-length rows or formats whose byte length is not word-aligned.'
  },
  'gpu-run-length-encode': {
    problem: 'Turn adjacent equal uint32 values into ordered run values and lengths.',
    readsWrites: 'Reads ordered values; writes bounded run values, lengths, and a valid-run count.',
    ownership: COMMON.callerOwned,
    output: 'Only the prefix named by count is valid; first-occurrence order is preserved.',
    work: 'Boundary detection, an inclusive run-ID scan, and chunk-aware materialization.',
    chunks: 'Runs continue across empty and uneven input chunks; outputs may be partitioned independently.',
    execution: COMMON.noSubmission,
    neighborhood: 'sorted keys → GPURunLengthEncode → segment metadata or grouped aggregation.',
    cost: 'The whole ordered input is visited even when it contains few runs.',
    mistake: 'Do not confuse adjacent-run uniqueness with global uniqueness on unsorted input.'
  },
  'gpu-flag-offsets': {
    problem: 'Turn one packed binary flag stream into stable dense indices and a count.',
    readsWrites: 'Reads uint32 zero-or-one flags; writes exclusive uint32 offsets and one scalar count.',
    ownership: 'Flags, offsets, and count are caller-owned; hierarchical scan scratch is graph-owned.',
    output: 'One source-aligned exclusive offset per flag and an exact count modulo uint32.',
    work: 'One hierarchical exclusive scan plus one scalar publication pass.',
    chunks: 'Atomic and vector views may have independent boundaries; only the flag-length destination prefix is written.',
    execution: 'Contributes ordinary graph nodes and never compiles, submits, maps, or reads back.',
    neighborhood: 'format classifier → GPUFlagOffsets → compaction destinations, counts, or GPUSegmentOffsets.',
    cost: 'The complete flag stream is scanned even when few flags are set.',
    mistake: 'Flags must be zero or one; larger values are summed rather than normalized.'
  },
  'gpu-segment-offsets': {
    problem: 'Publish list-style boundaries when logical-element offsets are already available.',
    readsWrites: 'Reads element flags/offsets and segment-start flags; writes segment indices, offsets, and count.',
    ownership: 'All public views are caller-owned; hierarchical segment-scan scratch is graph-owned.',
    output: 'Source-aligned segment indices plus a segmentCount + 1 valid offset prefix.',
    work: 'One hierarchical exclusive scan, offset publication per aligned span, and one scalar count pass.',
    chunks: 'Slot views align by logical row across independent atomic/vector boundaries; the global list-offset destination remains atomic.',
    execution: 'Contributes ordinary graph nodes and never compiles, submits, maps, or reads back.',
    neighborhood: 'GPUFlagOffsets plus segment flags → GPUSegmentOffsets → lists, groups, or nested consumers.',
    cost: 'Separating shared value and per-depth element scans saves work only when layouts reuse them.',
    mistake: 'Mark every segment start, including the first; consume only segmentCount + 1 list offsets.'
  },
  'gpu-segmented-layout': {
    problem: 'Turn slot-aligned value, element, and segment-start flags into dense columnar layout metadata.',
    readsWrites: 'Reads three packed binary flag streams; writes value and element offsets, segment indices and offsets, and three counts.',
    ownership: 'All public inputs and outputs are caller-owned; hierarchical scan scratch is graph-owned transient memory.',
    output: 'Exact source-aligned offsets plus a segment-offset prefix named by segmentCount.',
    work: 'Three hierarchical scans, segment-offset publication over aligned spans, and one scalar-count pass.',
    chunks: 'Six slot views may mix independent atomic/vector partitions; scans carry globally without packing. List offsets and counts remain atomic.',
    execution: 'Contributes ordinary graph nodes and does not compile, submit, read back, or publish results.',
    neighborhood: 'format-specific classification → GPUSegmentedLayout → compaction, gather, nested layout, or rendering.',
    cost: 'Every slot is scanned three times even when few values are present or few segments are produced.',
    mistake: 'Use binary flags, keep segmentStartFlags[0] zero, and consume only segmentCount + 1 segment offsets.'
  },
  'gpu-visibility-workflow': {
    problem: 'Turn visibility decisions into one mask, stable ID list, and draw-ready count.',
    readsWrites: 'Reads predicate masks and optional source IDs; writes mask, packed IDs, and count.',
    ownership: 'Inputs, outputs, and count are caller-owned; identity, scan, and compaction scratch are internal.',
    output: 'Bounded stable IDs; only the GPU-written count prefix is valid.',
    work: 'Mask intersection, optional identity generation, hierarchical scan, and stable scatter.',
    chunks: 'Source-aligned masks and IDs align by logical row; atomic and vector views and independent output capacity topologies may be mixed.',
    execution: 'Contributed nodes may share a branch condition; no custom resumable plan is exposed.',
    neighborhood: 'time, bounds, LOD, and selection masks → GPUVisibilityWorkflow → indirect consumer.',
    cost: 'All candidate rows are masked and compacted; bound candidates before this workflow when possible.',
    mistake: 'Do not rebuild source IDs on the CPU when canonical GPU identity is already available.'
  },
  'gpu-virtual-geometry-selection': {
    problem: 'Select a deterministic hierarchy frontier from frustum visibility and projected error.',
    readsWrites: 'Reads hierarchy and view columns; writes stable cluster IDs, counts, and overflow.',
    ownership: 'Source, view, output, and status buffers are borrowed; selection state is operation-owned.',
    output: 'Bounded stable IDs with retained count, optional total count, and overflow flag.',
    work: 'Initialization, one traversal pass per breadth level, then visibility compaction.',
    chunks: 'Hierarchy uses one breadth-level index space rather than implicit vector chunks.',
    execution: 'Can be conditioned; breadth levels are fixed nodes and expose no custom execution plan.',
    neighborhood: 'cluster hierarchy and camera → GPUVirtualGeometrySelection → indirect geometry rendering.',
    cost: 'Breadth depth and visited clusters determine work; output size alone is insufficient.',
    mistake: 'Do not discard overflow or total-count diagnostics when choosing LOD capacity.'
  },
  'draw-command-buffer': {
    problem: 'Carry GPU-produced draw counts into rendering without CPU synchronization.',
    readsWrites: 'Compute may write command fields; indirect draw calls read one record.',
    ownership: 'The helper owns storage it creates and borrows caller-supplied storage by default.',
    output: 'Fixed-capacity standard WebGPU indirect records; no hidden resizing or readback.',
    work: 'No compute by itself; one indirect draw call for each record the application chooses.',
    chunks: 'Not applicable; records occupy one typed command buffer.',
    execution: 'A writable count can be produced by conditioned or resumable graph work.',
    neighborhood: 'compaction or draw generation → DrawCommandBuffer → render pass.',
    cost: 'Persistent command storage plus the fixed draw calls the renderer records.',
    mistake: 'Do not read the count to JavaScript before drawing; that defeats the indirect path.'
  },
  'gpu-readback-ring': {
    problem: 'Move small bounded GPU answers to JavaScript without overwriting in-flight staging memory.',
    readsWrites: 'Copies a caller-selected GPU source range into one MAP_READ staging slot.',
    ownership: 'The ring owns staging buffers; each ticket owns one slot temporarily; the application submits.',
    output: 'Exact requested bytes or explicit dropped, cancelled, failed, or stale state.',
    work: 'One bounded copy plus asynchronous queue completion and mapping per accepted ticket.',
    chunks: 'Not implicit; callers select the exact source buffer and byte range.',
    execution: 'tryAcquire() drops under pressure; acquire() explicitly waits for capacity.',
    neighborhood: 'bounded GPU result → GPUReadbackRing → generation-checked UI publication.',
    cost: 'Latency includes copy, queue completion, mapping, and ring pressure—not just byte count.',
    mistake: 'Do not publish a completed ticket after a newer generation superseded it.'
  },
  'gpu-histogram': {
    problem: 'Summarize one numeric distribution without downloading source rows.',
    readsWrites: 'Reads values and literal or GPU domain/edges; clears and writes uint32 bins.',
    ownership: 'Input/output are caller-owned; automatic-domain reduction scratch is graph-owned.',
    output: 'Exact bin membership for accepted finite values; counts wrap as uint32.',
    work: 'Output clear, optional extent reduction, then one accumulation pass per nonempty chunk.',
    chunks: 'Input chunks are preserved and accumulate into one shared output.',
    execution: 'Can sit inside a conditioned branch; it has no custom resumable plan.',
    neighborhood: 'values and optional selection → GPUHistogram → small chart or inclusive scan.',
    cost: 'All selected input rows are visited; automatic domains add a reduction.',
    mistake: 'Do not download source rows to build a chart when a small bin buffer is sufficient.'
  },
  'gpu-group-aggregation': {
    problem: 'Compute stable categorical counts or statistics over all or selected rows.',
    readsWrites: 'Reads dense uint32 keys, optional mask, and values; writes one row per group.',
    ownership: 'Inputs/output are caller-owned; mean-count scratch is graph-owned transient storage.',
    output: 'Fixed group rows; invalid keys are ignored and numeric edge cases are explicit.',
    work: 'Output initialization plus accumulation per nonempty chunk; mean adds division.',
    chunks: 'Matching chunks are preserved and accumulate into one shared output.',
    execution: 'Can sit inside a conditioned branch; it has no custom resumable plan.',
    neighborhood: 'dictionary IDs, values, and mask → GPUGroupAggregation → linked chart or summary.',
    cost: 'Source rows, group count, and atomic contention in popular groups.',
    mistake: 'Do not confuse fixed group capacity with the number of populated groups.'
  },
  'gpu-ancestor-projection': {
    problem: 'Reconnect hidden graph endpoints to their nearest visible canonical ancestor.',
    readsWrites: 'Reads parents and visibility; writes projected ancestor IDs or the invalid sentinel.',
    ownership: COMMON.callerOwned,
    output: 'One source-aligned projected identity per node; unresolved ancestry writes the invalid sentinel.',
    work: 'Bounded parent traversal over the configured maximum hierarchy depth.',
    chunks: COMMON.preserveChunks,
    execution: COMMON.noSubmission,
    neighborhood: 'visibility mask + parent forest → GPUAncestorProjection → dependency routing or rendering.',
    cost: 'Maximum hierarchy depth and source-row count determine the upper bound.',
    mistake: 'Do not replace canonical identity with the projected display identity.'
  },
  'gpu-batch-hash-index': {
    problem: 'Build one exact sparse-key index while preserving ordered vector chunks.',
    readsWrites: 'Reads chunked uint32 keys and values; writes a shared fixed-capacity hash table and diagnostics.',
    ownership: COMMON.callerOwned,
    output: 'One GPUHashIndexView plus cumulative duplicate, overflow, and probe statistics.',
    work: 'Linear in source rows, with probe work bounded by table capacity and maximum probe count.',
    chunks: 'Processes chunks in source order without concatenating their buffers.',
    execution: COMMON.noSubmission,
    neighborhood: 'GraphVectorView keys/values → GPUBatchHashIndex → lookup, join, or dictionary resolution.',
    cost: 'Load factor and key distribution dominate probe count.',
    mistake: 'Do not size the table to row count without reserving headroom for probing.'
  },
  'gpu-batch-hash-join': {
    problem: 'Join chunked left inputs against one shared GPU hash index without losing batch boundaries.',
    readsWrites: 'Reads left keys and a GPUHashIndexView; writes per-chunk row pairs, counts, overflow, and probe statistics.',
    ownership: COMMON.callerOwned,
    output: 'Capacity-bounded aligned left/right row IDs for every input chunk.',
    work: 'One bounded lookup and stable compaction workflow per chunk.',
    chunks: 'Preserves empty and uneven chunks; matches never spill into a neighboring chunk.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUBatchHashIndex + left GraphVectorView → GPUBatchHashJoin → grouped or rendered pairs.',
    cost: 'Output capacity, index load factor, and unmatched-key probe length.',
    mistake: 'Do not treat per-chunk counts as one globally packed output.'
  },
  'gpu-bvh': {
    problem: 'Build or refit a flat complete-binary hierarchy over packed 2D or 3D bounds.',
    readsWrites: 'Reads leaf bounds and optional identities; writes node bounds, child links, remapping, and diagnostics.',
    ownership: COMMON.callerOwned,
    output: 'Exact hierarchy storage for the compiled leaf capacity.',
    work: 'Linear leaf load followed by logarithmic bottom-up levels; small trees may fuse into one dispatch.',
    chunks: 'Consumes one packed leaf domain; pack explicitly when the source is chunked.',
    execution: COMMON.noSubmission,
    neighborhood: 'bounds → GPUBVH build/refit → GPUBVHQuery → exact candidates or masks.',
    cost: 'Build cost scales with leaf capacity; reuse or refit unchanged topology.',
    mistake: 'Do not rebuild a static hierarchy for every query.'
  },
  'gpu-bvh-query': {
    problem: 'Traverse a GPUBVH for exact point containment or bounds intersection.',
    readsWrites: 'Reads hierarchy nodes and query bounds; writes stable leaf IDs, count, overflow, and optional mask.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Traversal visits only nodes that survive bounds rejection, up to the configured stack and result bounds.',
    chunks: 'Returns canonical leaf IDs from the packed hierarchy.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUBVH + query → GPUBVHQuery → compaction, visibility, selection, or analysis.',
    cost: 'Hierarchy quality and query overlap determine visited nodes.',
    mistake: 'Do not compare only result count; report visited candidates and overflow too.'
  },
  'gpu-transpose': {
    problem: 'Transpose one packed two-dimensional scalar field without leaving the command graph.',
    readsWrites: 'Reads a row-major source view and writes a caller-provided transposed destination.',
    ownership: COMMON.callerOwned,
    output: 'One exact out-of-place transposed field.',
    work: 'Bounded tiled dispatches over shared source/destination chunk regions.',
    chunks: 'One packed 2D domain with independent input/output chunk boundaries.',
    execution: COMMON.noSubmission,
    neighborhood: 'packed field → GPUTranspose → FFT, matrix operation, or layout conversion.',
    cost: 'Source extent and memory bandwidth dominate.',
    mistake: 'Do not swap dimensions without also allocating the transposed destination shape.'
  },
  'gpu-finite-differences': {
    problem: 'Evaluate gradient, divergence, curl, or Laplacian on a regular 2D or 3D sampled field.',
    readsWrites: 'Reads scalar or vector field samples; writes the operator result in global row-major order.',
    ownership: 'Caller-owned input/output; bounded graph-owned stencil scratch for multiple source chunks.',
    output: 'One result per field row; spare output capacity remains untouched.',
    work: 'Gathers neighbors across source chunks and evaluates second-order stencils in bounded output blocks.',
    chunks: 'Independent input/output partitions may split rows or planes without changing field boundaries.',
    execution: COMMON.noSubmission,
    neighborhood: 'sampled field → finite differences → elementwise update, residual, or visualization.',
    cost: 'Direct kernels need no scratch; chunked source gathering scales with source chunks times output blocks.',
    mistake: 'Use physical spacing and the intended field-edge policy; chunk boundaries are storage only.'
  },
  'gpu-elementwise': {
    problem: 'Apply one canonical arithmetic operation independently to every packed scalar row.',
    readsWrites: 'Reads one to three matching scalar inputs; writes one source-aligned output.',
    ownership: COMMON.callerOwned,
    output: 'One value per input row in the shared uint32, sint32, or float32 format.',
    work: 'One bounded invocation per row with no cross-row communication.',
    chunks: 'Equal logical lengths with independent input/B/C/output chunk boundaries; alignment borrows views without packing.',
    execution: COMMON.noSubmission,
    neighborhood: 'vectors and coefficients → GPUElementwise → residuals, updates, or dense operators.',
    cost: 'Usually memory-bandwidth bound; graph fusion can avoid intermediate traffic.',
    mistake: 'Do not mix formats, lengths, or omit the third input for multiply-add.'
  },
  'gpu-matvec': {
    problem: 'Apply one packed row-major float32 matrix to a packed float32 vector.',
    readsWrites: 'Reads matrix rows and one shared vector; writes one scalar per matrix row.',
    ownership: COMMON.callerOwned,
    output: 'Exactly rows float32 values for an explicit rows-by-columns matrix.',
    work: 'One workgroup reduction per matrix row in the baseline implementation.',
    chunks: 'Independent packed matrix/vector/output chunks; row splits retain global column indices without scratch.',
    execution: COMMON.noSubmission,
    neighborhood: 'row-major matrix + vector → GPUMatVec → elementwise update or reduction.',
    cost: 'Matrix bandwidth and column count dominate; the vector is reused across rows.',
    mistake: 'Do not supply column-major storage or dimensions inconsistent with buffer lengths.'
  },
  'gpu-matmul': {
    problem: 'Multiply packed row-major float32 matrices with explicit M, K, and N dimensions.',
    readsWrites: 'Reads M-by-K and K-by-N matrices; writes one M-by-N destination matrix.',
    ownership: COMMON.callerOwned,
    output: 'One row-major float32 result; partitioning can change floating-point summation order.',
    work: 'A tiled two-dimensional dispatch with cooperative workgroup-memory reuse.',
    chunks: 'Independent packed matrix chunks may split rows and tiles; shared-memory tile loads borrow the original buffers.',
    execution: COMMON.noSubmission,
    neighborhood: 'dense matrices → GPUMatMul → dense numerical or machine-learning graph stages.',
    cost: 'M×K×N arithmetic with performance governed by tile reuse and matrix shape.',
    mistake: 'Do not swap K/N dimensions or assume transpose and batched layouts are implicit.'
  },
  'gpu-fft1d': {
    problem: 'Compute one bounded out-of-place complex transform along packed rows.',
    readsWrites: 'Reads complex row values; writes transformed values through graph-owned scratch.',
    ownership: COMMON.callerOwned,
    output: 'Exact complex transform for each configured power-of-two row.',
    work: 'Bit reversal plus radix-2 butterfly stages per row.',
    chunks: 'Independent packed input/output chunks may split transforms; bounded scratch preserves caller storage.',
    execution: COMMON.noSubmission,
    neighborhood: 'complex rows → GPUFFT1D → GPUFFT2D, filtering, or inverse transform.',
    cost: 'O(rows × width × log width) passes and bandwidth.',
    mistake: 'Do not omit normalization or complex layout conventions when composing transforms.'
  },
  'gpu-fft2d': {
    problem: 'Compute a bounded out-of-place two-dimensional complex transform.',
    readsWrites: 'Reads row-major complex values; writes the destination through graph-owned ping-pong scratch.',
    ownership: COMMON.callerOwned,
    output: 'Exact complex transform for the configured power-of-two extent.',
    work: 'Bit reversal plus radix-2 butterfly passes across both dimensions.',
    chunks: 'Independent packed float32x2 chunks; bounded single-transform scratch preserves caller storage.',
    execution: COMMON.noSubmission,
    neighborhood: 'complex field → GPUFFT2D → spectral filter, simulation step, or inverse transform.',
    cost: 'O(width × height × (log width + log height)) passes and bandwidth.',
    mistake: 'Do not omit normalization or complex layout conventions when composing forward and inverse transforms.'
  },
  'gpu-convolution': {
    problem: 'Apply a centered same-size two-dimensional float32 convolution.',
    readsWrites: 'Reads independently chunked packed input and kernel views; writes separate output chunks.',
    ownership: COMMON.callerOwned,
    output: 'One same-size convolved field with explicit zero or wrap boundaries.',
    work: 'Uses direct chunk contributions or an explicit FFT pipeline selected from the configured strategy.',
    chunks: 'Global field/kernel coordinates cross arbitrary chunks; FFT scratch remains bounded by one binding per field.',
    execution: COMMON.noSubmission,
    neighborhood: 'field + kernel → GPUConvolution → raster filter, simulation, or analysis.',
    cost: 'Kernel area dominates direct work; padded field size dominates FFT work.',
    mistake: 'Do not treat convolution as correlation or use even-sized centered kernels.'
  },
  'gpu-graph-traversal': {
    problem: 'Select bounded incoming, outgoing, or bidirectional multi-hop graph neighborhoods.',
    readsWrites: 'Reads CSR adjacency and seeds; writes frontier/visited masks, compact IDs, counts, and status.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Per-hop frontier expansion over visited adjacency, bounded by hop and output limits.',
    chunks: 'Adjacency chunks remain explicit; canonical vertex IDs cross chunk boundaries.',
    execution: 'Supports conditioned focus branches and bounded hop-by-hop execution.',
    neighborhood: 'CSR + seeds → GPUGraphTraversal → ancestor projection, focus mask, or aggregation.',
    cost: 'Frontier size and vertex degree matter more than total edge count.',
    mistake: 'Do not publish a truncated frontier as a complete traversal.'
  },
  'gpu-grid-aggregation': {
    problem: 'Accumulate weighted sum, minimum, maximum, or mean into a 2D grid.',
    readsWrites: 'Reads float32x2 positions and weights; writes per-cell accumulators, counts, and final values.',
    ownership: COMMON.callerOwned,
    output: 'Dense row-major grid statistics with explicit empty-cell behavior.',
    work: 'Input visits per output chunk plus initialization and finalization over cells.',
    chunks: 'Independent position, weight, and cell-output chunks; mean-count scratch follows output chunks.',
    execution: COMMON.noSubmission,
    neighborhood: 'positions + weights → GPUGridAggregation → texture upload, contours, or chart readback.',
    cost: 'Aligned input spans times output chunks, cell count, and atomic contention.',
    mistake: 'Do not infer a mean from sums without preserving counts and empty-cell policy.'
  },
  'gpu-grid-binning': {
    problem: 'Count packed 2D points into a dense row-major grid.',
    readsWrites: 'Reads float32x2 positions; atomically writes uint32 cell counts.',
    ownership: COMMON.callerOwned,
    output: 'Exact modulo-2^32 counts for the configured bounds and grid extent.',
    work: 'Input visits per output chunk plus grid initialization.',
    chunks: 'Independent position and cell-output chunks; global row-major cell addresses.',
    execution: COMMON.noSubmission,
    neighborhood: 'positions → GPUGridBinning → density texture, histogram, or threshold mask.',
    cost: 'Position chunks times output chunks, cell count, and atomic contention.',
    mistake: 'Do not confuse cell counts with an exact object-level spatial query.'
  },
  'gpu-grid-index': {
    problem: 'Build a reusable uniform-grid index over packed 2D or 3D points.',
    readsWrites: 'Reads positions; writes cell counts, offsets, stable object IDs, accepted count, and overflow.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Classify, count, scan, and stable scatter over source rows and grid cells.',
    chunks: 'Positions, source IDs, cell offsets, and object IDs may be independently chunked.',
    execution: COMMON.noSubmission,
    neighborhood: 'positions → GPUGridIndex → GPUGridIndexQuery → GPUPointSpatialFilter.',
    cost: 'Build cost is amortized only when multiple queries reuse the index.',
    mistake: 'Do not rebuild an unchanged index for every view update.'
  },
  'gpu-grid-index-query': {
    problem: 'Publish stable candidate IDs from cells intersecting a point, bounds, or radius query.',
    readsWrites: 'Reads a GPUGridIndex and query parameters; writes IDs, full candidate count, overflow, and optional mask.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Visits intersecting cells and their indexed ID ranges.',
    chunks: 'Independent cell, ID, output, and mask chunks retain canonical source IDs.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUGridIndex + query → GPUGridIndexQuery → exact GPUPointSpatialFilter or consumer.',
    cost: 'Cell coverage and local density determine candidate work.',
    mistake: 'Candidates are not exact geometry hits; refine when exactness matters.'
  },
  'gpu-hash-index': {
    problem: 'Map sparse uint32 keys to values without allocating a dense key-space-sized array.',
    readsWrites: 'Reads keys/values; writes a fixed-capacity open-addressed table and probe diagnostics.',
    ownership: COMMON.callerOwned,
    output: 'A reusable GPUHashIndexView with explicit duplicate and overflow policy.',
    work: 'Linear build/query rows with bounded open-addressing probes.',
    chunks: 'Keys, values, and query outputs accept independent chunks; the shared table remains one bounded binding.',
    execution: COMMON.noSubmission,
    neighborhood: 'sparse keys/values → GPUHashIndex → GPUHashIndexQuery or GPUHashJoin.',
    cost: 'Table load factor and hash distribution dominate work.',
    mistake: 'Do not ignore duplicate-key policy or probe-limit diagnostics.'
  },
  'gpu-hash-join': {
    problem: 'Produce stable inner-join row pairs from sparse exact-key lookup.',
    readsWrites: 'Reads left keys and a GPUHashIndexView; writes match mask, offsets, row pairs, count, and overflow.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Hash lookup followed by scan and stable scatter.',
    chunks: 'Independent input/output chunks form one global result. GPUBatchHashJoin keeps separate per-chunk output domains.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUHashIndex + left keys → GPUHashJoin → joined aggregation or rendering.',
    cost: 'Probe count and output cardinality; a small result does not remove lookup cost.',
    mistake: 'Do not assume one-to-many semantics when the index contract is one value per key.'
  },
  'gpu-hierarchy-layout': {
    problem: 'Turn hierarchy expansion state into effective row heights and stable vertical offsets.',
    readsWrites: 'Reads parent/child expansion flags and row heights; writes effective heights and exclusive positions.',
    ownership: COMMON.callerOwned,
    output: 'Exact source-aligned heights and positions for the compiled hierarchy.',
    work: 'Hierarchy flag propagation plus a linear scan.',
    chunks: COMMON.preserveChunks,
    execution: COMMON.noSubmission,
    neighborhood: 'hierarchy + expansion flags → GPUHierarchyLayout → renderer lanes and picking.',
    cost: 'Source row count and hierarchy propagation depth.',
    mistake: 'Do not rebuild source rows when only expansion control state changed.'
  },
  'gpu-index-picking-target': {
    problem: 'Capture integer object identities and resolve a pixel or bounded rectangle selection.',
    readsWrites: 'Receives renderer-written integer attachments; copies or reduces into bounded picking storage.',
    ownership: 'The target owns attachments; the application owns rendering, request state, readback, and highlight policy.',
    output: 'One pixel identity or a capacity-bounded region of identities and counts.',
    work: 'One picking render plus a small copy or region reduction.',
    chunks: 'Picking preserves the canonical IDs encoded by the renderer.',
    execution: 'Pairs with a readback ring and generation checks; it does not submit or map automatically.',
    neighborhood: 'rendered IDs → GPUIndexPickingTarget → GPUReadbackRing → hover/selection uniform.',
    cost: 'Latency includes render, copy, queue completion, and mapping.',
    mistake: 'Do not allow an older asynchronous pick result to overwrite a newer pointer generation.'
  },
  'gpu-point-spatial-filter': {
    problem: 'Apply exact bounds or radius predicates to packed points or indexed candidates.',
    readsWrites: 'Reads positions and optional candidate IDs; writes one source-row-aligned exact mask.',
    ownership: COMMON.callerOwned,
    output: 'Exact membership mask in canonical source-row space.',
    work: 'Aligned source spans, or candidate chunks visited for each aligned source span.',
    chunks: 'Independent positions, masks, and candidate-ID chunks; IDs address global source rows.',
    execution: COMMON.noSubmission,
    neighborhood: 'grid candidates or source rows → GPUPointSpatialFilter → scan, compaction, or aggregation.',
    cost: 'Candidate count and chunk-routing overhead determine whether refinement beats a full scan.',
    mistake: 'Do not emit candidate-relative identities when downstream consumers expect source-row masks.'
  },
  'gpu-reduction': {
    problem: 'Reduce packed numeric values to a scalar or small fixed result.',
    readsWrites: 'Reads uint32, sint32, or float32 values; writes hierarchical summaries and a final value.',
    ownership: COMMON.callerOwned,
    output: 'One exact result under the operation and numeric semantics documented by the selected mode.',
    work: 'Linear first-level reads plus logarithmic summary levels.',
    chunks: 'Chunk summaries compose without silently repacking source buffers.',
    execution: COMMON.noSubmission,
    neighborhood: 'values + optional mask → GPUReduction → statistic, condition, or small readback.',
    cost: 'Bandwidth and summary pass count; only the final output is small.',
    mistake: 'Do not assume floating-point reductions are bitwise order-independent.'
  },
  'gpu-segmented-reduction': {
    problem: 'Reduce packed scalar values independently over offset-delimited segments.',
    readsWrites: 'Reads values and CSR-style offsets; writes one sum, minimum, or maximum per segment.',
    ownership: COMMON.callerOwned,
    output: 'One scalar per segment; empty segments produce zero.',
    work: 'One workgroup reduction per segment in the baseline implementation.',
    chunks: 'Consumes one packed value domain with explicit segment boundaries.',
    execution: COMMON.noSubmission,
    neighborhood: 'segment offsets + values → GPUSegmentedReduction → grouped aggregates.',
    cost: 'Segment count and skew determine utilization; very long segments serialize across one workgroup.',
    mistake: 'Do not provide fewer or more than output.length + 1 segment offsets.'
  },
  'gpu-scene-adapters': {
    problem: 'Populate one flat GPUScene contract from CPU hierarchies or GPU-native table sources.',
    readsWrites: 'Reads adapter-specific source records; writes canonical GPUScene records and identity metadata.',
    ownership: 'Adapters preserve caller ownership rules and make any transferred storage explicit.',
    output: 'A GPUScene with stable canonical record and application identities.',
    work: 'Adapter-specific upload or graph transformation over source records.',
    chunks: 'GPU-native adapters preserve source partitions where the scene contract permits them.',
    execution: 'Population is explicit; scene rendering and submission remain separate.',
    neighborhood: 'application hierarchy or GPU table → scene adapter → GPUScene workflows.',
    cost: 'Avoid repeated CPU traversal and upload when source topology is unchanged.',
    mistake: 'Do not make one adapter’s hierarchy or table model canonical for all scenes.'
  },
  'gpu-scene-draw-generation': {
    problem: 'Turn active visible scene records into bounded indirect draw commands.',
    readsWrites: 'Reads scene records and visibility; writes indirect commands, active count, and overflow diagnostics.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Visibility-aligned selection, stable command placement, and count publication.',
    chunks: 'Preserves canonical scene IDs while commands occupy renderer-owned slots.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUScene + visibility → GPUSceneDrawGeneration → renderer indirect draws.',
    cost: 'Scene candidate rows and configured command capacity.',
    mistake: 'Do not expect an indirect command to select arbitrary pipelines or bind groups.'
  },
  'gpu-scene-resource-groups': {
    problem: 'Classify indirect draws into stable renderer-owned pipeline and resource groups.',
    readsWrites: 'Reads generated commands and scene group references; writes grouped command windows and diagnostics.',
    ownership: 'The renderer owns pipelines, bind groups, geometries, and command windows; graph scratch is transient.',
    output: 'Stable group-local command ranges with active counts and overflow status.',
    work: 'Classification and bounded scatter over generated command slots.',
    chunks: 'Groups are explicit renderer domains, not implicit source-data chunks.',
    execution: COMMON.noSubmission,
    neighborhood: 'GPUSceneDrawGeneration → GPUSceneResourceGroups → fixed renderer draw loops.',
    cost: 'Command candidates, group count, and per-group capacity.',
    mistake: 'Do not encode arbitrary material switching into one portable indirect draw stream.'
  },
  'gpu-scene': {
    problem: 'Store renderable records in one flat, fixed-capacity GPU database with stable identity.',
    readsWrites: 'Uploads or borrows bounds, transforms, group references, geometry references, and command slots.',
    ownership: 'Each column explicitly owns or borrows its GPU storage; aggregate destruction follows that ownership.',
    output: 'Canonical scene records consumable by visibility, spatial, picking, and draw-generation workflows.',
    work: 'Storage itself adds no hidden per-frame work; composed contributors define execution.',
    chunks: 'Scene records may preserve explicit source partitions; canonical identities remain stable.',
    execution: 'The application composes, compiles, encodes, and submits scene workflows.',
    neighborhood: 'application records → GPUScene → visibility/picking/spatial queries → draw generation.',
    cost: 'Persistent capacity and the candidate ranges visited by composed operations.',
    mistake: 'Do not mistake the flat GPU database for an application scene-graph hierarchy.'
  },
  'gpu-segmented-bvh': {
    problem: 'Build or refit many independent small BVHs stored in shared packed buffers.',
    readsWrites: 'Reads segment descriptors and leaf bounds; writes segment-local nodes, roots, counts, and overflow.',
    ownership: COMMON.callerOwned,
    output: 'Exact independent hierarchies for every valid segment.',
    work: 'Equal-capacity segments share dispatches across bounded tree levels.',
    chunks: 'Segments are explicit packed domains; the primitive does not create or pack them.',
    execution: COMMON.noSubmission,
    neighborhood: 'packed segments → GPUSegmentedBVH → segment-local query or rendering.',
    cost: 'Largest segment capacity sets shared pass structure; sparse capacity wastes work.',
    mistake: 'Do not use segmented BVH as an implicit packer for streaming chunks.'
  },
  'gpu-segmented-sort': {
    problem: 'Stably sort many independent key/value domains in shared packed buffers.',
    readsWrites: 'Reads segment descriptors and source keys/values; writes destination keys/values and status.',
    ownership: COMMON.callerOwned,
    output: 'One stable order inside each segment; no order is implied across segments.',
    work: 'Equal-width segments share a bounded set of sorting dispatches.',
    chunks: 'Segments are caller-packed comparison domains, not streaming chunks.',
    execution: COMMON.noSubmission,
    neighborhood: 'packed segment keys/values → GPUSegmentedSort → grouped consumer.',
    cost: 'Segment capacity, key width, and the number of shared passes.',
    mistake: 'Do not interpret individually sorted segments as one global order.'
  },
  'gpu-sort': {
    problem: 'Produce stable out-of-place key/value ordering for packed or explicitly batched data.',
    readsWrites: 'Reads source keys and values; writes ordered destination views through transient sorting scratch.',
    ownership: COMMON.callerOwned,
    output: 'Exact stable order within the requested packed or per-batch domain.',
    work: 'Bounded multi-pass sorting determined by capacity and key representation.',
    chunks: 'GPUSort merges one stable global order across independent chunks; GPUBatchSort retains per-batch order.',
    execution: COMMON.noSubmission,
    neighborhood: 'keys + values → GPUSort/GPUBatchSort → top-K, grouping, index, or renderer.',
    cost: 'Capacity and pass count; global sorting requires reading and writing the full domain.',
    mistake: 'Do not claim global order from independently sorted chunks.'
  },
  'gpu-spatial-query-benchmark': {
    problem: 'Compare full scan, uniform-grid, and BVH query paths under one correctness and measurement protocol.',
    readsWrites: 'Uses each adapter’s normal graph resources and reads back exact stable IDs plus compact metrics.',
    ownership: 'The harness owns benchmark fixtures; adapters retain their documented graph-resource ownership.',
    output: 'Oracle-checked timings, memory, candidates, traversal work, and build/refit/query classifications.',
    work: 'Explicit warmup and measured iterations for each selected strategy.',
    chunks: 'Benchmark inputs and index layouts are reported rather than hidden.',
    execution: 'Runs only when requested and synchronizes measurements deliberately.',
    neighborhood: 'fixture + query → strategy adapters → correctness gate → comparable measurements.',
    cost: 'Benchmark synchronization is intentional and should not be copied into an interactive frame loop.',
    mistake: 'Do not compare query time without including build amortization and candidate counts.'
  },
  'gpu-trace-aggregation': {
    problem: 'Compute trace-domain counts, duration statistics, and trace-time occupancy.',
    readsWrites: 'Reads canonical trace columns, scope masks, and time intervals; writes dense groups, buckets, and summaries.',
    ownership: COMMON.callerOwned,
    output: 'Bounded group rows and time buckets with counts, clipped durations, and validation status.',
    work: 'Linear selected-row aggregation plus bounded group or bucket finalization.',
    chunks: 'Preserves canonical source partitions and aggregates into explicit result domains.',
    execution: 'Caches by scope generation and supports budgeted full-trace analysis.',
    neighborhood: 'viewport/measurement/full-trace mask → GPUTraceAggregation → charts and cross-filtering.',
    cost: 'Scope cardinality, group count, and bucket count—not only final chart size.',
    mistake: 'Do not reuse a cached result across a different analysis scope or selection generation.'
  },
  'gpu-trace-anomaly-scoring': {
    problem: 'Score canonical spans against explicit peer-group duration and error baselines.',
    readsWrites: 'Reads span metrics, group IDs, and baselines; writes per-span scores, anomaly mask, and summary.',
    ownership: COMMON.callerOwned,
    output: 'Source-aligned scores/mask plus a compact maximum and validation summary.',
    work: 'Linear scoring plus bounded summary reduction.',
    chunks: COMMON.preserveChunks,
    execution: 'Supports maximumRowsPerPass and resumable publication of complete generations.',
    neighborhood: 'peer baselines + trace columns → GPUTraceAnomalyScoring → filter, color, label, or aggregation.',
    cost: 'Selected span count and reduction; small summaries do not remove per-span scoring work.',
    mistake: 'Do not present policy scores as causal explanations.'
  },
  'gpu-trace-comparison': {
    problem: 'Align current and baseline trace groups and compute explicit regression deltas.',
    readsWrites: 'Reads compact group metrics and dictionary-aligned keys; writes deltas, scores, masks, and summary.',
    ownership: COMMON.callerOwned,
    output: 'Bounded group-aligned comparison rows and stable maximum regression.',
    work: 'Linear in aligned group capacity plus a bounded maximum reduction.',
    chunks: 'Compares compact group domains; it does not allocate per-span baseline rows.',
    execution: 'Supports conditioned and resumable analysis with generation-checked publication.',
    neighborhood: 'current + baseline aggregates → GPUTraceComparison → anomaly scoring or comparison overlays.',
    cost: 'Aligned group count, not raw trace row count, when aggregation is reused.',
    mistake: 'Do not align groups by display order when stable dictionary IDs are available.'
  },
  'gpu-trace-critical-path': {
    problem: 'Find exact duration-weighted critical paths in the canonical trace parent forest.',
    readsWrites: 'Reads parents and durations; writes cumulative duration, critical predecessors, path mask, and diagnostics.',
    ownership: COMMON.callerOwned,
    output: 'Exact selected path under the documented forest model, with cycle and invalid-parent reporting.',
    work: 'Logarithmic pointer-jumping rounds plus bounded endpoint selection and path publication.',
    chunks: 'Canonical span IDs remain stable across partitions.',
    execution: 'May be spread across frame-budgeted steps for full-trace analysis.',
    neighborhood: 'trace parent forest → GPUTraceCriticalPath → focus mask, labels, and aggregation.',
    cost: 'Canonical span count and hierarchy depth; it is an inherently global analysis.',
    mistake: 'Do not treat dependency DAG analysis and parent-forest analysis as the same contract.'
  },
  'gpu-trace-interaction': {
    problem: 'Compose hierarchy, temporal filtering, dependency focus, ancestor projection, visibility, and indirect drawing.',
    readsWrites: 'Reads canonical scene/index/control state; writes layout, focus, visibility, compact IDs, and draw commands.',
    ownership: 'The trace scene and controls are caller-owned; workflow scratch is graph-owned transient storage.',
    output: 'Stable GPU-resident interaction views and bounded indirect commands.',
    work: 'Only invalidated workflow branches should re-encode; candidate work is bounded by the temporal index.',
    chunks: 'Preserves span/dependency partitions and canonical identity.',
    execution: 'Designed for CPU conditions, GPU indirect counts, invalidation, and resumable optional analyses.',
    neighborhood: 'GPUTraceScene + controls + temporal candidates → GPUTraceInteraction → renderer/picking/analytics.',
    cost: 'Candidate spans, admitted dependencies, and invalidated branches.',
    mistake: 'Do not re-run the complete graph every animation frame when the view is idle.'
  },
  'gpu-trace-picking': {
    problem: 'Resolve a timeline coordinate to the lowest matching visible canonical span.',
    readsWrites: 'Reads span timing, effective lanes, and visibility; atomically writes one bounded picking record.',
    ownership: 'The helper supplies WGSL; the application owns the graph node, request/result storage, readback, and hover state.',
    output: 'One canonical span identity or an explicit no-hit sentinel.',
    work: 'One bounded candidate visit for the current picking request.',
    chunks: 'Results use canonical IDs independent of compact display position.',
    execution: 'Encode on pointer invalidation and reject stale asynchronous generations.',
    neighborhood: 'timeline coordinate + trace candidates → picking shader → readback ring → highlight uniform.',
    cost: 'Candidate count and readback latency; do not scan all canonical spans for every pointer event.',
    mistake: 'Do not confuse the compacted draw index with the canonical span ID.'
  },
  'gpu-trace-scene': {
    problem: 'Store canonical spans, ownership hierarchy, parents, dependencies, and generic scene projection on the GPU.',
    readsWrites: 'Uploads or borrows canonical record columns and adjacency; writes the projected GPUScene records.',
    ownership: 'Each input and output explicitly owns or borrows storage; the application owns ingestion and submission.',
    output: 'Stable span, object, parent, dependency, process, thread, and scene identities.',
    work: 'Construction/upload work is explicit; composed workflows determine per-view execution.',
    chunks: 'Preserves empty and uneven span, dependency, and adjacency partitions.',
    execution: 'Compile after capacities and topology are known; update compatible control/import state afterward.',
    neighborhood: 'trace source → GPUTraceScene → temporal index and interaction → renderer/analytics.',
    cost: 'Persistent capacity and upload volume; avoid rebuilding immutable source columns.',
    mistake: 'Do not collapse canonical, application-object, and compact display identities into one index.'
  },
  'gpu-trace-temporal-index': {
    problem: 'Select stable source-ordered trace candidates for a viewport and semantic zoom level.',
    readsWrites: 'Reads persistent per-batch time/lane summaries; writes bounded candidate batches, counts, and diagnostics.',
    ownership: COMMON.callerOwned,
    output: COMMON.bounded,
    work: 'Queries the chosen hierarchy level, then scans and stably compacts candidate ranges.',
    chunks: 'Publishes candidates in canonical batch/source order.',
    execution: 'Index construction can be resumable; unchanged viewport generations reuse cached candidates.',
    neighborhood: 'trace summaries + viewport → GPUTraceTemporalIndex → spans, labels, dependencies, picking, analytics.',
    cost: 'Chosen level and overlapping partitions, not total canonical span count.',
    mistake: 'Do not bin in moving screen coordinates; stable trace-time boundaries prevent pan flicker.'
  }
} as const satisfies Record<string, OperationContract>;

export type GPUOperationContractId = keyof typeof GPUGRAPH_OPERATION_CONTRACTS;

export function GPUOperationContract({operation}: {operation: GPUOperationContractId}): ReactNode {
  const contract = GPUGRAPH_OPERATION_CONTRACTS[operation];
  return (
    <section className="gpu-operation-contract">
      <h2 id="at-a-glance">At a glance</h2>
      <div className="docs-markdown-table">
        <table className="docs-markdown-table__table">
          <thead><tr><th>Question</th><th>Answer</th></tr></thead>
          <tbody>
            <ContractRow label="Problem" value={contract.problem} />
            <ContractRow label="Reads / writes" value={contract.readsWrites} />
            <ContractRow label="Ownership" value={contract.ownership} />
            <ContractRow label="Output contract" value={contract.output} />
            <ContractRow label="Expected work" value={contract.work} />
            <ContractRow label="Chunks" value={contract.chunks} />
            <ContractRow label="Conditions / budgets" value={contract.execution} />
            <ContractRow label="Neighborhood" value={contract.neighborhood} />
          </tbody>
        </table>
      </div>
      <div className="gpu-operation-contract__callouts">
        <aside><strong>Cost</strong><span>{contract.cost}</span></aside>
        <aside><strong>Common mistake</strong><span>{contract.mistake}</span></aside>
      </div>
    </section>
  );
}

function ContractRow({label, value}: {label: string; value: string}): ReactNode {
  return <tr><td><strong>{label}</strong></td><td>{value}</td></tr>;
}

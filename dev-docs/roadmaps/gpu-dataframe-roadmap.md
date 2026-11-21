# GPU DataFrame roadmap

GPU DataFrame plans analytical queries over GPU-resident columnar data. SQL parsing and
portable expression syntax come from [math.gl SQL](https://github.com/visgl/math.gl/blob/master/docs/modules/sql/README.md).
luma.gl binds schemas, selects supported GPU operations, and executes command graphs.
Arrow adapters handle upload and readback at the application boundary.

| Milestone | Deliverable |
| --- | --- |
| Share expression lowering | Route SQL and portable ASTs through the same operator mapping. Preserve qualified identifiers and runtime SQL parameters. Support bounded membership predicates with SQL null semantics. |
| Cover packed vectors | Wire the existing portable vector syntax and layout metadata into execution. Verify Arrow round trips and direct vertex consumption with packed strides. |
| Verify semantics | Run shared fixtures for null propagation, parameter binding, numeric coercion, and casts against math.gl Arrow and WebGPU. Record format limits and expected backend differences. |
| Extend expressions | Support searched CASE for scalar numeric output. Support absolute value, integer rounding, scalar null handling, and explicit 32-bit scalar casts. Extend coverage to domain-sensitive functions once GPU error reporting is defined. |
| Paginate ordered results | Apply SQL OFFSET and LIMIT to a global GPU sort. Keep the dense permutation and per-batch selections consistent. |
| Extend relational queries | Prioritize multi-column sorting and grouping, then evaluate wider join key and cardinality support. Check results across batches and preserve the GPU residency contract. |

See the [GPU SQL reference](../../docs/api-reference/experimental/gpu-sql.md) for the
supported query surface and the [GPU Core roadmap](gpugraph-roadmap.md) for execution infrastructure.

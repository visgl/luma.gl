# AGENTS.md
 
## Setup commands
- Select Node version: `nvm use`
- Install deps: `yarn install`
- Check types: `yarn build`
- Check lint and formatting: `yarn lint`
- Run tests: `yarn test`
- Check website build `yarn website:build`
- Check website package build: `(cd website && yarn build)`

## LLM-friendly test setup
- Use the repo root scripts as the stable interface:
  - `yarn test-node`
  - `yarn test-browser`
  - `yarn test-headless`
  - `yarn test-coverage`
  - `yarn website-debug`
- The test commands use the shared `@vis.gl/dev-tools` Vitest runner and the root `vitest.config.ts`.
- Luma-specific Playwright utilities live under [`scripts/playwright`](/Users/ibgreen/code/luma.gl/scripts/playwright).
- Playwright example aliases and defaults live in [`\.ocularrc.js`](/Users/ibgreen/code/luma.gl/.ocularrc.js).
- For details, see [docs/developer/dev-tools/llm-friendly-test-setup.md](/Users/ibgreen/code/luma.gl/docs/developer/dev-tools/llm-friendly-test-setup.md).

## Before committing
- Format code: `yarn lint fix`
- Always `yarn lint fix` after making changes to ensure that Biome formatting is maintained.

## Pull requests
- When opening a PR, wait 15 minutes for review comments, address them and respond, then make sure CI is green.

## Merge preparation
- When asked to "get ready for merge", create a copyable Markdown description of the changes versus `master`.
- Start that Markdown description with `Goals` and `Changes` sections, then include verification, risks, follow-up notes, or other merge-relevant sections when useful.
- In the verification section, explicitly call out the AGENTS.md checks that were run or could not be run: `nvm use`, `yarn install`, `yarn build`, `yarn test`, `yarn lint fix`, `yarn website:build`, and `(cd website && yarn build)`.
- Run `yarn build` after the final code and formatting changes, and treat it as a required pre-merge gate. It compiles every module with `tspc` and catches cross-package TypeScript API breakage that `yarn test-node` does not cover.
- Run `yarn test` after the final code and formatting changes, and treat it as a required pre-merge gate. It runs both node and headless coverage; targeted `yarn test-node` runs are focused checks and are not sufficient on their own.
- Do not rely on `yarn test-node` as a substitute for `yarn build` or `yarn test`; run all three when table or shared package APIs change.
 
## Code style
- TypeScript strict mode
- We end lines with semicolons
- Single quotes
- Every first-party source file with `SPDX-License-Identifier`, including tests and examples, must also declare each actual copyright holder using `SPDX-FileCopyrightText` (for example, `// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors`).
- Preserve existing license expressions and upstream attribution; do not infer MIT licensing or ownership for generated, vendored, or third-party files.
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Prefer verbNoun structure for function and method names.
- Keep shipped runtime validation minimal to protect bundle size. Prefer static typing and simple assertions over heavy validation or verbose runtime error paths.
- When a runtime invariant needs an assertion, put the explanatory error message in a comment next to the assertion so users can break on it and read the nearby context instead of shipping a long error string.
- Always import individual symbols from `'apache-arrow'` in `modules/*/src`.
- It is preferred to use `import * as arrow from 'apache-arrow'` in tests, examples, and docs.

## Geometry attribute naming
- Built-in engine geometries and `@luma.gl/gltf` geometry use glTF mesh attribute semantics such as `POSITION`, `NORMAL`, and `TEXCOORD_0`.
- `Geometry.attributes` preserves source keys. Do not camelCase or alias those keys in the CPU geometry container.
- `bufferLayout`, `GPUGeometry`, and `Model` bindings are shader-facing metadata. Convert source semantics only at adapter and model boundaries.
- Explicit `bufferLayout` is caller-owned and must not be normalized by `Geometry`.
- When source keys synthesize the same shader attribute, preserve legacy last-input-wins behavior without storing duplicate CPU aliases.
- Preserve custom geometry names. When writing glTF custom semantics, follow the glTF `_NAME` convention.

## GPU table API boundaries
- `@luma.gl/gpgpu/gpu-data` owns primitive GPU concepts: `GPUData`, `GPUDataView`, `GPUVector`, `GPUConstant`, and `GPUVectorFormat`.
- `@luma.gl/experimental/gpu-tables` owns higher-level `GPURecordBatch`, `GPUTable`, `GPUSchema`, table bindings, computations, and generic planners.
- `@luma.gl/experimental/models` owns specialized path and polygon rendering models and their GPU input helpers.
- `@luma.gl/gpgpu` and `@luma.gl/experimental` should not depend on `apache-arrow`. Arrow conversion, upload, and readback helpers belong in `@luma.gl/arrow`.
- `GPUVector.format` is the canonical type metadata. Arrow `dataType` is adapter/readback compatibility metadata, not the primary GPU type.
- Keep memory layout and shader value types separate. `GPUVectorFormat` describes stored bytes such as `float32x3`, `unorm8x4`, and `vertex-list<float32x3>`; `ShaderLayout` describes shader-facing values such as `vec3<f32>` and `vec4<f32>`.
- Use compatibility checks at adapter and model boundaries instead of encoding shader semantics into vector formats.

## GPU table storage and batching
- Each `GPUData` owns or borrows exactly one buffer.
- `GPUVector` does not own a raw buffer directly; it is an ordered list of `GPUData` chunks.
- Streaming should preserve source batch and chunk boundaries. Do not combine streaming batches or repack buffers implicitly.
- Packing is explicit table behavior, not a side effect of append or streaming.
- Destruction must follow ownership. Borrowed `GPUData` chunks must not be destroyed by aggregate vectors.

## GPU table typing style
- Prefer precise generics: `GPUVector<T extends GPUVectorFormat = GPUVectorFormat>` and `GPUData<T extends GPUVectorFormat = GPUVectorFormat>`.
- Use `VertexList<Format>` for `vertex-list<format>` typing instead of hand-written string aliases.
- Avoid shallow alias chains such as `ArrowLinePathFormat = ArrowPathCoordinateFormat`. Prefer spelling concrete `GPUVector<...>` types at the boundary unless an alias adds real domain meaning.
- Avoid casts in renderer and example code. If a helper creates a known format, type the helper overload or generic so the return type is precise.
- Keep casts localized inside low-level adapter implementation only when TypeScript cannot express the runtime invariant cleanly.

## GPU table naming
- Use source-to-target helper names such as `makeGPUVectorFromArrow(...)`.
- Avoid mixed names like `ArrowPathColorGPUVectorFormat` when the type is just a GPU memory format. Arrow names should describe Arrow source types; GPU names should describe GPU objects and formats.
- Do not define old parallel Arrow-side `GPUData` or `GPUVector` types. Arrow utilities should create the shared table types.

## GPU table metadata and validation
- Prefer explicit object metadata over side tables or hidden state. Do not use `WeakMap` for core vector/table metadata.
- Centralize vertex format knowledge in the core vertex-format decoder. Do not add duplicate bundled vertex format arrays in multiple modules.
- Runtime format strings are lowercase, exact, and whitespace-free.
- `vertex-list<format>` means variable-length per-row vertex elements; `length` is row count, `valueLength` is flattened element count, and byte stride describes one flattened element.
- Generic layout synthesis should reject `vertex-list<...>` unless a model or adapter explicitly handles expansion or storage consumption.

## Documentation
- `docs/upgrade-guide.md` should focus on breaking changes and deprecations only.
- Do not add new-feature bullets to the upgrade guide; put those in release notes such as `docs/whats-new.md`.

# Upgrade Guide

## Upgrading to v10.0

This section covers upgrades from stable luma.gl 9.x to 10.0. Update the luma.gl
packages together and regenerate your lockfile.

### Package imports

| v9 package | v10 entry point |
| --- | --- |
| `@luma.gl/webgl`, `@luma.gl/webgpu` | `@luma.gl/core/webgl`, `@luma.gl/core/webgpu` |
| `@luma.gl/constants` | `@luma.gl/core/webgl-constants` |
| `@luma.gl/webgl/debug` | `@luma.gl/core/webgl-debug` |
| `@luma.gl/shadertools` | `@luma.gl/shaders` |
| `@luma.gl/effects` | `@luma.gl/engine/effects` |
| `@luma.gl/gltf` | `@luma.gl/engine/gltf` |
| `@luma.gl/splats` | `@luma.gl/engine/splats` |
| `@luma.gl/text` | `@luma.gl/engine/text` |
| `@luma.gl/arrow` | `@luma.gl/graph/arrow` for GPU data and `@luma.gl/engine/arrow` for rendering adapters |
| `@luma.gl/test-utils` | `@luma.gl/core/test-utils` |
| `@luma.gl/gpgpu` | [Graph](./api-reference/graph/README.md) for GPU operations and Engine for model integration |

Use the [package index](./packages.mdx) to find APIs formerly imported from
`@luma.gl/experimental`. Scene rendering moved into `@luma.gl/anari`.

For direct math.gl 5.0 imports, use the public subpaths. Use
`@math.gl/core/matrix` for matrix and vector helpers, `@math.gl/core/types`
for array types, and `@math.gl/geometry/primitives` for geometry classes.
Use hyphenated projection subpaths such as
`@math.gl/geospatial/projection-types`.

### Shaders and drawing

- Create a `GLSLShaderAssembler` or `WGSLShaderAssembler` and pass it as
  `shaderAssembler` when an application needs shared hooks or modules.
- Import `GL` from `@luma.gl/core/webgl-constants`. The `@luma.gl/core/webgl` adapter entry no longer exports it.
- On WebGL, indexed draws take `firstIndex` in index elements. Divide an old byte
  offset by the index element size. Use `firstVertex` for non-indexed draws.
- If application code draws a model’s retained pipeline directly, pass the model’s
  current draw parameters. Calls through `Model.draw()` do this automatically.

- The fullscreen effect factories and `configureEffect` were removed. Pass
  the effect definition and its construction options inline as `{effect, options}`.
  See the [declarative effects guide](api-guide/shaders/declarative-effects.md).


### Resources and assets

- Destroying an owned WebGL device requests context loss. If you need to reuse
  the canvas and its context after destroying the wrapper, create the device
  with `ownsHandle: false`. An attached WebGL context is borrowed by default.
- Narrow `userData` and glTF `extras` before reading properties. These values use
  TypeScript’s `unknown` type.
- Supply an image-loading callback to `loadPBREnvironment()`. Install loaders.gl
  separately if your application uses it for asset loading.
- Validate all geometry indices against the supplied vertices, including indices
  outside an explicit draw count. See the [geometry reference](./api-reference/engine/geometry/geometry.md).

### GPUGroupAggregation sum and mean limits

`GPUGroupAggregation` `sum` and `mean` now reduce graph-owned partials in a fixed order instead
of using float atomics. The props are unchanged, but the operation has new capacity limits:

- An unpartitioned pass with more than 16,777,215 groups throws when the operation adds its command nodes.
  Count, minimum, and maximum keep their previous limits.
- Each operation allocates a transient partial-sum array of up to about 4 MB, or `4 × groupCount`
  bytes above about one million groups. Mean allocates a second array of the same size for
  partial counts. The `maxMeanScratchBytes` option caps each mean array. The graph throws when one array exceeds the device's
  `maxStorageBufferBindingSize`.
- Results are bitwise repeatable across runs on the same device, but can differ from earlier
  releases in the last bits because the addition order changed. Accumulation is still
  sequential `float32`, so cancellation-heavy inputs can lose small terms.

See [GPUGroupAggregation](./api-reference/experimental/gpu-core/gpu-group-aggregation) for details.

## Upgrading to v9.4

Review any custom shader injection hooks and the rendering options documented in
the [v9.4.2 guide](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/upgrade-guide.md#upgrading-to-v94).

## Upgrading to v9.3

Review shader type layout and portability changes in the
[v9.4.2 guide](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/upgrade-guide.md#upgrading-to-v93).

## Upgrading to v9.2

See the [v9.4.2 guide](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/upgrade-guide.md#upgrading-to-v92)
for device, resource, and rendering API changes.

## Upgrading to v9.1

See the [v9.4.2 guide](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/upgrade-guide.md#upgrading-to-v91)
for resource and canvas defaults.

## Upgrading to v9.0

Follow the [Porting Guide](./legacy/porting-guide.md) to move from v8 to the device API.

## Upgrading to v8 and earlier releases

[v8.5](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v85) · [v8.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v80) · [v7.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v73) · [v7.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v70) · [v6.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v60) · [v5.3](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v53) · [v5.2](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v52) · [v5.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v50) · [v4.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v40) · [v3.0](https://github.com/visgl/luma.gl/blob/v9.4.2/docs/legacy/legacy-upgrade-guide.md#upgrading-to-v30)

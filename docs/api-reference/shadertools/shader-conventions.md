# Shader Modules

:::caution
This describes informal conventions that luma.gl applies to its shaders. 
It is still a work in progress.
:::

## Uniform Blocks

Shader modules are increasingly organized around a logical bind-group
convention:

| Group | Intended Use | Typical Examples |
| ----- | ------------ | ---------------- |
| `0` | Core engine-owned per-draw state | `project`, `pbrProjection`, `picking`, `skin`, transform or object data |
| `1` | Application-defined shared state | renderer feature blocks, app-specific environment or simulation state, terrain or dataset-level state |
| `2` | Lighting and other scene invariants reused across many materials and draws | `lighting`, `dirlight`, shared `ibl`, shadow maps and shadow parameters |
| `3` | Per-material surface state | `pbrMaterial`, `lambertMaterial`, `phongMaterial`, `gouraudMaterial`, material textures and samplers |

Postprocessing and effect parameters should generally stay in group `0` for
now. They are pass-local state rather than material state, and reusing group
`3` for both would make the convention ambiguous.

Projection-style blocks stay in group `0` when they mix camera data with
object-dependent matrices such as `modelMatrix` or `normalMatrix`. A pure
camera or view-projection block could reasonably live in group `1` or group
`2`.

For the current public guidance, see the
[Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings).

## Shader Passes

It is possible to package up many typical screen-space post-processing steps as a shader module.

Sometimes a pass needs to be run several times with some internal uniform changed. This can be described
by adding the `passes` field to a shader module.

### Defining your own Shader Modules

It is important that the order and types of declarations of uniforms match those in the shader.

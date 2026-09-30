# River District

A standalone Deck city scene rendered by the shared river-district mesh layer. The fictional
district uses deterministic local geometry, so it requires no basemap service or credentials.

```sh
yarn install
cd examples/deck/city-scene
yarn start
```

Choose WebGPU or WebGL2, change camera presets, toggle buildings and water shading, compare the
classic and layered river water styles, adjust ripple strength, pause the waves, and click surfaces
to inspect features. Positions use Deck's meter-offset
coordinate system around a fixed geographic origin. Deck owns the frame loop and presentation
device. The example owns the water positions; `WaterSurfaceLayer` borrows them and owns its model.

`yarn build` checks types and builds the standalone example. `yarn test:visual` runs the real scene
in both backends, checks animated and deterministic water, pause, picking, camera changes, resize,
layer updates, and finalization, and saves
screenshots in the system temporary directory. Tests use software rendering for portability and
do not establish hardware performance targets. Set `CITY_SCENE_HARDWARE=true` to run them with the
available hardware adapter instead.

The classic style uses luma.gl's procedural `waterMaterial`. The River style layers small crossing
ripples, Fresnel response, and directional-light glints in the separate
`riverWaterMaterial`; its wave travel follows the dominant axis of the river footprint. The existing
material remains available unchanged. Neither style displaces geometry. Ripple frequencies fade
below a pixel to limit distant flicker.

On WebGPU, **Scene reflections** adds screen-space building and bridge reflections. The example's
`SceneBufferEffect` captures participating opaque layers into the shared luma.gl `GBuffer`.
`RiverReflectionEffect` borrows its color, depth, and view-normal/roughness textures and runs
luma.gl's shared SSR tracer, camera-reprojected history, spatial filtering, and compositing.
The reflection adapter owns only the postprocessing pipeline and its temporal history; scene
capture, layer filtering, target resizing, and texture cleanup belong to `SceneBufferEffect`.

The `surfaceBuffer` shader module lets participating layers supply normals and roughness. Capture
runs before Deck's display pass, and reflections are installed as this single-view fixture's final
effect. Arbitrary Deck layers must explicitly participate in capture and normal output. WebGL keeps
the procedural material and disables the reflection control.

SSR can only reflect surfaces visible in the current frame; screen-edge and occlusion gaps remain.
Camera-only temporal accumulation follows the static district through camera movement. Each
history tap must match the reprojected depth, surface normal, and roughness; a neighborhood clamp
limits stale reflection colors. The animated water's changing normals can reject history. Camera
presets, large camera jumps, resize, time resets, and material changes clear history. Moving objects
would require motion vectors or explicit history resets. Depth history preserves 24-bit depth in
RGBA8 textures, avoiding optional float-filtering support. Reflection history stays at half
resolution while depth and normal history use full resolution. Buildings sit close to the river
to make their reflections easier to see. The scene uses face lighting,
without cast shadows. The shared fixture adapter does not promise arbitrary mesh formats or terrain draping.

Website builds use an explicit asset prefix (including `WEBSITE_BASE_URL` when set), so clean-URL
redirects cannot move relative asset requests out of the embedded example directory. Standalone
builds retain relative asset URLs.

The district geometry is rendered by `../river-district-layer.ts`, shared with the other riverfront
examples. It uses luma.gl's Lambert material for lighting, optional `heightFog`, and `surfaceBuffer`
for view-space normals/roughness and selection output. The layer owns its generated mesh buffer and
model; Deck owns their layer lifecycle. Fog defaults to zero density.

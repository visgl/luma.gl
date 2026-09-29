# River District

A standalone Deck city scene rendered by an example-owned luma.gl mesh layer. The fictional
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
`RiverReflectionEffect` rerenders its participating opaque layers into color/depth and view-normal/
roughness buffers, then uses luma.gl's shared SSR tracer and spatial filters at half resolution.
The `surfaceBuffer` shader module lets participating layers write normals and roughness for the
auxiliary pass. This is a workaround for Deck's color-only postprocess input, scoped to this
single-view fixture and installed as its final effect. It does not add buffers to arbitrary Deck
layers. WebGL keeps the procedural material and disables the reflection control.

SSR can only reflect surfaces visible in the current frame; screen-edge and occlusion gaps remain.
There is no temporal accumulation because this fixture does not provide motion vectors. Buildings
sit close to the river to make their reflections easier to see. The scene uses face lighting,
without cast shadows. The small city mesh adapter remains local to the example and does not
promise arbitrary mesh formats or terrain draping.

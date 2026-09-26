# River District

A standalone Deck city scene rendered by an example-owned luma.gl mesh layer. The fictional
district uses deterministic local geometry, so it requires no basemap service or credentials.

```sh
yarn install
cd examples/deck/city-scene
yarn start
```

Choose WebGPU or WebGL2, change camera presets, toggle buildings and water shading, adjust ripple
strength, pause the waves, and click surfaces to inspect features. Positions use Deck's meter-offset
coordinate system around a fixed geographic origin. Deck owns the frame loop and presentation
device. The example owns the water positions; `WaterSurfaceLayer` borrows them and owns its model.

`yarn build` checks types and builds the standalone example. `yarn test:visual` runs the real scene
in both backends, checks animated and deterministic water, pause, picking, camera changes, resize,
layer updates, and finalization, and saves
screenshots in the system temporary directory. Tests use software rendering for portability and
do not establish hardware performance targets. Set `CITY_SCENE_HARDWARE=true` to run them with the
available hardware adapter instead.

The river uses luma.gl's procedural `waterMaterial` with normal perturbation and Fresnel/specular
shading. It does not displace geometry or reflect surrounding buildings. The small city mesh adapter
remains local to the example and does not promise arbitrary mesh formats or terrain draping.

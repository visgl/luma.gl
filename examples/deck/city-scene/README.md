# River District

A standalone Deck city scene rendered by an example-owned luma.gl mesh layer. The fictional
district uses deterministic local geometry, so it requires no basemap service or credentials.

```sh
yarn install
cd examples/deck/city-scene
yarn start
```

Choose WebGPU or WebGL2, change camera presets, toggle buildings, and click surfaces to inspect
features. Positions use Deck's meter-offset coordinate system around a fixed geographic origin.
Deck owns the frame loop and presentation device; the layer owns and releases its mesh buffers.

`yarn build` checks types and builds the standalone example. `yarn test:visual` runs the real scene
in both backends, checks picking, camera changes, resize, layer updates, and finalization, and saves
screenshots in the system temporary directory. Tests use software rendering for portability and
do not establish hardware performance targets. Set `CITY_SCENE_HARDWARE=true` to run them with the
available hardware adapter instead.

The initial scene uses opaque, statically shaded surfaces. The small mesh adapter is local to the
example while material and stroke APIs are developed; it does not promise arbitrary mesh formats,
terrain draping, or extension compatibility.

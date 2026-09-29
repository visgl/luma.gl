# Riverfront routes

Connected routes through the shared fictional river district, using luma.gl's `makeStrokeGeometry`
and `pathDash` with an example-owned Deck mesh adapter. No map service or credentials are needed.

```sh
yarn install
yarn workspace luma.gl-examples-deck-styled-paths start
```

Choose WebGPU or WebGL2, adjust width in metres, compare butt/square/round path ends and
miter/bevel/round corners, and change dash length, gap, and phase. Turn off dashes to see the full
cap and join shapes. Click visible route ink to inspect its feature; gaps pick the surface below.
The elevated bridge crossings interpolate vertex heights while retaining a horizontal stroke width.

The layer owns its uploaded mesh and model. Changing width, caps, joins, or path data rebuilds
geometry and releases the old buffers. Changing dashes only updates uniforms. Deck supplies the
device, frame loop, projection, picking uniforms, and render pass. The adapter is local to this
example; the reusable CPU geometry and shader module live in engine and shadertools respectively.

`yarn workspace luma.gl-examples-deck-styled-paths build` checks types and builds standalone assets.
`test:visual` runs both renderers and checks stable redraw, dash phase and toggles, geometry changes,
feature picking through gaps, zero-width paths, resizing, buffer reuse, and resource cleanup. Set
`STROKE_EXAMPLE_URL` to test a served production bundle. Software-GPU checks do not establish hardware
performance. `STROKE_THUMBNAIL` optionally writes a JPEG of the default WebGPU scene.

Caps apply to the path endpoints; individual dashes have straight ends. Width is in local map units,
not CSS pixels. Closed-loop dash phase can have a seam when the period does not divide the perimeter.
Self-intersecting or retraced paths may overlap; this tessellator does not compute a polygon union.

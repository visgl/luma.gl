# patternFill

`patternFill` returns antialiased coverage for hatch, crosshatch, and dot fills. It supports GLSL and WGSL, has no Deck dependency, and is intended for fragment shaders.

```
import {patternFill} from '@luma.gl/shadertools';



const model = new Model(device, {modules: [patternFill], /* application shaders and geometry */});

model.shaderInputs.setProps({

  patternFill: {pattern: 'crosshatch', spacing: 8, width: 0.12, angle: Math.PI / 4}

});
```

Call `patternFill_getCoverage(coordinates)` with a two-component coordinate in the fragment shader. It returns coverage from 0 to 1. For example, combine it with material color using `mix(baseColor, inkColor, coverage)`. The application controls color, opacity, and picking.

| Property  | Default       | Meaning                                                                         |
| --------- | ------------- | ------------------------------------------------------------------------------- |
| `pattern` | `'hatch'`     | `'hatch'`, `'crosshatch'`, or `'dots'`                                          |
| `spacing` | `8`           | Pattern period in the input coordinate units; clamped to at least `0.0001`      |
| `width`   | `0.12`        | Stripe thickness or dot diameter as a fraction of the period, clamped to 0–1    |
| `angle`   | `Math.PI / 4` | Rotation of the coordinate grid, in radians; zero produces vertical hatch lines |
| `offset`  | `[0, 0]`      | Pattern origin, in input coordinate units before rotation                       |

Partial updates retain previously supplied values. Width zero removes the fill. Width one fills the surface for hatch and crosshatch; dots remain circles with diameter equal to the spacing.

## Coordinates and filtering[​](#coordinates-and-filtering "Direct link to Coordinates and filtering")

Use UVs or local object/world coordinates to attach the pattern to a surface. Use screen coordinates for an overlay. The caller determines the coordinate system and units; for example, spacing 8 means eight meters for local meter coordinates and eight pixels for pixel coordinates. Prefer a nearby coordinate origin to retain floating-point precision over large geographic areas.

The shader evaluates derivatives before pattern selection. Call it outside divergent fragment branches. Stripe coverage integrates a periodic pulse over the pixel footprint and preserves mean ink area at distance. Crosshatching combines the two filtered directions. Dots blend toward their analytic mean area when subpixel. The dot filter and oblique crosshatch intersection filter are approximations; there is no temporal accumulation or texture dependency.

See [Riverfront patterns](https://luma.gl/next/examples/deck/pattern-fills) for controls on both rendering backends.

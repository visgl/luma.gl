# heightFog

Analytic fog extinction for fragment shaders in GLSL and WGSL. Call
`heightFog_getColor(color, position, cameraPosition)` with both positions in the same
local east/north/up metre coordinates. It preserves alpha and mixes linear RGB with
`heightFog.color`. `heightFog_getTransmittance(position, cameraPosition)` returns the
unscattered fraction for custom compositing.

`density` is base extinction per metre, `baseHeight` is in metres, and `heightFalloff`
is inverse metres. Density stays constant below the base and decays exponentially above
it. Zero density disables fog; zero falloff gives uniform distance fog. The ray integral
handles horizontal rays and rays crossing the base without a marching loop or history.
This is a constant-color atmosphere approximation, without shadowing or directional scattering.


`heightFogFunctions` exposes the same calculation without a uniform block. Its
`heightFog_getRayTransmittance(rayLength, cameraHeight, fragmentHeight, density, baseHeight, heightFalloff)`
function accepts scalar metre-space ray length and heights, allowing callers to choose an up
axis and supply their own uniform layout. The `heightFog` material module depends on it, as does
`@luma.gl/effects`' analytic height-fog pass. The two paths therefore share the density integral.


For drifting wisps, set `variation` from 0 to 1, `wispScale` in metres, `velocity`
in metres per second, and `time` in seconds. Defaults keep the uniform analytic path.
With variation enabled, twelve ray segments sample warped, multiscale world-space
noise; each segment retains the analytic height integral. This is a bounded-cost density
approximation, not a volumetric fluid simulation. Pausing time freezes it; zero velocity
keeps a static, nonuniform field. Both material and depth-pass fog call the same
`heightFog_getSpatialTransmittance` helper. It needs no noise textures or temporal history.
The tint remains constant; density varies. Very long rays through small wisps can undersample
this fixed twelve-segment approximation, so choose bank sizes appropriate to the scene.

Set `evolutionSpeed` above zero for gentle internal deformation in addition to advection.
Zero retains the rigid density field. Applications control time; freeze it to pause both
forms of motion. When changing drift speed interactively, integrate distance over time
instead of multiplying the new speed by the entire elapsed clock.

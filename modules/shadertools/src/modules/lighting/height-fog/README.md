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

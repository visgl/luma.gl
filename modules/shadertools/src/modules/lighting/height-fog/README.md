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

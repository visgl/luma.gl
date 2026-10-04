# atmosphere

Portable GLSL/WGSL single-scattering Rayleigh/Mie sky and aerial perspective. The sun direction,
camera, and surface positions use a local east/north/up frame in metres, with z = altitude.
The analytic planet is a sphere with `planetRadius` (default 6,371,000 m); the atmosphere
extends 100 km above it. This is a local tangent-frame renderer, rather than a globe adapter.

`atmosphere_getSkyColor(camera, normalizedDirection)` returns exposure-mapped sky RGB.
`atmosphere_getColor(color, position, camera)` applies atmospheric extinction and in-scattering
to geometry, preserving alpha. Set `enabled` to zero to leave geometry untouched.
`atmosphere_getScattering` returns linear radiance and RGB transmittance for applications with
their own HDR compositor. `sunIntensity`, `rayleigh`, `haze` and `exposure` control illumination,
molecular scattering, aerosol scattering, and display exposure respectively. A nonzero
`sunDirection` is required. Incremental uniform updates preserve previous values.

The fixed integration uses twelve view samples and four sunlight samples. Planet occlusion
removes sunlight from the night side. The implementation omits multiple scattering, ozone,
terrain shadows and cloud attenuation of atmospheric light; it is not a spectral atmosphere
model. Long near-horizon paths and very low sunlight can undersample density. Use separate
celestial layers for disks; this module provides the scattering halo.

`AtmosphereLayer` supplies shared perspective camera rays, far depth, picking exclusion and
premultiplied opacity for deck.gl flat maps on WebGPU and WebGL2. Draw it before SunLayer,
MoonLayer, CloudLayer and opaque scene layers. Orthographic and globe views are skipped.

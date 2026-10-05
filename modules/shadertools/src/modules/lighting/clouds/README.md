# clouds

Procedural, wind-driven sky clouds for GLSL and WGSL. The module uses shared `valueNoise` and
returns premultiplied RGBA from `clouds_getColor(camera, normalizedRayDirection)`.
Camera positions, slab dimensions, and velocity use a local east/north/up metre frame.

The cloud slab starts at `altitude`, extends through `thickness`, and uses `scale` for the
horizontal size of formations. `cover` ranges from clear (0) to overcast (1); `density`
controls extinction per metre. Set `time` in seconds and `velocity` in east/north metres per
second. The shader adds gradual shape evolution independently of advection. `sunDirection`
points toward the sun; `sunColor` is linear RGB. The direction must be nonzero.

A fixed 64-sample march integrates density through the slab, with approximate local sunlight
attenuation and a forward-scattering highlight. The horizon fades at long distances. There
are no cloud shadow maps, temporal accumulation, or atmospheric multiple scattering.
`clouds_getTransmittance(position)` integrates sunlight extinction through that same density
field with sixteen midpoint samples. Multiply direct sunlight by this factor, preserving
ambient illumination. It returns one for clear/zero-density clouds and sun elevation at or
below approximately 1.1 degrees. Sky and receivers must share the origin, dimensions, time and wind.
The light march caps at 40 km, limiting cost and low-sun precision. It does not create
shadow-map resources or implement terrain/volume shadowing. The
caller supplies world-space camera rays, composites over the sky, and arranges foreground
occlusion. `CloudLayer` in the deck.gl adapter provides this integration for perspective
flat-map views. Cloud render cost scales with visible sky area.

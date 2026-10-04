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
are no cloud shadow maps, temporal accumulation, or atmospheric multiple scattering. The
caller supplies world-space camera rays, composites over the sky, and arranges foreground
occlusion. `CloudLayer` in the deck.gl adapter provides this integration for perspective
flat-map views. Cloud render cost scales with visible sky area.

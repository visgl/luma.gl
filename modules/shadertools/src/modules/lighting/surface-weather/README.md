# surfaceWeather

GLSL/WGSL material helpers for wet surfaces, world-anchored puddle patches and upward-facing
snow coverage. State, time, shelter masks and accumulation rates are application-owned.
The same helpers work with Lambert, Phong or PBR material adapters without a new render pass.

* `surfaceWeather_getAlbedo(albedo, position, normal, exposure)` darkens wet material and
  blends snow color according to coverage, patch noise and upward slope.
* `surfaceWeather_getRoughness(roughness, position, normal, exposure)` lowers wet roughness
  and raises snow roughness. Feed this into PBR or a scene-buffer roughness attachment.
* `surfaceWeather_getReflection(position, normal, camera, lightDirection, lightColor, exposure)`
  supplies approximate dielectric highlights and uniform sky tint for simple material adapters.
  It is not scene reflection, SSR, a planar reflection or a simulated fluid surface.
* `surfaceWeather_getSnow`, `surfaceWeather_getWetness` and `surfaceWeather_getPuddle` expose
  the individual coverage terms for custom materials.

Positions and `scale` use metres, normals use an east/north/up frame, and `lightDirection`
points toward the light. `exposure` is a 0–1 mask: water and fully sheltered surfaces use zero.
Wetness, snow and puddles range from 0 to 1. Noise is static in world space and reuses the
same valueNoise dependency as clouds and height fog. Incremental uniforms preserve state.

`integrateSurfaceWeather(state, rates, elapsedSeconds)` returns bounded wetness/snow with
exact constant-rate integration, independent of frame rate. Incoming rainfall/snowfall fills
remaining capacity; evaporation/snowmelt removes existing coverage. Rates are inverse seconds.
Zero elapsed time preserves state exactly. The caller decides whether to advance, pause or
reset state; accumulated cover can remain after precipitation stops. There is no GPU state
texture, particle deposition, snow depth/displacement, temperature model or automatic shelter
calculation. Riverfront Weather demonstrates scalar accumulation and excludes water explicitly.

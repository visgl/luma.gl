# Wind Atlas

Run `yarn workspace luma.gl-examples-deck-wind start`. Requires WebGPU.

The private `@deck.gl-community/gpu-layers` module supplies two reusable components:

- `WindSimulationEffect` owns a `ScientificFlowGraph` and records RK2/RK4 integration into Deck's frame encoder before drawing. Deck owns submission. The effect supports pause, a bounded wall-time step, and an encoding callback for inspection. A temporal graph stops at its resident interval endpoint; callers may rotate snapshots after frame submission through `effect.simulation.setNextSnapshot`.
- `WindParticleLayer` borrows the graph's current/previous storage buffers and projects normalized positions into field bounds. It never advances, reads back, or destroys the simulation. It supports geographic Deck views or Cartesian plots, screen-space widths, opacity, altitude, and stable particle-slot picking. Streaks extrapolate recent motion, not retained trajectory history. Respawns and longitude crossings draw heads only to avoid false connecting lines.

Keep the effect stable while adjusting its `props.paused` and `props.timeScale`. Replace it for a new field, particle count, or integrator; Deck cleans up the old effect. Do not share an owning effect between Deck instances. The layer can also render a caller-owned `ScientificFlowGraph` without this effect.

The example displays synthetic angular winds in degrees per illustrative second on a longitude/latitude atlas. These are not observations or forecast data. It reuses the repository's Earth image and needs no remote data service. Settings, Info, Graph, Trace, and Source use the shared example panels. Graph and Trace describe the real advection encoding; rendering is outside that graph. No particle positions are read during animation.

A deck.gl-community station adapter can rasterize its wind field into the existing `ScientificVectorFieldInput`. Preserve units explicitly: community visualization-normalized velocities are not meters per second. Real geographic velocities should use `coordinates: 'lnglat'`. Elevation sampling and the community WebGL path remain separate work.

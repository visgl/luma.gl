# precipitation

GLSL vertex and WGSL shader helpers for deterministic falling particles.
`precipitation_getPosition(identifier)` returns a local east/north/up metre position.
`precipitation_getFade(position)` fades recycling at the boundaries of the volume.

Uniforms include `time` in seconds, `fallSpeed` in metres/second downward, east/north
`wind` in metres/second, `turbulence` amplitude in metres, an integer `seed` from 0 to
16,777,215, and `volumeCenter` / positive `volumeSize` in metres. Time must be finite and
non-negative; all other inputs must be finite. Callers own the clock, particle count,
projection, appearance, surface exclusion, and animation scheduling.

Positions are evaluated analytically from seed and identifier with periodic wrapping.
Pausing requires only keeping time constant. Moving the center of a fixed-size volume
preserves overlapping particles' world positions; new particles wrap in at its boundaries.
Changing size, seed, or velocity changes trajectories immediately. Turbulence adds gentle
horizontal swaying, suitable for snow. There is no persistent simulation state or collision
response. Long-running applications should reset between sessions before float time loses
needed precision.

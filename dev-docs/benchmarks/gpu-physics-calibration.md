# GPU physics calibration and stability protocol

Updated October 17, 2026. These tests verify the implemented equations; they do not
establish that the pool example reproduces a particular physical table.

## Units, observations and fitting

Use metres, seconds, radians, and positive gravity magnitude. Angular speed is
positive in the forward rolling direction. Supply radius, gravity and source
provenance with every dataset. `kind: measured` means the observations came from an
identified measurement process; changing this label does not make synthetic data
experimental evidence. Record table/cloth, ball size, acquisition method,
uncertainty, temperature and sample conditions in `provenance.notes`.

For each cloth observation record initial linear speed `v`, initial rolling-axis
angular speed `w`, slide duration `t`, rolling-transition speed `u`, subsequent
rolling distance `d`, initial sidespin `s`, and sidespin stopping time `q`.
The independent least-squares fits through the origin are:

- `abs(v - radius*w)/3.5 = slidingFriction * gravity*t`.
- `u² = rollingResistance * 2*gravity*d`.
- `abs(s)*radius = spinningResistance * gravity*q`.

For cushions record incoming and outgoing speed along the contact normal, using
spin-free impacts without another simultaneous contact. The pace fit is
`incoming/outgoing = (1 + velocityScale*incoming)/restitution`.
At least two distinct positive incident speeds are required. The fit rejects
superelastic normal samples and negative pace dependence. It is deliberately not a
fit for raised-nose spin exchange, simultaneous table reactions or arbitrary
angle/spin data. Such observations need a richer model.

Report RMS residuals in m/s, m²/s², m/s and reciprocal restitution, respectively.
Do not compare these different units directly. Use independent hold-out shots and
acquisition tolerances to accept a measured fit; a zero training residual alone
is insufficient. No empirical tolerances are asserted by this change.

After `yarn build`, produce a reproducible report:

```sh
node scripts/physics/calibrate-spheres.mjs test/fixtures/gpu-physics/cloth-cushion-si.json
```

The committed analytic fixture recovers coefficients 0.2, 0.01, 0.02, 0.88 and
0.035. It deliberately labels its provenance as synthetic. GPU regressions compare
SI draw/stun/follow speeds within 0.005 m/s, rolling slip below 0.001 m/s and
sidespin decay within 0.005 rad/s at 240 Hz, with and without warm starting.
Continuous cushion tests check the pace law within 0.0005 m/s, sidespin symmetry
and bounded total translational-plus-rotational energy. These are numerical model
tolerances, not measurement uncertainties.

## Published reference and limits

[Mathavan, Jackson and Parkin (2010), DOI 10.1243/09544062JMES1964](https://journals.sagepub.com/doi/10.1243/09544062JMES1964)
reports experimentally informed cushion model parameters and a rigid-cushion
applicability limit around 2.5 m/s normal speed. Its coupled impact equations differ
from this solver's simplified impulse law. Copying its fitted constants into this
solver would not reproduce the study or calibrate the pool table. No paper figures
have been digitized into the synthetic fixture, and no measured follow/draw or
throw-angle dataset is claimed here. Those empirical acceptance checks remain open.

## Collision and contact stability gates

- Symmetric simultaneous sphere impacts at 30 and 120 Hz preserve momentum within
  0.001 and do not exceed initial kinetic energy by more than 0.01.
- A fast sphere rebounds repeatedly between finite thin surfaces during one 0.2 s
  step. Eight 0.025 s steps agree within 0.005 length units, without tunneling.
- Reducing the impact budget to one reports the unprocessed interval as cumulative
  discarded simulation seconds. Rendering/readback delay does not hide this loss.
- A supported sphere chain compares two-iteration cold and persistent solvers.
  Persistence must reduce final velocity and compression; teleporting invalidates
  cached support rather than kicking the displaced sphere.
- The existing tiny/grazing, trigger crossing, dense candidate-budget, ownership,
  sleeping, grid/all-pairs and 10,000-body sparse tests remain required.

A persistent sphere manifold has one point. The cache is a bounded dense identity
map for up to 256 bodies and is not suitable for large worlds. Warm starting is
opt-in; wider dense-pile, adapter and extreme mass-ratio validation is still needed
before changing module defaults. General non-spherical manifolds remain separate.

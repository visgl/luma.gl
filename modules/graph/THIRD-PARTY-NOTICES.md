# Third-party notices: graph

Application-facing GPU graph composition and independently implemented analysis, physics, and projection operations. NVIDIA RAPIDS cuGraph, cuVS, cuSpatial, cuProj, cuDF, cuCIM, and cuXfilter provide inspiration; Crossfilter and Lalit Maganti/Perfetto provide interactive analysis ideas. These are algorithm and API inspirations, not claims that their implementation code is redistributed. See feature documentation for differences. The physics guide uses Erin Catto’s Box2D simulation documentation as a timestep reference; no Box2D solver port is claimed.

See the [repository license](./LICENSE) and [References and credits](https://luma.gl/docs/references-and-credits). Separately installed dependencies retain their own licenses. No additional embedded third-party source is identified in this inventory.

## Projection formula references

The PROJ contributors document the published projection formulas and coefficient
matrices used by independently implemented WebGPU kernels in `src/gpu-project`.
Source comments link the relevant Lambert conformal conic, Albers equal-area,
Transverse Mercator, Web Mercator, and unit-conversion references.
The sixth-order Krüger matrices in `projection-transverse-mercator.ts` are
identified there as published coefficients, rather than copied PROJ program code.
[PROJ projection documentation](https://proj.org/en/stable/operations/projections/index.html).

## Parcels adaptive advection

Copyright (c) 2025, Parcels team. RKF45 stages and controller in `src/experimental/simulation/scientific-flow-rk45-shaders.ts` adapt [Parcels AdvectionRK45](https://github.com/OceanParcels/parcels/blob/8584c09a4189ed29a49aa980b9830a2379e42c65/src/parcels/kernels/_advection.py), at commit `8584c09a4189ed29a49aa980b9830a2379e42c65`. Full terms: [Parcels MIT license](./src/experimental/simulation/PARCELS-LICENSE.txt).

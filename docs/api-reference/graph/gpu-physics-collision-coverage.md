# Rigid-body collision coverage

This is an executable coverage contract, not a claim of complete geometry qualification.
The ordered-pair fixtures in `rigid-body-coverage.spec.ts` exercise all 36 combinations
of the six finite shape families below, including both kernel orderings. They assert
separating response and complete diagnostics for 35 combinations; the stationary
mesh/mesh case explicitly records the missing penetration-recovery response. They do not
establish penetration-depth accuracy, arbitrary mesh containment or high-speed safety.

| Shape pair | Implementation | Evidence and remaining qualification |
| --- | --- | --- |
| Sphere / sphere | Analytic discrete contact | Ordered-pair response fixture; specialized sphere dynamics tests |
| Sphere / box; box / box | Analytic/SAT contacts | Ordered-pair response fixture; stack and rotated-box tests |
| Capsule, cylinder, convex hull / finite convex shapes | Bounded convex contact query | Ordered-pair response fixture; tapered primitive tests; degeneracy and convergence remain open |
| Triangle mesh / convex shapes | Cooked BVH and triangle surface contacts | Ordered-pair response fixture; original-triangle and opening tests; no deep solid containment |
| Triangle mesh / triangle mesh | Bounded triangle-pair surface contacts | Moving-contact fixtures cover offsets and openings; stationary intersecting cubes have no separating recovery response; no deep solid containment |
| Plane / finite shape | Plane-aware contact query, static planes only | Existing plane fixtures; broader all-shape reference qualification remains open |
| Plane / plane | No physical response | Both planes are static; not a supported dynamic pair |

Materials, collision filters and compound transforms are independent dimensions.
This table does not turn sensor overlap or query-cast support into collision-response
support. Continuous response currently has a narrower sphere/static-surface envelope.

Next qualification gates are independent distance/penetration references, stable feature
identity across seams, thin/degenerate geometry, scale extremes, long-running rotated
compounds, and explicit closed-solid semantics. Every matrix entry also checks a separated negative case. Neither those checks nor
positive response alone establish full geometric qualification.

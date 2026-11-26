# Documentation review, October 2026

## Scope and method

Baseline: `4ebeb7fa2a` on `master`. The review inventory includes all 429 curated documents
under `docs/` and all 107 example pages under `website/content/`, including the three legacy
guides. Generated API output is produced from source by the website build; it is not a second
manually maintained corpus. Internal RFCs and development roadmaps are not published API contracts.

Every source page was included in the route, heading/organization, stale-API, placeholder,
code-fence syntax triage, size, and repeated-paragraph review. The existing documentation contracts
also check sidebar reachability, tab groups, table structure, and public runtime-export coverage.
Source checks focused on flagged contracts and changed examples. This does not certify every
code snippet as executable or every external link as reachable.

## Findings and changes

| Area | Finding | Resolution |
| --- | --- | --- |
| First-run experience | Missing project-directory step; three copies of the triangle implementation; misspellings; incomplete installation subclass | Keep one complete program, explain its lifecycle, add `cd`, and implement `onFinalize`. |
| Backend selection | Removed `webglAdapter` import and misleading adapter-order/retry claims | Use `webgl2Adapter`; document support-based preference and explicit handling of creation failure. |
| Rendering | Removed framebuffer accessors, obsolete draw calls, invalid framebuffer options, and WebGL 1 MRT syntax | Explain current pass-owned drawing and valid attachment creation; link to exact resource contracts. |
| Clearing | Conflicting opaque/transparent defaults and nonexistent `loadOp`, depth, and stencil fields | Centralize `RenderPassProps`; use `clearColor`, `clearDepth`, `clearStencil`, and boolean `false`. |
| Framebuffers | Invalid attachment types and resize signature; outdated no-resolve claim; unclear borrowed ownership | Document format strings, texture views, `clone`, deprecated resize overloads, ownership, and WebGPU resolve targets. |
| Parameters | Incomplete snippets, duplicate usage sections, obsolete names, and wrong depth-write default | Separate guide workflow from reference tables; correct names, comparison values, defaults, and state ownership. |
| UniformStore | Empty usage section and outdated block definitions, managed-buffer method, and return types | Add a small typed example and current methods, upload ordering, packed/allocation sizes, and ownership. |
| Projection module | Wrong export, props, function spelling, and a stray raw-uniform draft | Document `projection` and the actual GLSL functions and portability boundary. |
| GPU Core | Removed `seal()` instructions; obsolete PR narratives; claims that dynamic/nested lowering is unimplemented | Document current arena allocation and capacity, runtime dispatch gates, nested conjunctions, and current related APIs. |
| Contribution/testing | Travis/headless.gl, removed example paths/scripts, removed Cube, and wrong snapshot constructor | Use current setup and Vitest/Playwright commands; centralize snapshot guidance. |
| Arrow/navigation | Repeated long path-conversion explanation on landing and support pages | Keep selection guidance on the landing page and link to canonical conversion/type contracts. |
| Batch guide | Public guide contained a long test-by-test audit and PR work queue | Keep the public behavior contract and retain evidence in an internal roadmap. |
| Style | Malformed specification link, inconsistent API spelling, stale project name, copied prose | Repair the link and terminology; shorten repeated explanations. |

## Organization decisions

- Preserve routes. Guides explain workflows; reference pages own exact names, types, defaults,
  failures, and ownership. The FAQ is a short entry point.
- Keep detailed numerical, projection, raster, glTF, and shader-pass pages where the detail describes
  real contracts or tradeoffs. File length alone does not justify a split.
- Keep reference-local compatibility reminders even when they resemble another operation's notes;
  requiring readers to jump between APIs for a crucial mask or ownership rule would reduce usability.
- Preserve historical API examples in legacy upgrade/release guides. They describe older releases,
  not recommended current code.
- Maintain generated reference coverage alongside curated workflow documentation. Mapping an
  export to a landing page is reachability evidence, not proof of complete semantic documentation.

## Review limits

GPU examples were not all executed interactively on both backends during this review. TypeScript
syntax triage intentionally distinguishes runnable examples from signatures, descriptor fragments,
WGSL/GLSL, and ellipses. External specifications and research citations were not exhaustively
network-checked. Experimental APIs remain subject to their documented limits and source contracts.

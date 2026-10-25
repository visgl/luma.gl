# References and credits

luma.gl grows from the work of many people: library authors, graphics researchers,
standards contributors, artists, educators, and the developers who maintain the
web graphics ecosystem. We are grateful for the code, ideas, tools, and freely
available examples that make this project possible.

This guide distinguishes adapted source, research implemented independently,
inspiration, standards compatibility, and separately installed dependencies.
The package notices contain redistribution terms; the acknowledgments here also
recognize contributions that go beyond license requirements.

## Origins and community

luma.gl began as an ES6 port of **Nicolas Garcia Belmonte's PhiloGL**, developed at
**Sencha Labs**. Our [v1 release history](./legacy/legacy-whats-new.md#version-10)
records that origin, and the repository license retains Sencha's notice.
PhiloGL's approachable WebGL abstractions and examples provided a foundation for
the project. We thank Nicolas and the PhiloGL contributors for making that work
available.

**Uber Technologies** developed and open sourced early luma.gl work; the retained
2015 copyright records that contribution. We thank the
[luma.gl contributors](https://github.com/visgl/luma.gl/graphs/contributors),
including maintainers, reviewers, documentation writers, issue reporters, and
example authors, for its continued development. **vis.gl** and the **OpenJS
Foundation** provide the project's community and organizational home.

## Package source inventory

Every public package ships a `THIRD-PARTY-NOTICES.md` index, the repository
license, and applicable full notices. The links below identify affected source,
upstream terms, known revisions, and changes. Unknown historical revisions are
marked explicitly rather than inferred from current upstream releases.
The website also distributes [standalone example notices](/standalone-examples/THIRD-PARTY-NOTICES.txt).

| Package | Contributions and foundations |
| --- | --- |
| [core](https://github.com/visgl/luma.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md) | Portable API and backends; Gregg Tavares’s webgpu-utils mipmaps, Mikola Lysenko’s regl polyfill lineage, wwwtyro’s compiler parser, and Spector.js declarations. |
| [engine](https://github.com/visgl/luma.gl/blob/master/modules/engine/THIRD-PARTY-NOTICES.md) | PhiloGL heritage; math.gl supplies CPU primitive generation and numerical foundations. |
| [shadertools](https://github.com/visgl/luma.gl/blob/master/modules/shadertools/THIRD-PARTY-NOTICES.md) | Historical Khronos PBR shaders; three.js half-float conversion; Uber geospatial shaders; Heitz, Dupuy, Hill, and Neubelt's LTC area-light fit data. |
| [effects](https://github.com/visgl/luma.gl/blob/master/modules/effects/THIRD-PARTY-NOTICES.md) | Evan Wallace's glfx.js filters; three.js postprocessing heritage; NVIDIA FXAA via Cesium. |
| [text](https://github.com/visgl/luma.gl/blob/master/modules/text/THIRD-PARTY-NOTICES.md) | three.js font, path, shape, and extrusion utilities; deck.gl text atlas utilities; MAGENTA's font data. |
| [splats](https://github.com/visgl/luma.gl/blob/master/modules/splats/THIRD-PARTY-NOTICES.md) | World Labs' Spark RAD opacity and support behavior; Gaussian-splat research. |
| [gltf](https://github.com/visgl/luma.gl/blob/master/modules/gltf/THIRD-PARTY-NOTICES.md) | Benjamin Wasty’s gltf-loader-ts schema types, Khronos specifications, sample assets, and interoperability fixtures. |
| [gpgpu](https://github.com/visgl/luma.gl/blob/master/modules/gpgpu/THIRD-PARTY-NOTICES.md) | GPU data containers, low-level operations, and execution utilities. |
| [experimental](https://github.com/visgl/luma.gl/blob/master/modules/experimental/THIRD-PARTY-NOTICES.md) | Experimental rendering, materials, models, and scientific flow simulation. |
| [arrow](https://github.com/visgl/luma.gl/blob/master/modules/arrow/THIRD-PARTY-NOTICES.md) | Apache Arrow and GeoArrow formats, libraries, and community. |
| [slang](https://github.com/visgl/luma.gl/blob/master/modules/slang/THIRD-PARTY-NOTICES.md) | Slang language and compiler community; optional compiler integration. |
| [test-utils](https://github.com/visgl/luma.gl/blob/master/modules/test-utils/THIRD-PARTY-NOTICES.md) | Shared vis.gl testing infrastructure and browser tooling. |
| [deck-arrow-layers](https://github.com/visgl/luma.gl/blob/master/modules/deck-arrow-layers/THIRD-PARTY-NOTICES.md) | deck.gl rendering and Arrow interoperability. |
| [deck-gpu-layers](https://github.com/visgl/luma.gl/blob/master/modules/deck-gpu-layers/THIRD-PARTY-NOTICES.md) | deck.gl rendering and GPU data interoperability. |
| [graph](https://github.com/visgl/luma.gl/blob/master/modules/graph/THIRD-PARTY-NOTICES.md) | GPU composition, RAPIDS-inspired analysis, physics, and projection operations. |
| [anari](https://github.com/visgl/luma.gl/blob/master/modules/anari/THIRD-PARTY-NOTICES.md) | Independent exploration of the Khronos ANARI object model. |
| [three](https://github.com/visgl/luma.gl/blob/master/modules/three/THIRD-PARTY-NOTICES.md) | Interoperability with separately installed three.js. |

The private ANARI workspace explores the **Khronos ANARI** object model. Standards
inspiration and format support do not imply certification, affiliation, or
endorsement. Package boundaries can change: primitive generation has moved to
math.gl; its TDL and PhiloGL history remains part of luma.gl's lineage.

## Graphics implementations and educational foundations

- **Evan Wallace** made [glfx.js](https://github.com/evanw/glfx.js) available with
  clear, compact image-processing shaders. The classic adjustment, blur, warp,
  and artistic filters retain that implementation lineage through luma.gl's
  shader-pass interfaces. The repository license also acknowledges adapted
  [three.js](https://github.com/mrdoob/three.js) postprocessing work.
- **Gregg Tavares** and the [webgpu-utils](https://github.com/greggman/webgpu-utils)
  contributors supplied the mipmap implementation foundation. His web graphics
  teaching and utilities help make the underlying APIs accessible.
- **Mohamad Moneimne and contributors** supplied the historical
  [glTF-WebGL-PBR reference shader](https://github.com/KhronosGroup/glTF-Sample-Viewer/tree/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1).
  Both GLSL and WGSL adaptations preserve its 2016–2017 MIT terms. The modern
  Sample Viewer's later Apache license does not replace that historical license.
- **Ricardo Cabello (mrdoob) and the three.js contributors** provided the text
  geometry, font loading, curves, extrusion, and half-float conversion foundations.
  **MAGENTA Ltd.** supplied the font data behind Helvetiker; its embedded font
  permission terms are retained separately from the code's MIT license.
- **Google's TDL contributors** supplied the acknowledged plane, sphere, and
  truncated-cone primitive lineage. Porting, moving, or replacing these helpers
  does not erase their contribution.
- **NVIDIA's FXAA authors** and the **Cesium contributors** supplied the FXAA 3.11
  shader lineage. The retained source records luma.gl's sampling, alpha, and
  luminance modifications; package notices preserve NVIDIA and Cesium terms.
- **Mikola Lysenko and regl contributors**, **wwwtyro**, and the **Babylon.js
  Spector.js contributors** supplied useful WebGL compatibility and debugging
  foundations. These source adaptations are recorded in the core package notices.
- **Benjamin Wasty** supplied [gltf-loader-ts](https://github.com/bwasty/gltf-loader-ts)
  schema types, retained through loaders.gl and now adapted in luma.gl’s glTF
  package. Its MIT notice accompanies both schema files and the package.
- **World Labs and Spark contributors** supplied RAD opacity and Gaussian support
  behavior adapted for luma.gl's paged splat rendering. This acknowledgment
  describes retained implementation work, beyond compatibility with Spark data.

## Research and algorithm references

Research credit and source-code provenance are complementary. These works
explain important ideas used by the rendering and compute features:

- **Brian Karis**, [Real Shading in Unreal Engine 4](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf);
  **Brent Burley**, [Physically-Based Shading at Disney](https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf);
  and **Christophe Schlick**, *An Inexpensive BRDF Model for Physically-based Rendering*.
  See the [PBR material reference](./api-reference/shadertools/shader-modules/pbr-material.md)
  for their relationship to the shader.
- **Eric Heitz, Jonathan Dupuy, Stephen Hill, and David Neubelt**,
  [Real-Time Polygonal-Light Shading with Linearly Transformed Cosines](https://eheitzresearch.wordpress.com/415-2/),
  ACM Transactions on Graphics (SIGGRAPH 2016), 35(4), 2016. Their GGX fit data
  supplies area-light shading tables, pinned to selfshadow/ltc_code commit
  `31e5e96b54f98f33098f8503003119ba2231a1c6`. The full LTC terms and required
  paper citation ship beside the source and with standalone distribution notices.
- **The PROJ contributors** document the projection formulas, unit conversions,
  and published Krüger coefficient matrices referenced by GPU projection kernels.
  The [projection documentation](https://proj.org/en/stable/operations/projections/index.html)
  supplies mathematical references, distinct from source-code adaptation.
- **Bernhard Kerbl, Georgios Kopanas, Thomas Leimkühler, and George Drettakis**,
  [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/),
  established the rendering representation behind Gaussian-splat workflows.
  This citation does not imply redistribution of their reference implementation.
- **NVIDIA and the RAPIDS contributors** pioneered GPU-resident analysis through
  [cuDF](https://github.com/rapidsai/cudf), [cuGraph](https://github.com/rapidsai/cugraph),
  [cuVS](https://github.com/rapidsai/cuvs), [cuSpatial](https://github.com/rapidsai/cuspatial),
  [cuProj](https://github.com/rapidsai/cuproj), [cuCIM](https://github.com/rapidsai/cucim),
  and [cuXfilter](https://github.com/rapidsai/cuxfilter). luma.gl's related APIs
  document independent WebGPU implementations and their differing scope.
  **Crossfilter's authors and contributors** also deserve credit for coordinated,
  interactive filtering; see the [crossfilter attribution](./api-reference/experimental/gpu-crossfilter.md#attribution-and-feature-comparison).
- **Lalit Maganti's** [description of Perfetto’s batched exponential search](https://lalitm.com/post/exponential-search/)
  inspired the pixel-mipmap foundation described in the
  [GPU trace algorithms](./api-reference/experimental/gpu-trace-algorithms.md).
- **Jeroen van der Zijp's** *Fast Half Float Conversions* is the algorithm
  reference cited by the three.js-derived half-float conversion utility.

- **Erin Catto and the Box2D contributors** provide the
  [simulation timestep reference](https://box2d.org/documentation/md_simulation.html)
  linked by the [GPU physics guide](./api-guide/gpu/gpu-physics.md). This is a
  numerical/educational reference, not a claim that luma.gl redistributes Box2D.

## Standards, libraries, and tools

We thank the **W3C GPU for the Web group**, **The Khronos Group**, browser and GPU
driver implementers, and contributors to **WebGPU, WGSL, WebGL, GLSL, glTF, and
ANARI**. Their specifications and implementations make portable web graphics
possible.

The **math.gl**, **loaders.gl**, **deck.gl**, and **probe.gl** communities provide
mathematics, asset loading, visualization, diagnostics, and shared infrastructure.
The **Apache Arrow** and **GeoArrow** communities provide interoperable columnar
data foundations. **Slang**, **TypeScript**, **Vitest**, **Playwright**, **Vite**,
**Docusaurus**, **Biome**, and **Yarn** contributors support development and
documentation. Separately installed dependencies retain their own licenses;
this guide is not a transitive dependency bill of materials.

## Assets, examples, and fixtures

Data and artwork have their own terms. Preserve their credits when distributing
examples, screenshots, converted assets, or generated font atlases.

| Material | Creators and provenance |
| --- | --- |
| glTF scene examples | Ed Mackey, Microsoft, Maximillan Kamps, sbtron, Frank Galligan, Tomás Laulhé, Don McCurdy, Marco Hutter, Guido Odendahl, and Eric Chadwick; [asset-by-asset CC0 credits](https://github.com/visgl/luma.gl/blob/master/examples/anari/scenes/public/gltf/ASSET-LICENSE.md). |
| USD mini vehicles | Kenney; USD conversion and assembly by Robin-Yann Storm. |
| USD teapots | Chris Rydalch at SideFX; Fancy Teapot by James Ray Cook, Jurita Burger, and Rico Cilliers at PolyHaven. |
| Open Chess Set | Moeen Sayed and Mujtaba Sayed; SideFX, Chris Rydalch, Jonathan Stone, and Pablo Delgado; Academy Software Foundation CC BY 4.0. [Full USD credits and terms](https://github.com/visgl/luma.gl/blob/master/examples/anari/scenes/public/usd/ASSET-LICENSE.md). |
| glTF interoperability fixtures | Khronos Sample Assets, Marco Hutter's Simple Skin, and Babylon.js; [pinned sources, transformations, and terms](https://github.com/visgl/luma.gl/blob/master/modules/gltf/test/data/README.md). |
| Text Space Crawl font atlas | Oswald font contributors and Viktor Chlumský's msdfgen; [font source, OFL, and generation tools](https://github.com/visgl/luma.gl/blob/master/examples/experimental/text-space-crawl/public/fonts/README.md). |
| 3D texture and depth-of-field examples | Tarek Sherif's [PicoGL.js](https://github.com/tsherif/picogl.js) examples, ported to luma.gl; see the [example notice index](https://github.com/visgl/luma.gl/blob/master/examples/THIRD-PARTY-NOTICES.md). |
| Transform feedback tutorial | [WebGL 2 Samples](https://github.com/WebGLSamples/WebGL2Samples), linked from the tutorial. |
| Website marks | W3C WebGPU logo under CC BY 4.0; Khronos and other marks belong to their respective holders. |
| Material gallery and Scatter imagery | Eric Chadwick, Wayfair, UX3D / Mathias Kanzler, Pascal Schoen, Chris Rydalch, André Mazzone, and Thomas Anagnostou; [per-image credits, pinned sources, and CC BY/CC0 terms](https://github.com/visgl/luma.gl/blob/master/website/static/images/examples/gltf/ATTRIBUTION.md). |
| Standalone splat loader | loaders.gl and its bundled dependencies; the distributed bundle includes [its generated license notices](https://github.com/visgl/luma.gl/blob/master/website/static/standalone-examples/gaussian-splats/loaders-gl.LICENSE.txt). |

## Keeping these credits useful

The [attribution maintenance guide](https://github.com/visgl/luma.gl/blob/master/dev-docs/attribution.md)
explains how to record new sources, preserve full terms, and verify package
contents. Historical source revisions remain unknown in some cases, and this
inventory does not claim to identify every past influence. Corrections and
additional credits are welcome through
[GitHub issues](https://github.com/visgl/luma.gl/issues).

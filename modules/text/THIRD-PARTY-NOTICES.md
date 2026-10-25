# Third-party notices: @luma.gl/text

Text paths, extrusion, and font loading adapted from three.js; browser atlas utilities adapted from deck.gl. Font data has its own retained terms.

The [repository license](./LICENSE) retains historical project notices.
See [References and credits](https://luma.gl/docs/references-and-credits) for people, research, standards, and assets.
These notices accompany the published text package and local distributions.
Separately installed dependencies retain their own licenses.

## three.js text utilities

three.js authors.

Source: [three.js text utilities](https://github.com/mrdoob/three.js).

Revision: historical import revision unknown unless identified below.

Adaptation: src/text-3d paths, curves, shapes, FontLoader, TextGeometry, and ExtrudeGeometry adapted to TypeScript and luma.gl geometry; src/fonts/typeface-font-data.ts and helvetiker.ts retain three.js data lineage.

Full terms: [three](./licenses/three.txt).

## deck.gl text atlas

Vis.gl contributors.

Source: [deck.gl text atlas](https://github.com/visgl/deck.gl).

Revision: historical import revision unknown unless identified below.

Adaptation: src/fonts/atlas/browser-font-atlas.ts and text-utils.ts adapt browser font atlas and text utilities.

Full terms: [deck](./licenses/deck.txt).

## Helvetiker / MgOpen

Copyright (c) 2004 by MAGENTA Ltd. All Rights Reserved..

Source: [Helvetiker / MgOpen](https://github.com/mrdoob/three.js/blob/master/examples/fonts/helvetiker_regular.typeface.json).

Revision: historical import revision unknown unless identified below.

Adaptation: src/fonts/helvetiker.ts packages font data as TypeScript. Metadata identifies version 1.00, 2004 initial release. The embedded original font terms are reproduced separately from the code license.

Full terms: [magenta-font](./licenses/magenta-font.txt).

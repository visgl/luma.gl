# Type Alias: PBRSurfaceProps

> **PBRSurfaceProps** = `object`

Defined in: [modules/lighting/pbr-surface/pbr-surface.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-surface/pbr-surface.ts#L8)

## Properties[​](#properties "Direct link to Properties")

### useMaterialNormals?[​](#usematerialnormals "Direct link to useMaterialNormals?")

> `optional` **useMaterialNormals?**: `boolean`

Defined in: [modules/lighting/pbr-surface/pbr-surface.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-surface/pbr-surface.ts#L12)

Include canonical normal/bump maps instead of geometric normals. Defaults to false.

***

### viewMatrix?[​](#viewmatrix "Direct link to viewMatrix?")

> `optional` **viewMatrix?**: `Readonly`<`NumberArray16`>

Defined in: [modules/lighting/pbr-surface/pbr-surface.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-surface/pbr-surface.ts#L10)

Rigid world-to-view camera transform. Defaults to identity.

# Type Alias: SkinProps

> **SkinProps** = `object`

Defined in: [modules/engine/skin/skin.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L122)

## Properties[​](#properties "Direct link to Properties")

### jointMatrices?[​](#jointmatrices "Direct link to jointMatrices?")

> `optional` **jointMatrices?**: `Float32Array` | readonly `number`\[]

Defined in: [modules/engine/skin/skin.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L128)

Adapter-owned joint palette, already expressed in the skinned mesh's local space.

***

### meshWorldMatrix?[​](#meshworldmatrix "Direct link to meshWorldMatrix?")

> `optional` **meshWorldMatrix?**: readonly `number`\[]

Defined in: [modules/engine/skin/skin.ts:132](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L132)

Optional mesh transform used to convert world-space joints into mesh-local space.

***

### scenegraphsFromGLTF?[​](#scenegraphsfromgltf "Direct link to scenegraphsFromGLTF?")

> `optional` **scenegraphsFromGLTF?**: `any`

Defined in: [modules/engine/skin/skin.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L124)

Existing glTF scenegraph input retained for backwards compatibility.

***

### skinIndex?[​](#skinindex "Direct link to skinIndex?")

> `optional` **skinIndex?**: `number`

Defined in: [modules/engine/skin/skin.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L126)

Source skin selected when the scene contains more than one skeleton.

***

### skinJointMatrices?[​](#skinjointmatrices "Direct link to skinJointMatrices?")

> `optional` **skinJointMatrices?**: `Binding`

Defined in: [modules/engine/skin/skin.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L130)

Instance-packed joint palettes: WebGPU storage buffer or WebGL float texture.

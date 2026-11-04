# Variable: skin

> `const` **skin**: `object`

Defined in: [modules/engine/skin/skin.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/engine/skin/skin.ts#L144)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"skin"`; }, { `group`: `0`; `name`: `"skinJointMatrices"`; `visibility`: `1`; }]

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: `SkinBindings`

### defines[​](#defines "Direct link to defines")

> `readonly` **defines**: `object`

#### defines.SKIN\_MAX\_JOINTS[​](#definesskin_max_joints "Direct link to defines.SKIN_MAX_JOINTS")

> **SKIN\_MAX\_JOINTS**: `64`

Fits comfortably inside the minimum portable WebGL uniform-block limit.

### dependencies[​](#dependencies "Direct link to dependencies")

> `readonly` **dependencies**: \[] = `[]`

### fs[​](#fs "Direct link to fs")

> **fs**: `""`

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> `readonly` **getUniforms**: (`props`, `_previousUniforms?`) => [`SkinUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SkinUniforms.md) & `SkinBindings`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`SkinProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SkinProps.md) = `{}`

##### \_previousUniforms?[​](#_previousuniforms "Direct link to _previousUniforms?")

[`SkinUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SkinUniforms.md)

#### Returns[​](#returns "Direct link to Returns")

[`SkinUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SkinUniforms.md) & `SkinBindings`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"skin"` = `'skin'`

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: [`SkinProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SkinProps.md)

### source[​](#source "Direct link to source")

> **source**: "\nstruct skinUniforms {\n jointMatrix: array\<mat4x4\<f32>, 64>,\n};\n\n\@group(0) @binding(auto) var\<uniform> skin: skinUniforms;\n\n#ifdef HAS\_INSTANCED\_SKIN\n\@group(0) @binding(auto) var\<storage, read> skinJointMatrices: array\<mat4x4\<f32>>;\n\nfn getInstancedSkinMatrix(\n weights: vec4f,\n joints: vec4u,\n instanceIndex: u32,\n jointsPerInstance: u32\n) -> mat4x4\<f32> {\n let firstJoint = instanceIndex \* jointsPerInstance;\n return (weights.x \* skinJointMatrices\[firstJoint + joints.x])\n + (weights.y \* skinJointMatrices\[firstJoint + joints.y])\n + (weights.z \* skinJointMatrices\[firstJoint + joints.z])\n + (weights.w \* skinJointMatrices\[firstJoint + joints.w]);\n}\n#else\n#ifdef HAS\_LARGE\_SKIN\n\@group(0) @binding(auto) var\<storage, read> skinJointMatrices: array\<mat4x4\<f32>>;\n#endif\n#endif\n\nfn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4\<f32> {\n#ifdef HAS\_LARGE\_SKIN\n return (weights.x \* skinJointMatrices\[joints.x])\n + (weights.y \* skinJointMatrices\[joints.y])\n + (weights.z \* skinJointMatrices\[joints.z])\n + (weights.w \* skinJointMatrices\[joints.w]);\n#else\n return (weights.x \* skin.jointMatrix\[joints.x])\n + (weights.y \* skin.jointMatrix\[joints.y])\n + (weights.z \* skin.jointMatrix\[joints.z])\n + (weights.w \* skin.jointMatrix\[joints.w]);\n#endif\n}\n"

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: [`SkinUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SkinUniforms.md)

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.jointMatrix[​](#uniformtypesjointmatrix "Direct link to uniformTypes.jointMatrix")

> `readonly` **jointMatrix**: readonly \[`"mat4x4<f32>"`, `64`]

### vs[​](#vs "Direct link to vs")

> **vs**: "\nlayout(std140) uniform skinUniforms {\n mat4 jointMatrix\[SKIN\_MAX\_JOINTS];\n} skin;\n\n#ifdef HAS\_INSTANCED\_SKIN\nuniform highp sampler2D skinJointMatrices;\n\nmat4 getInstancedJointMatrix(uint jointIndex, uint instanceIndex) {\n int firstColumn = int(jointIndex \* 4u);\n int row = int(instanceIndex);\n return mat4(\n texelFetch(skinJointMatrices, ivec2(firstColumn, row), 0),\n texelFetch(skinJointMatrices, ivec2(firstColumn + 1, row), 0),\n texelFetch(skinJointMatrices, ivec2(firstColumn + 2, row), 0),\n texelFetch(skinJointMatrices, ivec2(firstColumn + 3, row), 0)\n );\n}\n\nmat4 getInstancedSkinMatrix(\n vec4 weights,\n uvec4 joints,\n uint instanceIndex,\n uint jointsPerInstance\n) {\n return (weights.x \* getInstancedJointMatrix(joints.x, instanceIndex))\n + (weights.y \* getInstancedJointMatrix(joints.y, instanceIndex))\n + (weights.z \* getInstancedJointMatrix(joints.z, instanceIndex))\n + (weights.w \* getInstancedJointMatrix(joints.w, instanceIndex));\n}\n#else\n#ifdef HAS\_LARGE\_SKIN\nuniform highp sampler2D skinJointMatrices;\n\nmat4 getSkinJointMatrix(uint jointIndex) {\n int firstColumn = int(jointIndex \* 4u);\n return mat4(\n texelFetch(skinJointMatrices, ivec2(firstColumn, 0), 0),\n texelFetch(skinJointMatrices, ivec2(firstColumn + 1, 0), 0),\n texelFetch(skinJointMatrices, ivec2(firstColumn + 2, 0), 0),\n texelFetch(skinJointMatrices, ivec2(firstColumn + 3, 0), 0)\n );\n}\n#endif\n#endif\n\nmat4 getSkinMatrix(vec4 weights, uvec4 joints) {\n#ifdef HAS\_LARGE\_SKIN\n return (weights.x \* getSkinJointMatrix(joints.x))\n + (weights.y \* getSkinJointMatrix(joints.y))\n + (weights.z \* getSkinJointMatrix(joints.z))\n + (weights.w \* getSkinJointMatrix(joints.w));\n#else\n return (weights.x \* skin.jointMatrix\[joints.x])\n + (weights.y \* skin.jointMatrix\[joints.y])\n + (weights.z \* skin.jointMatrix\[joints.z])\n + (weights.w \* skin.jointMatrix\[joints.w]);\n#endif\n}\n\n"

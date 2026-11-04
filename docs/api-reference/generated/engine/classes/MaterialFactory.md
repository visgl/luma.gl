# Class: MaterialFactory\<TModuleProps, TBindings>

Defined in: [modules/engine/src/material/material-factory.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L66)

Creates typed [Material](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md) instances for a stable material binding schema.

## Examples[​](#examples "Direct link to Examples")

```
const pbrFactory = new MaterialFactory<

  {pbrMaterial: PBRMaterialUniforms},

  PBRMaterialBindings

>(device, {modules: [pbrMaterial]});

const pbr = pbrFactory.createMaterial();

pbr.setProps({pbrMaterial: {baseColorFactor: [1, 0, 0, 1]}});

const pbrVariant = pbr.clone({bindings: {pbr_baseColorSampler: texture}});
```

```
const phongFactory = new MaterialFactory<

  {phongMaterial: PhongMaterialProps},

  {}

>(device, {modules: [phongMaterial]});

const phong = phongFactory.createMaterial();

phong.setProps({phongMaterial: {ambient: 0.4, diffuse: 0.7}});

const phongVariant = phong.clone({moduleProps: {phongMaterial: {shininess: 64}}});
```

```
const gouraudFactory = new MaterialFactory<

  {gouraudMaterial: GouraudMaterialProps},

  {}

>(device, {modules: [gouraudMaterial]});

const gouraud = gouraudFactory.createMaterial();

gouraud.setProps({gouraudMaterial: {ambient: 0.25}});

const gouraudVariant = gouraud.clone({moduleProps: {gouraudMaterial: {diffuse: 0.8}}});
```

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TModuleProps[​](#tmoduleprops "Direct link to TModuleProps")

`TModuleProps` *extends* `MaterialModuleProps` = `MaterialModuleProps`

### TBindings[​](#tbindings "Direct link to TBindings")

`TBindings` *extends* `MaterialBindings` = `MaterialBindings`

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new MaterialFactory**<`TModuleProps`, `TBindings`>(`device`, `props?`): `MaterialFactory`<`TModuleProps`, `TBindings`>

Defined in: [modules/engine/src/material/material-factory.ts:78](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L78)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props?[​](#props "Direct link to props?")

[`MaterialFactoryProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MaterialFactoryProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`MaterialFactory`<`TModuleProps`, `TBindings`>

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/material/material-factory.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L71)

Device that creates materials for this schema.

***

### modules[​](#modules "Direct link to modules")

> `readonly` **modules**: `ShaderModule`\[]

Defined in: [modules/engine/src/material/material-factory.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L73)

Shader modules that define the material schema.

## Methods[​](#methods "Direct link to Methods")

### createMaterial()[​](#creatematerial "Direct link to createMaterial()")

> **createMaterial**(`props?`): [`Material`](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md)<`TModuleProps`, `TBindings`>

Defined in: [modules/engine/src/material/material-factory.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L90)

Creates one typed material instance for this factory's schema.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props?[​](#props-1 "Direct link to props?")

`Omit`<[`MaterialProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MaterialProps.md)<`TModuleProps`, `TBindings`>, `"factory"` | `"modules"`> = `{}`

#### Returns[​](#returns-1 "Direct link to Returns")

[`Material`](https://luma.gl/docs/api-reference/generated/engine/classes/Material.md)<`TModuleProps`, `TBindings`>

***

### getBindingNames()[​](#getbindingnames "Direct link to getBindingNames()")

> **getBindingNames**(): `string`\[]

Defined in: [modules/engine/src/material/material-factory.ts:100](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L100)

Returns the logical material-owned resource binding names.

#### Returns[​](#returns-2 "Direct link to Returns")

`string`\[]

***

### getBindingsByGroup()[​](#getbindingsbygroup "Direct link to getBindingsByGroup()")

> **getBindingsByGroup**(`bindings`): `BindingsByGroup`

Defined in: [modules/engine/src/material/material-factory.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L120)

Packages resolved material bindings into bind group `3`.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### bindings[​](#bindings "Direct link to bindings")

`Partial`<{ \[K in string | number | symbol]: Binding }> & `Record`<`string`, `Binding`>

#### Returns[​](#returns-3 "Direct link to Returns")

`BindingsByGroup`

***

### ownsBinding()[​](#ownsbinding "Direct link to ownsBinding()")

> **ownsBinding**(`bindingName`): `boolean`

Defined in: [modules/engine/src/material/material-factory.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L105)

Returns `true` when the supplied binding belongs to this material schema.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### bindingName[​](#bindingname "Direct link to bindingName")

`string`

#### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

***

### ownsModule()[​](#ownsmodule "Direct link to ownsModule()")

> **ownsModule**(`moduleName`): `boolean`

Defined in: [modules/engine/src/material/material-factory.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/material/material-factory.ts#L115)

Returns `true` when the supplied shader module is owned by this material schema.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### moduleName[​](#modulename "Direct link to moduleName")

`string`

#### Returns[​](#returns-5 "Direct link to Returns")

`boolean`

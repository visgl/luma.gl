# Material variants

Material variants switch authored surface appearances while preserving the scene hierarchy and model identities.

The **MaterialsVariantsShoe** sample demonstrates this capability. Use **Material variant** to switch appearances without reloading the model. Drag to orbit and scroll to zoom.

### MaterialsVariantsShoe

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

`MaterialVariants` from `@luma.gl/engine` accepts named variants and explicit per-model material/parameter mappings. See [scene controllers](https://luma.gl/docs/api-guide/engine/scene-controllers.md) for the source-independent construction API.

For imported assets, `createScenegraphsFromGLTF()` exposes a `variants` controller. Read `names` to discover choices, call `selectVariant(name)` to apply one, and `resetVariant()` to restore authored defaults. The controller updates materials and pipeline state on existing models.

## Usage[​](#usage "Direct link to Usage")

```
import {MaterialVariants} from '@luma.gl/engine';



// modelNode is an existing ModelNode; paintedMaterial is a compatible Material.

const variants = new MaterialVariants({

  variants: [{name: 'paint', index: 0}],

  bindings: [{

    modelNode,

    defaultMaterial: modelNode.model.material,

    defaultParameters: {...modelNode.model.parameters},

    mappings: new Map([[0, {

      material: paintedMaterial,

      parameters: {...modelNode.model.parameters}

    }]])

  }]

});

variants.selectVariant('paint');

variants.resetVariant();
```

Alternate materials must remain compatible with the original shader feature layout. Selecting a variant does not rebuild the model shader to add previously absent texture or alpha-cutoff defines.

## glTF support[​](#gltf-support "Direct link to glTF support")

The importer supplies the same engine controller with source variant names and resolved primitive mappings:

```
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';



const scenegraphs = createScenegraphsFromGLTF(device, gltf);

const variantName = scenegraphs.variants.names[0];

if (variantName) {

  scenegraphs.variants.selectVariant(variantName);

}

// Restore the original appearance.

scenegraphs.variants.resetVariant();
```

`KHR_materials_variants` defines named primitive-to-material mappings. Unmapped primitives return to their default materials when switching. See [native glTF extensions](https://luma.gl/docs/api-reference/gltf/gltf-native-extensions.md).

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)

# Type Alias: ScanWGSLInterfaceOptions

> **ScanWGSLInterfaceOptions** = `object`

Defined in: [lib/shader-assembly/wgsl-interface-scan.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-interface-scan.ts#L18)

## Properties[​](#properties "Direct link to Properties")

### scanVertexAttributes?[​](#scanvertexattributes "Direct link to scanVertexAttributes?")

> `optional` **scanVertexAttributes?**: `boolean`

Defined in: [lib/shader-assembly/wgsl-interface-scan.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-interface-scan.ts#L22)

Whether to scan vertex attributes. Disable for compute pipelines that only need bindings.

***

### vertexEntryPoint?[​](#vertexentrypoint "Direct link to vertexEntryPoint?")

> `optional` **vertexEntryPoint?**: `string`

Defined in: [lib/shader-assembly/wgsl-interface-scan.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-interface-scan.ts#L20)

Selected render-pipeline vertex entry point. Required when WGSL declares multiple vertices.

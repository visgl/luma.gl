# Function: scanWGSLInterface()

> **scanWGSLInterface**(`source`, `options?`): `ShaderLayout` | `null`

Defined in: [lib/shader-assembly/wgsl-interface-scan.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/shader-assembly/wgsl-interface-scan.ts#L41)

Scans the pipeline interface needed to create a WebGPU shader layout without a full WGSL parser. Returns `null` when an interface is ambiguous or uses unsupported syntax, signaling that the caller must provide an explicit layout.

## Parameters[​](#parameters "Direct link to Parameters")

### source[​](#source "Direct link to source")

`string`

### options?[​](#options "Direct link to options?")

[`ScanWGSLInterfaceOptions`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ScanWGSLInterfaceOptions.md) = `{}`

## Returns[​](#returns "Direct link to Returns")

`ShaderLayout` | `null`

# Upgrade Guide

The upgrade guide lists breaking changes in each major and minor version of the luma.gl API, and provides information on how to update applications.

Upgrade instructions assume that you are upgrading from the immediately previous release.
If you are upgrading across multiple releases you will want to consider the release notes for all
intermediary releases.

luma.gl largely follows [SEMVER](https://semver.org) conventions. Breaking changes are typically only done in major versions, minor version bumps bring new functionality but few breaking changes, and patch releases typically contain only low-risk fixes.

*For detailed commit level logs that include alpha and beta releases, see the [CHANGELOG](https://github.com/visgl/luma.gl/blob/master/CHANGELOG.md) in the github repository.*

## Upgrading to v9.1

Some deprectations and minor breaking changes are necessary as WebGPU support is built out.

**@luma.gl/core**

| Updated API                    | Status     | Replacement                            | Comment                                                         |
| ------------------------------ | ---------- | -------------------------------------- | --------------------------------------------------------------- |
| `Parameters.blend`             | New        |                                        | Explicit activation of color blending                           |
| `luma.registerDevices()`       | Deprecated | [`luma.registerAdapters()`][adapters]. | Adapters provide a cleaner way to work with GPU backends.       |
| `Texture.props.data` (Promise) | Changed    | `AsyncTexture` class                   | Textures no longer accept promises.                             |
| `triangle-fan-webgl`           | Removed    | `triangle-strip`.                      | Reorganize your geometries                                      |
| `line-loop-webgl`              | Removed    | `line-list`.                           | Reorganize your geometries                                      |
| `glsl` shader template string  | Removed    | `/* glsl */` comment                   | Enable syntax highlighting in vscode using before shader string |
| `depth24unorm-stencil8`        | Removed    | `depth24plus-stencil8`                 | The `TextureFormat` was removed from the WebGPU spec            |
| `rgb8unorm-unsized`            | Removed    | `rgb8unorm`                            | No longer support unsized WebGL1 `TextureFormat`                |
| `rgba8unorm-unsized`           | Removed    | `rgb8aunorm`                           | No longer support unsized WebGL1 `TextureFormat`                |

[adapters]: /docs/api-reference/core/luma#lumaregisteradapters

**@luma.gl/shadertools**

| Updated API                          | Status  | Replacement                             | Comment                                            |
| ------------------------------------ | ------- | --------------------------------------- | -------------------------------------------------- |
| `ShaderModuleInstance`               | Removed | Use `ShaderModule` instead.             | Type has been removed.                             |
| `initializeShaderModule()`           | Changed |                                         | Initializes the original shader module object      |
| `ShaderModuleInstance.getUniforms()` | Removed | `getShaderModuleUniforms(module, ...)`. | Interact directly with the shader module           |
| `getDependencyGraph()`               | Removed | `getShaderModuleDependencies(module)` . | Interact directly with the shader module           |
| `glsl` template string               | Removed | `/* glsl */` comment                    | Enable syntax highlighting in vscode using comment |

## Upgrading to v9.0

luma.gl v9 is a major modernization of the luma.gl API, with many breaking changes, so the upgrade notes for this release are unusually long. To facilitate porting to the v9 release we have also provided a
[Porting Guide](/docs/legacy/porting-guide) that also provides more background information and discusses porting strategies.

## Upgrading to v8 and earlier releases

This page only covers luma.gl v9 and later releases. 
For information on upgrading to from v8 and earlier releases, see the [Legacy Upgrade Guide](/docs/legacy/legacy-upgrade-guide).

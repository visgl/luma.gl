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

| Updated API                    | Status     | Replacement                                                                                  |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `luma.registerDevices()`       | Deprecated | Use [`luma.registerAdapters()`](/docs/api-reference/core/luma#lumaregisteradapters) instead. |
| `Texture.props.data` (Promise) | Changed    | Textures no longer accept promises, use `AsyncTexture` class instead.                        |
| `triangle-fan-webgl`           | Removed    | Rebuild your geometries using `triangle-strip`.                                              |
| `line-loop-webgl`              | Removed    | Rebuild your geometries`line-list`.                                                          |
| `glsl` template string         | Removed    | Enable syntax highlighting in vscode using `/* glsl */` comment instead                      |

**@luma.gl/shadertools**

| Updated API                          | Status   | Replacement                                                             |
| ------------------------------------ | -------- | ----------------------------------------------------------------------- |
| `ShaderModuleInstance`               | Removed  | Type has been removed. Use `ShaderModule` instead.                      |
| `initializeShaderModule()`           | Changed  | Stores initialized information on the original shader module object.    |
| `ShaderModuleInstance.getUniforms()` | Removed | Use `getShaderModuleUniforms(module, ...)` instead.                     |
| `getDependencyGraph()`               | Removed  | Use `getShaderModuleDependencies(module)` instead.                      |
| `glsl` template string               | Removed  | Enable syntax highlighting in vscode using `/* glsl */` comment instead |

## Upgrading to v9.0

luma.gl v9 is a major modernization of the luma.gl API, with many breaking changes, so the upgrade notes for this release are unusually long. To facilitate porting to the v9 release we have also provided a
[Porting Guide](/docs/legacy/porting-guide) that also provides more background information and discusses porting strategies.

## Upgrading to v8 and earlier releases

This page only covers luma.gl v9 and later releases. 
For information on upgrading to from v8 and earlier releases, see the [Legacy Upgrade Guide](/docs/legacy/legacy-upgrade-guide).

---
title: Shaders
description: Assemble reusable WGSL and GLSL shader modules, hooks, injections, plugins, uniforms, and rendering passes.
---

import {ShaderModulesExample} from '@site/src/examples';
import {ClientOnlyLiveExample} from '@site/src/components/docs/client-only-live-example';
import {DocumentationExampleCard} from '@site/src/components/docs/documentation-example-card';
import {FoundationAdjacency, FoundationAPIIndex, FoundationFeatureCard, FoundationReadingPath, FoundationTerminology, ShaderAssemblyInspector} from '@site/src/components/docs/foundation-docs';
import {ShadersDocsTabs} from '@site/src/components/docs/shaders-docs-tabs';

# Shaders

<ShadersDocsTabs group="starting" active="shaders-reference" />

## Overview

`@luma.gl/shaders` assembles reusable shader behavior. It resolves module dependencies,
typed props and bindings, hooks, injections, plugins, and passes into shader source. It does
not create a device or compile shaders itself.
The generated Shaders API index at `/docs/api-reference/generated/shaders` contains every
public descriptor, helper, built-in module, and type with source links.

## Language entry points

Use `@luma.gl/shaders/glsl` for `GLSLShaderAssembler` and GLSL assembly helpers, or
`@luma.gl/shaders/wgsl` for `WGSLShaderAssembler`, WGSL assembly, interface scanning and binding
diagnostics. The language entries share the abstract `ShaderAssembler` contract and common module
logic, while keeping the other assembly backend out of application bundles. Root exports retain
constructor identity. See [ShaderAssembler](./shader-assembler) for explicit assembler ownership.

## When to use it

Use Shaders when shader behavior must be shared, configured, or composed. Use plain WGSL
or GLSL for a tiny one-off shader. Move up to [Engine](/docs/api-reference/engine) when the
assembled shader needs geometry, inputs, a pipeline, and draw lifecycle management.

## Live example

Toggle the module behavior in the running example and compare the reusable module inputs with
the assembled WGSL/GLSL application that Engine submits.

<DocumentationExampleCard
  rows={[
    {label: 'Inspect', value: 'Dependencies, module props, assembled source, uniforms, and rendered output'},
    {label: 'Composition', value: 'ShaderModule descriptors consumed through ShaderInputs and Model'},
    {label: 'Portability', value: 'Parallel WGSL and GLSL paths on the best available backend'},
    {label: 'Cost', value: 'Assembly happens before pipeline creation; steady-state draws reuse the result'}
  ]}
  fullPageHref="/examples/tutorials/shader-modules"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/examples/tutorials/shader-modules"
/>

<ShaderAssemblyInspector />

<ClientOnlyLiveExample
  activationLabel="Run the shader-module example"
  description="Shader assembly and GPU initialization begin only after activation."
  height={460}
>
  <ShaderModulesExample />
</ClientOnlyLiveExample>

## Core concepts

<FoundationTerminology module="shaders" />

The learning spine is: modules and dependencies; uniforms and bindings; hooks and injections;
assembly; plugins and passes; portability; then the built-in module and pass catalogs.

## Feature card

<FoundationFeatureCard module="shaders" />

## Workflows

<FoundationReadingPath module="shaders" />

The [Shaders cookbook](/docs/api-guide/shaders/cookbook) covers authoring modules, exposing
props, adding hooks, injecting source, composing dependencies, creating plugins, and defining passes.

## API index

<FoundationAPIIndex module="shaders" />

Keep the [shader module catalog](/docs/api-reference/shaders/shader-modules/random) and
[shader pass catalog](/docs/api-reference/shaders/shader-passes/image-processing) separate
from the teaching path; use them after choosing the relevant descriptor family.

## Limits and compatibility

- A module may provide WGSL, GLSL, or both. The selected backend requires a compatible source path.
- Shaders assembles text and metadata; Core adapters perform validation and compilation.
- Dependency order is deterministic, but conflicting hook or binding contracts remain author errors.
- Plugins should state their source, binding, and backend requirements explicitly.

## Related modules

<FoundationAdjacency current="shaders" />

- Use [Engine](/docs/api-reference/engine) to bind module props and draw a `Model`.
- Use [Core](/docs/api-reference/core) for the resources and pipelines that compile assembled source.
- Shader modules can also be consumed by GPU Core render and compute nodes.

## Standalone shader contracts

`@luma.gl/shaders` has no dependency on core or a GPU device. Import shader value types,
`ShaderLayout`, `TextureFormat`, sampler options, `getVariableShaderTypeInfo`, and
`makeShaderBlockLayout` from `@luma.gl/shaders/types`. WGSL interface and binding scanners
are available from `@luma.gl/shaders/wgsl`. Core re-exports its existing contracts and scanner
entry points from these implementations, preserving constructor and function identity.

Shader modules describe resource bindings without owning GPU resources. PBR material, scene
and IBL props accept a resource type parameter, for example `PBRMaterialProps<Texture>` when
using core textures. Core validates and binds concrete Buffer, Texture and Sampler resources.
Device-backed area-light lookup allocation is `createAreaLightLTCTextures` from
`@luma.gl/engine`; the shader definitions remain in shaders.

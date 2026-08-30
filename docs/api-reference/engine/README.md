---
title: Engine
description: Render models with geometry and shader inputs, manage redraw and interaction, and compose animation, scenes, compute, and passes.
---

import {HelloTriangleGeometryExample} from '@site/src/examples';
import {ClientOnlyLiveExample} from '@site/src/components/docs/client-only-live-example';
import {DocumentationExampleCard} from '@site/src/components/docs/documentation-example-card';
import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';
import {EngineCoreMapping, FoundationAdjacency, FoundationAPIIndex, FoundationFeatureCard, FoundationReadingPath, FoundationTerminology} from '@site/src/components/docs/foundation-docs';

# Engine

<EngineDocsTabs group="starting" active="engine-reference" />

## Overview

`@luma.gl/engine` turns common rendering patterns into reusable classes. `Geometry` describes
CPU-side attributes, `ShaderInputs` manages shader-module values, and `Model` connects them to
Core resources, pipelines, bindings, and draw calls while tracking redraw needs.
The generated Engine API index at `/docs/api-reference/generated/engine` contains every public
value and TypeScript type with source links.

## When to use it

Use Engine for most rendered applications. Drop to [Core](/docs/api-reference/core) when you
need exact resource or command control. Use [Shadertools](/docs/api-reference/shadertools) to
make shader behavior reusable. Add GPU Core only when work becomes a scheduled GPU dataflow;
a single `Model` does not need a graph.

## Live example

This portable example maps the Engine objects to the Core work they manage.

<DocumentationExampleCard
  rows={[
    {label: 'Engine', value: 'Geometry data + ShaderInputs-compatible shaders + Model + redraw lifecycle'},
    {label: 'Core equivalents', value: 'Buffer + layouts/bindings + RenderPipeline + RenderPass'},
    {label: 'Backend', value: 'best-available with WGSL and GLSL shader paths'},
    {label: 'Lifecycle', value: 'Create once, draw on demand, destroy on finalize'}
  ]}
  fullPageHref="/examples/tutorials/hello-triangle-geometry"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-triangle-geometry"
/>

<ClientOnlyLiveExample
  activationLabel="Run the Engine model example"
  description="The example creates no GPU device or animation loop before activation."
  height={420}
>
  <HelloTriangleGeometryExample />
</ClientOnlyLiveExample>

## Core concepts

<FoundationTerminology module="engine" />

The learning spine is: geometry, shader inputs, models, redraw/frame lifecycle, dynamic
resources, interaction and picking, scenegraphs, animation, compute helpers, and
postprocessing. Engine objects wrap Core resources but do not make ownership disappear.

<EngineCoreMapping />

## Feature card

<FoundationFeatureCard module="engine" />

## Workflows

<FoundationReadingPath module="engine" />

The [Engine cookbook](/docs/api-guide/engine/cookbook) covers rendering, updates, on-demand
animation, picking and highlighting, scenes, and shader passes.

## API index

<FoundationAPIIndex module="engine" />

## Limits and compatibility

- Engine is portable where its underlying Core resources and shaders are portable.
- Provide WGSL and GLSL when the same application must run on WebGPU and WebGL.
- A redraw flag avoids unnecessary rendering only when the application honors it.
- Experimental helpers are labeled in their individual references and may have narrower
  backend support.

## Related modules

<FoundationAdjacency current="engine" />

- Use [Core](/docs/api-reference/core) for direct resource and command control.
- Use [Shadertools](/docs/api-reference/shadertools) for modules, hooks, and plugins.
- Use [GPU Core](/docs/api-reference/experimental/gpu-core) for scheduled multi-stage GPU work.

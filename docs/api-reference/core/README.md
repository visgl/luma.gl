---
title: Core GPU API
description: Create portable GPU resources, pipelines, passes, commands, and presentation contexts across WebGPU and WebGL 2.
---

import {HelloTriangleGeometryExample} from '@site/src/examples';
import {ClientOnlyLiveExample} from '@site/src/components/docs/client-only-live-example';
import {CoreDocsTabs} from '@site/src/components/docs/core-docs-tabs';
import {DocumentationExampleCard} from '@site/src/components/docs/documentation-example-card';
import {CoreResourceLifecycle, FoundationAdjacency, FoundationAPIIndex, FoundationFeatureCard, FoundationReadingPath, FoundationTerminology} from '@site/src/components/docs/foundation-docs';

# Core GPU API

<CoreDocsTabs group="starting" active="core-reference" />

## Overview

`@luma.gl/core` is the portable GPU layer. It gives applications one API for devices,
resources, pipelines, passes, command submission, presentation, and readback across WebGPU
and WebGL 2 adapters.

The curated pages explain workflows and portability. The
[generated API index](/docs/api-reference/generated/core) is the exact, source-linked
TypeScript contract.

## When to use it

Use Core when you need direct control over GPU memory, formats, bindings, passes, or command
submission. Start one layer higher with [Engine](/docs/api-reference/engine) when a `Model`
can manage those details. Move one layer higher still to
[GPU Core](/docs/api-reference/experimental/gpu-core) when several operations need
dependency scheduling, transient storage, indirect work, or multi-frame execution.

## Live example

The example is intentionally dormant until activated. It selects the best available adapter,
creates a buffer, constructs a portable model pipeline, records a render pass, submits a draw,
and releases its resources when unmounted.

<DocumentationExampleCard
  rows={[
    {label: 'Flow', value: 'resource → shader/pipeline → render pass → submitted draw'},
    {label: 'Backend', value: 'best-available; the running example reports WebGPU or WebGL'},
    {label: 'Shaders', value: 'Equivalent WGSL and GLSL paths'},
    {label: 'Ownership', value: 'The example destroys both Model and Buffer'}
  ]}
  fullPageHref="/examples/tutorials/hello-triangle-geometry"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-triangle-geometry"
/>

<ClientOnlyLiveExample
  activationLabel="Run the Core rendering example"
  description="GPU initialization begins only after activation. Page scrolling remains with the documentation until then."
  height={420}
>
  <HelloTriangleGeometryExample />
</ClientOnlyLiveExample>

## Core concepts

<FoundationTerminology module="core" />

The learning spine is: choose an adapter and create a `Device`; create and own resources;
describe memory layouts and bindings; create pipelines; encode passes; submit work; then
present or read results back. A resource is durable GPU state, while an encoder and its passes
record a particular unit of work.

<CoreResourceLifecycle />

## Feature card

<FoundationFeatureCard module="core" />

## Workflows

<FoundationReadingPath module="core" />

The [Core cookbook](/docs/api-guide/gpu/cookbook) has compact recipes for initialization,
upload, render, compute, readback, resize, and recovery from validation or device errors.

## API index

<FoundationAPIIndex module="core" />

## Limits and compatibility

- Import at least one adapter; `@luma.gl/core` does not choose a backend by itself.
- Use `type: 'best-available'` when either WebGPU or WebGL 2 is acceptable.
- WebGPU-only features must be capability-checked. The abstract API does not emulate every
  WebGPU feature on WebGL.
- Resource ownership remains explicit: destroy objects that your code creates and owns.

## Related modules

<FoundationAdjacency current="core" />

- Move up to [Engine](/docs/api-reference/engine) for managed models and redraw state.
- Move down to [Shadertools](/docs/api-reference/shadertools) to author reusable shader behavior.
- Add [GPU Core](/docs/api-reference/experimental/gpu-core) for multi-operation scheduling.

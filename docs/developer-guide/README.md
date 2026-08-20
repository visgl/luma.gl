---
title: Developer guide
description: Set up, test, debug, profile, document, and ship luma.gl applications and contributions.
---

import {DeveloperDocsTabs} from '@site/src/components/docs/developer-docs-tabs';

# Developer Guide

<DeveloperDocsTabs active="overview" />

You have seen what luma.gl can do. This is where you turn those ideas into a working
application, then make it easier to debug, faster to run, and lighter to ship.

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/developer-guide/installing">
    <span className="docs-api-card__kind">Start building</span>
    <strong>Create your first project</strong>
    <span>Set up a portable GPU application and render your first frame.</span>
    <span className="docs-api-card__meta">WebGPU · WebGL2 · local setup</span>
  </a>
  <a className="docs-api-card" href="/docs/developer-guide/debugging">
    <span className="docs-api-card__kind">Understand each frame</span>
    <strong>Debug GPU applications</strong>
    <span>Inspect shader errors, resource state, draw calls, and device diagnostics.</span>
    <span className="docs-api-card__meta">Shaders · resources · logging</span>
  </a>
  <a className="docs-api-card" href="/docs/developer-guide/profiling">
    <span className="docs-api-card__kind">Find your bottlenecks</span>
    <strong>Measure and optimize</strong>
    <span>Understand GPU timings, frame costs, memory use, and application performance.</span>
    <span className="docs-api-card__meta">Timing · memory · performance</span>
  </a>
  <a className="docs-api-card" href="/docs/developer-guide/bundling">
    <span className="docs-api-card__kind">Ship with confidence</span>
    <strong>Keep your bundle lean</strong>
    <span>Choose adapters deliberately and understand tree shaking, code splitting, and delivery size.</span>
    <span className="docs-api-card__meta">Adapters · modules · bundling</span>
  </a>
</div>

## Explore more workflows

- [Testing](/docs/developer-guide/testing) covers reliable GPU-aware verification.
- [Working with AI coding agents](/docs/developer-guide/working-with-ai) helps agents
  navigate the documentation and choose the right API layer.
- [Editing](/docs/developer-guide/editing) improves your shader development environment.
- [Contributing](/docs/developer-guide/contributing) explains how to work on luma.gl
  itself.

Not ready to set up a project? [Explore live examples](/examples) or start with
[Hello Triangle](/docs/tutorials/hello-triangle) directly in your browser.

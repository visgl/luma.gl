# Working with AI Coding Agents

[Overview](https://luma.gl/next/docs/developer-guide.md)[AI Agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)

AI coding agents can help design, implement, and debug luma.gl applications when they work from the version actually installed in the application and can observe the result in a real browser. This page describes a practical workflow for application developers first, followed by additional guidance for contributors to the luma.gl repository.

## Start from local truth[​](#start-from-local-truth "Direct link to Start from local truth")

Do not ask an agent to rely on its memory of luma.gl APIs. First give it the application and ask it to identify the installed package versions:

```
npm ls @luma.gl/core @luma.gl/engine @luma.gl/shadertools @luma.gl/webgpu @luma.gl/webgl
```

Use the equivalent command for the project's package manager. The agent should then inspect each installed package's `package.json`, exported TypeScript declarations, and the documentation for that release. Installed declarations are the authority for exact constructor props, methods, and types; current website documentation can describe a newer release.

When a project is pinned to an older release, use the documentation in the matching GitHub release branch. Ask the agent to cite the declaration or documentation page it used when an API choice is uncertain.

## Choose the right luma.gl level[​](#choose-the-right-lumagl-level "Direct link to Choose the right luma.gl level")

Give the agent the smallest API surface appropriate to the task:

| Level        | Start here when                                                                                     | Typical packages                                     |
| ------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Engine API   | Building a rendered application, model, animation loop, geometry, picking, or common GPU transform  | `@luma.gl/engine` plus one or more adapters          |
| Core GPU API | Managing devices, buffers, textures, pipelines, bindings, render passes, or compute passes directly | `@luma.gl/core`, `@luma.gl/webgpu`, `@luma.gl/webgl` |
| Shader API   | Assembling reusable shader modules, hooks, plugins, or matching WGSL and GLSL implementations       | `@luma.gl/shadertools`, usually with Engine or Core  |

Most applications should start with `Model` and `AnimationLoop` from Engine, then use Core resources only where explicit control is useful. Shader tooling composes shader code; it does not replace Engine or Core execution. See [A Tale of Three APIs](https://luma.gl/next/docs/api-guide.md) for the complete object model.

## Install the luma.gl skill[​](#install-the-lumagl-skill "Direct link to Install the luma.gl skill")

The repository contains an official progressive Agent Skill that routes application design, portability, GPU debugging, and repository contribution tasks:

```
npx skills add visgl/luma.gl --skill lumagl
```

After installation, ask your agent to use the `lumagl` skill. A useful prompt names the goal, supported backends, installed luma.gl version, and observable success condition:

> Use the lumagl skill to add this render path for WebGPU and WebGL 2. Confirm the installed package APIs, run the typecheck, exercise both backends in a real browser, and report console errors and screenshots.

The skill provides procedural judgment and debugging order. It does not copy the entire API reference into every conversation.

## Give agents exact documentation[​](#give-agents-exact-documentation "Direct link to Give agents exact documentation")

The website publishes [llms.txt](https://luma.gl/llms.txt), an index of current tutorials, API guides, API references, and developer guides. Each listed page has a raw Markdown sibling. For example:

* [Getting Started Markdown](https://luma.gl/docs/getting-started.md)
* [Portable Shaders Markdown](https://luma.gl/docs/api-guide/shaders/writing-portable-shaders.md)
* [Model API Markdown](https://luma.gl/docs/api-reference/engine/model.md)

Ask the agent to fetch only the pages needed for the task. The Markdown is generated from the rendered site, so tabs, cards, and other MDX components become readable content rather than JSX. Generated TypeDoc pages are included as raw Markdown references as well.

`llms.txt` is an inference-time documentation index. It helps an agent select context; it is not crawler access control, a training opt-out, or a substitute for accurate, versioned documentation. Crawler policy belongs in mechanisms such as `robots.txt` and provider controls.

## Require an observable verification loop[​](#require-an-observable-verification-loop "Direct link to Require an observable verification loop")

Typechecking is necessary but cannot prove that GPU code renders correctly. Ask the agent to produce evidence in this order:

1. Run the application typecheck and relevant unit tests.
2. Open the actual application in a current browser, not a DOM-only test environment.
3. Capture console messages, page errors, failed requests, and shader compiler output.
4. Confirm the selected device and canvas context, then inspect layouts, bindings, uploaded data, render-pass state, and draw counts.
5. Capture a screenshot after the expected frame has rendered.
6. Exercise WebGPU and WebGL 2 separately when the feature is intended to be portable.
7. Use browser GPU diagnostics or a frame debugger when logs and screenshots do not isolate the fault.

For a blank canvas, debug the pipeline from the outside inward: device and adapter availability → canvas context → shader compilation → layouts and bindings → uploaded data → render pass and draw call. Changing shaders at random before confirming device and binding state usually hides the original failure.

When a feature is genuinely WebGPU-only, state that constraint and test the unsupported path explicitly. Do not ask the agent to invent a WebGL fallback for compute shaders, storage textures, or another capability the backend does not provide.

## Working inside the luma.gl repository[​](#working-inside-the-lumagl-repository "Direct link to Working inside the luma.gl repository")

Repository contributors should direct the agent to read the root `AGENTS.md` before editing. It records coding conventions, ownership boundaries, and the stable command surface. Prefer these root commands over runner-specific invocations:

```
yarn test-node

yarn test-browser

yarn test-headless

yarn test-coverage

yarn website-debug --example hello-triangle --backend webgpu-core

yarn website-debug --example hello-triangle --backend webgl2
```

`website-debug` records the final URL, a screenshot, a WebGPU capability probe, and page diagnostics under `.playwright-artifacts/`. Ask the agent to inspect those artifacts and report concrete evidence instead of concluding that a browser task passed because the process exited successfully.

Before merge, follow the checks required by `AGENTS.md`. In particular, targeted tests do not replace the final repository `yarn build` and `yarn test` gates. This workflow does not add an AI disclosure requirement or otherwise change the contribution policy.

## How other frameworks inform this model[​](#how-other-frameworks-inform-this-model "Direct link to How other frameworks inform this model")

| Project                                                       | Forward-looking support                            | Lesson used by luma.gl                                  |
| ------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| [Next.js](https://nextjs.org/blog/agentic-future)             | Agent-oriented documentation and upgrade workflows | Make version-aware framework knowledge easy to retrieve |
| [Nuxt](https://nuxt.com/docs/4.x/guide/ai/llms-txt)           | Documented `llms.txt` variants for agent context   | Publish a curated index and page-level Markdown         |
| [Svelte](https://svelte.dev/llms.txt)                         | A public machine-readable documentation index      | Give agents stable, direct documentation URLs           |
| [TanStack](https://tanstack.com/intent/latest/docs/overview)  | Intent and procedural guidance beyond API lookup   | Encode task routing and judgment in a skill             |
| [MapLibre](https://github.com/maplibre/maplibre-agent-skills) | Installable framework-specific Agent Skills        | Ship the skill with the framework source                |

luma.gl combines these ideas into four layers: accurate human documentation, raw Markdown plus `llms.txt` for knowledge retrieval, one installable skill for procedural work, and an offline corpus for manually comparing agent behavior. The repository documents the [evaluation protocol](https://github.com/visgl/luma.gl/blob/master/test/llm/README.md); CI validates the corpus but does not invoke a model. An embedded assistant, MCP server, additional specialized skills, and a monolithic `llms-full.txt` are intentionally deferred until evaluation or runtime-observability evidence shows they are needed.

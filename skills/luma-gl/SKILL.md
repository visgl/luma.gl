---
name: luma-gl
description: Design, implement, update, and debug luma.gl applications and repository changes with version-aware API selection, WebGPU/WebGL portability, browser-based GPU diagnosis, and project-specific verification. Use when working with @luma.gl packages, luma.gl shaders or resources, blank or incorrect canvases, backend compatibility, or the visgl/luma.gl repository.
---

# luma.gl

Work from the installed packages and observable browser behavior. Do not substitute
model memory for the consuming project's declarations, and do not claim rendering
success from typechecking alone.

## Establish local truth

1. Identify whether the task is in a consumer application or the luma.gl repository.
2. Inspect the package manager lockfile and installed `@luma.gl/*` versions.
3. Read the installed packages' `package.json` exports and TypeScript declarations for
   every API used. Treat those declarations as authoritative.
4. Consult documentation for the same release. When using current
   [luma.gl documentation](https://luma.gl/llms.txt), fetch only the raw Markdown pages
   relevant to the task.
5. State any version or backend constraint that changes the implementation.

Never silently modernize code to an API that is absent from the installed declarations.
Do not infer API availability from a code sample without checking its version.

## Route the task

- For application architecture, package selection, or API-level decisions, read
  [references/architecture.md](references/architecture.md).
- For code that must run on WebGPU and WebGL 2, or for a backend-specific feature, read
  [references/portability.md](references/portability.md).
- For a blank canvas, shader failure, bad output, device loss, or binding problem, read
  [references/debugging.md](references/debugging.md).
- For work inside `visgl/luma.gl`, read
  [references/contributing.md](references/contributing.md) and the repository's root
  `AGENTS.md` before editing.

Read every reference that applies; portability and debugging often overlap.

## Implement

1. Select Engine, Core GPU, and Shader APIs deliberately.
2. Preserve the application's existing package manager, build setup, style, and
   resource-ownership conventions.
3. Keep the first change minimal and independently verifiable.
4. Label GPU resources with meaningful `id` values when the local API supports them.
5. Destroy owned GPU resources and animation infrastructure at the matching lifecycle
   boundary. Do not destroy borrowed resources.
6. Keep backend-specific code behind an explicit capability or adapter boundary.

## Verify

Run the project's typecheck and focused tests, then exercise the actual application in
a current browser. Collect console output, page errors, failed requests, shader
compiler messages, and a screenshot after the expected frame.

For portable rendering, run WebGPU and WebGL 2 explicitly. For a WebGPU-only feature,
verify the supported path and a clear unsupported path. Report which backends and
browser environment were actually observed.

Do not stop at a successful process exit if the expected frame was not observed. When
the output is wrong, follow the debugging sequence in the reference instead of making
unrelated shader or pipeline changes.

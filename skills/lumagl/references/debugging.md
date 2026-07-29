# GPU Debugging

## Preserve evidence

Before changing code, reproduce the failure and record:

- selected backend, adapter, device info, features, and limits;
- browser console messages, page errors, and failed requests;
- shader compiler errors and the assembled shader when available;
- a screenshot after the failing frame;
- resource identifiers, layouts, bindings, and a small sample of uploaded data.

Give important resources stable `id` values when supported. Increase luma.gl logging
only for diagnosis; high-volume and synchronous WebGL debug modes are not production
settings.

## Debug in dependency order

### 1. Device and adapters

Confirm an adapter is installed and imported, device creation completed, the expected
backend was actually selected, required features and limits exist, and the device is
not lost.

### 2. Canvas context

Confirm the canvas is present, sized, visible, and associated with the device's canvas
or presentation context. Check CSS dimensions and backing-store dimensions. Verify
that the frame is presented and not immediately cleared or covered.

### 3. Shader compilation

Read compiler errors before editing shader logic. Inspect the assembled source, entry
points, shader language, defined modules, injected hooks, and declared resource names.
Use forced shader display or debug output when the installed Engine API supports it.

### 4. Layouts and bindings

Compare vertex buffer layouts, shader layouts, attribute names and formats, bind-group
or logical binding names, uniform types, texture/sample types, and resource usage
flags. Verify every required resource is bound and has the expected lifetime.

### 5. Data

Check buffer byte lengths, offsets, strides, draw ranges, indices, texture dimensions,
formats, upload timing, and a small sample of values. Reject `NaN`, `undefined`, wrong
component counts, and stale CPU debug copies.

### 6. Render pass and draw

Confirm attachment formats and sample counts match the pipeline, viewport and scissor
are nonempty, clear/depth/blend/cull state is intentional, the draw count is nonzero,
and the pass ends before presentation. Check that redraw scheduling reaches this path.

### 7. Backend comparison

Run the same minimal case through WebGPU and WebGL 2 when supported. A working backend
can reveal a shader-contract, format, feature, or state assumption in the failing one.
Do not hide a backend failure by allowing automatic fallback during this comparison.

## Escalation tools

Use a browser GPU inspector or frame debugger after the ordered checks. On WebGL,
Spector.js and the optional synchronous debug context can expose calls and state. Use
browser-native WebGPU diagnostics where available. Keep the failing screenshot and
logs alongside the diagnosis.

## Primary documentation

- `https://luma.gl/docs/developer-guide/debugging.md`
- `https://luma.gl/docs/api-guide/gpu/gpu-rendering.md`
- `https://luma.gl/docs/api-guide/gpu/gpu-bindings.md`
- `https://luma.gl/docs/api-reference/core/shader-logs.md`
- `https://luma.gl/docs/developer-guide/profiling.md`

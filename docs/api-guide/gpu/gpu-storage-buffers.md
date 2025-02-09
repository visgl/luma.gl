# Storage Buffers

**storage buffers** represent a flexible mechanism for providing data to shaders, they are not available in WebGL, so applications may need to consider fallbacks.

The alternative mechanism is **attributes**, a structured and performant mechanism that works on both WebGPU and WebGL, though they are more rigid and have a number of limitations. 

## Storage Buffer Basics

```ts
const buffer = device.createBuffer({usage: Buffer.STORAGE, ...});

model.setBindings({
  ...
})
```

Storage buffers have many similarities to uniform buffers.

TBA

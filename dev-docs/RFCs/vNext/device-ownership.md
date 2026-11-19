# Device ownership

A Device records one ownership decision when it is constructed. Creating a device owns its native handle by default. Attaching an external handle borrows it by default. The caller can override either default with `ownsHandle`. Attaching to an existing wrapper returns that wrapper with its original ownership.

The owner calls `device.destroy()` when the last use ends. Destroying a wrapper releases its own resources. If it owns the native handle, WebGPU destroys the GPUDevice and WebGL requests context loss when supported. Borrowers release their own rendering resources and leave the device lifetime to its owner.

For deck.gl, a renderer supplied with an existing Device borrows it. A canvas owner can create an explicitly owned device, retain it across remounts, and destroy it when the canvas is permanently discarded. Existing WebGL callers using implicit device reuse keep their legacy teardown behavior until they explicitly select ownership.

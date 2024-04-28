# Adapter

An `Adapter` is a factory for `Device` instances for a specific backend (e.g. WebGPU or WebGL).

Adapters are normally not used directly, they are imported and passed to 
methods like [`luma.createDevice`].
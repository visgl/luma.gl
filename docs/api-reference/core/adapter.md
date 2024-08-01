# Adapter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.1-blue.svg?style=flat-square" alt="From-v9.1" />
</p>

An `Adapter` is a factory for `Device` instances for a specific backend (e.g. WebGPU or WebGL).

Each GPU backend exports a singleton adapter instance.

Methods on adapters are normally not called directly, they are imported and passed to 
methods like [`luma.createDevice`] that select the appropriate adapter before calling it.

## Members

### `type`
```ts
type: string;
```

## Methods

### `isSupported()`

Checks if this adapter is supported in the current environment/browser.

```ts
adapter.isSupported(): boolean;
```

### `create()`

Creates a device for this adapter's backend.

```ts
create(props: DeviceProps): Promise<Device>;
```

### `attach()`

Attaches a device to a GPU device handle from this backend.

```ts
attach?(handle: unknown): Promise<Device>;
```
}

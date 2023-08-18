# CommandEncoder

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

A command encoder offering GPU memory copying operations.

## Types

### `CommandEncoderProps`

| Property      | Type                             | Description                                                                  |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| N/A  |                     |                          |


## Members

- `device`: `Device` - holds a reference to the `Device` that created this `CommandEncoder`.
- `handle`: `unknown` - holds the underlying WebGL or WebGPU shader object
- `props`: `CommandEncoderProps` - holds a copy of the `CommandEncoderProps` used to create this `CommandEncoder`.

## Methods

### `constructor(props: CommandEncoderProps)`

`CommandEncoder` is an abstract class and cannot be instantiated directly. Create with `device.beginCommandEncoder(...)`.

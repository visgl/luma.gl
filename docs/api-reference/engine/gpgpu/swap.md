# Swap

`Swap` is a helper class to manage repeated transformations / computations and double buffering techniques. primarily intended for GPU buffers (`Swap<Buffer>`) or textures (`Swap<Texture>`).

It enables an "infinite" sequence of repeated / successive transformations to be run using just two resources (two buffers or two textures).

Remarks
 - The two resources are expected to be structurally identical (same size, length, format, etc)

## Members

### `current`

```ts
swap.current: T 
```

Get the current resource - usually the source for renders or computations.

### `next`

```ts
swap.next: T
```

Get the next resource - usually the target/destination for transforms / computations.

## Methods

### `constructor`

```ts
new Swap<T>(props: {current: T, next: T})
```

### `destroy()`

Destroys the two managed resources.

### `swap()`

Make the next resource into the "current" resource, and the current resource becomes the "next" resource

Typically this reuses the previously current resource as the next resource.


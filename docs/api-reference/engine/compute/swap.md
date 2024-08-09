# Swap

`Swap` is a helper class to support buffer and texture management when doing repeated transformations or computations on a block of data (memory). `Swap` enables a sequence of repeated / successive data transformations to be run by reusing just two resources (two buffers or two textures), effectively supporting a simple double buffering techniques.

`Swap` is primarily intended to manage pairs of GPU memory resources, such as
- a pair of GPU buffers (`Swap<Buffer>`)
- a pair of GPU textures (`Swap<Texture>`).

The two resources are expected to be structurally identical (same size, length, format, etc).

## Usage

```ts
const swapBuffers = new Swap({
  current: 
})

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

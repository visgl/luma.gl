# deck.gl v10 API Directions

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

:::info
This document outlines the shape of a hypothetical deck.gl v10 API.
It is intended to be directional during luma.gl v10 development.
luma.gl should be designed to support this API efficiently.
:::

## Usage

Assume we have a file at 'some-url'. It can be a native `.arrow` file or it can be any file format that can be parsed by a loaders.gl 5.0 loader into Apache Arrow format.

When loaded the file would be represented by an `arrow.Table` with the following schema.
```ts
arrow.Schema([
    arrow.Field('posisions', new arrow.FixedSizeList(new arrow.Field('position', new arrow.Float32(), false), 3), false),
    arrow.Field('color', new arrow.FixedSizeList(new arrow.Field('color', new arrow.Uint8(), false), 4), false),
]);
```

#### Usage 1: Loading by URL, selecting columns by name

```ts
new AnyLayer({
    data: 'some-url',
    loadOptions: {core: {shape: 'arrow-table'}},
    loaders: [AnyLoader],
    positions: 'positions',
    colors: 'color',
});
```

#### Usage 2: Supply arrow columns (Vectors) directly

```ts
const arrowTable = load('some-url', AnyLoader, {core: {shape: 'arrow-table'}});

new AnyLayer({
    data: arrowTable,
    positions: arrowTable.getColumn('positions'),
    colors: arrowTable.getColumn('color'),
});
```

#### Usage 3: GeoArrow has metadata that identifies the geometry column

```ts
new GeoLayer({
    data: 'some-url',
    loadOptions: {core: {shape: 'arrow-table'}},
    loaders: [AnyGeometryLoader],
    // additional columns maybe used for styling, but geometry column is auto-detected
    getColor: 'color',
});
```

#### Usage 4 loaders.gl Point-cloud and Mesh loaders return standard format arrow arrowTable with metadata.

```ts
new MultiMeshLayer({
    mesh: 'mesh-url',
    data: 'some-url', instance table that positions and styles multiple instances of the mesh,
    loadOptions: {core: {shape: 'arrow-table'}},
    loaders: [AnyMeshLoader, AnyTableLoader],
    getColor: 'color',
});
```

# Arrow Utilities

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From: v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

This page documents the general-purpose Arrow inspection helpers exported by
`@luma.gl/arrow`.

These helpers operate on Apache Arrow tables, record batches, vectors, and data
chunks before or alongside GPU upload. For shader-facing upload and binding
workflows, see [Arrow Type Mapping](/docs/api-reference/arrow/arrow-type-mapping).

## `getArrowPaths`

### `getArrowPaths(arrowObject): string[]`

Returns all leaf column paths in an Arrow object. Nested `Struct` fields are
reported with dot-separated paths.

Accepted inputs:

| Input | Behavior |
| --- | --- |
| `arrow.Table` | Reads paths from the table's top-level struct data |
| `arrow.RecordBatch` | Reads paths from the record batch data |
| `arrow.Vector` | Reads paths from the vector data |
| `arrow.Data` | Reads paths from the data node directly |

Example:

```ts
import {getArrowPaths} from '@luma.gl/arrow';

const paths = getArrowPaths(table);
// ['positions', 'properties.color']
```

## `getArrowDataByPath`

### `getArrowDataByPath(arrowObject, columnPath): arrow.Data`

Returns the Arrow `Data` node at a dot-separated leaf column path.

Behavior:

- accepts `arrow.Table`, `arrow.RecordBatch`, `arrow.Vector`, or `arrow.Data`;
- traverses nested `Struct` fields by name;
- throws if an intermediate path segment is not a struct;
- throws if the path does not exist;
- throws if the resolved path is still a struct instead of a leaf data node.

Example:

```ts
import {getArrowDataByPath} from '@luma.gl/arrow';

const colorData = getArrowDataByPath(table, 'properties.color');
```

## `getArrowVectorByPath`

### `getArrowVectorByPath(arrowTable, columnPath): arrow.Vector`

Returns the Arrow `Vector` at a dot-separated leaf column path in a table.

Behavior:

- accepts an `arrow.Table`;
- traverses nested `Struct` fields by name;
- throws if an intermediate path segment is not a struct;
- throws if the path does not exist;
- throws if the resolved path is still a struct instead of a leaf vector.

Example:

```ts
import {getArrowVectorByPath} from '@luma.gl/arrow';

const colorVector = getArrowVectorByPath(table, 'properties.color');
```

## `getArrowListNestingLevel`

### `getArrowListNestingLevel(data): number`

Returns the number of top-level Arrow `List` wrappers around a data node.

In the current implementation, this helper distinguishes a top-level list from
non-list data:

| Data type | Result |
| --- | --- |
| `List<T>` | `1` |
| Non-list data | `0` |

Example:

```ts
import {getArrowListNestingLevel} from '@luma.gl/arrow';

const nestingLevel = getArrowListNestingLevel(pathData);
```

## Related References

- [Arrow Type Mapping](/docs/api-reference/arrow/arrow-type-mapping)
- [Apache Arrow JavaScript API](https://arrow.apache.org/docs/js/)

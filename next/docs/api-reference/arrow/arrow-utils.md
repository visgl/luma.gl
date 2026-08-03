# Arrow Utilities

[Overview](https://luma.gl/next/docs/api-reference/arrow.md)[Arrow Representations](https://luma.gl/next/docs/api-reference/arrow/arrow-representations.md)[Conversion](https://luma.gl/next/docs/api-reference/arrow/arrow-conversion.md)[Supported Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md)[Utilities](https://luma.gl/next/docs/api-reference/arrow/arrow-utils.md)[deck.gl API](https://luma.gl/next/docs/api-reference/arrow/deck-target-api.md)

![From: v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

This page documents the general-purpose Arrow inspection helpers exported by `@luma.gl/arrow`.

These helpers operate on Apache Arrow tables, record batches, vectors, and data chunks before or alongside GPU upload. For shader-facing upload and binding workflows, see [Supported Arrow Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md).

## `getArrowPaths`[​](#getarrowpaths "Direct link to getarrowpaths")

### `getArrowPaths(arrowObject): string[]`[​](#getarrowpathsarrowobject-string "Direct link to getarrowpathsarrowobject-string")

Returns all leaf column paths in an Arrow object. Nested `Struct` fields are reported with dot-separated paths.

Accepted inputs:

| Input               | Behavior                                           |
| ------------------- | -------------------------------------------------- |
| `arrow.Table`       | Reads paths from the table's top-level struct data |
| `arrow.RecordBatch` | Reads paths from the record batch data             |
| `arrow.Vector`      | Reads paths from the vector data                   |
| `arrow.Data`        | Reads paths from the data node directly            |

Example:

```
import {getArrowPaths} from '@luma.gl/arrow';

const paths = getArrowPaths(table);
// ['positions', 'properties.color']
```

## `getArrowDataByPath`[​](#getarrowdatabypath "Direct link to getarrowdatabypath")

### `getArrowDataByPath(arrowObject, columnPath): arrow.Data`[​](#getarrowdatabypatharrowobject-columnpath-arrowdata "Direct link to getarrowdatabypatharrowobject-columnpath-arrowdata")

Returns the Arrow `Data` node at a dot-separated leaf column path.

Behavior:

* accepts `arrow.Table`, `arrow.RecordBatch`, `arrow.Vector`, or `arrow.Data`;
* traverses nested `Struct` fields by name;
* throws if an intermediate path segment is not a struct;
* throws if the path does not exist;
* throws if the resolved path is still a struct instead of a leaf data node.

Example:

```
import {getArrowDataByPath} from '@luma.gl/arrow';

const colorData = getArrowDataByPath(table, 'properties.color');
```

## `getArrowVectorByPath`[​](#getarrowvectorbypath "Direct link to getarrowvectorbypath")

### `getArrowVectorByPath(arrowTable, columnPath): arrow.Vector`[​](#getarrowvectorbypatharrowtable-columnpath-arrowvector "Direct link to getarrowvectorbypatharrowtable-columnpath-arrowvector")

Returns the Arrow `Vector` at a dot-separated leaf column path in a table.

Behavior:

* accepts an `arrow.Table`;
* traverses nested `Struct` fields by name;
* throws if an intermediate path segment is not a struct;
* throws if the path does not exist;
* throws if the resolved path is still a struct instead of a leaf vector.

Example:

```
import {getArrowVectorByPath} from '@luma.gl/arrow';

const colorVector = getArrowVectorByPath(table, 'properties.color');
```

## `getArrowListNestingLevel`[​](#getarrowlistnestinglevel "Direct link to getarrowlistnestinglevel")

### `getArrowListNestingLevel(data): number`[​](#getarrowlistnestingleveldata-number "Direct link to getarrowlistnestingleveldata-number")

Returns the number of top-level Arrow `List` wrappers around a data node.

In the current implementation, this helper distinguishes a top-level list from non-list data:

| Data type     | Result |
| ------------- | ------ |
| `List<T>`     | `1`    |
| Non-list data | `0`    |

Example:

```
import {getArrowListNestingLevel} from '@luma.gl/arrow';

const nestingLevel = getArrowListNestingLevel(pathData);
```

## Related References[​](#related-references "Direct link to Related References")

* [Supported Arrow Types](https://luma.gl/next/docs/api-reference/arrow/supported-arrow-types.md)
* [Apache Arrow JavaScript API](https://arrow.apache.org/docs/js/)

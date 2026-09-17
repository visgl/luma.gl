# GPU sparse matrices

Sparse matrices store only nonzero entries. Jarnevon's initial sparse substrate uses two complementary representations.

## COO: construction[​](#coo-construction "Direct link to COO: construction")

COO stores explicit `(row, column, value)` triples. It is convenient for GPU generation, compaction, concatenation, sorting and canonicalization.

```
rowIndices    = [0,0,1,2,2]

columnIndices = [0,2,1,0,2]

values        = [10,20,30,40,50]
```

## CSR: row execution[​](#csr-row-execution "Direct link to CSR: row execution")

CSR replaces repeated row IDs with offset-delimited row boundaries:

```
rowOffsets    = [0,2,3,5]

columnIndices = [0,2,1,0,2]

values        = [10,20,30,40,50]
```

Row `r` owns `[rowOffsets[r], rowOffsets[r + 1])`. Repeated offsets naturally represent empty rows.

This is the same structural idea used by graph adjacency and other offset-delimited GPU data.

## Pipeline[​](#pipeline "Direct link to Pipeline")

```
entry generation

      ↓

     COO

      ↓

sort / canonicalize

      ↓

 GPUCOOToCSR

      ↓

     CSR

      ↓

adaptive SpMV

      ↓

CG / PCG / sparse analytics
```

The representations describe data and shape; conversion and execution remain separate graph operations. The initial value format is `float32`; indices and offsets are `uint32`.

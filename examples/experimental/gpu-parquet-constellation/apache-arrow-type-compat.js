// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// loaders.gl 5.0.0-alpha.5 imports the proposed Arrow LargeList type while still supporting
// Apache Arrow releases that do not export it. Parquet does not instantiate GeoArrow types, but
// bundlers must still resolve the re-exported GeoArrow modules. Keep the alpha compatibility shim
// local to this example until the loaders.gl dependency edge is removed.
export * from 'apache-arrow';

export class LargeList {}

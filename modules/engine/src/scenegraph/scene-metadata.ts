// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A collection of source metadata associated with indexed scene resources. */
export class SceneMetadata {
  private readonly entries = new Map<string, Map<number, Readonly<Record<string, unknown>>>>();

  /** Associates metadata with a resource category and its source index. */
  set(category: string, index: number, metadata: Readonly<Record<string, unknown>>): void {
    let categoryEntries = this.entries.get(category);
    if (!categoryEntries) {
      categoryEntries = new Map();
      this.entries.set(category, categoryEntries);
    }
    categoryEntries.set(index, metadata);
  }

  /** Returns metadata for a resource, or undefined when none was supplied. */
  get(category: string, index = 0): Readonly<Record<string, unknown>> | undefined {
    return this.entries.get(category)?.get(index);
  }
}

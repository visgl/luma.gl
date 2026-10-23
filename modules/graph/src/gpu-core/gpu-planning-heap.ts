// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Small priority queue for transient allocation planning. @internal */
export class GPUPlanningHeap<Value> {
  private readonly values: Value[] = [];

  constructor(private readonly compare: (left: Value, right: Value) => number) {}

  peek(): Value | undefined {
    return this.values[0];
  }

  push(value: Value): void {
    let index = this.values.length;
    this.values.push(value);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.values[parent], value) <= 0) break;
      this.values[index] = this.values[parent];
      index = parent;
    }
    this.values[index] = value;
  }

  pop(): Value | undefined {
    const first = this.values[0];
    const last = this.values.pop();
    if (this.values.length && last !== undefined) {
      let index = 0;
      while (index * 2 + 1 < this.values.length) {
        let child = index * 2 + 1;
        if (
          child + 1 < this.values.length &&
          this.compare(this.values[child + 1], this.values[child]) < 0
        )
          child++;
        if (this.compare(last, this.values[child]) <= 0) break;
        this.values[index] = this.values[child];
        index = child;
      }
      this.values[index] = last;
    }
    return first;
  }
}

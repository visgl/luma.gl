// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Count number of nested top level Arrow Lists */
export function getArrowListNestingLevel(data: arrow.Data): number {
  let nestingLevel = 0;
  if (arrow.DataType.isList(data.type)) {
    nestingLevel += 1;
    data = data.children[0];
  }
  return nestingLevel;
}

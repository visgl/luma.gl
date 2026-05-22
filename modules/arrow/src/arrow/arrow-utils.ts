// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Data, DataType} from 'apache-arrow';

/** Returns the number of top-level nested Arrow List wrappers around a data node. */
export function getArrowListNestingLevel(data: Data): number {
  let nestingLevel = 0;
  if (DataType.isList(data.type)) {
    nestingLevel += 1;
    data = data.children[0];
  }
  return nestingLevel;
}

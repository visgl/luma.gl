// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import test from 'tape-promise/tape';
// import * as arrow from 'apache-arrow';
// import {getArrowDataByPath} from '@luma.gl/arrow';
// import { expandArrayToCoords } from "../src/utils.js";
// import { arraysEqual } from "./utils.js";

// test('getArrowDataByPath', async t => {
//   const nestedTable = makeNestedArrowTable();
//   t.ok(nestedTable, 'nestedTable created');

//   const ageData = getArrowDataByPath(nestedTable, 'age');
//   t.equal(ageData, 'extracted age from struct');

//   const deeplyNestedTable = makeDeeplyNestedArrowTable('data');
//   t.ok(deeplyNestedTable, 'deeplyNestedTable created');

//   const heightData = getArrowDataByPath(deeplyNestedTable, 'data.age');
//   t.equal(
//     heightData.type.typeId,
//     new arrow.Float32().typeId,
//     'extracted age from deeply nested struct'
//   );

//   t.end();
// });

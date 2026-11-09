// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// import test from 'test/utils/vitest-tape';
// import * as arrow from 'apache-arrow';
// import {getArrowDataByPath} from '@luma.gl/graph/arrow';
// import { expandArrayToCoords } from "../../../gpgpu/test/src/utils.js";
// import { arraysEqual } from "../../../gpgpu/test/arrow/utils.js";

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
//     new Float32().typeId,
//     'extracted age from deeply nested struct'
//   );

//   t.end();
// });

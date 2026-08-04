// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {mergeLcovReports} from '../../dev-modules/devtools-extensions/vitest/merge-lcov.mjs';

describe('mergeLcovReports', () => {
  test('sums compatible records and preserves complementary hits', () => {
    const merged = mergeLcovReports([
      makeReport({lineHits: [1, 0], branchHits: [1, 0], functionHits: 1}),
      makeReport({lineHits: [2, 3], branchHits: [0, 3], functionHits: 2})
    ]);

    expect(merged).toContain('FNDA:3,project');
    expect(merged).toContain('DA:10,3');
    expect(merged).toContain('DA:20,3');
    expect(merged).toContain('BRDA:10,0,0,1');
    expect(merged).toContain('BRDA:10,0,1,3');
    expect(merged).toContain('FNF:1\nFNH:1');
    expect(merged).toContain('LF:2\nLH:2');
    expect(merged).toContain('BRF:2\nBRH:2');
  });

  test('drops an incompatible zero-hit schema once another shard executes the source', () => {
    const executed = makeReport({lineHits: [2, 0], branchHits: [2, 0], functionHits: 1});
    const zeroHitRawTypeScriptSchema = `TN:
SF:src/project.ts
FN:10,project
FNF:1
FNH:0
FNDA:0,project
DA:1,0
DA:2,0
DA:10,0
DA:20,0
LF:4
LH:0
BRDA:1,7,0,0
BRDA:1,7,1,0
BRDA:10,8,0,0
BRDA:10,8,1,0
BRF:4
BRH:0
end_of_record
`;
    const merged = mergeLcovReports([executed, zeroHitRawTypeScriptSchema]);

    expect(merged).toContain('DA:10,2');
    expect(merged).toContain('DA:20,0');
    expect(merged).not.toContain('DA:1,0');
    expect(merged).not.toContain('DA:2,0');
    expect(merged).not.toContain('BRDA:1,7');
    expect(merged).not.toContain('BRDA:10,8');
    expect(merged).toContain('LF:2\nLH:1');
  });

  test('keeps every nonzero schema so incompatible shards cannot lose real hits', () => {
    const first = makeReport({lineHits: [1, 0], branchHits: [1, 0], functionHits: 1});
    const second = `TN:
SF:src/project.ts
FN:10,project
FNF:1
FNH:1
FNDA:1,project
DA:30,4
LF:1
LH:1
BRDA:30,4,0,4
BRF:1
BRH:1
end_of_record
`;
    const merged = mergeLcovReports([first, second]);

    expect(merged).toContain('DA:10,1');
    expect(merged).toContain('DA:20,0');
    expect(merged).toContain('DA:30,4');
    expect(merged).toContain('BRDA:10,0,0,1');
    expect(merged).toContain('BRDA:30,4,0,4');
  });

  test('drops a majority zero-only schema beside an incompatible executed schema', () => {
    const canonical = makeReport({lineHits: [0, 0], branchHits: [0, 0], functionHits: 0});
    const executed = `TN:
SF:src/project.ts
FN:30,otherProject
FNF:1
FNH:1
FNDA:1,otherProject
DA:30,4
LF:1
LH:1
BRDA:30,4,0,4
BRF:1
BRH:1
end_of_record
`;
    const merged = mergeLcovReports([canonical, executed, canonical]);

    expect(merged).not.toContain('DA:10,0');
    expect(merged).not.toContain('DA:20,0');
    expect(merged).toContain('DA:30,4');
    expect(merged).toContain('LF:1\nLH:1');
  });

  test('retains the majority zero-hit schema for a source no shard executes', () => {
    const canonical = makeReport({lineHits: [0, 0], branchHits: [0, 0], functionHits: 0});
    const incompatible = canonical
      .replace('DA:10,0\n', 'DA:1,0\nDA:10,0\n')
      .replace('LF:2', 'LF:3');
    const merged = mergeLcovReports([canonical, incompatible, canonical]);

    expect(merged).toContain('DA:10,0');
    expect(merged).toContain('DA:20,0');
    expect(merged).not.toContain('DA:1,0');
    expect(merged).toContain('LF:2\nLH:0');
  });

  test('uses the smaller zero-hit schema as a deterministic tie-breaker', () => {
    const canonical = makeReport({lineHits: [0, 0], branchHits: [0, 0], functionHits: 0});
    const incompatible = canonical
      .replace('DA:10,0\n', 'DA:1,0\nDA:10,0\n')
      .replace('LF:2', 'LF:3');
    const merged = mergeLcovReports([incompatible, canonical]);

    expect(merged).not.toContain('DA:1,0');
    expect(merged).toContain('LF:2\nLH:0');
  });

  test('retains completely uncovered files', () => {
    const merged = mergeLcovReports([
      makeReport({sourceFile: 'src/unused.ts', lineHits: [0, 0], branchHits: [0, 0]})
    ]);

    expect(merged).toContain('SF:src/unused.ts');
    expect(merged).toContain('LF:2\nLH:0');
    expect(merged).toContain('BRF:2\nBRH:0');
  });
});

function makeReport(options: {
  sourceFile?: string;
  lineHits: [number, number];
  branchHits: [number, number];
  functionHits?: number;
}): string {
  const {
    sourceFile = 'src/project.ts',
    lineHits,
    branchHits,
    functionHits = Math.max(...lineHits)
  } = options;
  return `TN:
SF:${sourceFile}
FN:10,project
FNF:1
FNH:${functionHits > 0 ? 1 : 0}
FNDA:${functionHits},project
DA:10,${lineHits[0]}
DA:20,${lineHits[1]}
LF:2
LH:${lineHits.filter(hits => hits > 0).length}
BRDA:10,0,0,${branchHits[0]}
BRDA:10,0,1,${branchHits[1]}
BRF:2
BRH:${branchHits.filter(hits => hits > 0).length}
end_of_record
`;
}

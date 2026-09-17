// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, describe} from 'vitest';
import {_resolveModules, getShaderModuleDependencies} from '@luma.gl/shadertools';

// Dummy shader modules with dependencies
const fp32 = {
  name: 'fp32-test'
};

const fp64 = {
  name: 'fp64-test'
};

const project = {
  name: 'project-test',
  dependencies: [fp32]
};

const project64 = {
  name: 'project64-test',
  dependencies: [project, fp64],
  uniformTypes: {}
};

describe('ShaderModules', () => {
  it('import', () => {
    expect(Boolean(_resolveModules !== undefined), '_resolveModules import successful').toBe(true);
    expect(
      Boolean(getShaderModuleDependencies !== undefined),
      'getShaderModuleDependencies import successful'
    ).toBe(true);
    void 0;
  });

  it('getShaderDependencies - regression test', () => {
    const result = _resolveModules([project64, project]);
    expect(
      result.map(module => module.name),
      'Module order is correct'
    ).toEqual([fp32.name, project.name, fp64.name, project64.name]);

    void 0;
  });

  it('handles diamond dependencies correctly', () => {
    const D = {name: 'D'};
    const B = {name: 'B', dependencies: [D]};
    const C = {name: 'C', dependencies: [D]};
    const A = {name: 'A', dependencies: [B, C]};

    const result = getShaderModuleDependencies([A]);

    // D should appear exactly once
    const dCount = result.filter(m => m.name === 'D').length;
    expect(dCount, 'D appears exactly once').toBe(1);

    // D should come before both B and C
    const names = result.map(m => m.name);
    const dIndex = names.indexOf('D');
    const bIndex = names.indexOf('B');
    const cIndex = names.indexOf('C');
    const aIndex = names.indexOf('A');

    expect(dIndex, 'D comes before B').toBeLessThan(bIndex);
    expect(dIndex, 'D comes before C').toBeLessThan(cIndex);
    expect(bIndex, 'B comes before A').toBeLessThan(aIndex);
    expect(cIndex, 'C comes before A').toBeLessThan(aIndex);
  });

  it('detects cycles and reports full path', () => {
    const A: any = {name: 'A'};
    const B: any = {name: 'B'};
    const C: any = {name: 'C'};

    A.dependencies = [B];
    B.dependencies = [C];
    C.dependencies = [A]; // Cycle!

    expect(() => getShaderModuleDependencies([A])).toThrow(/cycle.*A -> B -> C -> A/i);
  });

  it('detects self-loops', () => {
    const A: any = {name: 'A'};
    A.dependencies = [A]; // Self-loop!

    expect(() => getShaderModuleDependencies([A])).toThrow(/cycle.*A -> A/i);
  });

  it('detects name collisions between different module objects', () => {
    const foo1 = {name: 'foo'};
    const foo2 = {name: 'foo'}; // Different object, same name!
    const app = {name: 'app', dependencies: [foo1, foo2]};

    expect(() => getShaderModuleDependencies([app])).toThrow(/name collision.*foo/i);
  });

  it('uses object identity for deduplication, not name', () => {
    const shared = {name: 'shared'};
    const B = {name: 'B', dependencies: [shared]};
    const C = {name: 'C', dependencies: [shared]};
    const A = {name: 'A', dependencies: [B, C]};

    const result = getShaderModuleDependencies([A]);

    // shared should appear once and be the exact same object reference
    const sharedModules = result.filter(m => m.name === 'shared');
    expect(sharedModules.length, 'shared appears exactly once').toBe(1);
    expect(sharedModules[0], 'shared is same object reference').toBe(shared);
  });

  it('handles deep dependency graphs without false cycle detection', () => {
    // Create a chain: A -> B -> C -> D -> E -> F -> G (depth 7)
    const G = {name: 'G'};
    const F = {name: 'F', dependencies: [G]};
    const E = {name: 'E', dependencies: [F]};
    const D = {name: 'D', dependencies: [E]};
    const C = {name: 'C', dependencies: [D]};
    const B = {name: 'B', dependencies: [C]};
    const A = {name: 'A', dependencies: [B]};

    // Should not throw (old implementation would fail at depth 5)
    const result = getShaderModuleDependencies([A]);

    expect(
      result.map(m => m.name),
      'Deep graph resolves correctly'
    ).toEqual(['G', 'F', 'E', 'D', 'C', 'B', 'A']);
  });

  // Tests that expose bugs in the old depth-counting implementation

  it('handles chain at exactly depth 5 (old implementation boundary)', () => {
    // Old implementation would throw at level >= 5, so a chain with 6 nodes would fail
    const F = {name: 'F'};
    const E = {name: 'E', dependencies: [F]};
    const D = {name: 'D', dependencies: [E]};
    const C = {name: 'C', dependencies: [D]};
    const B = {name: 'B', dependencies: [C]};
    const A = {name: 'A', dependencies: [B]};

    const result = getShaderModuleDependencies([A]);

    expect(
      result.map(m => m.name),
      'Depth 5 chain works'
    ).toEqual(['F', 'E', 'D', 'C', 'B', 'A']);
  });

  it('handles very deep chain (depth 10) without false positive', () => {
    // Old implementation definitely fails here
    const J = {name: 'J'};
    const I = {name: 'I', dependencies: [J]};
    const H = {name: 'H', dependencies: [I]};
    const G = {name: 'G', dependencies: [H]};
    const F = {name: 'F', dependencies: [G]};
    const E = {name: 'E', dependencies: [F]};
    const D = {name: 'D', dependencies: [E]};
    const C = {name: 'C', dependencies: [D]};
    const B = {name: 'B', dependencies: [C]};
    const A = {name: 'A', dependencies: [B]};

    const result = getShaderModuleDependencies([A]);

    expect(result.length, 'All 10 modules present').toBe(10);
    expect(result[0].name, 'Deepest dependency first').toBe('J');
    expect(result[9].name, 'Root module last').toBe('A');
  });

  it('name collision is detected even in deep graphs', () => {
    // Old implementation would silently overwrite, new one throws
    const shared = {name: 'shared'};
    const conflict = {name: 'shared'}; // Different object, same name!
    const D = {name: 'D', dependencies: [conflict]};
    const C = {name: 'C', dependencies: [D]};
    const B = {name: 'B', dependencies: [shared]};
    const A = {name: 'A', dependencies: [B, C]};

    expect(() => getShaderModuleDependencies([A])).toThrow(/name collision.*shared/i);
  });

  it('handles multiple roots with shared deep dependencies', () => {
    // Tests that depth calculation doesn't interfere with multiple entry points
    const D = {name: 'D'};
    const C = {name: 'C', dependencies: [D]};
    const B = {name: 'B', dependencies: [C]};
    const A1 = {name: 'A1', dependencies: [B]};
    const A2 = {name: 'A2', dependencies: [C]}; // Shorter path to C

    const result = getShaderModuleDependencies([A1, A2]);

    // D and C should appear exactly once each
    const names = result.map(m => m.name);
    expect(names.filter(n => n === 'D').length, 'D appears once').toBe(1);
    expect(names.filter(n => n === 'C').length, 'C appears once').toBe(1);

    // Dependencies must come before dependents
    const dIndex = names.indexOf('D');
    const cIndex = names.indexOf('C');
    const bIndex = names.indexOf('B');
    const a1Index = names.indexOf('A1');
    const a2Index = names.indexOf('A2');

    expect(dIndex, 'D before C').toBeLessThan(cIndex);
    expect(cIndex, 'C before B').toBeLessThan(bIndex);
    expect(bIndex, 'B before A1').toBeLessThan(a1Index);
    expect(cIndex, 'C before A2').toBeLessThan(a2Index);
  });

  it('complex diamond with unequal path lengths', () => {
    // Old depth-counting approach might incorrectly order these
    const E = {name: 'E'};
    const D = {name: 'D', dependencies: [E]};
    const C = {name: 'C', dependencies: [E]};
    const B = {name: 'B', dependencies: [D]};
    const A = {name: 'A', dependencies: [B, C]};

    // A -> B -> D -> E
    // A -> C -> E
    // E is reached at depth 3 via B->D and depth 2 via C
    // Old implementation would assign depth based on max, might affect ordering

    const result = getShaderModuleDependencies([A]);
    const names = result.map(m => m.name);

    // E should appear exactly once
    expect(names.filter(n => n === 'E').length, 'E appears once').toBe(1);

    // Verify topological ordering
    const eIndex = names.indexOf('E');
    const dIndex = names.indexOf('D');
    const cIndex = names.indexOf('C');
    const bIndex = names.indexOf('B');
    const aIndex = names.indexOf('A');

    expect(eIndex, 'E before D').toBeLessThan(dIndex);
    expect(eIndex, 'E before C').toBeLessThan(cIndex);
    expect(dIndex, 'D before B').toBeLessThan(bIndex);
    expect(cIndex, 'C before A').toBeLessThan(aIndex);
    expect(bIndex, 'B before A').toBeLessThan(aIndex);
  });

  it('cycle in deep graph gives clear error, not depth limit error', () => {
    // Old implementation would eventually throw "Possible loop" at depth 5
    // New implementation detects cycle immediately with clear path
    const D: any = {name: 'D'};
    const C: any = {name: 'C', dependencies: [D]};
    const B: any = {name: 'B', dependencies: [C]};
    const A: any = {name: 'A', dependencies: [B]};
    D.dependencies = [B]; // Cycle: B -> C -> D -> B

    expect(() => getShaderModuleDependencies([A])).toThrow(/cycle.*B -> C -> D -> B/i);
  });

  it('name collision between deeply nested modules', () => {
    // Old implementation would keep whichever is visited last based on depth ordering
    const leaf1 = {name: 'leaf'};
    const leaf2 = {name: 'leaf'}; // Different object!
    const path1 = {name: 'path1', dependencies: [leaf1]};
    const path2 = {name: 'path2', dependencies: [leaf2]};
    const root = {name: 'root', dependencies: [path1, path2]};

    expect(() => getShaderModuleDependencies([root])).toThrow(/name collision.*leaf/i);
  });

  it('multiple disconnected trees resolve correctly', () => {
    // Tests that multiple root nodes with no shared dependencies work
    const B1 = {name: 'B1'};
    const A1 = {name: 'A1', dependencies: [B1]};

    const B2 = {name: 'B2'};
    const A2 = {name: 'A2', dependencies: [B2]};

    const result = getShaderModuleDependencies([A1, A2]);

    // All modules present
    const names = result.map(m => m.name);
    expect(names.length, 'All 4 modules present').toBe(4);

    // Dependencies before dependents
    const b1Index = names.indexOf('B1');
    const a1Index = names.indexOf('A1');
    const b2Index = names.indexOf('B2');
    const a2Index = names.indexOf('A2');

    expect(b1Index, 'B1 before A1').toBeLessThan(a1Index);
    expect(b2Index, 'B2 before A2').toBeLessThan(a2Index);
  });

  it('triple diamond pattern deduplicates correctly', () => {
    // Tests more complex deduplication scenarios
    //       A
    //     / | \
    //    B  C  D
    //    |  |  |
    //    |  E  |
    //    | / \ |
    //    F     G
    //     \   /
    //       H

    const H = {name: 'H'};
    const F = {name: 'F', dependencies: [H]};
    const G = {name: 'G', dependencies: [H]};
    const E = {name: 'E', dependencies: [F, G]};
    const B = {name: 'B', dependencies: [F]};
    const C = {name: 'C', dependencies: [E]};
    const D = {name: 'D', dependencies: [G]};
    const A = {name: 'A', dependencies: [B, C, D]};

    const result = getShaderModuleDependencies([A]);
    const names = result.map(m => m.name);

    // Each module appears exactly once
    expect(new Set(names).size, 'No duplicates').toBe(names.length);
    expect(names.length, 'All 8 modules present').toBe(8);

    // H should appear exactly once despite 4 paths to it
    expect(names.filter(n => n === 'H').length, 'H appears once').toBe(1);

    // Verify some key orderings
    const hIndex = names.indexOf('H');
    const fIndex = names.indexOf('F');
    const gIndex = names.indexOf('G');
    const aIndex = names.indexOf('A');

    expect(hIndex, 'H before F').toBeLessThan(fIndex);
    expect(hIndex, 'H before G').toBeLessThan(gIndex);
    expect(fIndex, 'F before A').toBeLessThan(aIndex);
    expect(gIndex, 'G before A').toBeLessThan(aIndex);
  });

  it('empty dependencies array treated as no dependencies', () => {
    const B = {name: 'B', dependencies: []};
    const A = {name: 'A', dependencies: [B]};

    const result = getShaderModuleDependencies([A]);

    expect(result.map(m => m.name)).toEqual(['B', 'A']);
  });

  it('undefined dependencies treated as no dependencies', () => {
    const B = {name: 'B'}; // No dependencies field
    const A = {name: 'A', dependencies: [B]};

    const result = getShaderModuleDependencies([A]);

    expect(result.map(m => m.name)).toEqual(['B', 'A']);
  });

  it('single module with no dependencies', () => {
    const A = {name: 'A'};

    const result = getShaderModuleDependencies([A]);

    expect(result.map(m => m.name)).toEqual(['A']);
  });

  it('empty input returns empty array', () => {
    const result = getShaderModuleDependencies([]);

    expect(result).toEqual([]);
  });
});

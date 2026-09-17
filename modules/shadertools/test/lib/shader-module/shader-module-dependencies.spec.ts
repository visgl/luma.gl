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

    expect(result.map(m => m.name), 'Deep graph resolves correctly').toEqual([
      'G',
      'F',
      'E',
      'D',
      'C',
      'B',
      'A'
    ]);
  });
});

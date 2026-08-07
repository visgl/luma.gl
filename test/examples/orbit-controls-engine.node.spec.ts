// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();
const ORBIT_CONTROL_EXAMPLES = [
  'examples/experimental/deferred-rendering/app.ts',
  'examples/experimental/spectral-caustics/app.ts',
  'examples/experimental/volumetric-fire-forge/app.ts',
  'examples/experimental/webxr-kaleidoscope/app.ts',
  'examples/showcase/gaussian-splats/app.ts',
  'examples/showcase/packet-spraying/app.ts'
];

describe('engine-owned orbit camera controls', () => {
  test('exports the implementation and its public types from the engine', () => {
    const engineSource = readRepositoryFile('modules/engine/src/index.ts');
    const implementationSource = readRepositoryFile(
      'modules/engine/src/controls/orbit-controls.ts'
    );

    expect(engineSource).toContain("export {OrbitControls} from './controls/orbit-controls'");
    expect(engineSource).toContain('OrbitControlsProps, OrbitPosition');
    expect(implementationSource).toContain('export class OrbitControls');
    expect(implementationSource).toContain('export type OrbitControlsProps');
  });

  test('retains the previous experimental import as an engine compatibility alias', () => {
    const compatibilitySource = readRepositoryFile(
      'modules/experimental/src/controls/orbit-controls.ts'
    );

    expect(compatibilitySource).toContain("export {OrbitControls} from '@luma.gl/engine'");
    expect(compatibilitySource).toContain('OrbitControlsProps, OrbitPosition');
    expect(compatibilitySource).not.toContain('export class OrbitControls');
  });

  test.each(ORBIT_CONTROL_EXAMPLES)('%s imports orbit controls from the engine', examplePath => {
    const exampleSource = readRepositoryFile(examplePath);
    const engineImport = exampleSource.match(
      /import\s*\{([^}]*)\}\s*from\s*['"]@luma\.gl\/engine['"]/s
    );
    const experimentalImport = exampleSource.match(
      /import\s*\{([^}]*)\}\s*from\s*['"]@luma\.gl\/experimental['"]/s
    );

    expect(engineImport?.[1]).toMatch(/\bOrbitControls\b/);
    expect(experimentalImport?.[1] ?? '').not.toMatch(/\bOrbitControls\b/);
  });

  test('links the engine reference and interaction guide from the documentation sidebar', () => {
    const tableOfContents = readRepositoryFile('docs/table-of-contents.json');
    const interactionGuide = readRepositoryFile('docs/api-guide/engine/interactivity.md');
    const capabilities = readRepositoryFile('docs/capabilities.mdx');

    expect(tableOfContents).toContain('api-reference/engine/orbit-controls');
    expect(interactionGuide).toContain("import {OrbitControls} from '@luma.gl/engine'");
    expect(interactionGuide).toContain('/docs/api-reference/engine/orbit-controls');
    expect(capabilities).toContain('| Orbit camera controls | Available |');
  });
});

function readRepositoryFile(relativePath: string): string {
  return readFileSync(path.join(REPOSITORY_ROOT, relativePath), 'utf8');
}

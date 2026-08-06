// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

type RapidsModuleAttribution = {
  directory: string;
  documentation: string[];
  project: string;
  repository: string;
};

const RAPIDS_MODULE_ATTRIBUTIONS: RapidsModuleAttribution[] = [
  {
    directory: 'geospatial',
    documentation: ['docs/api-reference/experimental/geospatial.md'],
    project: 'cuSpatial',
    repository: 'https://github.com/rapidsai/cuspatial'
  },
  {
    directory: 'luproj',
    documentation: [
      'docs/api-reference/experimental/luproj.md',
      'modules/experimental/src/luproj/README.md'
    ],
    project: 'cuProj',
    repository: 'https://github.com/rapidsai/cuspatial/tree/branch-25.04/cpp/cuproj'
  },
  {
    directory: 'luxfilter',
    documentation: [
      'docs/api-reference/experimental/luxfilter.md',
      'modules/experimental/src/luxfilter/README.md'
    ],
    project: 'cuXfilter',
    repository: 'https://github.com/rapidsai/cuxfilter'
  },
  {
    directory: 'lugraph',
    documentation: ['modules/experimental/src/lugraph/README.md'],
    project: 'cuGraph',
    repository: 'https://github.com/rapidsai/cugraph'
  }
];

const REPOSITORY_ROOT = new URL('../..', import.meta.url);

describe('RAPIDS-inspired module provenance', () => {
  for (const attribution of RAPIDS_MODULE_ATTRIBUTIONS) {
    describe(attribution.directory, () => {
      test('records independent MIT ownership and accurate upstream inspiration in every source file', () => {
        const sourceDirectory = new URL(
          `modules/experimental/src/${attribution.directory}/`,
          REPOSITORY_ROOT
        );
        const sourceFiles = readdirSync(sourceDirectory).filter(fileName =>
          fileName.endsWith('.ts')
        );

        expect(sourceFiles.length).toBeGreaterThan(0);

        for (const sourceFile of sourceFiles) {
          const source = readFileSync(new URL(sourceFile, sourceDirectory), 'utf8');

          expect(source.split('\n').slice(0, 4), sourceFile).toEqual([
            '// luma.gl',
            '// SPDX-License-Identifier: MIT',
            '// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors',
            `// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS ${attribution.project}.`
          ]);
        }
      });

      test('distinguishes upstream Apache licensing from the independent MIT implementation', () => {
        for (const documentationPath of attribution.documentation) {
          const documentation = readFileSync(new URL(documentationPath, REPOSITORY_ROOT), 'utf8');

          expect(documentation, documentationPath).toContain(
            `NVIDIA RAPIDS ${attribution.project}`
          );
          expect(documentation, documentationPath).toContain(attribution.repository);
          expect(documentation, documentationPath).toContain('Apache License 2.0');
          expect(documentation, documentationPath).toContain('MIT-licensed');
          expect(documentation, documentationPath).toMatch(
            /do(?:es)? not copy or translate\s+\S+\s+source\s+code/
          );
          expect(documentation, documentationPath).toMatch(/endorse(?:d|ment)/);
        }
      });
    });
  }
});

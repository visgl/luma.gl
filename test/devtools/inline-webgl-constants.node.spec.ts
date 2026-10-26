// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import * as typescript from 'typescript';
import {expect, it} from 'vitest';

const require = createRequire(import.meta.url);
const createTransformer = require('@luma.gl/ts-transform-inline-webgl-constants');

it('inlines literal WebGL constants while preserving computed lookups', () => {
  const {outputText} = typescript.transpileModule(
    "const FLOAT = 'INT'; [GL.FLOAT, GL['FLOAT'], GL[FLOAT]];",
    {
      compilerOptions: {target: typescript.ScriptTarget.ES2022},
      transformers: {before: [createTransformer(undefined, {}, {ts: typescript})]}
    }
  );
  expect(runInNewContext(outputText, {GL: {FLOAT: 5126, INT: 5124}})).toEqual([5126, 5126, 5124]);
});

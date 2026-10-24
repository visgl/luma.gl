// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {execFileSync} from 'node:child_process';
import {readFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
const directory = path.dirname(fileURLToPath(import.meta.url));
export const reference = JSON.parse(
  readFileSync(path.join(directory, 'box3d-reference.json'), 'utf8')
);
/** Atomically create a private cache; never trust a predictable shared CMake directory. */
export function createReferenceCache() {
  return mkdtempSync(path.join(tmpdir(), 'luma-box3d-'));
}
export function buildReference(options = {}) {
  const root = options.source && options.build ? null : createReferenceCache();
  const source = path.resolve(options.source ?? path.join(root, 'source'));
  const build = path.resolve(options.build ?? path.join(root, 'build'));
  const execute = (program, args, cwd) =>
    execFileSync(program, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit']
    }).trim();
  if (!existsSync(source)) {
    mkdirSync(path.dirname(source), {recursive: true});
    execute('git', ['clone', '--no-checkout', reference.repository, source]);
    execute('git', ['checkout', '--detach', reference.commit], source);
  }
  if (
    execute('git', ['rev-parse', 'HEAD'], source) !== reference.commit ||
    execute('git', ['status', '--porcelain'], source)
  )
    throw new Error('Box3D source must be clean and match the pinned commit');
  const configuration = execute('cmake', [
    '-S',
    directory,
    '-B',
    build,
    `-DBOX3D_SOURCE=${source}`,
    '-DCMAKE_BUILD_TYPE=Release'
  ]);
  execute('cmake', ['--build', build, '--config', 'Release', '--parallel', '2']);
  const executable = path.join(build, 'luma-box3d');
  const compiler = readFileSync(path.join(build, 'CMakeCache.txt'), 'utf8')
    .split('\n')
    .find(line => line.startsWith('CMAKE_C_COMPILER:FILEPATH='))
    ?.split('=')[1];
  const metadata = {
    ...reference,
    compilerVersion: compiler ? execute(compiler, ['--version']) : null,
    configuration,
    cmake: execute('cmake', ['--version']).split('\n')[0],
    cache: readFileSync(path.join(build, 'CMakeCache.txt'), 'utf8')
      .split('\n')
      .filter(line =>
        /^(CMAKE_C_COMPILER:|CMAKE_C_FLAGS_RELEASE:|BOX3D_DOUBLE_PRECISION:|BOX3D_DISABLE_SIMD:)/.test(
          line
        )
      ),
    license: readFileSync(path.join(source, 'LICENSE'), 'utf8')
  };
  writeFileSync(`${executable}.json`, JSON.stringify(metadata, null, 2));
  return {executable, metadata, source, build};
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const {values} = parseArgs({options: {source: {type: 'string'}, build: {type: 'string'}}});
  console.log(JSON.stringify(buildReference(values), null, 2));
}

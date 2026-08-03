import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {brotliCompressSync, constants, gzipSync} from 'node:zlib';

import esbuild from 'esbuild';

import {BUNDLE_SIZE_FIXTURES} from '../test/size/bundle-size.config.mjs';

const SOURCE_ENTRIES = {
  '@luma.gl/core': 'modules/core/src/index.ts',
  '@luma.gl/webgl': 'modules/webgl/src/index.ts',
  '@luma.gl/webgpu': 'modules/webgpu/src/index.ts'
};

const SOURCE_PACKAGE_PATTERN = /^@luma\.gl\/(core|webgl|webgpu)$/;
const BYTE_FORMATTER = new Intl.NumberFormat('en-US');

const outputDirectory = parseOutputDirectory(process.argv.slice(2));
const sourceAliasesPlugin = {
  name: 'luma-source-aliases',
  setup(build) {
    build.onResolve({filter: SOURCE_PACKAGE_PATTERN}, resolveArguments => ({
      path: resolve(SOURCE_ENTRIES[resolveArguments.path])
    }));
  }
};

const measuredResults = [];
for (const fixture of BUNDLE_SIZE_FIXTURES.filter(fixture => fixture.entry)) {
  measuredResults.push(await measureFixture(fixture));
}

const resultsByName = new Map(measuredResults.map(result => [result.name, result]));
for (const fixture of BUNDLE_SIZE_FIXTURES.filter(fixture => fixture.sum)) {
  measuredResults.push(sumFixture(fixture, resultsByName));
}

const results = BUNDLE_SIZE_FIXTURES.map(fixture =>
  measuredResults.find(result => result.name === fixture.name)
);
const failures = results.flatMap(getBudgetFailures);
const markdownReport = formatMarkdownReport(results, failures);
const jsonReport = `${JSON.stringify(
  {
    version: 1,
    bundler: {name: 'esbuild', version: esbuild.version},
    results,
    failures
  },
  null,
  2
)}\n`;

if (outputDirectory) {
  await mkdir(outputDirectory, {recursive: true});
  await Promise.all([
    writeFile(resolve(outputDirectory, 'report.json'), jsonReport),
    writeFile(resolve(outputDirectory, 'report.md'), markdownReport)
  ]);
}

process.stdout.write(markdownReport);

if (failures.length > 0) {
  process.exitCode = 1;
}

async function measureFixture(fixture) {
  const buildResult = await esbuild.build({
    entryPoints: [fixture.entry],
    bundle: true,
    external: fixture.external,
    format: 'esm',
    logLevel: 'silent',
    minify: true,
    platform: 'browser',
    plugins: fixture.sourceAliases ? [sourceAliasesPlugin] : [],
    target: ['chrome110', 'firefox110', 'safari15'],
    treeShaking: true,
    write: false
  });
  const contents = buildResult.outputFiles[0].contents;

  return {
    name: fixture.name,
    label: fixture.label,
    sizes: {
      minified: contents.byteLength,
      gzip: gzipSync(contents, {level: 9}).byteLength,
      brotli: brotliCompressSync(contents, {
        params: {[constants.BROTLI_PARAM_QUALITY]: 11}
      }).byteLength
    },
    maximum: fixture.maximum,
    targetGzip: fixture.targetGzip
  };
}

function sumFixture(fixture, resultsByName) {
  const sizes = {minified: 0, gzip: 0, brotli: 0};
  for (const resultName of fixture.sum) {
    const result = resultsByName.get(resultName);
    if (!result) {
      throw new Error(`Unknown bundle-size fixture: ${resultName}`);
    }
    for (const metric of Object.keys(sizes)) {
      sizes[metric] += result.sizes[metric];
    }
  }

  const result = {
    name: fixture.name,
    label: fixture.label,
    sizes,
    maximum: fixture.maximum,
    targetGzip: fixture.targetGzip
  };
  resultsByName.set(result.name, result);
  return result;
}

function getBudgetFailures(result) {
  return Object.entries(result.maximum).flatMap(([metric, maximum]) => {
    const actual = result.sizes[metric];
    return actual <= maximum
      ? []
      : [
          {
            fixture: result.name,
            metric,
            actual,
            maximum,
            excess: actual - maximum
          }
        ];
  });
}

function formatMarkdownReport(results, failures) {
  const lines = [
    '# Bundle size report',
    '',
    '| Fixture | Minified | gzip | Brotli | gzip ceiling | gzip goal | Status |',
    '| --- | ---: | ---: | ---: | ---: | ---: | :---: |'
  ];

  for (const result of results) {
    const fixtureFailed = failures.some(failure => failure.fixture === result.name);
    lines.push(
      `| ${result.label} | ${formatBytes(result.sizes.minified)} | ${formatBytes(
        result.sizes.gzip
      )} | ${formatBytes(result.sizes.brotli)} | ${formatBytes(
        result.maximum.gzip
      )} | ${formatBytes(result.targetGzip)} | ${fixtureFailed ? 'FAIL' : 'PASS'} |`
    );
  }

  lines.push('', `Bundled with esbuild ${esbuild.version}; gzip level 9; Brotli quality 11.`, '');

  if (failures.length > 0) {
    lines.push('## Budget failures', '');
    for (const failure of failures) {
      lines.push(
        `- ${failure.fixture} ${failure.metric}: ${formatBytes(
          failure.actual
        )} exceeds ${formatBytes(failure.maximum)} by ${formatBytes(failure.excess)}.`
      );
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function formatBytes(bytes) {
  return `${BYTE_FORMATTER.format(bytes)} B`;
}

function parseOutputDirectory(commandLineArguments) {
  if (commandLineArguments.length === 0) {
    return null;
  }
  if (commandLineArguments.length === 2 && commandLineArguments[0] === '--output') {
    return resolve(commandLineArguments[1]);
  }
  throw new Error('Usage: yarn bundle-size [--output <directory>]');
}

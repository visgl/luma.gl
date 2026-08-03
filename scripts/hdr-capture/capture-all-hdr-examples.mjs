#!/usr/bin/env node

import {randomUUID} from 'node:crypto';
import {copyFile, lstat, mkdir, mkdtemp, readFile, rename, rm} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {loadOcularConfig} from '../../dev-modules/devtools-extensions/load-ocular-config.mjs';
import {runWebsiteExample} from '../../dev-modules/devtools-extensions/playwright/run-website-example.mjs';
import {
  applyCaptureManifestOptions,
  encodeGainMapJpeg,
  parseCliArguments as parseEncoderArguments,
  resolveUltrahdrAppPath
} from './encode-gainmap-jpeg.mjs';
import {
  HDR_EXAMPLE_CAPTURE_HEIGHT,
  HDR_EXAMPLE_CAPTURE_DELAY_MILLISECONDS,
  HDR_EXAMPLE_CAPTURE_WIDTH,
  HDR_EXAMPLE_CATALOG,
  HDR_EXAMPLE_VIEWPORT_HEIGHT,
  HDR_EXAMPLE_VIEWPORT_WIDTH
} from './hdr-example-catalog.mjs';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, '..', '..');
const CAPTURE_MANIFEST_SCHEMA = 'luma.gl/hdr-screenshot-capture';
const CAPTURE_MANIFEST_VERSION = 2;
const MINIMUM_TARGET_PEAK_NITS = 203;
const MAXIMUM_TARGET_PEAK_NITS = 10_000;

export const HELP_TEXT = `Capture and publish every public website HDR example as a gain-map JPEG.

Usage:
  node scripts/hdr-capture/capture-all-hdr-examples.mjs [options]

Options:
  --artifact-base <path>    Parent for a unique retained batch artifact directory.
  --base-url <url>          Website URL to reuse (default: http://127.0.0.1:3000).
  --channel <name>          Chromium-family browser channel passed to the website runner.
  --headless                Run without a visible browser; requires an environment that still
                            exposes an actual extended-range rgba16float canvas.
  --software-gpu            Force the website runner's software-GPU launch flags.
  --ultrahdr-app <path>     Explicit ultrahdr_app binary; otherwise use the normal resolver.
  --help                    Show this help message.

The batch uses core WebGPU except where a catalog entry requires max WebGPU, and validates a
1280x720 version-2 manifest for every example.
All captures and encodes finish successfully before any website image is replaced.
`;

/** Capture and encode the catalog sequentially, then publish the complete validated set. */
export async function captureAllHDRExamples(options = {}, dependencies = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? REPOSITORY_ROOT);
  const environment = options.environment ?? process.env;
  const catalog = options.catalog ?? HDR_EXAMPLE_CATALOG;
  const logger = dependencies.logger ?? console;
  const loadConfiguration = dependencies.loadOcularConfig ?? loadOcularConfig;
  const captureWebsiteExample = dependencies.runWebsiteExample ?? runWebsiteExample;
  const resolveEncoderPath = dependencies.resolveUltrahdrAppPath ?? resolveUltrahdrAppPath;
  const encodeCapture = dependencies.encodeCaptureManifest ?? encodeCaptureManifest;
  const publishOutputs = dependencies.publishStagedOutputs ?? publishStagedOutputs;

  validateHDRExampleCatalog(catalog);

  const runDirectory = await createRunDirectory(repositoryRoot, options);
  const captureRoot = path.join(runDirectory, 'captures');
  const stagedOutputRoot = path.join(runDirectory, 'staged');
  const backupRoot = path.join(runDirectory, 'backups');
  await Promise.all([
    mkdir(captureRoot, {recursive: true}),
    mkdir(stagedOutputRoot, {recursive: true}),
    mkdir(backupRoot, {recursive: true})
  ]);

  const ocularConfig =
    options.ocularConfig ?? (await loadConfiguration({cwd: repositoryRoot}));
  const ultrahdrAppPath = await resolveEncoderPath(options.ultrahdrAppPath, environment);
  const stagedCaptures = [];

  for (const [exampleIndex, example] of catalog.entries()) {
    logger.log(
      `[hdr-batch] Capturing ${exampleIndex + 1}/${catalog.length}: ${example.route}`
    );
    const artifactDirectory = path.join(captureRoot, example.id);
    const captureResult = await captureWebsiteExample({
      artifactDir: artifactDirectory,
      backend: example.backend ?? 'webgpu-core',
      baseUrl: options.baseUrl,
      captureDelayMilliseconds:
        example.captureDelayMilliseconds ?? HDR_EXAMPLE_CAPTURE_DELAY_MILLISECONDS,
      channel: options.channel,
      cwd: repositoryRoot,
      headless: Boolean(options.headless),
      highDynamicRangeCapture: true,
      highDynamicRangeCaptureTimeout: options.captureTimeoutMilliseconds,
      keepOpen: false,
      logger,
      ocularConfig,
      skipScreenshot: true,
      softwareGpu: Boolean(options.softwareGpu),
      example: example.route,
      viewportHeight: HDR_EXAMPLE_VIEWPORT_HEIGHT,
      viewportWidth: example.viewportWidth ?? HDR_EXAMPLE_VIEWPORT_WIDTH
    });
    assertCleanCaptureDiagnostics(captureResult.diagnostics, example.route);

    const manifestPath = captureResult.highDynamicRangeArtifacts?.manifestPath;
    if (!manifestPath) {
      throw new Error(`${example.route} did not produce an HDR capture manifest.`);
    }
    assertPathWithinDirectory(manifestPath, artifactDirectory, `${example.route} manifest`);
    const manifest = await loadBatchCaptureManifest(manifestPath, example.route);

    const stagedOutputPath = resolveRepositoryPath(stagedOutputRoot, example.outputPath);
    await mkdir(path.dirname(stagedOutputPath), {recursive: true});
    logger.log(
      `[hdr-batch] Encoding ${example.route} at ${manifest.targetPeakNits} nits from its manifest`
    );
    await encodeCapture({
      environment,
      manifestPath,
      outputPath: stagedOutputPath,
      targetPeakNits: manifest.targetPeakNits,
      ultrahdrAppPath
    });
    await assertRegularNonemptyFile(stagedOutputPath, `${example.route} staged JPEG`);

    stagedCaptures.push({
      example,
      manifestPath,
      stagedOutputPath,
      targetPeakNits: manifest.targetPeakNits
    });
  }

  logger.log('[hdr-batch] Every capture and encode validated; publishing the complete catalog');
  await publishOutputs(stagedCaptures, {backupRoot, repositoryRoot});

  const outputs = stagedCaptures.map(capture => ({
    ...capture,
    outputPath: resolveRepositoryPath(repositoryRoot, capture.example.outputPath)
  }));
  logger.log(`[hdr-batch] Published ${outputs.length} gain-map JPEGs`);
  return {outputs, runDirectory};
}

/** Encode one manifest without supplying a competing peak-luminance option. */
export async function encodeCaptureManifest(options) {
  let encoderOptions = parseEncoderArguments(
    ['--manifest', options.manifestPath, '--output', options.outputPath],
    options.environment
  );
  encoderOptions = await applyCaptureManifestOptions(encoderOptions);
  if (encoderOptions.targetPeakNits !== options.targetPeakNits) {
    throw new Error(
      `Encoder resolved ${encoderOptions.targetPeakNits} target nits for ${options.manifestPath}; ` +
        `the version-2 manifest declares ${options.targetPeakNits}.`
    );
  }
  encoderOptions.ultrahdrAppPath = options.ultrahdrAppPath;
  return await encodeGainMapJpeg(encoderOptions);
}

/** Load the batch-owned manifest fields before invoking the stricter encoder validation. */
export async function loadBatchCaptureManifest(manifestPath, expectedExampleId) {
  const route = expectedExampleId ?? 'HDR example';
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read ${route} capture manifest ${manifestPath}: ${error.message}`, {
      cause: error
    });
  }

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`${route} capture manifest must contain a JSON object.`);
  }
  if (manifest.schema !== CAPTURE_MANIFEST_SCHEMA || manifest.version !== CAPTURE_MANIFEST_VERSION) {
    throw new Error(
      `${route} capture manifest must use ${CAPTURE_MANIFEST_SCHEMA} version ` +
        `${CAPTURE_MANIFEST_VERSION}.`
    );
  }
  if (typeof manifest.exampleId !== 'string' || manifest.exampleId.trim().length === 0) {
    throw new Error(`${route} capture manifest exampleId must be a non-empty string.`);
  }
  if (expectedExampleId && manifest.exampleId !== expectedExampleId) {
    throw new Error(
      `${route} capture manifest belongs to ${manifest.exampleId}; expected ${expectedExampleId}.`
    );
  }
  if (
    manifest.width !== HDR_EXAMPLE_CAPTURE_WIDTH ||
    manifest.height !== HDR_EXAMPLE_CAPTURE_HEIGHT
  ) {
    throw new Error(
      `${route} capture is ${manifest.width}x${manifest.height}; expected ` +
        `${HDR_EXAMPLE_CAPTURE_WIDTH}x${HDR_EXAMPLE_CAPTURE_HEIGHT}.`
    );
  }
  if (
    !Number.isSafeInteger(manifest.targetPeakNits) ||
    manifest.targetPeakNits < MINIMUM_TARGET_PEAK_NITS ||
    manifest.targetPeakNits > MAXIMUM_TARGET_PEAK_NITS
  ) {
    throw new Error(
      `${route} capture manifest targetPeakNits must be an integer in ` +
        `[${MINIMUM_TARGET_PEAK_NITS}, ${MAXIMUM_TARGET_PEAK_NITS}].`
    );
  }
  return manifest;
}

/** Validate catalog invariants and keep authored peak luminance out of duplicated configuration. */
export function validateHDRExampleCatalog(catalog) {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('HDR example catalog must contain at least one example.');
  }

  const identifiers = new Set();
  const routes = new Set();
  const outputPaths = new Set();
  for (const example of catalog) {
    if (!example || typeof example !== 'object' || Array.isArray(example)) {
      throw new Error('Every HDR example catalog entry must be an object.');
    }
    if (!/^[a-z0-9-]+$/.test(example.id)) {
      throw new Error(`Invalid HDR example id: ${example.id}`);
    }
    if (!/^(showcase|experimental)\/[a-z0-9-]+$/.test(example.route)) {
      throw new Error(`Invalid public HDR example route: ${example.route}`);
    }
    const expectedIdentifier = example.route.replace('/', '-');
    if (example.id !== expectedIdentifier) {
      throw new Error(`${example.route} must use catalog id ${expectedIdentifier}.`);
    }
    const expectedOutputPath = `website/static/images/examples/${example.route}.jpg`;
    if (example.outputPath !== expectedOutputPath) {
      throw new Error(`${example.route} must publish to ${expectedOutputPath}.`);
    }
    if ('targetPeakNits' in example) {
      throw new Error(
        `${example.route} duplicates targetPeakNits; peak luminance must come from its manifest.`
      );
    }
    if (example.backend !== undefined && example.backend !== 'webgpu-max') {
      throw new Error(`Invalid HDR example backend: ${example.backend}`);
    }
    if (
      example.viewportWidth !== undefined &&
      (!Number.isSafeInteger(example.viewportWidth) || example.viewportWidth <= 0)
    ) {
      throw new Error(`Invalid HDR example viewport width: ${example.viewportWidth}`);
    }
    if (
      example.captureDelayMilliseconds !== undefined &&
      (!Number.isSafeInteger(example.captureDelayMilliseconds) ||
        example.captureDelayMilliseconds < 0)
    ) {
      throw new Error(`Invalid HDR example capture delay: ${example.captureDelayMilliseconds}`);
    }
    if (identifiers.has(example.id) || routes.has(example.route) || outputPaths.has(example.outputPath)) {
      throw new Error(`Duplicate HDR example catalog entry: ${example.route}`);
    }
    identifiers.add(example.id);
    routes.add(example.route);
    outputPaths.add(example.outputPath);
  }
}

function assertCleanCaptureDiagnostics(diagnostics, route) {
  const browserErrors = diagnostics?.consoleMessages?.filter(message => message.type === 'error') ?? [];
  const pageErrors = diagnostics?.pageErrors ?? [];
  const requestFailures = diagnostics?.requestFailures ?? [];
  const failureCount = browserErrors.length + pageErrors.length + requestFailures.length;
  if (failureCount > 0) {
    throw new Error(
      `${route} emitted ${failureCount} browser diagnostic error${failureCount === 1 ? '' : 's'} during HDR capture.`
    );
  }
}

/**
 * Prepare every destination beside its current asset, then atomically replace the catalog files.
 * Existing images are backed up and restored if a later rename fails.
 */
export async function publishStagedOutputs(stagedCaptures, options) {
  const repositoryRoot = path.resolve(options.repositoryRoot);
  const backupRoot = path.resolve(options.backupRoot);
  await mkdir(backupRoot, {recursive: true});

  const publicationRecords = [];
  try {
    for (const [captureIndex, capture] of stagedCaptures.entries()) {
      await assertRegularNonemptyFile(
        capture.stagedOutputPath,
        `${capture.example.route} staged JPEG`
      );
      const destinationPath = resolveRepositoryPath(
        repositoryRoot,
        capture.example.outputPath
      );
      await mkdir(path.dirname(destinationPath), {recursive: true});

      const destinationStatus = await getOptionalFileStatus(destinationPath);
      if (destinationStatus && !destinationStatus.isFile()) {
        throw new Error(`HDR catalog destination is not a regular file: ${destinationPath}`);
      }
      const backupPath = path.join(
        backupRoot,
        `${String(captureIndex).padStart(2, '0')}-${path.basename(destinationPath)}`
      );
      if (destinationStatus) {
        await copyFile(destinationPath, backupPath);
      }

      const temporaryDestinationPath = path.join(
        path.dirname(destinationPath),
        `.${path.basename(destinationPath)}.${process.pid}-${randomUUID()}.hdr-batch.tmp`
      );
      await copyFile(capture.stagedOutputPath, temporaryDestinationPath);
      publicationRecords.push({
        backupPath,
        destinationExisted: Boolean(destinationStatus),
        destinationPath,
        published: false,
        rollbackPath: `${temporaryDestinationPath}.rollback`,
        temporaryDestinationPath
      });
    }

    for (const record of publicationRecords) {
      await rename(record.temporaryDestinationPath, record.destinationPath);
      record.published = true;
    }
  } catch (publicationError) {
    const rollbackErrors = [];
    for (const record of [...publicationRecords].reverse()) {
      if (!record.published) {
        continue;
      }
      try {
        if (record.destinationExisted) {
          await copyFile(record.backupPath, record.rollbackPath);
          await rename(record.rollbackPath, record.destinationPath);
        } else {
          await rm(record.destinationPath, {force: true});
        }
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [publicationError, ...rollbackErrors],
        'HDR catalog publication failed and could not be fully rolled back.'
      );
    }
    throw publicationError;
  } finally {
    await Promise.all(
      publicationRecords.flatMap(record => [
        rm(record.temporaryDestinationPath, {force: true}),
        rm(record.rollbackPath, {force: true})
      ])
    );
  }
}

export function parseArguments(commandLineArguments) {
  const options = {
    artifactBaseDirectory: undefined,
    baseUrl: undefined,
    channel: undefined,
    headless: false,
    help: false,
    softwareGpu: false,
    ultrahdrAppPath: undefined
  };

  for (let argumentIndex = 0; argumentIndex < commandLineArguments.length; argumentIndex++) {
    const argument = commandLineArguments[argumentIndex];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (argument === '--software-gpu') {
      options.softwareGpu = true;
      continue;
    }
    if (argument === '--headless') {
      options.headless = true;
      continue;
    }

    const equalsIndex = argument.indexOf('=');
    const optionName = equalsIndex === -1 ? argument : argument.slice(0, equalsIndex);
    let optionValue = equalsIndex === -1 ? undefined : argument.slice(equalsIndex + 1);
    if (optionValue === undefined) {
      optionValue = commandLineArguments[++argumentIndex];
    }
    if (!optionValue || optionValue.startsWith('--')) {
      throw new Error(`${optionName} requires a value.`);
    }

    switch (optionName) {
      case '--artifact-base':
        options.artifactBaseDirectory = optionValue;
        break;
      case '--base-url':
        options.baseUrl = optionValue;
        break;
      case '--channel':
        options.channel = optionValue;
        break;
      case '--ultrahdr-app':
        options.ultrahdrAppPath = optionValue;
        break;
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

export async function runCli(commandLineArguments = process.argv.slice(2)) {
  const options = parseArguments(commandLineArguments);
  if (options.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  const result = await captureAllHDRExamples(options);
  process.stdout.write(
    `[hdr-batch] Retained capture artifacts: ${result.runDirectory}\n` +
      result.outputs.map(output => `[hdr-batch] ${output.outputPath}`).join('\n') +
      '\n'
  );
}

async function createRunDirectory(repositoryRoot, options) {
  if (options.runDirectory) {
    const runDirectory = path.resolve(options.runDirectory);
    await mkdir(runDirectory, {recursive: true});
    return runDirectory;
  }
  const artifactBaseDirectory = path.resolve(
    repositoryRoot,
    options.artifactBaseDirectory ?? '.playwright-artifacts/hdr-gainmap-batches'
  );
  await mkdir(artifactBaseDirectory, {recursive: true});
  return await mkdtemp(path.join(artifactBaseDirectory, 'run-'));
}

function resolveRepositoryPath(rootDirectory, relativePath) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Expected a repository-relative path, received ${relativePath}.`);
  }
  const resolvedRoot = path.resolve(rootDirectory);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const pathFromRoot = path.relative(resolvedRoot, resolvedPath);
  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(pathFromRoot)) {
    throw new Error(`Path escapes its root directory: ${relativePath}`);
  }
  return resolvedPath;
}

function assertPathWithinDirectory(candidatePath, directoryPath, description) {
  const resolvedDirectory = path.resolve(directoryPath);
  const resolvedCandidate = path.resolve(candidatePath);
  const relativePath = path.relative(resolvedDirectory, resolvedCandidate);
  if (
    relativePath === '' ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`${description} is outside its unique artifact directory: ${candidatePath}`);
  }
}

async function assertRegularNonemptyFile(filePath, description) {
  const fileStatus = await lstat(filePath);
  if (!fileStatus.isFile() || fileStatus.size <= 0) {
    throw new Error(`${description} must be a nonempty regular file: ${filePath}`);
  }
}

async function getOptionalFileStatus(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

const invokedModuleUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;
if (invokedModuleUrl === import.meta.url) {
  runCli().catch(error => {
    const errorText = process.env.HDR_CAPTURE_DEBUG === '1' ? error.stack : error.message;
    process.stderr.write(`[hdr-batch] ${errorText}\n`);
    process.exitCode = 1;
  });
}

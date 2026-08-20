import {mkdtempSync, readdirSync, existsSync, readFileSync, writeFileSync, rmSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const examplesRoot = join(repoRoot, 'examples');
const tscPath = join(repoRoot, 'node_modules', '.bin', 'tsc');
const SUPPORTED_EXAMPLE_WORKSPACES = new Set([
  'api/blending',
  'api/multi-canvas',
  'api/render-bundles',
  'api/texture-compressed',
  'api/texture-sampling',
  'api/texture-tester',
  'arrow/arrow-columns',
  'arrow/arrow-geoarrow',
  'arrow/arrow-lines',
  'arrow/arrow-mesh-geometry',
  'arrow/arrow-particles',
  'arrow/arrow-points',
  'arrow/arrow-polygons',
  'experimental/fluid-foundry',
  'experimental/advanced-effects',
  'experimental/deferred-rendering',
  'experimental/gpu-frustum-culling',
  'experimental/gpu-trace-viewer',
  'deck/luspatial-taxi',
  'deck/gpu-culled-trace',
  'experimental/gpu-sort',
  'experimental/spectral-caustics',
  'experimental/volumetric-fire-forge',
  'experimental/virtual-geometry-canyon',
  'api/video-texture',
  'experimental/webxr-kaleidoscope',
  'integrations/hello-react',
  'experimental/antialiasing',
  'showcase/scene',
  'showcase/dof',
  'showcase/gaussian-splats',
  'showcase/billion-point-spatial-atlas',
  'showcase/lightstorm-megacity',
  'showcase/million-row-crossfilter',
  'showcase/tempest-ocean',
  'showcase/vector-field-lab',
  'showcase/packet-spraying',
  'showcase/persistence',
  'showcase/raster-lab',
  'tutorials/hello-instanced-cubes',
  'tutorials/hello-instancing',
  'tutorials/hello-triangle',
  'tutorials/hello-triangle-geometry',
  'tutorials/hello-two-cubes',
  'tutorials/shader-hooks',
  'tutorials/shader-modules',
  'tutorials/transform',
  'tutorials/transform-feedback'
]);

const PACKAGE_FREE_EXAMPLE_WORKSPACES = new Set(['showcase/raster-lab']);
const NATIVE_TYPESCRIPT_CONFIG_WORKSPACES = new Set(['showcase/scene', 'showcase/raster-lab']);

const SHARED_COMPILER_OPTIONS = {
  noEmit: true,
  typeRoots: [join(repoRoot, 'node_modules'), join(repoRoot, 'node_modules/@types')],
  types: ['@webgpu/types', 'node'],
  strict: false,
  noImplicitAny: false,
  noImplicitThis: false,
  strictBindCallApply: false,
  strictFunctionTypes: false,
  useUnknownInCatchVariables: false,
  strictNullChecks: false,
  strictPropertyInitialization: false,
  noFallthroughCasesInSwitch: false,
  noImplicitOverride: false,
  noImplicitReturns: false,
  noPropertyAccessFromIndexSignature: false,
  noUnusedLocals: false,
  moduleResolution: 'bundler',
  jsx: 'react-jsx',
  paths: {
    '@luma.gl/arrow': [join(repoRoot, 'modules/arrow/src/index.ts')],
    '@luma.gl/arrow/*': [join(repoRoot, 'modules/arrow/src/*')],
    '@deck.gl-community/arrow-layers': [join(repoRoot, 'modules/deck-arrow-layers/src/index.ts')],
    '@deck.gl-community/arrow-layers/*': [join(repoRoot, 'modules/deck-arrow-layers/src/*')],
    '@deck.gl-community/gpu-layers': [join(repoRoot, 'modules/deck-gpu-layers/src/index.ts')],
    '@deck.gl-community/gpu-layers/*': [join(repoRoot, 'modules/deck-gpu-layers/src/*')],
    '@math.gl/geoarrow': [join(repoRoot, 'modules/math-geoarrow/src/index.ts')],
    '@math.gl/geoarrow/*': [join(repoRoot, 'modules/math-geoarrow/src/*')],
    '@luma.gl/experimental': [join(repoRoot, 'modules/experimental/src/index.ts')],
    '@luma.gl/experimental/*': [join(repoRoot, 'modules/experimental/src/*')],
    '@luma.gl/gpgpu': [join(repoRoot, 'modules/gpgpu/src/index.ts')],
    '@luma.gl/gpgpu/*': [join(repoRoot, 'modules/gpgpu/src/*')],
    '@luma.gl/splats': [join(repoRoot, 'modules/splats/src/index.ts')],
    '@luma.gl/splats/*': [join(repoRoot, 'modules/splats/src/*')],
  }
};

const AMBIENT_MODULE_DECLARATIONS = `declare module '*.css';
declare module '*.png';
declare module '*.jpg';
declare module '*.gif';
declare module '*.glb';
`;

function getExampleWorkspaces() {
  const workspaces = [];

  for (const category of readdirSync(examplesRoot, {withFileTypes: true})) {
    if (!category.isDirectory()) {
      continue;
    }

    const categoryPath = join(examplesRoot, category.name);
    for (const example of readdirSync(categoryPath, {withFileTypes: true})) {
      if (!example.isDirectory()) {
        continue;
      }

      const workspacePath = join(categoryPath, example.name);
      const packageJsonPath = join(workspacePath, 'package.json');
      const workspaceId = `${category.name}/${example.name}`;
      const hasPackageManifest = existsSync(packageJsonPath);
      if (!hasPackageManifest && !PACKAGE_FREE_EXAMPLE_WORKSPACES.has(workspaceId)) {
        continue;
      }

      // Keep the CI signal focused on examples that already have clean compile coverage.
      // The remaining examples still carry unrelated type debt and can be added incrementally.
      if (!SUPPORTED_EXAMPLE_WORKSPACES.has(workspaceId)) {
        continue;
      }

      const packageJson = hasPackageManifest
        ? JSON.parse(readFileSync(packageJsonPath, 'utf8'))
        : {};
      workspaces.push({
        name: packageJson.name ?? `${category.name}/${example.name}`,
        workspaceId,
        workspacePath
      });
    }
  }

  return workspaces;
}

function createTempTypecheckConfig(workspaces) {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'luma-examples-typecheck-'));
  const ambientTypesPath = join(tempDirectory, 'ambient.d.ts');
  const tsconfigPath = join(tempDirectory, 'tsconfig.json');
  const includedFiles = workspaces.flatMap(({workspacePath}) => [
    `${workspacePath}/**/*.ts`,
    `${workspacePath}/**/*.tsx`,
    `${workspacePath}/**/*.d.ts`
  ]);
  const excludedFiles = workspaces.flatMap(({workspacePath}) => [
    `${workspacePath}/node_modules`,
    `${workspacePath}/dist`,
    `${workspacePath}/vite.config.ts`
  ]);

  writeFileSync(ambientTypesPath, AMBIENT_MODULE_DECLARATIONS);
  writeFileSync(
    tsconfigPath,
    JSON.stringify(
      {
        extends: join(repoRoot, 'tsconfig.json'),
        compilerOptions: SHARED_COMPILER_OPTIONS,
        include: [...includedFiles, ambientTypesPath],
        exclude: excludedFiles
      },
      null,
      2
    )
  );

  return {tempDirectory, tsconfigPath};
}

function runTypecheck(tsconfigPath, description) {
  console.log(`Typechecking ${description}`);
  const result = spawnSync(tscPath, ['-p', tsconfigPath, '--noEmit'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    return false;
  }

  return true;
}

function typecheckWorkspaces(workspaces) {
  if (workspaces.length === 0) {
    return true;
  }

  const {tempDirectory, tsconfigPath} = createTempTypecheckConfig(workspaces);

  try {
    return runTypecheck(tsconfigPath, `${workspaces.length} example workspaces together`);
  } finally {
    rmSync(tempDirectory, {recursive: true, force: true});
  }
}

const workspaces = getExampleWorkspaces();

console.log(
  `Typechecking ${workspaces.length} example workspace${workspaces.length === 1 ? '' : 's'}: ${workspaces
    .map(workspace => workspace.workspaceId)
    .join(', ')}`
);

const sharedConfigurationWorkspaces = workspaces.filter(
  ({workspaceId}) => !NATIVE_TYPESCRIPT_CONFIG_WORKSPACES.has(workspaceId)
);
const nativeConfigurationWorkspaces = workspaces.filter(({workspaceId}) =>
  NATIVE_TYPESCRIPT_CONFIG_WORKSPACES.has(workspaceId)
);
let allPassed = typecheckWorkspaces(sharedConfigurationWorkspaces);

for (const {name, workspacePath} of nativeConfigurationWorkspaces) {
  allPassed = runTypecheck(join(workspacePath, 'tsconfig.json'), name) && allPassed;
}

if (!allPassed) {
  process.exitCode = 1;
}

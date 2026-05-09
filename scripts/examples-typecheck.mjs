import {mkdtempSync, readdirSync, existsSync, readFileSync, writeFileSync, rmSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const examplesRoot = join(repoRoot, 'examples');
const tscPath = join(repoRoot, 'node_modules', '.bin', 'tsc');
const SUPPORTED_EXAMPLE_WORKSPACES = new Set([
  'api/multi-canvas',
  'api/texture-compressed',
  'api/texture-tester',
  'integrations/hello-react',
  'showcase/dof',
  'showcase/persistence',
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

const SHARED_COMPILER_OPTIONS = {
  noEmit: true,
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
  paths: {}
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
      if (!existsSync(packageJsonPath)) {
        continue;
      }

      // Keep the CI signal focused on examples that already have clean compile coverage.
      // The remaining examples still carry unrelated type debt and can be added incrementally.
      if (!SUPPORTED_EXAMPLE_WORKSPACES.has(workspaceId)) {
        continue;
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      workspaces.push({
        name: packageJson.name ?? `${category.name}/${example.name}`,
        workspaceId,
        workspacePath
      });
    }
  }

  return workspaces;
}

function createTempTypecheckConfig(workspacePath) {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'luma-examples-typecheck-'));
  const ambientTypesPath = join(tempDirectory, 'ambient.d.ts');
  const tsconfigPath = join(tempDirectory, 'tsconfig.json');

  writeFileSync(ambientTypesPath, AMBIENT_MODULE_DECLARATIONS);
  writeFileSync(
    tsconfigPath,
    JSON.stringify(
      {
        extends: join(repoRoot, 'tsconfig.json'),
        compilerOptions: SHARED_COMPILER_OPTIONS,
        include: [
          `${workspacePath}/**/*.ts`,
          `${workspacePath}/**/*.tsx`,
          `${workspacePath}/**/*.d.ts`,
          ambientTypesPath
        ],
        exclude: [
          `${workspacePath}/node_modules`,
          `${workspacePath}/dist`,
          `${workspacePath}/vite.config.ts`
        ]
      },
      null,
      2
    )
  );

  return {tempDirectory, tsconfigPath};
}

function typecheckWorkspace({name, workspacePath}) {
  const {tempDirectory, tsconfigPath} = createTempTypecheckConfig(workspacePath);

  try {
    console.log(`Typechecking ${name}`);
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
  } finally {
    rmSync(tempDirectory, {recursive: true, force: true});
  }
}

const workspaces = getExampleWorkspaces();
let allPassed = true;

console.log(
  `Typechecking ${workspaces.length} example workspace${workspaces.length === 1 ? '' : 's'}: ${workspaces
    .map(workspace => workspace.workspaceId)
    .join(', ')}`
);

for (const workspace of workspaces) {
  allPassed = typecheckWorkspace(workspace) && allPassed;
}

if (!allPassed) {
  process.exitCode = 1;
}

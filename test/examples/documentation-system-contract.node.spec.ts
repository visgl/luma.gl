import {describe, expect, it} from 'vitest';
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {dirname, extname, join, relative} from 'node:path';
import ts from 'typescript';
import {FOUNDATION_DOCS_CATALOG} from '../../website/src/components/docs/foundation-docs-catalog';
import {
  EXPERIMENTAL_DOCS_TAB_GROUPS,
  GPU_CORE_DOCS_TAB_GROUPS
} from '../../website/src/components/docs/experimental-docs-catalog';
import {PUBLIC_PACKAGE_API_INVENTORY} from '../../website/src/components/docs/public-api-inventory';
import {
  ANARI_GUIDE_TABS,
  GLTF_CROWD_DOCS_TABS,
  SPLATS_DOCS_TABS
} from '../../website/src/components/docs/specialized-docs-catalog';

type TocItem = string | {type: 'category'; label: string; items: TocItem[]};

const ROOT_DIRECTORY = process.cwd();
const DOCS_DIRECTORY = join(ROOT_DIRECTORY, 'docs');
const TABLE_OF_CONTENTS = JSON.parse(
  readFileSync(join(DOCS_DIRECTORY, 'table-of-contents.json'), 'utf8')
) as TocItem[];

function collectTocRoutes(items: readonly TocItem[], routes = new Set<string>()): Set<string> {
  for (const item of items) {
    if (typeof item === 'string') {
      routes.add(item.replace(/\/README$/, ''));
    } else {
      collectTocRoutes(item.items, routes);
    }
  }
  return routes;
}

function collectMarkdownFiles(directory: string, files: string[] = []): string[] {
  if (!existsSync(directory)) return files;

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== 'generated') collectMarkdownFiles(path, files);
    } else if (['.md', '.mdx'].includes(extname(path))) {
      files.push(path);
    }
  }
  return files;
}

function getRouteForFile(path: string): string {
  return relative(DOCS_DIRECTORY, path)
    .replace(/\\/g, '/')
    .replace(/\.(md|mdx)$/, '')
    .replace(/\/README$/, '');
}

function getRouteAliases(path: string): string[] {
  const route = getRouteForFile(path);
  const segments = route.split('/');
  const filename = segments.at(-1);
  const parent = segments.at(-2);
  if (filename === 'index' || filename === parent) {
    return [route, segments.slice(0, -1).join('/')];
  }
  return [route];
}

function resolveInternalRoute(route: string): string | null {
  const cleanRoute = route.split(/[?#]/, 1)[0];
  if (!cleanRoute.startsWith('/docs/')) return null;
  return cleanRoute.replace(/^\/docs\//, '').replace(/\/$/, '');
}

function isRuntimeExport(symbol: ts.Symbol, checker: ts.TypeChecker): boolean {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return Boolean(resolved.flags & ts.SymbolFlags.Value);
}

function getMarkdownTableCells(line: string): string[] {
  const cells = [''];
  let inCode = false;
  let escaped = false;
  for (const character of line) {
    if (escaped) {
      cells[cells.length - 1] += character;
      escaped = false;
    } else if (character === '\\') {
      cells[cells.length - 1] += character;
      escaped = true;
    } else if (character === '`') {
      cells[cells.length - 1] += character;
      inCode = !inCode;
    } else if (character === '|' && !inCode) {
      cells.push('');
    } else {
      cells[cells.length - 1] += character;
    }
  }
  if (!cells[0]?.trim()) cells.shift();
  if (!cells.at(-1)?.trim()) cells.pop();
  return cells.map(cell => cell.trim());
}

describe('documentation system contracts', () => {
  const tocRoutes = collectTocRoutes(TABLE_OF_CONTENTS);
  const markdownFiles = collectMarkdownFiles(DOCS_DIRECTORY);
  const curatedRoutes = new Set(markdownFiles.map(getRouteForFile));
  const generatedIndexFiles = collectMarkdownFiles(join(DOCS_DIRECTORY, 'api-reference/generated'));
  const generatedRoutes = PUBLIC_PACKAGE_API_INVENTORY.flatMap(item => {
    if (item.documentation.kind !== 'generated') return [];
    const route = resolveInternalRoute(item.documentation.routePrefix);
    return route ? [route] : [];
  });
  const knownRoutes = new Set([
    ...[...markdownFiles, ...generatedIndexFiles].flatMap(getRouteAliases),
    ...generatedRoutes
  ]);

  it('keeps every curated document reachable from the table of contents', () => {
    const allowedStandaloneRoutes = new Set(['developer/dev-tools/README']);
    const orphaned = [...curatedRoutes].filter(
      route => !tocRoutes.has(route) && !allowedStandaloneRoutes.has(route)
    );
    expect(orphaned).toEqual([]);
  });

  it('keeps table-of-contents routes unique and backed by files', () => {
    const flattened: string[] = [];
    const visit = (items: readonly TocItem[]): void => {
      for (const item of items) {
        if (typeof item === 'string') flattened.push(item.replace(/\/README$/, ''));
        else visit(item.items);
      }
    };
    visit(TABLE_OF_CONTENTS);
    expect(flattened.filter((route, index) => flattened.indexOf(route) !== index)).toEqual([]);
    expect(flattened.filter(route => !knownRoutes.has(route))).toEqual([]);
  });

  it('keeps visible page-tab groups focused and routes valid', () => {
    const groups = [
      ...Object.values(FOUNDATION_DOCS_CATALOG).flatMap(module => Object.values(module)),
      ...EXPERIMENTAL_DOCS_TAB_GROUPS.filter(group => group.tabs.length >= 3),
      ...GPU_CORE_DOCS_TAB_GROUPS,
      {label: 'ANARI guide', tabs: ANARI_GUIDE_TABS},
      {label: 'Gaussian splats', tabs: SPLATS_DOCS_TABS},
      {label: 'GPU-animated crowds', tabs: GLTF_CROWD_DOCS_TABS}
    ];
    for (const group of groups) {
      expect(group.tabs.length, group.label).toBeGreaterThanOrEqual(3);
      expect(group.tabs.length, group.label).toBeLessThanOrEqual(7);
      expect(new Set(group.tabs.map(tab => tab.id)).size, group.label).toBe(group.tabs.length);
      for (const tab of group.tabs) {
        const route = resolveInternalRoute(tab.href);
        expect(route && knownRoutes.has(route), `${group.label}: ${tab.href}`).toBe(true);
      }
    }
  });

  it('uses local badges and valid internal documentation links', () => {
    const errors: string[] = [];
    for (const path of markdownFiles) {
      const source = readFileSync(path, 'utf8');
      if (source.includes('img.shields.io')) errors.push(`${getRouteForFile(path)}: remote badge`);
      for (const match of source.matchAll(/\]\((\/docs\/[^)\s]+)\)/g)) {
        const route = resolveInternalRoute(match[1]);
        if (route && !knownRoutes.has(route))
          errors.push(`${getRouteForFile(path)} -> ${match[1]}`);
      }
    }
    expect(errors).toEqual([]);
  });

  it('keeps public copy and MDX integration production-ready', () => {
    const errors: string[] = [];
    for (const path of markdownFiles.filter(path => !path.includes('/legacy/'))) {
      const source = readFileSync(path, 'utf8');
      const prose = source.replace(/```[\s\S]*?```/g, '');
      if (/^import .* from ['"]\.\.?\//m.test(prose)) {
        errors.push(`${getRouteForFile(path)}: relative MDX component import`);
      }
      if (/^import .*;\n(?=#)/m.test(prose)) {
        errors.push(`${getRouteForFile(path)}: MDX import must be separated from prose`);
      }
      if (
        /\b(?:supremacy|tranche status|delivery tranches|implementation roadmap)\b/i.test(prose)
      ) {
        errors.push(`${getRouteForFile(path)}: internal roadmap language`);
      }
      if (/\b(?:TODO|TBD|WIP|work[- ]in[- ]progress)\b/i.test(prose)) {
        errors.push(`${getRouteForFile(path)}: unresolved placeholder language`);
      }
      for (const match of prose.matchAll(/(?:\]\(|(?:href|src)=["'])(https?:[^)"'\s>]+)/g)) {
        try {
          const url = new URL(match[1]);
          if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('protocol');
        } catch {
          errors.push(`${getRouteForFile(path)}: malformed URL ${match[1]}`);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  it('provides descriptions for the main learning and package landing pages', () => {
    const landingPages = [
      'README.mdx',
      'capabilities.mdx',
      'tutorials/README.mdx',
      'api-guide/README.md',
      'api-reference/README.md',
      'developer-guide/README.md',
      'api-reference/core/README.md',
      'api-reference/engine/README.md',
      'api-reference/shadertools/README.md',
      'api-reference/gpgpu/README.md',
      'api-reference/tables/README.mdx',
      'api-reference/gltf/README.md',
      'api-reference/test-utils/README.md'
    ];
    for (const relativePath of landingPages) {
      expect(readFileSync(join(DOCS_DIRECTORY, relativePath), 'utf8'), relativePath).toMatch(
        /^---[\s\S]*?^description:\s+\S.*$[\s\S]*?^---$/m
      );
    }
  });

  it('gives every curated page one accessible level-one heading', () => {
    const errors: string[] = [];
    for (const path of markdownFiles) {
      const source = readFileSync(path, 'utf8');
      const markdownHeadings = source.match(/^#\s+.+$/gm)?.length || 0;
      const jsxHeadings = source.match(/<h1(?:\s|>)/g)?.length || 0;
      if (markdownHeadings + jsxHeadings !== 1) {
        errors.push(`${getRouteForFile(path)}: ${markdownHeadings + jsxHeadings} H1 headings`);
      }
    }
    expect(errors).toEqual([]);
  });

  it('has balanced Markdown table rows', () => {
    const errors: string[] = [];
    for (const path of markdownFiles.filter(path => !path.includes('/legacy/'))) {
      const lines = readFileSync(path, 'utf8').split('\n');
      let inFence = false;
      for (let lineIndex = 0; lineIndex < lines.length - 1; lineIndex++) {
        const line = lines[lineIndex];
        if (/^```/.test(line.trim())) inFence = !inFence;
        if (inFence) continue;
        const header = getMarkdownTableCells(line);
        const separator = getMarkdownTableCells(lines[lineIndex + 1]);
        const isTable =
          header.length > 1 &&
          separator.length === header.length &&
          separator.every(cell => /^:?-{3,}:?$/.test(cell));
        if (!isTable) continue;

        for (
          let rowIndex = lineIndex + 2;
          rowIndex < lines.length && /^\s*\|/.test(lines[rowIndex]);
          rowIndex++
        ) {
          const cells = getMarkdownTableCells(lines[rowIndex]);
          if (cells.length !== header.length || cells.some(cell => !cell)) {
            errors.push(
              `${getRouteForFile(path)}:${rowIndex + 1} (${cells.length}/${header.length})`
            );
          }
        }
        lineIndex++;
      }
    }
    expect(errors).toEqual([]);
  });

  it('maps every published package runtime export to documentation', () => {
    const entryPoints = PUBLIC_PACKAGE_API_INVENTORY.map(item =>
      join(ROOT_DIRECTORY, item.entryPoint)
    );
    const program = ts.createProgram(entryPoints, {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true
    });
    const checker = program.getTypeChecker();
    const errors: string[] = [];

    for (const item of PUBLIC_PACKAGE_API_INVENTORY) {
      const sourceFile = program.getSourceFile(join(ROOT_DIRECTORY, item.entryPoint));
      const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
      if (!sourceFile || !moduleSymbol) {
        errors.push(`${item.packageName}: entry point was not compiled`);
        continue;
      }

      for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
        if (!isRuntimeExport(symbol, checker)) continue;
        if (item.documentation.kind === 'generated') continue;
        const resolved =
          symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        const declarationPath =
          resolved.declarations?.[0]?.getSourceFile().fileName || sourceFile.fileName;
        const sourceDirectory = dirname(join(ROOT_DIRECTORY, item.entryPoint));
        const sourcePath = relative(sourceDirectory, declarationPath).replace(/\\/g, '/');
        const matchingPrefix = Object.keys(item.documentation.routesBySourcePrefix || {})
          .filter(prefix => sourcePath.startsWith(prefix))
          .sort((left, right) => right.length - left.length)[0];
        const route = matchingPrefix
          ? item.documentation.routesBySourcePrefix?.[matchingPrefix]
          : item.documentation.defaultRoute;
        const tocRoute = resolveInternalRoute(route || '');
        if (!tocRoute || !tocRoutes.has(tocRoute)) {
          errors.push(`${item.packageName}.${symbol.name}: ${route || 'no route'}`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});

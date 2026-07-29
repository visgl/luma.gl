import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {parse} from 'yaml';

type EvalCase = {
  id: string;
  category: string;
  prompt: string;
  expectedBehaviors: string[];
  forbiddenMistakes: string[];
  canonicalSources: string[];
};

type EvalCorpus = {
  version: number;
  description: string;
  cases: EvalCase[];
};

const repositoryDirectory = process.cwd();
const skillDirectory = path.join(repositoryDirectory, 'skills/lumagl');
const skillPath = path.join(skillDirectory, 'SKILL.md');
const evalPath = path.join(repositoryDirectory, 'test/llm/lumagl-skill-evals.json');

function readSkillFrontmatter(): {frontmatter: Record<string, unknown>; body: string} {
  const skill = readFileSync(skillPath, 'utf8');
  const match = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  expect(match, 'SKILL.md must have YAML frontmatter').not.toBeNull();

  return {
    frontmatter: parse(match?.[1] || ''),
    body: match?.[2] || ''
  };
}

describe('lumagl Agent Skill', () => {
  test('uses valid portable frontmatter and local references', () => {
    const {frontmatter, body} = readSkillFrontmatter();

    expect(Object.keys(frontmatter).sort()).toEqual(['description', 'name']);
    expect(frontmatter.name).toBe('lumagl');
    expect(typeof frontmatter.description).toBe('string');
    expect((frontmatter.description as string).length).toBeGreaterThan(80);

    const referenceLinks = [...body.matchAll(/\]\((references\/[^)]+\.md)\)/g)].map(
      match => match[1]
    );
    expect(new Set(referenceLinks).size).toBe(4);
    for (const referenceLink of referenceLinks) {
      expect(existsSync(path.join(skillDirectory, referenceLink))).toBe(true);
    }

    expect(existsSync(path.join(skillDirectory, 'agents/openai.yaml'))).toBe(false);
    expect(existsSync(path.join(skillDirectory, 'scripts'))).toBe(false);
  });

  test('has a valid offline eval corpus with resolvable canonical sources', () => {
    const corpus = JSON.parse(readFileSync(evalPath, 'utf8')) as EvalCorpus;

    expect(corpus.version).toBe(1);
    expect(corpus.description.length).toBeGreaterThan(40);
    expect(corpus.cases.length).toBeGreaterThanOrEqual(9);

    const caseIds = new Set<string>();
    const categories = new Set<string>();
    for (const evalCase of corpus.cases) {
      expect(evalCase.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(caseIds.has(evalCase.id), `duplicate eval id: ${evalCase.id}`).toBe(false);
      caseIds.add(evalCase.id);
      categories.add(evalCase.category);

      expect(evalCase.prompt.length).toBeGreaterThan(30);
      expect(evalCase.expectedBehaviors.length).toBeGreaterThanOrEqual(3);
      expect(evalCase.forbiddenMistakes.length).toBeGreaterThanOrEqual(2);
      expect(evalCase.canonicalSources.length).toBeGreaterThanOrEqual(2);

      for (const source of evalCase.canonicalSources) {
        expect(path.isAbsolute(source), `${source} must be repository-relative`).toBe(false);
        expect(source.split('/')).not.toContain('..');
        expect(existsSync(path.join(repositoryDirectory, source)), `missing ${source}`).toBe(true);
      }
    }

    expect(categories).toEqual(
      new Set([
        'application-setup',
        'outdated-apis',
        'webgpu-only-features',
        'blank-canvases',
        'bindings-and-layouts',
        'resource-cleanup',
        'backend-portability',
        'contributor-testing',
        'website-debugging'
      ])
    );
  });
});

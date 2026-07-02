import React, {useEffect, useMemo, useState} from 'react';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styled from 'styled-components';

type ExampleBackend = 'webgpu' | 'webgl2';
type ExampleDifficulty = 'beginner' | 'intermediate' | 'advanced';
type ExampleMaturity = 'stable' | 'experimental';

type ExampleCustomProps = {
  backends?: ExampleBackend[];
  description?: string;
  difficulty?: ExampleDifficulty;
  maturity?: ExampleMaturity;
  topics?: string[];
};

export type SidebarDocItem = {
  type?: 'doc' | 'link';
  label: string;
  href?: string;
  docId?: string;
  customProps?: ExampleCustomProps;
};

type SidebarCategoryItem = {
  type: 'category';
  label: string;
  items: Array<SidebarDocItem | SidebarCategoryItem>;
};

type SidebarRoot = {
  label?: string;
  items: Array<SidebarDocItem | SidebarCategoryItem>;
};

type CatalogItem = SidebarDocItem & {
  backends: ExampleBackend[];
  category: string;
  description: string;
  difficulty: ExampleDifficulty;
  maturity: ExampleMaturity;
  topics: string[];
};

type ExamplesIndexProps = {
  getThumbnail: (item: SidebarDocItem) => string;
};

const MainExamples = styled.main`
  padding: 1rem 0 2rem;
`;

const CatalogControls = styled.div`
  background: var(--ifm-background-surface-color);
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 12px;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(14rem, 2fr) repeat(4, minmax(8rem, 1fr));
  margin: 0 1rem 1.5rem;
  padding: 1rem;

  input,
  select {
    background: var(--ifm-background-color);
    border: 1px solid var(--ifm-color-emphasis-300);
    border-radius: 8px;
    color: var(--ifm-font-color-base);
    font: inherit;
    min-height: 2.65rem;
    padding: 0.55rem 0.7rem;
    width: 100%;
  }

  @media screen and (max-width: 996px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    input {
      grid-column: 1 / -1;
    }
  }

  @media screen and (max-width: 520px) {
    grid-template-columns: 1fr;

    input {
      grid-column: auto;
    }
  }
`;

const ResultsSummary = styled.p`
  color: var(--ifm-color-emphasis-700);
  margin: 0 1rem 1rem;
`;

const ExampleSection = styled.section`
  margin: 0 1rem 2rem;
`;

const ExampleHeader = styled.h2`
  border-bottom: 1px solid var(--ifm-color-emphasis-200);
  margin: 0 0 1rem;
  padding-bottom: 0.45rem;
`;

const ExamplesGroup = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;

const ExampleCard = styled.a`
  background: var(--ifm-background-surface-color);
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 10px;
  color: var(--ifm-font-color-base);
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
  transition: border-color var(--ifm-transition-fast), box-shadow var(--ifm-transition-fast),
    transform var(--ifm-transition-fast);

  &:hover,
  &:focus-visible {
    border-color: var(--ifm-color-primary);
    box-shadow: var(--ifm-global-shadow-md);
    color: var(--ifm-font-color-base);
    text-decoration: none;
    transform: translateY(-2px);
  }

  img {
    aspect-ratio: 16 / 9;
    background: var(--ifm-color-emphasis-100);
    object-fit: cover;
    width: 100%;
  }
`;

const CardBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem;

  h3 {
    font-size: 1.08rem;
    margin: 0;
  }

  p {
    color: var(--ifm-color-emphasis-700);
    font-size: 0.9rem;
    line-height: 1.45;
    margin: 0;
  }
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: auto;
`;

const Badge = styled.span`
  background: var(--ifm-color-emphasis-100);
  border: 1px solid var(--ifm-color-emphasis-200);
  border-radius: 999px;
  color: var(--ifm-color-emphasis-800);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.18rem 0.45rem;
`;

export function ExamplesIndex({getThumbnail}: ExamplesIndexProps) {
  const sidebar = useDocsSidebar() as SidebarRoot;
  const baseUrl = useBaseUrl('/');
  const catalog = useMemo(() => buildCatalog(sidebar), [sidebar]);
  const topics = useMemo(
    () => [...new Set(catalog.flatMap(item => item.topics))].sort(),
    [catalog]
  );
  const [query, setQuery] = useState('');
  const [backend, setBackend] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [maturity, setMaturity] = useState('all');
  const [topic, setTopic] = useState('all');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    setQuery(parameters.get('q') || '');
    setBackend(parameters.get('backend') || 'all');
    setDifficulty(parameters.get('difficulty') || 'all');
    setMaturity(parameters.get('maturity') || 'all');
    setTopic(parameters.get('topic') || 'all');
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    const parameters = new URLSearchParams();
    if (query) parameters.set('q', query);
    if (backend !== 'all') parameters.set('backend', backend);
    if (difficulty !== 'all') parameters.set('difficulty', difficulty);
    if (maturity !== 'all') parameters.set('maturity', maturity);
    if (topic !== 'all') parameters.set('topic', topic);
    const search = parameters.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  }, [backend, difficulty, isInitialized, maturity, query, topic]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCatalog = catalog.filter(item => {
    const searchableText = [item.label, item.description, item.category, ...item.topics]
      .join(' ')
      .toLowerCase();
    return (
      (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
      (backend === 'all' || item.backends.includes(backend as ExampleBackend)) &&
      (difficulty === 'all' || item.difficulty === difficulty) &&
      (maturity === 'all' || item.maturity === maturity) &&
      (topic === 'all' || item.topics.includes(topic))
    );
  });
  const categories = groupByCategory(filteredCatalog);

  return (
    <MainExamples>
      <CatalogControls aria-label="Filter examples">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search examples, APIs, and topics…"
          aria-label="Search examples"
        />
        <FilterSelect label="Backend" value={backend} onChange={setBackend} options={['webgpu', 'webgl2']} />
        <FilterSelect
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={['beginner', 'intermediate', 'advanced']}
        />
        <FilterSelect
          label="Maturity"
          value={maturity}
          onChange={setMaturity}
          options={['stable', 'experimental']}
        />
        <FilterSelect label="Topic" value={topic} onChange={setTopic} options={topics} />
      </CatalogControls>
      <ResultsSummary aria-live="polite">
        Showing {filteredCatalog.length} of {catalog.length} examples
      </ResultsSummary>
      {categories.map(([category, items]) => (
        <ExampleSection key={category}>
          <ExampleHeader>{category}</ExampleHeader>
          <ExamplesGroup>
            {items.map(item => {
              const thumbnail = getThumbnail(item);
              const imageUrl = `${baseUrl}${thumbnail.replace(/^\//, '')}`;
              return (
                <ExampleCard key={item.href || item.docId || item.label} href={item.href}>
                  <img src={imageUrl} alt="" />
                  <CardBody>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                    <Badges>
                      {item.backends.map(value => <Badge key={value}>{value}</Badge>)}
                      <Badge>{item.difficulty}</Badge>
                      {item.maturity === 'experimental' ? <Badge>experimental</Badge> : null}
                    </Badges>
                  </CardBody>
                </ExampleCard>
              );
            })}
          </ExamplesGroup>
        </ExampleSection>
      ))}
      {filteredCatalog.length === 0 ? (
        <ResultsSummary>No examples match the selected filters.</ResultsSummary>
      ) : null}
    </MainExamples>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      <option value="all">{getAllOptionsLabel(label)}</option>
      {options.map(option => <option key={option} value={option}>{formatLabel(option)}</option>)}
    </select>
  );
}

function buildCatalog(sidebar: SidebarRoot): CatalogItem[] {
  const catalog: CatalogItem[] = [];

  const visit = (items: Array<SidebarDocItem | SidebarCategoryItem>, category = 'Examples') => {
    for (const item of items) {
      if (item.type === 'category') {
        visit(item.items, item.label);
      } else if (item.docId !== 'index') {
        catalog.push(normalizeItem(item, category));
      }
    }
  };

  visit(sidebar.items);
  return catalog;
}

function normalizeItem(item: SidebarDocItem, category: string): CatalogItem {
  const customProps = item.customProps || {};
  const topic = getDefaultTopic(category);
  return {
    ...item,
    backends: customProps.backends || getDefaultBackends(category),
    category,
    description: customProps.description || `${item.label} — ${category.toLowerCase()} example.`,
    difficulty: customProps.difficulty || getDefaultDifficulty(category),
    maturity: customProps.maturity || (category === 'Experimental' ? 'experimental' : 'stable'),
    topics: customProps.topics || [topic]
  };
}

function getDefaultBackends(category: string): ExampleBackend[] {
  return category.includes('GPU Data') ? ['webgpu'] : ['webgpu', 'webgl2'];
}

function getDefaultDifficulty(category: string): ExampleDifficulty {
  if (category === 'Tutorials') return 'beginner';
  if (category === 'Experimental' || category.includes('Arrow')) return 'advanced';
  return 'intermediate';
}

function getDefaultTopic(category: string): string {
  if (category === 'Tutorials') return 'fundamentals';
  if (category === 'Integrations') return 'integration';
  if (category.includes('GPU Data') || category.includes('Arrow')) return 'data';
  if (category === 'API') return 'api';
  return 'rendering';
}

function groupByCategory(items: CatalogItem[]): Array<[string, CatalogItem[]]> {
  const groups = new Map<string, CatalogItem[]>();
  for (const item of items) {
    const group = groups.get(item.category) || [];
    group.push(item);
    groups.set(item.category, group);
  }
  return [...groups.entries()];
}

function formatLabel(value: string): string {
  return value === 'webgpu' ? 'WebGPU' : value === 'webgl2' ? 'WebGL2' : `${value[0].toUpperCase()}${value.slice(1)}`;
}

function getAllOptionsLabel(label: string): string {
  const labels: Record<string, string> = {
    Backend: 'All backends',
    Difficulty: 'All difficulties',
    Maturity: 'All maturity levels',
    Topic: 'All topics'
  };
  return labels[label] || `All ${label.toLowerCase()} options`;
}

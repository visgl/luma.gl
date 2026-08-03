import React, {useEffect, useMemo, useState} from 'react';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './examples-index.module.css';

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
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search ? `?${search}` : ''}`
    );
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
    <main className={styles.mainExamples}>
      <div className={styles.catalogControls} aria-label="Filter examples">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search examples, APIs, and topics…"
          aria-label="Search examples"
        />
        <FilterSelect
          label="Backend"
          value={backend}
          onChange={setBackend}
          options={['webgpu', 'webgl2']}
        />
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
      </div>
      <p className={styles.resultsSummary} aria-live="polite">
        Showing {filteredCatalog.length} of {catalog.length} examples
      </p>
      {categories.map(([category, items]) => (
        <section className={styles.exampleSection} key={category}>
          <h2 className={styles.exampleHeader}>{category}</h2>
          <div className={styles.examplesGroup}>
            {items.map(item => {
              const thumbnail = getThumbnail(item);
              const imageUrl = `${baseUrl}${thumbnail.replace(/^\//, '')}`;
              return (
                <a
                  className={styles.exampleCard}
                  key={item.href || item.docId || item.label}
                  href={item.href}
                >
                  <img src={imageUrl} alt="" />
                  <div className={styles.cardBody}>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                    <div className={styles.badges}>
                      {item.backends.map(value => (
                        <span className={styles.badge} key={value}>
                          {value}
                        </span>
                      ))}
                      <span className={styles.badge}>{item.difficulty}</span>
                      {item.maturity === 'experimental' ? (
                        <span className={styles.badge}>experimental</span>
                      ) : null}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
      {filteredCatalog.length === 0 ? (
        <p className={styles.resultsSummary}>No examples match the selected filters.</p>
      ) : null}
    </main>
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
      {options.map(option => (
        <option key={option} value={option}>
          {formatLabel(option)}
        </option>
      ))}
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
    maturity: customProps.maturity || getDefaultMaturity(category),
    topics: customProps.topics || [topic]
  };
}

function getDefaultBackends(category: string): ExampleBackend[] {
  return category === 'WebGPU' ||
    category.includes('GPU Data') ||
    category.includes('GPU Command Graph')
    ? ['webgpu']
    : ['webgpu', 'webgl2'];
}

function getDefaultDifficulty(category: string): ExampleDifficulty {
  if (category === 'Tutorials') return 'beginner';
  if (
    category === 'Experimental' ||
    category === 'WebGPU' ||
    category.includes('Arrow') ||
    category.includes('GPU Command Graph')
  ) {
    return 'advanced';
  }
  return 'intermediate';
}

function getDefaultMaturity(category: string): ExampleMaturity {
  return category === 'Experimental' ||
    category === 'WebGPU' ||
    category.includes('GPU Command Graph')
    ? 'experimental'
    : 'stable';
}

function getDefaultTopic(category: string): string {
  if (category === 'Tutorials') return 'fundamentals';
  if (category === 'Integrations') return 'integration';
  if (category.includes('GPU Command Graph')) return 'compute';
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
  return value === 'webgpu'
    ? 'WebGPU'
    : value === 'webgl2'
      ? 'WebGL2'
      : `${value[0].toUpperCase()}${value.slice(1)}`;
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

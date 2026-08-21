import React, {useEffect, useMemo, useState} from 'react';
import {useDocsSidebar, useDocsVersion} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {ExampleCard} from './example-card';
import styles from './examples-index.module.css';

type ExampleBackend = 'webgpu' | 'webgl2';
type ExampleDifficulty = 'tutorial' | 'intermediate' | 'advanced';
type ExampleDisplay = 'hdr-capable' | 'standard';
type ExampleMaturity = 'stable' | 'experimental';

type ExampleCustomProps = {
  backends?: ExampleBackend[];
  difficulty?: ExampleDifficulty;
  display?: ExampleDisplay;
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
  display: ExampleDisplay;
  maturity: ExampleMaturity;
  topics: string[];
};

type CatalogDocument = {
  description?: string;
};

type ExamplesIndexProps = {
  getThumbnail: (item: SidebarDocItem) => string;
};

export function ExamplesIndex({getThumbnail}: ExamplesIndexProps) {
  const sidebar = useDocsSidebar() as SidebarRoot;
  const {docs} = useDocsVersion();
  const baseUrl = useBaseUrl('/');
  const catalog = useMemo(() => buildCatalog(sidebar, docs), [docs, sidebar]);
  const topics = useMemo(
    () => [...new Set(catalog.flatMap(item => item.topics))].sort(),
    [catalog]
  );
  const [query, setQuery] = useState('');
  const [backend, setBackend] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [displayMode, setDisplayMode] = useState('all');
  const [maturity, setMaturity] = useState('all');
  const [topic, setTopic] = useState('all');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    setQuery(parameters.get('q') || '');
    setBackend(parameters.get('backend') || 'all');
    setDifficulty(parameters.get('difficulty') || 'all');
    setDisplayMode(parameters.get('display') || 'all');
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
    if (displayMode !== 'all') parameters.set('display', displayMode);
    if (maturity !== 'all') parameters.set('maturity', maturity);
    if (topic !== 'all') parameters.set('topic', topic);
    const search = parameters.toString();
    const currentSearch = window.location.search.replace(/^\?/, '');
    if (search !== currentSearch) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
      );
    }
  }, [backend, difficulty, displayMode, isInitialized, maturity, query, topic]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCatalog = catalog.filter(item => {
    const searchableText = [
      item.label,
      item.description,
      item.category,
      item.display,
      ...item.topics
    ]
      .join(' ')
      .toLowerCase();
    return (
      (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
      (backend === 'all' || item.backends.includes(backend as ExampleBackend)) &&
      (difficulty === 'all' || item.difficulty === difficulty) &&
      (displayMode === 'all' || item.display === displayMode) &&
      (maturity === 'all' || item.maturity === maturity) &&
      (topic === 'all' || item.topics.includes(topic))
    );
  });
  const categories = groupByCategory(filteredCatalog);
  const activeFilterCount =
    [backend, difficulty, displayMode, maturity, topic].filter(value => value !== 'all').length +
    Number(Boolean(query));

  const clearFilters = () => {
    setQuery('');
    setBackend('all');
    setDifficulty('all');
    setDisplayMode('all');
    setMaturity('all');
    setTopic('all');
  };

  return (
    <div className={styles.mainExamples}>
      <div className={styles.catalogControls} aria-label="Find examples">
        <div className={styles.controlsHeading}>
          <div>
            <p className={styles.controlsEyebrow}>Find examples</p>
            <p className={styles.controlsIntroduction}>
              Search by name, topic, graphics API, or difficulty.
            </p>
          </div>
          <span className={styles.catalogCount}>{catalog.length} examples</span>
        </div>

        <div className={styles.searchField}>
          <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" />
            <path d="m12.5 12.5 4.25 4.25" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search examples, APIs, and techniques…"
            aria-label="Search examples"
          />
        </div>

        <div className={styles.filterGrid}>
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
            options={['tutorial', 'intermediate', 'advanced']}
          />
          <FilterSelect
            label="Display"
            value={displayMode}
            onChange={setDisplayMode}
            options={['hdr-capable', 'standard']}
          />
          <FilterSelect
            label="Maturity"
            value={maturity}
            onChange={setMaturity}
            options={['stable', 'experimental']}
          />
          <FilterSelect label="Topic" value={topic} onChange={setTopic} options={topics} />
        </div>
      </div>

      <div className={styles.resultsBar}>
        <p className={styles.resultsSummary} aria-live="polite">
          Showing {filteredCatalog.length} of {catalog.length} examples
        </p>
        {activeFilterCount > 0 ? (
          <button className={styles.clearFilters} type="button" onClick={clearFilters}>
            Clear {activeFilterCount === 1 ? 'filter' : `${activeFilterCount} filters`}
          </button>
        ) : null}
      </div>

      {categories.map(([category, items]) => (
        <section className={styles.exampleSection} key={category}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>{getCategoryEyebrow(category)}</p>
              <h2 className={styles.exampleHeader}>{category}</h2>
            </div>
            <span className={styles.sectionCount} aria-label={`${items.length} examples`}>
              {String(items.length).padStart(2, '0')}
            </span>
          </div>
          <div className={styles.examplesGroup}>
            {items.map(item => {
              const thumbnail = getThumbnail(item);
              const imageUrl = `${baseUrl}${thumbnail.replace(/^\//, '')}`;
              return (
                <ExampleCard
                  key={item.href || item.docId || item.label}
                  href={item.href}
                  imageUrl={imageUrl}
                  title={item.label}
                  description={item.description}
                  category={item.category}
                  backends={item.backends}
                  highDynamicRange={item.display === 'hdr-capable'}
                  difficulty={item.difficulty}
                  maturity={item.maturity}
                  topics={item.topics}
                />
              );
            })}
          </div>
        </section>
      ))}
      {filteredCatalog.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No examples match the selected filters.</p>
          <button className={styles.clearFilters} type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      ) : null}
    </div>
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

function buildCatalog(
  sidebar: SidebarRoot,
  documents: Record<string, CatalogDocument>
): CatalogItem[] {
  const catalog: CatalogItem[] = [];

  const visit = (items: Array<SidebarDocItem | SidebarCategoryItem>, category = 'Examples') => {
    for (const item of items) {
      if (item.type === 'category') {
        visit(item.items, item.label);
      } else if (item.docId !== 'index') {
        const documentDescription = item.docId ? documents[item.docId]?.description : undefined;
        catalog.push(normalizeItem(item, category, documentDescription));
      }
    }
  };

  visit(sidebar.items);
  return catalog;
}

function normalizeItem(
  item: SidebarDocItem,
  category: string,
  documentDescription?: string
): CatalogItem {
  const customProps = item.customProps || {};
  const topic = getDefaultTopic(category);
  return {
    ...item,
    backends: customProps.backends || getDefaultBackends(category),
    category,
    description: documentDescription || `${item.label} — ${category.toLowerCase()} example.`,
    difficulty: customProps.difficulty || getDefaultDifficulty(category),
    display: customProps.display || 'standard',
    maturity: customProps.maturity || getDefaultMaturity(category),
    topics: customProps.topics || [topic]
  };
}

function getDefaultBackends(category: string): ExampleBackend[] {
  return category === 'WebGPU' || isGeneralPurposeGPUCategory(category)
    ? ['webgpu']
    : ['webgpu', 'webgl2'];
}

function isGeneralPurposeGPUCategory(category: string): boolean {
  return category === 'Compute and analytics' ||
    category === 'Rendering and inspection' ||
    category === 'Simulation and data';
}

function getDefaultDifficulty(category: string): ExampleDifficulty {
  if (category === 'Tutorials') return 'tutorial';
  if (
    category === 'Experimental' ||
    category === 'WebGPU' ||
    isGeneralPurposeGPUCategory(category) ||
    category.includes('Arrow')
  ) {
    return 'advanced';
  }
  return 'intermediate';
}

function getDefaultMaturity(category: string): ExampleMaturity {
  return category === 'Experimental' ||
    category === 'WebGPU' ||
    isGeneralPurposeGPUCategory(category)
    ? 'experimental'
    : 'stable';
}

function getDefaultTopic(category: string): string {
  if (category === 'Tutorials') return 'fundamentals';
  if (category === 'Integrations') return 'integration';
  if (isGeneralPurposeGPUCategory(category)) return 'compute';
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

function getCategoryEyebrow(category: string): string {
  if (category === 'WebGPU') return 'Next-generation graphics';
  if (category === 'Effects') return 'Image, lighting, and post-processing';
  if (category === 'Simulation and data') return 'Interactive simulations and GPU-native data';
  if (isGeneralPurposeGPUCategory(category)) {
    return 'Compute, projections, and GPU-native data';
  }
  if (category === 'Showcase') return 'Featured examples';
  if (category === 'Tutorials') return 'Learn by building';
  if (category === 'Experimental') return 'Emerging techniques';
  if (category === 'Integrations') return 'Works with your stack';
  if (category.includes('Arrow') || category.includes('Data')) return 'GPU-native data';
  return 'Core capabilities';
}

function formatLabel(value: string): string {
  return value === 'webgpu'
    ? 'WebGPU'
    : value === 'webgl2'
      ? 'WebGL2'
      : value === 'hdr-capable'
        ? 'HDR capable'
        : `${value[0].toUpperCase()}${value.slice(1)}`;
}

function getAllOptionsLabel(label: string): string {
  const labels: Record<string, string> = {
    Backend: 'All backends',
    Difficulty: 'All difficulties',
    Display: 'All displays',
    Maturity: 'All maturity levels',
    Topic: 'All topics'
  };
  return labels[label] || `All ${label.toLowerCase()} options`;
}

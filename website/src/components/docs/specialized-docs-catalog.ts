import type {DocumentationTab} from './docs-page-tabs';

export type AnariGuideTabId = 'overview' | 'first-scene' | 'architecture' | 'json-scenes';

export const ANARI_GUIDE_TABS: readonly DocumentationTab<AnariGuideTabId>[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-guide/engine/anari-rendering'},
  {id: 'first-scene', label: 'First scene', href: '/docs/api-guide/engine/anari-first-scene'},
  {id: 'architecture', label: 'Architecture', href: '/docs/api-guide/engine/anari-architecture'},
  {id: 'json-scenes', label: 'JSON scenes', href: '/docs/api-guide/engine/anari-json-scenes'}
];

export type SplatsDocsTabId =
  | 'overview'
  | 'renderers'
  | 'data-shading'
  | 'streaming'
  | 'picking-scenes'
  | 'formats-loaders';

export const SPLATS_DOCS_TABS: readonly DocumentationTab<SplatsDocsTabId>[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/splats'},
  {id: 'renderers', label: 'Renderers', href: '/docs/api-reference/splats/renderers'},
  {id: 'data-shading', label: 'Data & shading', href: '/docs/api-reference/splats/data-and-shading'},
  {id: 'streaming', label: 'Streaming', href: '/docs/api-reference/splats/streaming-and-residency'},
  {id: 'picking-scenes', label: 'Picking & scenes', href: '/docs/api-reference/splats/picking-and-scenes'},
  {id: 'formats-loaders', label: 'Formats & loaders', href: '/docs/api-reference/splats/formats-and-loaders'}
];

export type GltfCrowdDocsTabId = 'overview' | 'usage' | 'performance' | 'api';

export const GLTF_CROWD_DOCS_TABS: readonly DocumentationTab<GltfCrowdDocsTabId>[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/gltf/gltf-animated-crowd'},
  {id: 'usage', label: 'Usage', href: '/docs/api-reference/gltf/gltf-crowd-usage'},
  {id: 'performance', label: 'Performance & LOD', href: '/docs/api-reference/gltf/gltf-crowd-performance'},
  {id: 'api', label: 'API', href: '/docs/api-reference/gltf/gltf-crowd-api'}
];

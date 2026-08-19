import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

type GltfDocsTab = {id: NativeGltfDocsTabId; label: string; href: string};

/** glTF documentation tab identifiers. */
export type GltfDocsTabId = 'overview' | 'materials' | 'animation' | 'interchange' | 'extensions';

type NativeGltfDocsTabId = GltfDocsTabId | 'native-extensions' | 'animated-crowd';

const GLTF_DOCS_TABS: GltfDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/gltf'},
  {id: 'materials', label: 'Materials', href: '/docs/api-reference/gltf/gltf-materials'},
  {
    id: 'native-extensions',
    label: 'Native Extensions',
    href: '/docs/api-reference/gltf/gltf-native-extensions'
  },
  {id: 'animation', label: 'Animation', href: '/docs/api-reference/gltf/gltf-animation'},
  {
    id: 'animated-crowd',
    label: 'Animated Crowd',
    href: '/docs/api-reference/gltf/gltf-animated-crowd'
  },
  {id: 'interchange', label: 'Interchange', href: '/docs/api-reference/gltf/gltf-interchange'},
  {id: 'extensions', label: 'Extensions', href: '/docs/api-reference/gltf/gltf-extensions'}
];

/** Renders page links with the same visual treatment as tabs for glTF documentation pages. */
export function GltfDocsTabs({active}: {active: NativeGltfDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'glTF documentation', tabs: GLTF_DOCS_TABS}} />;
}

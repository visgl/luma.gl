import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './framework-module-cards.module.css';

type FrameworkModule = {
  capabilities: readonly string[];
  description: string;
  documentationPath: string;
  id: 'portability' | 'engine' | 'shaders' | 'effects' | 'anari' | 'splats' | 'gpgpu';
  label: string;
  packageName: string;
  title: string;
};

const FRAMEWORK_MODULES: readonly FrameworkModule[] = [
  {
    id: 'portability',
    title: 'Core / WebGPU / WebGL',
    packageName: '@luma.gl/core + adapters',
    label: 'GPU portability',
    description:
      'One low-level GPU portability layer for buffers, pipelines, textures, and rendering across WebGPU and WebGL2.',
    capabilities: ['WebGPU', 'WebGL2', 'GPU resources'],
    documentationPath: 'docs/api-reference/core'
  },
  {
    id: 'engine',
    title: 'Engine',
    packageName: '@luma.gl/engine',
    label: 'Rendering toolkit',
    description:
      'The classic luma.gl API for models, animation loops, geometry, picking, and composable rendering.',
    capabilities: ['Models', 'Animation', 'Geometry'],
    documentationPath: 'docs/api-reference/engine'
  },
  {
    id: 'shaders',
    title: 'Shader Tools',
    packageName: '@luma.gl/shadertools',
    label: 'Shader programming',
    description:
      'Write, assemble, and share portable shaders with a reusable module library for both WGSL and GLSL.',
    capabilities: ['WGSL', 'GLSL', 'Shader modules'],
    documentationPath: 'docs/api-reference/shadertools'
  },
  {
    id: 'effects',
    title: 'Effects',
    packageName: '@luma.gl/effects',
    label: 'Composable effects',
    description:
      'Compose reusable shader effects into complete post-processing, lighting, and image-processing pipelines.',
    capabilities: ['Bloom', 'Tone mapping', 'Shader passes'],
    documentationPath: 'docs/api-reference/shadertools/shader-passes/image-processing'
  },
  {
    id: 'anari',
    title: 'ANARI',
    packageName: '@luma.gl/scene',
    label: 'Declarative 3D',
    description:
      'Describe declarative 3D scenes with glTF and OpenUSD, then switch renderers without rebuilding the world.',
    capabilities: ['glTF', 'OpenUSD', 'Renderers'],
    documentationPath: 'docs/api-reference/scene'
  },
  {
    id: 'splats',
    title: 'Splats',
    packageName: '@luma.gl/splats',
    label: 'Captured scenes',
    description:
      'Stream and render Gaussian splats with depth ordering, high-dynamic-range color, and reusable GPU data.',
    capabilities: ['Streaming', 'Gaussian splats', 'HDR'],
    documentationPath: 'docs/api-reference/splats'
  },
  {
    id: 'gpgpu',
    title: 'GPGPU',
    packageName: '@luma.gl/gpgpu',
    label: 'GPU compute + rendering',
    description:
      'Connect reusable compute modules and rendering in a single GPU-native pipeline, without moving data back to the CPU.',
    capabilities: ['GPU workflows', 'Compute modules', 'Zero readback'],
    documentationPath: 'docs/api-reference/gpgpu'
  }
];

/** Responsive, reusable overview of the primary luma.gl framework modules. */
export function FrameworkModuleCards(): React.JSX.Element {
  const baseUrl = useBaseUrl('/');

  return (
    <div className={styles.grid} role="list" aria-label="luma.gl framework modules">
      {FRAMEWORK_MODULES.map((frameworkModule, index) => (
        <a
          className={styles.card}
          data-framework-module={frameworkModule.id}
          href={`${baseUrl}${frameworkModule.documentationPath}`}
          key={frameworkModule.id}
          role="listitem"
        >
          <div className={styles.artwork} aria-hidden="true">
            <span className={styles.artworkField} />
            <span className={styles.artworkForm} />
            <span className={styles.artworkDetail} />
          </div>

          <div className={styles.cardHeader}>
            <span className={styles.packageName}>{frameworkModule.packageName}</span>
            <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
          </div>

          <div className={styles.content}>
            <p className={styles.label}>{frameworkModule.label}</p>
            <h3 className={styles.title}>{frameworkModule.title}</h3>
            <p className={styles.description}>{frameworkModule.description}</p>
          </div>

          <div className={styles.cardFooter}>
            <ul className={styles.capabilities} aria-label={`${frameworkModule.title} capabilities`}>
              {frameworkModule.capabilities.map(capability => (
                <li className={styles.capability} key={capability}>
                  {capability}
                </li>
              ))}
            </ul>
            <span className={styles.documentationLink} aria-hidden="true">
              Docs
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M6 14 14 6M7 6h7v7" />
              </svg>
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

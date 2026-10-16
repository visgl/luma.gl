// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './module-cards.module.css';

type DocumentationModule = {
  name: string;
  description: string;
  image: string;
};

const DOCUMENTATION_MODULES: readonly DocumentationModule[] = [
  {
    name: 'core',
    description: 'Portable GPU resources, shader types, and WebGPU and WebGL2 backends.',
    image: 'tutorials/hello-cube'
  },
  {
    name: 'engine',
    description: 'Models, geometry, animation, picking, and rendering helpers.',
    image: 'showcase/instancing'
  },
  {
    name: 'shadertools',
    description: 'Compose WGSL and GLSL with reusable shader modules and hooks.',
    image: 'tutorials/shader-modules'
  },
  {
    name: 'effects',
    description: 'Build post-processing pipelines with composable image and lighting effects.',
    image: 'showcase/postprocessing'
  },
  {
    name: 'gpgpu',
    description: 'Connect compute operations, GPU data, and rendering without CPU readback.',
    image: 'experimental/gpu-parquet-constellation'
  },
  {
    name: 'arrow',
    description: 'Upload Apache Arrow columns and connect tabular data to GPU workflows.',
    image: 'arrow/arrow-points'
  },
  {
    name: 'scene',
    description: 'Describe 3D scenes and switch renderers through the ANARI scene API.',
    image: 'deck/city-scene'
  },
  {
    name: 'gltf',
    description: 'Load glTF assets, materials, lights, skins, and animations.',
    image: 'showcase/gltf'
  },
  {
    name: 'splats',
    description: 'Stream, sort, and render Gaussian splat scenes.',
    image: 'showcase/gaussian-splats'
  },
  {
    name: 'slang',
    description: 'Compile Slang shaders with reflection and typed shader contracts.',
    image: 'tutorials/slang-shaders'
  },
  {
    name: 'text',
    description: 'Render GPU text with font atlases and reusable layout helpers.',
    image: 'experimental/text-space-crawl'
  },
  {
    name: 'three',
    description: 'Combine luma.gl GPU workflows with Three.js scenes and renderers.',
    image: 'experimental/three'
  },
  {
    name: 'experimental',
    description: 'Explore emerging GPU tables, rendering models, and spatial tools.',
    image: 'showcase/million-row-crossfilter'
  }
];

/** Links the documentation introduction to each module's API reference. */
export function DocumentationModuleCards(): React.JSX.Element {
  const imageDirectory = useBaseUrl('/images/examples/');

  return (
    <ul className={styles.grid} aria-label="luma.gl modules">
      {DOCUMENTATION_MODULES.map((documentationModule) => (
        <li className={styles.item} key={documentationModule.name}>
          <Link className={styles.card} to={`/docs/api-reference/${documentationModule.name}`}>
            <img
              className={styles.image}
              src={`${imageDirectory}${documentationModule.image}.jpg`}
              alt=""
              loading="lazy"
              width="480"
              height="240"
            />
            <div className={styles.content}>
              <h3 className={styles.name}>@luma.gl/{documentationModule.name}</h3>
              <p className={styles.description}>{documentationModule.description}</p>
              <span className={styles.reference}>
                API reference <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

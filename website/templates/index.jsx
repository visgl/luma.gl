import React from 'react';
import {Home} from 'gatsby-theme-ocular/components';
import InstancingExample from './showcase/example-instancing';
import styled from 'styled-components';

if (typeof window !== 'undefined') {
  window.website = true;
}

const Bullet = styled.li`
  background: url(images/icon-high-precision.svg) no-repeat left top;
  list-style: none;
  max-width: 540px;
  padding: 8px 0 12px 42px;
  font: ${props => props.theme.typography.font300};
`;

const HeroExample = () => <InstancingExample panel={false} />

export default class IndexPage extends React.Component {
  render() {
    return (
      <Home HeroExample={HeroExample} >
        <h2>High-performance toolkit for WebGL-based data visualization.</h2>
        <ul>
          <Bullet>
            luma.gl can provide high-level drawing classes or simply enhance programming directly with the WebGL API.
          </Bullet>
          <Bullet>
            luma.gl polyfills WebGL 1 contexts where possible to provide WebGL 2 API support, relieving developers of common cross-platform support headaches.
          </Bullet>
          <Bullet>
            luma.gl simplifies usage of high-performance APIs for data visualization like instanced rendering and transform feedback.
          </Bullet>
        </ul>
      </Home>
    );
  }
}

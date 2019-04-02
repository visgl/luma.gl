import React, {Component} from 'react';
import {Link} from 'gatsby';
import Stats from 'stats.js';

import ExampleRunner from './example-runner';
import examples from './examples';

const HeroExample = examples.Instancing;

export default class Hero extends Component {

  componentDidMount() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    if (this.refs.fps) {
      this.refs.fps.appendChild(this.stats.dom);
    }

    const calcFPS = () => {
      this.stats.begin();
      this.stats.end();
      this.animationFrame = window.requestAnimationFrame(calcFPS);
    };

    this.animationFrame = window.requestAnimationFrame(calcFPS);
  }

  componentWillUnmount() {
    window.onresize = null;
    window.cancelAnimationFrame(this.animationFrame);
  }

  render() {
    return (
      <section ref="banner" className="banner">
        <div className="f hero">
          <ExampleRunner example={HeroExample} sourceLink={HeroExample.path} noPanel noStats />
        </div>
        <div className="container" style={{background: 'transparent'}}>
          <h1>luma.gl</h1>
          <p>A WebGL2-Powered Framework for GPU-based Visualization and Computation</p>
          <Link to="/docs/get-started" className="btn">
            GET STARTED
          </Link>
        </div>
        <div ref="fps" className="fps" />
      </section>
    );
  }
}

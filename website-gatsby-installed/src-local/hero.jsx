import React, {Component} from 'react';
import {Link} from 'gatsby';
import Stats from 'stats.js';

import DemoRunner from './demo-runner';
import demos from './demos';

const HeroDemo = demos.Instancing;

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
          <DemoRunner demo={HeroDemo.demo} sourceLink={HeroDemo.path} noPanel />
        </div>
        <div className="container">
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

/* global window */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Stats from 'stats.js';

import DemoRunner from './demo-runner';

import {setHeaderOpacity} from '../actions/app-actions';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      demoWidth: 0,
      demoHeight: 0
    };
  }

  componentDidMount() {
    window.onresize = this._resizeHandler.bind(this);
    window.onscroll = this._onScroll.bind(this);
    this._resizeHandler();
    this._onScroll();

    this._stats = new Stats();
    this._stats.showPanel(0);
    if (this.refs.fps) {
      this.refs.fps.appendChild(this._stats.dom);
    }

    const calcFPS = () => {
      this._stats.begin();
      this._stats.end();
      this._animateRef = window.requestAnimationFrame(calcFPS);
    };

    this._animateRef = window.requestAnimationFrame(calcFPS);
  }

  componentWillUnmount() {
    window.onscroll = null;
    window.onresize = null;
    window.cancelAnimationFrame(this._animateRef);
  }

  _resizeHandler() {
    const container = this.refs.banner;
    const demoWidth = container.clientWidth;
    const demoHeight = container.clientHeight;
    this.setState({demoWidth, demoHeight});
  }

  _onScroll() {
    const y = window.pageYOffset;
    const opacity = Math.max(0, Math.min(1, (y - 168) / 20));
    this.props.setHeaderOpacity(opacity);
  }

  render() {
    const {demoWidth, demoHeight} = this.state;

    return (
      <div className="home-wrapper">

        <section ref="banner" id="banner">
          <div className="hero">
            <DemoRunner
              demo="InstancingDemo"
              canvas="front-canvas"
              width={demoWidth}
              height={demoHeight}
              isInteractive={false}/>
          </div>
          <div className="container soft-left" style={{pointerEvents: 'none'}}>
            <h1>luma.gl</h1>
            <p>
              A WebGL2-Powered Framework for GPU-based Visualization and Computation
            </p>
            <a href="#/documentation/getting-started/overview" className="btn"
              style={{pointerEvents: 'auto'}}>
              Get started
            </a>
          </div>
          <div ref="fps" className="fps" />
        </section>

        <section id="features">
          <div className="container soft-left texts">
            <div>
              <h2>
                High-performance WebGL2 components for
                GPU-powered data visualization and computation.
              </h2>
              <hr className="short" />
              <h3>
                <img src="images/icon-high-precision.svg" />
                Advanced GPU Usage
              </h3>
              <p>
                luma.gl simplifies the use of advanced GPU techniques,
                such as Instanced Rendering, Transform Feedback
                and other WebGL2 features.
              </p>

              <h3>
                <img src="images/icon-high-precision.svg" />
                Shader Programming Power
              </h3>
              <p>
                Modularized shader code, classes for controlling
                GPU inputs and outputs, and support for debugging and profiling
                GLSL shaders.
              </p>

              <h3>
                <img src="images/icon-high-precision.svg" />
                Performance Focus
              </h3>
              <p>
                luma.gl's strong focus on performance enables
                visualization and GPU processing of very large data sets.
              </p>

            </div>
          </div>
        </section>

        <hr />

        <section id="footer">
          <div className="container soft-left">
            <h4>Made by</h4>
            <i className="icon icon-uber-logo" />
          </div>
        </section>

      </div>
    );
  }
}

export default connect(null, {setHeaderOpacity})(Home);

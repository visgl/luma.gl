/* global window */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Stats from 'stats.js';

import Context from './context';

import {updateMap, setHeaderOpacity} from '../actions/app-actions';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    window.onscroll = this._onScroll.bind(this);
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

  /*
  _resizeMap() {
    const container = this.refs.banner;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.props.updateMap({width, height});
  }
  */

  _onScroll() {
    const y = window.pageYOffset;
    const opacity = Math.max(0, Math.min(1, (y - 168) / 20));
    this.props.setHeaderOpacity(opacity);
  }

  render() {
    const {atTop} = this.state;
    return (
      <div className={`home-wrapper ${atTop ? 'top' : ''}`}>

        <section ref="banner" id="banner">
          <div className="hero">
            <Context demo="InstancingDemo" isInteractive={false}/>
          </div>
          <div className="container soft-left" style={{opacity: 0.8, backgroundColor: '#000000'}}>
            <h1 style={{opacity: 1}}>luma.gl</h1>
            <p style={{opacity: 1}}>
              A WebGL2-Powered Framework for GPU-based Visualization and Computation
            </p>
            <a style={{opacity: 1}} href="#/documentation/getting-started/overview" className="btn">
              Get started
            </a>
          </div>
          <div ref="fps" className="fps" /> */
        </section>

        <section id="features">
          <div style={{height: 100}}/>
          <div className="image" />
          <div className="container soft-left texts">
            <div>
              <h2>
                luma.gl provides high-performance WebGL2-based components for
                 GPU-powered data visualizations and computations.
              </h2>

              <hr className="short" />
              <h3>
                <img src="images/icon-layers.svg" />
                Advanced GPU Usage
              </h3>
              <p>
                luma.gl simplifies the use of advanced GPU techniques,
                including instanced rendering for extremely large data sets,
                and GPU based computing using Transform Feedback
                and other WebGL2 features.
              </p>

              <h3>
                <img src="images/icon-high-precision.svg" />
                Shader Programming Power
              </h3>
              <p>
                luma.gl takes GLSL shader programming for the Web to the next level.
                Modularized shader code, powerful JavaScript classes for setting up
                GPU inputs and receiving GPU outputs, and extensive support
                for debugging and profiling GLSL shaders.
              </p>

              <h3>
                <img src="images/icon-react.svg" />
                Performance Focus
              </h3>
              <p>
              A strong focus on performance. Due to this focus, luma.gl provides a
              somewhat lower abstraction level than some other WebGL frameworks.
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

export default connect(
  state => ({}),
  {updateMap, setHeaderOpacity}
)(Home);

import React, {Component} from 'react'; // eslint-disable-line
import PropTypes from 'prop-types'; 
import {isBrowser} from '@probe.gl/env';
import {luma, setPathPrefix} from '@luma.gl/api';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {luma} from '@luma.gl/api';
import {WebGLDevice} from '@luma.gl/webgl';
import {WebGPUDevice} from '@luma.gl/webgpu';

// import {VRDisplay} from '@luma.gl/experimental';
import StatsWidget from '@probe.gl/stats-widget';
import {InfoPanel} from 'gatsby-theme-ocular/components';

const GITHUB_TREE = 'https://github.com/visgl/luma.gl/tree/8.2-release';

luma.registerDevices([WebGPUDevice, WebGLDevice]);

// WORKAROUND FOR luma.gl VRDisplay
if (!globalThis.navigator) {// eslint-disable-line
  globalThis.navigator = {};// eslint-disable-line
}

if (typeof window !== 'undefined') {
  window.website = true;
}

const STYLES = {
  EXAMPLE_NOT_SUPPPORTED: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }
};

const STAT_STYLES = {
  position: 'fixed',
  fontSize: '12px',
  zIndex: 10000,
  color: '#fff',
  background: '#000',
  padding: '8px',
  opacity: 0.8
};

const propTypes = {
  AnimationLoop: PropTypes.func.isRequired,
  exampleConfig: PropTypes.object.isRequired,
  canvas: PropTypes.string
};

const defaultProps = {
  canvas: 'example-canvas'
};

const DEFAULT_ALT_TEXT = 'THIS EXAMPLE IS NOT SUPPORTED';

export default class AnimationLoopExamplePage extends Component {
  constructor(props) {
    super(props);
    try {
      // Render loop
      if ('run' in this.props.AnimationLoop) {
        this.animationLoop = AnimationLoopTemplate.run(this.props.AnimationLoop, props);
      } else {
        this.animationLoop = new this.props.AnimationLoop(props);
      }
    } catch (error) {
      this.setState({error});
    }
    this.state = {
      supported: true,
      error: null
    };
  }

  async componentDidMount() {
    if (!this.state.supported) {
      return;
    }

    const {showStats} = this.props;

    // this.animationLoop._setDisplay(new VRDisplay());

    // Ensure the example can find its images
    // TODO - ideally gatsby-theme-ocular should extract images from example source?
    const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/8.5-release';
    const {exampleConfig} = this.props;
    if (exampleConfig && exampleConfig.path) {
      setPathPrefix(`${RAW_GITHUB}/${exampleConfig.path}`);
    } else {
      setPathPrefix(`${RAW_GITHUB}/website/static/images/`);
    }

    // Start the actual example
    try {
      if (isBrowser()) {
        await this.animationLoop.start();
        await this.animationLoop.waitForRender();
        if (this.animationLoop.demoNotSupported) {
          this.setState({supported: false});
        }
        this.setState({error: null});
      }
    } catch (error) {
      this.setState({error});
    }


    // animationLoop.stats.reset();

    if (showStats) {
      this._showStats(this.animationLoop);
    }
  }

  componentWillUnmount() {
    if (!this.state.supported) {
      return;
    }

    this.animationLoop.stop(this.props);
    this.animationLoop.delete();
    this.animationLoop = null;
    // this._stopStats();
  }

  _showStats(animationLoop) {
    const timeWidget = new StatsWidget(animationLoop.stats, {
      container: this.refs.renderStats,
      title: 'Render Time',
      css: {
        header: {
          fontWeight: 'bold'
        }
      },
      framesPerUpdate: 60,
      formatters: {
        'CPU Time': 'averageTime',
        'GPU Time': 'averageTime',
        'Frame Rate': 'fps'
      },
      resetOnUpdate: {
        'CPU Time': true,
        'GPU Time': true,
        'Frame Rate': true
      }
    });

    luma.stats.get('Memory Usage').reset();
    const memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
      container: this.refs.memStats,
      css: {
        header: {
          fontWeight: 'bold'
        }
      },
      framesPerUpdate: 60,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      }
    });

    const updateStats = () => {
      timeWidget.update();
      memWidget.update();
      this.animationFrame = window.requestAnimationFrame(updateStats);
    };

    this.animationFrame = window.requestAnimationFrame(updateStats);
  }

  _stopStats() {
    window.cancelAnimationFrame(this.animationFrame);
  }

  render() {
    const {exampleConfig: {title, path} = {}, panel = true, stats} = this.props;

    if (!this.state.supported) {
      const altText = this.animationLoop.getAltText ? this.animationLoop.getAltText() : DEFAULT_ALT_TEXT;
      return (
        <div style={STYLES.EXAMPLE_NOT_SUPPPORTED}>
          <h2> {altText} </h2>
        </div>
      );
    }

    // HTML is stored on the app
    const controls = 
      this.props.AnimationLoop.info ||
      this.props.AnimationLoop.getInfo?.() ||
      (this.animationLoop.getInfo?.());

    return (
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        {
          stats ?
          <div ref="stats" className="stats" style={STAT_STYLES}>
            <div ref="renderStats" className="renderStats"/>
            <div ref="memStats" className="memStats"/>
          </div> : null
        }
        <canvas
          id={this.props.canvas}
          style={{width: '100%', height: '100%'}}
        />
        {panel && (
          <InfoPanel title={title} sourceLink={`${GITHUB_TREE}/${path}`}>
            <div dangerouslySetInnerHTML={{__html: controls}} />
            {
              this.state.error
                ? (<div> <b style={{color: 'red', overflowWrap: 'break-word', width: 200}}> This sample failed to render: <br /> {this.state.error.message} </b></div>)
                : (<></>)
            }
          </InfoPanel>
        )}
      </div>
    );
  }
}

AnimationLoopExamplePage.propTypes = propTypes;
AnimationLoopExamplePage.defaultProps = defaultProps;
AnimationLoopExamplePage.displayName = 'AnimationLoop';

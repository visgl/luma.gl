import React, {Component} from 'react'; // eslint-disable-line
import PropTypes from 'prop-types';
import {setPathPrefix} from 'luma.gl';

import InfoPanel from './info-panel';

const propTypes = {
  example: PropTypes.object,
  canvas: PropTypes.string
};

const defaultProps = {
  canvas: 'example-canvas'
};

const DEFAULT_ALT_TEXT = 'THIS EXAMPLE IS NOT SUPPORTED';

export default class ExampleRunner extends Component {
  componentDidMount() {
    const {sourceLink} = this.props;
    // Ensure the example can find its images
    // TODO - ideally we should extract images from example source?
    const RAW_GITHUB = 'https://raw.githubusercontent.com/uber/luma.gl/master';
    setPathPrefix(`${RAW_GITHUB}/${sourceLink}`);

    // Start the actual example
    this.props.example.start({
      canvas: this.props.canvas,
      debug: true
    });
  }

  componentWillUnmount() {
    this.props.example.stop();
  }

  render() {
    const {width, height, name, example, noPanel, sourceLink} = this.props;
    const controls = example.getInfo && example.getInfo();

    const notSupported = example.isSupported && !example.isSupported();

    if (notSupported) {
      const altText = example.getAltText ? example.getAltText() : DEFAULT_ALT_TEXT;
      return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
          <h2> {altText} </h2>
        </div>
      );
    }

    return (
      <div className="fg" style={{width, height, padding: 0, border: 0}}>
        <canvas
          id={this.props.canvas}
          style={{width: '100%', height: '100%', padding: 0, border: 0}}
        />
        {noPanel ? null : <InfoPanel name={name} controls={controls} sourceLink={sourceLink} />}
      </div>
    );
  }
}

ExampleRunner.propTypes = propTypes;
ExampleRunner.defaultProps = defaultProps;

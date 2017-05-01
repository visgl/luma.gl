import React, {Component} from 'react';

import {instancing} from '../../examples.js';

/*
  TODO:
  if every example follows the same API of { init, animationFrame },
  we don't need a file like this for every example.
  instead, context.js can just handle un/mounting.
  (then, it becomes more than just context, it's more like a `DemoManager`.)
*/
export default class InstancingDemo extends Component {

  static get parameters() {
    return {};
    /*
    return {
      colorM: {displayName: 'Male', type: 'color', value: [0, 128, 255]},
      colorF: {displayName: 'Female', type: 'color', value: [255, 0, 128]},
      radius: {displayName: 'Radius', type: 'number', value: 10, step: 1, min: 1}
    };
    */
  }

  static renderInfo(meta) {
    return (<div>DUMMY INSTANCING INFO</div>);
    /*
    return (
      <div>
        <h3>Every Person in New York City</h3>
        <p>Each dot accounts for 10 people. Density per tract from 2015 census data.</p>
        <p>Data source: <a href="http://www.census.gov">US Census Bureau</a></p>
        <div className="stat">Instances
          <b>{ readableInteger(meta.points || 0) }</b>
        </div>
      </div>
    );
    */
  }

  componentDidMount() {
    instancing.init(false);
    instancing.animationFrame.start();
  }

  componentWillUnmount() {
    instancing.animationFrame.stop();
  }

  render() {
    // luma.gl renders directly into the supplied context,
    // so there is no need to return anything here.
    return null;
  }

}
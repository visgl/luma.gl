/* eslint-disable react/no-array-index-key */
// Copyright (c) 2018 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component} from 'react';
import ControlledHeader, {generateHeaderLinks, propTypes} from './header.component';

// we are exposing 2 header components.
// 1 - DocsHeader, which will update the state of the top level layout.
//   we need to expose whether the menu is toggled or not because it could
//   affect how TOC is displayed in smaller screens.
// 2 - Header, which won't and just maintain its own state.
// both components are wrappers around ControlledHeader.

export default class DocsHeader extends Component {
  constructor(props) {
    super(props);
    // we need to know the number of links before render.
    // this is not an ideal solution.
    // some of the links which are hardcoded should come from configuration
    // TODO - let's create the links server side, then pass them to the template as props.
    this.state = {
      links: generateHeaderLinks(props)
    };
  }

  renderHeader() {
    const {links} = this.state;

    return <ControlledHeader links={links} {...this.props} />;
  }

  render() {
    return this.renderHeader();
  }
}

DocsHeader.propTypes = propTypes;

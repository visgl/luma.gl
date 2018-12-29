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

import React, { PureComponent } from 'react'
import cx from 'classnames'
import {Link} from 'gatsby';

const getRootPath = pathname => `/${pathname.split('/')[1]}`

function getHeight(route) {
  return route.entries.reduce((prev, curr) => prev + (curr.entries ? getHeight(curr) : 40), 0)
}

// This component only creates a Link component if clicking on that Link will
// effectively change routes. It avoids creating a Link with a 'to' property
// which will point to the same route, because the history module would
// generate warnings when such a link is clicked

const SafeLink = ({className, name, path, pathname}) => {
  if (path === pathname) {
    return (<div className={className}>{name}</div>);
  }
  return (<Link to={path} className={className}>{name}</Link>)
}

const renderRoute = (route, i, pathname, depth) => {
  let path;
  const queue = [route];
  while (queue.length) {
    const r = queue.shift();
    path = r.path;
    if (r.children) {
      queue.push(r.children[0]);
    }
  }


  if (route.chapters) {
    const name = route.title;
    return (
      <div key={i} style={{marginLeft: 10 * depth}}>
        <div>
          <SafeLink
            className={cx('list-header', {
              expanded: true, // TODO - route.expanded,
              active: true, // pathname.includes(route.path)
            })}
            name={name}
            path={path}
            pathname={pathname}
          />
          <div className="subpages">
            <ul>{route.chapters.map((r, idx) => renderRoute(r, idx, pathname, depth + 1))}</ul>
          </div>
        </div>
      </div>
    );
  }

  if (route.entries) {
    const name = route.title;
    return (
      <div key={i} style={{marginLeft: 10 * depth}}>
        <div>
          <SafeLink
            className={cx('list-header', {
              expanded: true, // TODO - route.expanded,
              active: false, // pathname.includes(route.path)
            })}
            name={name}
            path={path}
            pathname={pathname}
          />
          <div className="subpages" style={{ maxHeight: getHeight(route) }}>
            <ul>{route.entries.map((r, idx) => renderRoute(r, idx, pathname, depth + 1))}</ul>
          </div>
        </div>
      </div>
    );
  }

  const remark = route.childMarkdownRemark
  const name = remark && remark.frontmatter && remark.frontmatter.title;
  const slug = remark && remark.fields && remark.fields.slug;
  return (
    <div key={i} style={{marginLeft: 10 * depth}}>
      <li>
        <SafeLink
          className={cx('link', { active: false /* pathname.includes(path) */ })}
          name={name}
          path={slug}
          pathname={pathname}
        />
      </li>
    </div>
  );
}

export default class TableOfContents extends PureComponent {
  render() {
    const tree = this.props.chapters;
    const { className, open, pathname } = this.props

    if (!tree) {
      return null
    }
    return (
      <div className={cx('toc', { open }, className)}>
        <div>{tree.map((route, i) => renderRoute(route, i, pathname, 0))}</div>
      </div>
    )
  }
}

/*
@connect(({ router: { location: { pathname } }, ui: { isMenuOpen } }) => ({
  pathname,
  open: isMenuOpen,
  tree: trees[getRootPath(pathname)] && trees[getRootPath(pathname)].tree
}))
class Toc extends PureComponent {
  render() {
    const { className, open, tree, pathname } = this.props

    if (!tree) {
      return null
    }
    return (
      <div className={cx('toc', { open }, className)}>
        <div>{tree.map((route, i) => renderRoute(route, i, pathname, 0))}</div>
      </div>
    )
  }
}

export default Toc
*/

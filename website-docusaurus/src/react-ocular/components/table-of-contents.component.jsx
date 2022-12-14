/* eslint-disable prefer-const */
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

import React from 'react';
import {Link} from 'gatsby';

import {TocChevron, TocHeader, TocLink, TocEntry, TocSubpages} from '../styled/toc';

// sub components of the TOC

// This component only creates a Link component if clicking on that Link will
// effectively change routes. If no path is passed or if the path is not
// usable then it just renders a div. That should not be the case

const SafeLink = ({
  active,
  depth,
  index,
  hasChildren,
  isTocOpen,
  id,
  name,
  path,
  toggleEntry = () => {}
}) => {
  // Gatsby <Link> element emmits warning if "external" links are used
  // "internal" links start with `/`
  // https://github.com/gatsbyjs/gatsby/issues/11243
  if (path && !path.startsWith('/')) {
    path = `/${path}`; // eslint-disable-line
  }

  return (
    <TocEntry $depth={depth} $index={index} title={name} onClick={() => toggleEntry(id)}>
      {hasChildren && <TocChevron $depth={depth} $isTocOpen={isTocOpen} />}
      {!path || typeof path !== 'string' ? (
        <TocHeader $depth={depth}>{name}</TocHeader>
      ) : (
        <TocLink $depth={depth} $active={active}>
          <Link to={path} title={name}>
            {name}
          </Link>
        </TocLink>
      )}
    </TocEntry>
  );
};

const renderRoute = ({route, id, index, depth, tocState, toggleEntry}) => {
  const children = route.chapters || route.entries || [];
  const updatedId = id.concat(index);

  // parts of the TOC with children

  if (children.length) {
    const name = route.title;
    const routeInfo = tocState[updatedId];
    return (
      <div key={index}>
        <SafeLink
          depth={depth}
          index={index}
          hasChildren
          isTocOpen={routeInfo && routeInfo.height > 0}
          id={updatedId}
          name={name}
          /* uncomment to have the entry act as link to its first child */
          /* path={routeInfo && routeInfo.pathToFirstChild} */
          toggleEntry={toggleEntry}
        />
        <TocSubpages $height={routeInfo && routeInfo.height}>
          {children.map((childRoute, idx) => {
            return renderRoute({
              depth: depth + 1,
              id: updatedId,
              index: idx,
              route: childRoute,
              tocState,
              toggleEntry
            });
          })}
        </TocSubpages>
      </div>
    );
  }

  // leaves

  const remark = route.childMdx;
  // first syntax is toc for documentation, second is toc for examples
  const name = (remark && remark.frontmatter && remark.frontmatter.title) || route.title;
  const target = (remark && remark.fields && remark.fields.slug) || route.path;
  return (
    <div key={index}>
      <li>
        <SafeLink
          active={tocState[updatedId] && tocState[updatedId].isSelected === true}
          depth={depth}
          name={name}
          path={target}
        />
      </li>
    </div>
  );
};

const ControlledToc = ({tree, tocState, toggleEntry}) => {
  return (
    <>
      {tree.map((route, index) =>
        renderRoute({
          route,
          index,
          depth: 0,
          tocState,
          toggleEntry,
          id: []
        })
      )}
    </>
  );
};

export default ControlledToc;

const {log, COLOR} = require('../utils/log');

let tableOfContents = [];

// Patches up new markdown nodes
//
module.exports.processNewDocsJsonNode = function processNewDocsJsonNode({
  node, actions, getNode
}, docNodes) {
  traverseTableOfContents(node.chapters, docNodes, 1);
  tableOfContents = node;
  log.log({color: COLOR.CYAN}, `Processed tableOfContents \
${Object.keys(docNodes).length}
${Object.keys(tableOfContents.chapters).length}
//${JSON.stringify(Object.keys(docNodes), null, 0)}
`
//${JSON.stringify(tableOfContents, null, 0)}
  )(); // , Object.keys(docNodes));
}

module.exports.getTableOfContents = function getTableOfContents() {
  log.log('QUERIED tableOfContents', Object.keys(tableOfContents.chapters).length)();
  // , Object.keys(docNodes));
  return tableOfContents;
}

function traverseTableOfContents(chapters, docNodes, level) {
  for (const chapter of chapters || []) {
    chapter.level = level;
    if (chapter.chapters) {
      traverseTableOfContents(chapter.chapters, docNodes, level + 1);
    }
    const entries = chapter.entries || [];
    for (const entry of chapter.entries || []) {
      processEntry(chapter, entry, docNodes);
    }
  }
}

function processEntry(chapter, entry, docNodes) {
  if (!entry.entry) {
    // TODO/ib - make probe's log.warn emit color
    // log.warn({color: COLOR.RED}, 'missing entry in chapter', chapter.title, entry)();
    log.log({color: COLOR.RED}, 'missing entry in chapter', chapter.title, entry)();
    return;
  }
  const slug = entry.entry.replace(/\.[^/.]+$/, '').replace('/README', '');
  const docNode = docNodes[slug] || null;
  if (!docNode || !docNode.id) {
    // TODO/ib - make probe's log.warn emit color
    log.log({color: COLOR.RED}, `unmatched toc entry for "${slug}" ${chapter.title}`, docNode)();
  } else {
    entry.id = [ docNode.id ];
    entry.markdown = [ docNode.id ];
    entry.childMarkdownRemark = docNode;
    log.log({color: COLOR.CYAN}, 'doc page', chapter.title, entry.entry)();
  }
}

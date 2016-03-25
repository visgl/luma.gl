(function() {

  examples = {
    'cubemap': 'Cubemap',
    'instancing': 'Instancing',
    'multicontext': 'Multiple Contexts',
    'persistence': 'Persistence',
    'picking': 'Picking',
    'custom-picking': 'Custom Picking',
    'particles': 'Particles',
    'deferred-rendering': 'Deferred Rendering'
  };

  var IO = LumaGL.IO;

  function onSuccess(data) {
    // Add the editor div.
    var editorDiv = document.createElement('div');
    editorDiv.className = 'editor';
    editorDiv.style.display = 'none';
    document.body.appendChild(editorDiv);

    // Configure the editor div.
    var editor = ace.edit(editorDiv);
    editor.getSession().setUseWorker(false);
    editor.$blockScrolling = Infinity;
    editor.setTheme('ace/theme/tomorrow');
    editor.getSession().setMode('ace/mode/javascript');
    editor.renderer.setShowGutter(true);
    editor.setShowPrintMargin(false);
    editor.setHighlightActiveLine(false);
    editor.setDisplayIndentGuides(false);
    editor.setValue(data);
    editor.setReadOnly(true);
    editor.setFontSize(14);
    editor.getSession().selection.clearSelection();

    // Add the buttons div.
    var div = document.createElement('div');
    div.className = 'buttons';
    document.body.appendChild(div);

    // Add the editor button.
    var span = document.createElement('span');
    span.className = 'button';
    span.innerHTML = '<span class="glyphicon glyphicon-search"></span> Source';
    span.onclick = function() {
      if (editorDiv.style.display !== 'none') {
        editorDiv.style.display = 'none';
      } else {
        editorDiv.style.display = 'block';
      }
    }
    div.appendChild(span);

    var exampleKeys = Object.keys(examples);
    var exampleNames = exampleKeys.map(function(k) {return examples[k]});

    // Add the prev/next buttons.
    var split = window.location.pathname.split('/');
    var baseurl = split.slice(0,split.length - 2).join('/') + '/';
    var ex = split[split.length - 2];
    var current = exampleKeys.indexOf(ex);
    var prev = current - 1;
    var next = current + 1;
    if (prev > 0) {
      var span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<a href="' + baseurl + exampleKeys[prev] + '"><span class="glyphicon glyphicon-chevron-left"></span>' + exampleNames[prev] + '</a>';
      div.appendChild(span);
    } else {
      var span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<a href="' + baseurl + exampleKeys[exampleKeys.length - 1] + '"><span class="glyphicon glyphicon-chevron-left"></span>' + exampleNames[exampleNames.length - 1] + '</a>';
      div.appendChild(span);
    }
    var span = document.createElement('span');
    span.className = 'button';
    span.innerHTML = '<span style="color:yellow">' + exampleNames[current] + ' Example</span>';
    div.appendChild(span);
    if (next < exampleKeys.length) {
      var span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<a href="' + baseurl + exampleKeys[next] + '">' + exampleNames[next] + ' <span class="glyphicon glyphicon-chevron-right"></span></a>';
      div.appendChild(span);
    } else {
      var span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<a href="' + baseurl + exampleKeys[0] + '">' + exampleNames[0] + '<span class="glyphicon glyphicon-chevron-right"></span></a>';
      div.appendChild(span);
    }

  }

  function onError() {
    console.error("Error loading lesson source.");
  }

  function onLoad() {
    new IO.XHR({
      url: window.location + 'index.js',
      onSuccess: onSuccess,
      onError: onError
    }).send();
  }

  window.addEventListener('load', onLoad);

})();

/* eslint-disable no-var, no-console, max-statements */
/* global window, document, ace, LumaGL, console */
(function() {

  var loadFiles = LumaGL.loadFiles;

  window.addEventListener('load', () => {
    loadFiles({urls: [
      window.location + 'index.js'
    ]})
    .then(files => {
      const data = files[0];

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

      var controlsDiv = document.getElementById('controls');
      controlsDiv.style.display = 'none';

      // Add the editor button.
      var span = document.createElement('span');
      span.className = 'button';
      span.innerHTML =
        '<span class="glyphicon glyphicon-search"></span> Source';
      span.onclick = function() {
        controlsDiv.style.display = 'none';
        if (editorDiv.style.display !== 'none') {
          editorDiv.style.display = 'none';
        } else {
          editorDiv.style.display = 'block';
        }
      };
      div.appendChild(span);

      // Add the controls button.
      if (controlsDiv.innerHTML !== '') {
        span = document.createElement('span');
        span.className = 'button';
        span.innerHTML =
          '<span class="glyphicon glyphicon-cog"></span> Controls';
        span.onclick = function() {
          editorDiv.style.display = 'none';
          if (controlsDiv.style.display !== 'none') {
            controlsDiv.style.display = 'none';
          } else {
            controlsDiv.style.display = 'block';
          }
        };
        div.appendChild(span);
      }

      // Add the prev/next buttons.
      var split = window.location.pathname.split('/');
      var baseurl = split.slice(0, split.length - 2).join('/') + '/';
      var current = parseInt(split[split.length - 2]);
      var prev = current - 1;
      var next = current + 1;
      if (prev > 0) {
        span = document.createElement('span');
        span.className = 'button';
        span.innerHTML =
          '<a href="' + baseurl + prev + '">' +
          '<span class="glyphicon glyphicon-chevron-left"></span>' +
          ' Previous</a>';
        div.appendChild(span);
      } else {
        span = document.createElement('span');
        span.className = 'button';
        span.innerHTML = '<a href="' + baseurl + 16 + '">' +
          '<span class="glyphicon glyphicon-chevron-left">' +
          '</span> Lesson 16</a>';
        div.appendChild(span);
      }
      span = document.createElement('span');
      span.className = 'button';
      span.innerHTML = '<span style="color:yellow">' +
        'Lesson ' + current + '</span>';
      div.appendChild(span);
      if (next < 17) {
        span = document.createElement('span');
        span.className = 'button';
        span.innerHTML = '<a href="' + baseurl + next + '">' +
          'Next <span class="glyphicon glyphicon-chevron-right"></span></a>';
        div.appendChild(span);
      } else {
        span = document.createElement('span');
        span.className = 'button';
        span.innerHTML = '<a href="' + baseurl + 1 + '">' +
          'Lesson 1 <span class="glyphicon glyphicon-chevron-right"></span>' +
          '</a>';
        div.appendChild(span);
      }
    })
    .catch(() => console.error('Error loading lesson source.'));
  });
}());

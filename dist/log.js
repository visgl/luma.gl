'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/* eslint-disable no-console */
/* global console */
/* global window */

var lumaLog = {
  priority: 0,
  table: function table(priority, _table) {
    if (priority <= lumaLog.priority && _table) {
      console.table(_table);
    }
  }
};

if (typeof window !== 'undefined') {
  window.lumaLog = lumaLog;
}

exports.default = lumaLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9sb2cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBSUEsSUFBTSxVQUFVO0FBQ2QsWUFBVSxDQUFWO0FBQ0Esd0JBQU0sVUFBVSxRQUFPO0FBQ3JCLFFBQUksWUFBWSxRQUFRLFFBQVIsSUFBb0IsTUFBaEMsRUFBdUM7QUFDekMsY0FBUSxLQUFSLENBQWMsTUFBZCxFQUR5QztLQUEzQztHQUhZO0NBQVY7O0FBU04sSUFBSSxPQUFPLE1BQVAsS0FBa0IsV0FBbEIsRUFBK0I7QUFDakMsU0FBTyxPQUFQLEdBQWlCLE9BQWpCLENBRGlDO0NBQW5DOztrQkFJZSIsImZpbGUiOiJsb2cuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4vKiBnbG9iYWwgY29uc29sZSAqL1xuLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5jb25zdCBsdW1hTG9nID0ge1xuICBwcmlvcml0eTogMCxcbiAgdGFibGUocHJpb3JpdHksIHRhYmxlKSB7XG4gICAgaWYgKHByaW9yaXR5IDw9IGx1bWFMb2cucHJpb3JpdHkgJiYgdGFibGUpIHtcbiAgICAgIGNvbnNvbGUudGFibGUodGFibGUpO1xuICAgIH1cbiAgfVxufTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy5sdW1hTG9nID0gbHVtYUxvZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgbHVtYUxvZztcbiJdfQ==
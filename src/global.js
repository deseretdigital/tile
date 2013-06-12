
 var Tile = window.Tile = {
      Views: {}          // Prototypes (see Require.js dash view plugin)
    };

  /**
   * Window Globals
   */

  // Global Job Flags
  Tile.JOB_PRUNE = JOB_PRUNE = 1;
  Tile.JOB_RENDER = JOB_RENDER = 2;
  Tile.JOB_PRESIZE = JOB_PRESIZE = 4;
  Tile.JOB_TRACE = JOB_TRACE = 8;

  // Global Child Flow Flags
  Tile.FLOW_LOCAL = FLOW_LOCAL = 1;      // Set when local options change (by schema.local{}) -> use during flow to re-layout
  Tile.FLOW_SUPER = FLOW_SUPER = 2;      // Set When super options change (by schema.super{}) ->
  Tile.FLOW_SIZED = FLOW_SIZED = 4;      // Set when size options change (by schema.local{}) -> use during flow to re-layout
  Tile.FLOW_STYLED = FLOW_STYLED = 8;     // Set when style option changes (by schema.lcal{}) -> use during tracing to to trigger measure pad & sizing

  Tile.FLOW_RENDERED = FLOW_RENDERED = 16;  // Set when render is called (by view.render() wrapper)
  Tile.FLOW_ADDED = FLOW_ADDED = 32;     // Set when added to a parent (by view._attachView())

  Tile.FLOW_MEASURED = FLOW_MEASURED = 64;  // Used to keep track of if view has been measured

  // Global Parent/Ancestor Flow Flags
  Tile.FLOW_VIEWS = FLOW_VIEWS = 128;    // Set parent when child is added/removed or has super option change
  Tile.FLOW_TRACED = FLOW_TRACED = 256;   // Set parent/ancestor when child has traced (by view.traceBubble())

  // Global Flow Aggregate Flags (for group testing)
  Tile.SUPER_ADDED = SUPER_ADDED = FLOW_SUPER + FLOW_ADDED; // (used by positioner screen mode)
  Tile.STYLED_ADDED = STYLED_ADDED = FLOW_STYLED + FLOW_ADDED; // (used by tracing to trigger sizing)
  Tile.RENDERED_ADDED = RENDERED_ADDED = FLOW_RENDERED + FLOW_ADDED; // (used by flexer to measure size=0,flex=f)
  Tile.SUPER_ADDED_RENDERED_SIZED = SUPER_ADDED_RENDERED_SIZED = SUPER_ADDED + FLOW_RENDERED + FLOW_SIZED;

  // String Boolean Values
  STRING_BOOLEAN = {
    'false': false,
    'no': false,
    'off': false,
    'null': false,
    'nill': false,
    'true': true,
    'yes': true,
    'on': true
  };

  /**
   * Tile Globals
   */
  var

    // Backbone core-view options
    viewOptions = ['el', 'id', 'attributes', 'className', 'tagName', 'events'],

    // Abreviated System Helpers
    abs = Math.abs,
    round	= Math.round,
    floor = Math.floor,
    slice = Array.prototype.slice

    // Constants
    BIG = 100000,

    // Used for formatting debugging output
    emptyStr = function(length) {
      return "                                       ".slice(-length)
    }

     stopEvent = function(ev) {
      ev.cancelBubble = true;
      if (ev.stopPropagation) ev.stopPropagation();
    },

    // Disable text select
    textSelection = function(bool) {
      $(document)[bool ? "unbind" : "bind"]("selectstart", function() {
        return false;
        }).css("MozUserSelect", bool ? "" : "none");
      document.unselectable = bool ? "off" : "on";
    },

    // Convert titles to class names
    classify = function(str) {
      str || (str = '');
      return str.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, function(c) {
        return c.toUpperCase();
      }).replace(/\s/g, '');
    };
/*! tile - v0.0.1 - 2013-06-12 */
define(['jQuery', 'Underscore', 'Backbone'],
  function($, _, Backbone) {


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
Tile.filters = {};


  /**
   * Import & Export Filter for Boolean
   * { type: 'boolean', value: 0 | 1 }
   */
  Tile.filters['boolean'] = function(binding) {
    return {
      input: function(value) {
        if (_.isString(value)) {
          return STRING_BOOLEAN[value.loLowerCase()];
        }
        return (value ? true : false);
      }
    }
  };

  /**
   * Import & Export Filter for String
   */
  Tile.filters['string'] = function(binding) {
    return {
      input: function(value) {
        return ('' + value);
      }
    }
  };

  /**
   * Import & Export Filter for Number
   */
  Tile.filters['integer'] = function(binding) {
    return {
      input: function(value) {
        if (_.isString(value)) {
          return parseInt(value, 10);
        }
        if (_.isNumber(value)) {
          return value;
        }
        return undefined;
      }
    }
  };

  /**
   * Import & Export Filter for Options
   *
   * @param {array|object|string} config.options
   * @param {*} config.value (default value)
   */
  Tile.filters['options'] = function(binding) {
    var options = binding.options
      , isArray = false;

    if (_.isString(options)) {
      options = options.split(',');
    }
    if (_.isArray(options)) {
      options = _.object(options, options);
      isArray = true;
    }

    return {
      input: function(value) {
        if (value !== undefined) {
          if (_.isString(value)) {
            value = value.toLowerCase();
          }
          value = options[value];
        }
        return value;
      },
      output: function(value) {
        if (!isArray) {
          for (var key in options) {
            if (options[key] == value) return key;
          }
        }
        return value;
      }
    }
  };

Tile.adapters = {};

  /**
   * Setter & Getter for Options Adapter
   */
  Tile.adapters['options'] = function(binding) {
    return {
      setter: function(value) {
        this.options[binding.name] = value;
      },
      getter: function() {
        return this.options[binding.name];
      }
    }
  };

  /**
   * Setter & Getter for Property Adapter
   */
  Tile.adapters['property'] = function(binding) {
    return {
      setter: function(value) {
        this[binding.name] = value;
      },
      getter: function() {
        return this[binding.name];
      }
    }
  };

  /**
   * Setter & Getter for Generic
   */
  Tile.adapters['setter'] = function(binding) {
    var name = binding.name
      , setter = binding.setter || ('set' + classify(name))
      , getter = binding.getter || ('get' + classify(name));

    return {
      setter: _.isFunction(setter) ? setter
        : function(value) {
          var set = this[setter];
          if (_.isFunction(set)) {
            set.call(this, value);
          } else if (_.isObject(set)) {
            set.set(value);
          }
        },
      getter: _.isFunction(getter) ? getter
        : function() {
          var get = this[getter];
          if (_.isFunction(get)) {
            get.call(this);
          } else if (_.isObject(get)) {
            get.get();
          }
      }
    }
  };
Tile.Schema = function(localBindings, childBindings) {

    /**
     * Define the Schemas
     */
    var local = {};
    var child = {};

    /**
     * Initialize the Schemas
     */
    addBindings(localBindings);
    addBindings(childBindings, true);

    /**
     * Extend the schema
     *
     * @param {object} localExtend schema
     * @param {object} childExtend schema
     */
    function extend(localExtend, childExtend) {
      return Tile.Schema(
        _.extend({}, local, localExtend),
        _.extend({}, child, childExtend)
      );
    }

    /**
     * Add Bindings to a Schema
     *
     * @param {object} bindings (schema)
     * @param {boolean} isChild schema
     */
    function addBindings(bindings, isChild) {
      for (var name in bindings) {
        addBinding(name, bindings[name], isChild);
      }
    }

    /**
     * Add a Binding to a Schema
     */
    function addBinding(name, bindIn, isChild) {
      var aname = bindIn.adapter || 'options'
        , adapter = Tile.adapters[aname]
        , filter, props, bindOut;

      // if binding is boolean false, drop it.
      if (bindIn === false) {
        return;
      }
      // if binding is already bound, copy it verbatim.
      if (bindIn._bound) {
        bindOut = bindIn;
      }
      // if binding is new, build the binding object.
      else {
        // add the name to the bindIn
        bindIn.name = name;
        bindOut = {
          _bound: true,
          name: name,
          flowFlags: bindIn.flowFlags || 0,
          flowJobs: bindIn.flowJobs || 0,
          isPrivate: bindIn.isPrivate ? true : false,
          defaultValue: bindIn.defaultValue
        };

        // add the input & output filters to the binding
        if (bindIn.filter && (filter = Tile.filters[bindIn.filter])) {
          props = filter(bindIn);
          bindOut.filter = bindIn.filter;
          if (!bindIn.input) bindOut.input = props.input;
          if (!bindIn.output) bindOut.output = props.output;
        }

        // ensure there is a binding type
        bindIn.adapter || (bindIn.adapter = 'options');
        if (!adapter) {
          console.error("Adapter " + aname + " on schema.option." + name);
        }
        props = adapter(bindIn);
        bindOut.setter = props.setter;
        bindOut.getter = props.getter;
      }
      // add the binding to the schema
      (isChild ? child : local)[name] = bindOut;
    }

    /**
     * Set Options
     *
     * @param {object} view
     * @param {object} options
     * @return {integer} number of changes made
     */
    function setOptions(view, options) {
      var parent = view.parentView
        , pchild = parent ? parent.optionSchema.child : null
        , changes = 0
        , binding;

      for (var name in options) {
        var value = options[name];

        // Has the option value changed?
        if (view.options[name] != value) {

          // found filter in the local scope
          if ((binding = local[name])) {
            changes += importOption(name, view, binding, value);
          }
          // found filter in parent scope
          else if (pchild && (binding = pchild[name])) {
            changes += importOption(name, view, binding, value);
          }
          // didn't find, so store in option buffer
          else {
            view.optionBuffer[name] = value;
          }
        }
      }
      return changes;
    }

    /**
     * Get Options
     *
     * @param {object} view
     * @param {string} name
     */
    function getOptions(view, name) {
      // >>>>>>>>> look at binding.isPrivate property <<<<<<<<<
    }

    /**
     * Initialize Options by Scope
     *
     * @param {object} view
     * @param {boolean} isParent (true = parent | false = child)
     */
    function initOptions(view, isParent) {
      var options = view.options
        , buffer = view.optionBuffer
        , parent = isParent ? view.parentView : null
        , bindings = isParent ? parent.optionSchema.child : local
        , name, value, binding;

      // iterate through all filters within the scope
      for (name in bindings) {
        binding = bindings[name];

        // found buffered option
        if ((value = buffer[name]) !== undefined)  {
          importOption(name, view, binding, value);
          delete buffer[name];
        }
        // no existing option, but there is a default (setup)
        else if (options[name] === undefined
          && ((value = binding.defaultValue) !== undefined)) {
            importOption(name, view, binding, value, true);
        }
      }
    }

    /**
     * Import an Option
     *
     * @private
     * @param {string} name
     * @param {object} view
     * @param {object} binding
     * @param {*} value
     * @param {boolean} noFilter (Don't filter value - for default value)
     */
    function importOption(name, view, binding, value, noFilter) {
      var input, flag, job;

      // Filter the input value
      if (!noFilter && (input = binding.input)) {
        value = input(value);
      }
      // Set value with adapter
      binding.setter.call(view, value);

      // Set the flow flag
      if ((flag = binding.flowFlags)) {
        view.flowFlags |= flag;
      }
      // Set the flow job
      if ((job = binding.flowJobs)) {
        Tile.reflow.schedule(job, view, true);
      }
      // return change count
      return 1;
    }

    // ---------------------------------------------------------------------

    /**
     * Export an Option
     *
     * @private
     * @param {object} view
     * @param {object} binding
     * @param {*} value
     */
    function exportOption(view, binding, value) {

    }

    /**
     * Return the public filter object methods
     */
    return {
      extend: extend,
      addBindings: addBindings,
      addBinding: addBinding,
      initOptions: initOptions,
      setOptions: setOptions,
      getOptions: getOptions,
      local: local,
      child: child
    };

  };

  // -----------------------------------------------------------------------
  //    Reflow Object
  // -----------------------------------------------------------------------

  Tile.reflow = function() {

    /**
     * Local counting and queue variables
     */
    var cycles = 0,           // To prevent infinite reflow loop
        blocked = 0,          // To trigger reflow after end of nested blocks
        jobs = 0,             // To know when there are jobs to be done
        queues = {};

    queues[JOB_RENDER] = {
      jobs: [],
      method: 'renderView'
    }
    /**
     * For resizer to prune itself
     */
    queues[JOB_PRUNE] = {
      jobs: [],
      method: 'pruneView'
    };
    /**
     * For positioner to apply geometry
     */
    queues[JOB_PRESIZE] = {
      jobs: [],
      method: 'presizeView'
    };
    /**
     * For all changes to be traced and flowed
     */
    queues[JOB_TRACE] = {
      jobs: [],
      method: 'traceView'
    };

    /**
     * Enter a protected reflow block of code
     * - Prevent reflow from happening within this block
     */
    function block() {
      blocked++;
    }

    /**
     * Leave a protected reflow block of code
     * - Start the reflow jobs if end of all nested blocks
     */
    function unblock(silent) {
      blocked--;
      if (!silent) dispatch();
    }

    /**
     * Schedule an async reflow job
     *
     * @param {integer} job id flag of queue to add to
     * @param {object} view to callback
     */
    function schedule(job, view, silent) {
/*
var jobnames = '';
if (job & Tile.JOB_RENDER) jobnames += ' JOB_RENDER';
if (job & Tile.JOB_PRUNE) jobnames += ' JOB_PRUNE';
if (job & Tile.JOB_PRESIZE) jobnames += ' JOB_PRESIZE';
if (job & Tile.JOB_TRACE) jobnames += ' JOB_TRACE';
console.log("REFLOW.schedule(", jobnames, ",", view.cid, ")");
*/
      if (!(view.flowJobs & job)) {
        view.flowJobs |= job;
        queues[job].jobs.push(view);
        jobs++;
      }
      if (!silent) {
        dispatch();
      }
    }

    /**
     * Dispatch the reflow jobs
     */
    function dispatch() {
      if (blocked || cycles || !jobs) return;
//      console.time('DOM_REFLOW_TIME');

      cycles = 3;

      // reflow job queue loop
      while (cycles-- && jobs) {
//console.log("REFLOW_DISPATCH_CYCLE", cycles);
        for (var type in queues) {
          runQueue(type, queues[type]);
        }
        // start the depth-first flow tree traversal
        if (Tile.root.flowViews || Tile.root.flowFlags) {
          Tile.root.flow();
        }
      }

      // check for loop overflow
      if (!cycles) {
        console.error('Reflow Dispatch Cycle Overflow');
        //console.trace();
      }
      cycles = 0;

      // measure time for DOM to reflow
      _.defer(function() {
//        console.timeEnd('DOM_REFLOW_TIME');
      });
    }

    /**
     * Run a job queue
     *
     * @param {integer} flag (bitwise job flag)
     * @param {object} queue
     */
    function runQueue(flag, queue) {
      var qjobs = queue.jobs
        , method = queue.method;
//console.log("------------->reflow.runQueue(" + method + ") len=" + qjobs.length);

      if (!qjobs.length) return;

//      console.time('DISPATCH_TIME');
      for (var i = 0; i < qjobs.length; i++, jobs--) {
        var view = qjobs[i];

        view[method]();
        view.flowJobs &= ~flag;
      }
      queue.jobs = [];
//      console.timeEnd('DISPATCH_TIME');
    }

    /**
     * Return the reflow object
     */
    return {
      block: block,
      unblock: unblock,
      schedule: schedule,
      dispatch: dispatch
    };

  }();

  // -----------------------------------------------------------------------
  //    DOM Object
  // -----------------------------------------------------------------------

  Tile.dom = function() {

    /**
     * DOM Globals
     */
    var CACHE_NAME = null
      , cache = {};

    /**
     * Clear the style cache from local storage
     */
    function clearCache() {
      cache = {};
      localStorage.setItem(CACHE_NAME, undefined);
    }

    /**
     * Save the style cache to local storage
     */
    function saveCache() {
      var json = JSON.stringify(cache);
      localStorage.setItem(CACHE_NAME, json);
    }

    /**
     * Load the style cache from local storage
     */
    function loadCache() {
      var json = localStorage.getItem(CACHE_NAME);
      cache = json ? JSON.parse(json) : {};
    }

    /**
     * Measure the element scroll size
     */
    function scrollSize(view) {
      return {
        innerWidth: view.el.scrollWidth,
        innerHeight: view.el.scrollHeight
      }
    }

    /**
     * Measure the inner element size
     */
    function innerSize(view) {
      return {
        innerWidth: view.$el.width(),
        innerHeight: view.$el.height()
      }
    }

    /**
     * Get the cached pad size or generate and cache it
     *
     * @param {element} view - DOM element
     * @param {string} hash - path of tag and class names
     */
    function padSize(view, hash) {
      return (cache[hash] || (cache[hash] = _pad(view.$el)));
    }

    /**
     * Get the pad size for a DOM element
     */
    function _pad($el) {
      var innerWidth = $el.width()
        , outerWidth = $el.outerWidth(true)
        , innerHeight = $el.height()
        , outerHeight = $el.outerHeight(true);

      return {
        padWidth: outerWidth - innerWidth,
        padHeight: outerHeight - innerHeight
      }
    }

    function _padOld(el) {
      var style = document.defaultView.getComputedStyle(el, '');
      return {
        padWidth: _side(style, 'left') + _side(style, 'right'),
        padHeight: _side(style, 'top') + _side(style, 'bottom')
      };
    }

    /**
     * Get the pad side size given a style object
     *
     * @param {object} style - DOM element style object
     * @param {string} side - top | right | bottom | left
     */
    function _side(style, side) {
      var margin = parseInt(style.getPropertyValue('margin-' + side), 10)
        , padding = parseInt(style.getPropertyValue('padding-' + side), 10)
        , border = parseInt(style.getPropertyValue('border-' + side), 10);

      return ((margin || 0) + (padding || 0) + (border || 0));
    }

    /**
     * Public DOM Object Properties
     */
    return {
      padSize: padSize,
      innerSize: innerSize,
      scrollSize: scrollSize,
      loadCache: loadCache,
      saveCache: saveCache,
      clearCache: clearCache
    };

  }();

  // ------------------------------------------------------------------------
  //    DRAG AND DROP CONSTRUCTOR
  // ------------------------------------------------------------------------

  var Dragdrop = Tile.Dragdrop = function(ev) {
    var $target = $(ev.target)
      , $tile = $target.closest('.tile')
      , tile = $tile.data('tile');

    // Set the properties
    this.tile = ($target[0] == $tile[0]) ? tile : $target;
    this.origin = tile;
    this.target = $target;
    this.startX = ev.pageX;
    this.startY = ev.pageY;
    this.zones = [];

    // Bubble up the tree to find active drag handler
    while (tile && !tile.dragInit(ev, this)) {
      tile = tile.parentView;
    }
    // Found handler
    if (tile) {
      this.handler = tile;
      textSelection(false);
    }
  };

  Dragdrop.prototype = {

  // ------------------------- SET on dragInit() --------------------
    tile: null,           // {tile} jQuery el or tile object
    autodrag: true,       // {boolean} automatic dragging
    copyable: false,      // {boolean} true=copy | false=move
    dropable: true,       // {boolean} is this droppable?
    restorable: true,     // {boolean} true=uncommitted move will restore
    pxtodrag: 2,          // {integer} pixels to move to start

    // ------------------------- SET by system ------------------------
    handler: null,        // {object} drag handler
    origin: null,         // {tile} The originating tile
    target: null,         // {jquery} element that initiated the drag
    startX: 0,            // {integer} Starting x-coordinate
    startY: 0,            // {integer} Starting y-coordinate
    deltaX: 0,            // {integer} Change in x-coordinate
    deltaY: 0,            // {integer} Change in y-coordinate
    tileX: 0,             // {integer} Starting tile x-coordinate
    tileY: 0,             // {integer} Starting tile y-coordinate
    pageX: 0,             // {integer} Position of cursor on page
    pageY: 0,             // {integer} Position of cursor on page
    dropX: 0,             // {integer} Position within drop-zone
    dropY: 0,             // {integer} Position within drop-zone
    dropWidth: 0,         // {integer} Width of drop-zone
    dropHeight: 0,        // {integer} Height of drop-zone
    dropTop: 0,           // {integer} Top page offset of drop-zone
    dropLeft: 0,          // {integer} Left page offset of drop-zone
    started: false,       // {boolean} Has the dragging started
    committed: false,     // {boolean} was able to commit
    zones: null,          // {array} List of potential drop zones
    zone: null,           // {object} Current drop zone with bounds

    // ----------------------------------------------------------------------
    //    START THE MOVE
    // ----------------------------------------------------------------------

    start: function(root, ev) {
      if (abs(this.startX - ev.pageX) > this.pxtodrag
       || abs(this.startY - ev.pageY) > this.pxtodrag) {

        if (this.autodrag) {
          this.tile = this.prepTile(root, this.tile);
        }
        if (this.dropable) {
          this.zoneInit.call(root, ev, this);
        }
        root.set('cover', 'move');
        this.handler.dragStart(ev, this);

        return true;
      }
      return false;
    },

    // ----------------------------------------------------------------------
    //    MOVE THE MOUSE
    // ----------------------------------------------------------------------

    move: function(root, ev) {
      if (this.started || (this.started = this.start(root, ev))) {

        // Set page and change values
        this.pageX = ev.pageX;
        this.pageY = ev.pageY;
        this.deltaX = ev.pageX - this.startX;
        this.deltaY = ev.pageY - this.startY;

        // Detect if we have left or entered a new zone
        if (!this.inZone(this.zone, ev.pageX, ev.pageY)) {
          this.zone = this.changeZone(ev);
          if (this.zone.drop) {
            this.dropLeft = this.zone.drop.l;
            this.dropTop = this.zone.drop.t;
            this.dropWidth = this.zone.drop.r - this.dropLeft;
            this.dropHeight = this.zone.drop.b - this.dropTop;
          }
        }
        // Drag & Drop move callbacks
        this.handler.dragMove(ev, this);
        if (this.zone.tile) {
          this.dropX = this.pageX - this.zone.drop.l;
          this.dropY = this.pageY - this.zone.drop.t;
          this.zone.tile.dropMove(ev, this);
        }
        // Move the tile
        if (this.autodrag) {
          this.tile.set({
            x: this.tileX + this.deltaX,
            y: this.tileY + this.deltaY
          });
        }
      }
      stopEvent(ev);
    },

    // ----------------------------------------------------------------------
    //    END THE DRAGGING
    // ----------------------------------------------------------------------

    end: function(root, ev) {
      var drop = (this.zone && this.zone.tile) ? this.zone.tile : null;

      // dropOut, dragEnd, dropCommit & dragComplete
      if (this.started) {
        if (drop) drop.dropOut(ev, this);
        this.handler.dragEnd(ev, this);

        if (drop) {
          this.committed = drop.dropCommit(ev, this);
        }
        if (this.autodrag) {
          if (this.tile instanceof Tile.Dragger) {
            if (this.copyable || this.committed) this.tile.close();
            else if (this.restorable) this.tile.dragRestore();
          } else {
            // >>>>>>>>>>>>>>>> DEAL WITH AUTODRAG UNCOMMITTED TILES HERE <<<<<<<<<<<<<<<<<<
          }
        }
        root.set('cover');
      }
      // Re-enable text selection
      textSelection(true);

      // dropFinish & dragFinish
      if (drop) drop.dropFinish(ev, this);
      this.handler.dragFinish(ev, this);
    },

    // ----------------------------------------------------------------------
    //    TURN ELEMENT INTO TILE & ATTACH TO ROOT
    // ----------------------------------------------------------------------

    prepTile: function(root, tile) {

      // Turn a jquery element into a dragger tile
      // (NEED TO TEST FOR DOM ELEMENT TOO)
      if (tile instanceof jQuery) {
        tile = {
          type: Tile.Dragger,
          spawner: this.origin,
          dragData: this
        };
      }
      // Make a copy of a tile
      // (IS THIS REALLY WHAT WE WANT HERE?)
      else if (tile instanceof Tile.View && this.copyable) {
        tile = tile.get();
      }
      // Attach the tile to the root context
      if (_.isObject(tile)) {
        var offset = tile.$el.offset();

        root.addView(tile, undefined, {
          mode: 'offset',
          width: tile.$el.width(),
          height: tile.$el.height(),
          x: (this.tileX = offset.left),
          y: (this.tileY = offset.top)
        });

        return tile;
      }
      return null;
    },

    // ----------------------------------------------------------------------
    //    INITIALIZE THE DROP ZONES
    //    NOTE: This will be called within a tile context
    // ----------------------------------------------------------------------

    zoneInit: function(ev, dd, index) {
      // Determine if this is a valid drop-zone
      if (this.drop && this != dd.tile && this.dropInit(ev, dd)) {
        var off = this.$el.offset()
          , zindex = this.$el.css('zIndex');

        // represent the stacking order as a string
        if (parseInt(zindex)) {
          var pos = this.$el.css('position');
          if (pos == 'relative' || pos == 'absolute') {
            index = (index ? index + '.' : '') + zindex;
          }
        }
        // Push the zone onto the zone array
        dd.zones.push({
          tile: this,                             // tile
          t: off.top,                             // top
          l: off.left,                            // left
          r: off.left + this.$el.outerWidth(),    // right
          b: off.top + this.$el.outerHeight(),    // bottom
          z: index                                // zindex
        });

      }
      // Recurse to the children tiles
      else {
        _.each(this.childViews, function(tile) {
          Dragdrop.prototype.zoneInit.call(tile, ev, dd, index);
        });
      }
    },

    // ----------------------------------------------------------------------
    //    TEST IF CURSOR IS WTIHIN A DROP ZONE
    // ----------------------------------------------------------------------

    inZone: function(bounds, x, y) {
      return (bounds
        && x >= bounds.l
        && x <= bounds.r
        && y >= bounds.t
        && y <= bounds.b
      );
    },

    // ----------------------------------------------------------------------
    //    TRANSITION TO A NEW ZONE
    // ----------------------------------------------------------------------

    changeZone: function(ev) {
      var zone = this.findZone(ev.pageX, ev.pageY);

      if (!this.zone || this.zone.tile != zone.tile) {
        if (this.zone && this.zone.tile) {
          this.zone.tile.dropOut(ev, this);
        }
        if (zone && zone.tile) {
          zone.tile.dropOver(ev, this);
        }
      }
      return zone;
    },

    // ----------------------------------------------------------------------
    //    FIND NEW DROP ZONE
    // ----------------------------------------------------------------------

    findZone: function(x, y) {
      var l = BIG, r = BIG, t = BIG, b = BIG, zone = null;

      // Iterate through all the zones to find the next one
      for (var di = 0, len = this.zones.length; di < len; di++) {
        var dz = this.zones[di], deltaA, deltaB, bound = 0

        // Are we bound on X? Find nearest edges
        if ((deltaB = x - dz.l) > 0) {
          if ((deltaA = dz.r - x) > 0) {
            if (deltaB < l) l = deltaB;
            if (deltaA < r) r = deltaA;
            bound++;
          } else if (-deltaA < l) l = -deltaA;
        } else if (-deltaB < r) r = -deltaB;

        // Are we bound on Y? Find nearest edges
        if ((deltaB = y - dz.t) > 0) {
          if ((deltaA = dz.b - y) > 0) {
            if (deltaB < t) t = deltaB;
            if (deltaA < b) b = deltaA;
            bound++;
          } else if (-deltaA < t) t = -deltaA;
        } else if (-deltaB < b) b = -deltaB;

        // remember zone if bound on x & y & highest stacking order
        if (bound == 2 && (!zone || this.isAbove(dz.z, zone.z))) {
          zone = dz;
        }
      }
      // return the new zone
      return {
        drop: zone,
        tile: zone ? zone.tile : null,
        l: x - l,
        r: x + r,
        t: y - t,
        b: y + b
      }
    },

    // ----------------------------------------------------------------------
    //    COMPARE STACKING ORDER OF TWO TILES
    // ----------------------------------------------------------------------

    isAbove: function(newz, oldz) {
      if (!oldz) return true;
      if (!newz) return false;
      var news = newz.split('.');
      var olds = oldz.split('.');
      var len = news.length < olds.length ? news.length : olds.length;
      for (var i = 0; i < len; i++) {
        if (parseInt(news[i]) < parseInt(olds[i])) return false;
      }
      return true;
    }

  };
  // -----------------------------------------------------------------------
  //    View Object
  // -----------------------------------------------------------------------

  Tile.View = View = Backbone.View.extend({

    type: null,                   // {string} set by require view plugin
    className: 'tile',            // {string} css class name

    /**
     * Option Schema - defines the public API for the tile object
     *
     * @param {string} adapter = 'setter' | 'property' | 'options' (default)
     * @param {string} filter = 'integer' | 'boolean' | 'string' | 'options' | undefined (default)
     * @param {boolean} isPrivate = true | false (default)
     * @param {*} defaultValue = undefined (default)
     * @param {integer} flowFlags = FLOW_SIZED | FLOW_LOCAL | FLOW_SUPER | FLOW_STYLED | undefined (default)
     * @param {object} options = { name: value ... } (for use with options filter)
     */
    optionSchema: Tile.Schema({   // {object} option bindings
      views: {
        adapter: 'setter'
      },
      model: {
        adapter: 'property',
        isPrivate: true
      },
      drag: {
        adapter: 'setter',
        isPrivate: true
      },
      collection: {
        adapter: 'property',
        isPrivate: true
      },
      innerWidth: {
        adapter: 'options',
        flowFlags: FLOW_SIZED,
        isPrivate: true,
        defaultValue: 0
      },
      innerHeight: {
        adapter: 'options',
        flowFlags: FLOW_SIZED,
        isPrivate: true,
        defaultValue: 0
      },
      padWidth: {
        adapter: 'options',
        flowFlags: FLOW_SIZED,
        isPrivate: true,
        defaultValue: 0
      },
      padHeight: {
        adapter: 'options',
        flowFlags: FLOW_SIZED,
        isPrivate: true,
        defaultValue: 0
      }
    }),

    optionBuffer: null,           // {object} store non-schema options
    options: null,                // {object} View Options

    // Relationship Params
    parentView: null,             // {object} Parent View
    childViews: null,             // {array} Child Views

    // Reflow Params
    flowViews: null,              // {array} Reflow Traced Views
    flowFlags: 0,                 // {integer} Reflow State flags
    flowJobs: 0,                  // {integer} Reflow Job flags

    // Default Values
    childType: null,              // {string|true} string=default. true=same as parent

    // Internal Bookkeeping
    _styleHash: null,             // {string} DOM tag & class path names
    _isRunning: true,             // {boolean} true if view hasn't closed

    // -----------------------------------------------------------------------
    //    Constructor and Destructor
    // -----------------------------------------------------------------------

    /**
     * Standard Backbone Initializer
     *
     * @param {object} options
     */
    initialize: function(options) {
      this.optionSchema.initOptions(this);
    },

    /**
     * Close the View
     *
     * @param {boolean} delspawned (true=close spawned children)
     */
    close: function(delspawned) {
      if (this._isRunning) {
        this._isRunning = false;
        this.type = null; // in case type was constructor
        Tile.reflow.block();
     //   this.despawn(delspawned);
        this.detachThis();
        this.setViews();
        Tile.reflow.unblock();
      }
    },

    // -----------------------------------------------------------------------
    //    Backbone Overrides
    // -----------------------------------------------------------------------

    /**
     * Backbone override for custom dash view initialization
     *
     * NOTE: viewOptions don't contain 'model' & 'collection' as usual.
     *   The optionSchema imports 'model' & 'collection' via setters instead.
     *   This is necessary for timing and control purposes within the Tile.
     *   (modified backbone _configure() to import view options)
     *
     * @param {object} options (view options)
     */
    _configure: function(options) {

      // import backbone options before dealing with schema options
      if (this.options) options = _.extend({}, this.options, options);
      for (var i = 0, l = viewOptions.length; i < l; i++) {
        var attr = viewOptions[i];
        if (options[attr]) {
          this[attr] = options[attr];
          delete options[attr];
        }
      }

      // initialize the dash view parameters
      this.optionBuffer = options;
      this.options = {};
      this.childViews = [];
    },

    /**
     * Backbone override for faster element creation
     */
    _ensureElement: function() {
      if (!this.el) {
        this.el = document.createElement(this.tagName);
      }
      this.el.className = this.className;
      this.setElement(this.el, false);

      // add tile to DOM/jQuery as tile data property
      this.$el.attr('id', this.cid).data('tile', this);
    },

    // -----------------------------------------------------------------------
    //    Utility Methods
    // -----------------------------------------------------------------------

    /**
     * Execute a parent function
     *
     * @param {string} name (name of parent function)
     * @param {*} defalt (default value if not defined)
     * @param {*} ... (additional arguments...)
     */
    superFn: function(name, defaultTo) {
      var parent = this.parentView;
      if (parent && (name in parent)) {
        var args = slice.call(arguments, 2);
        return parent[name].apply(parent, args);
      }
      return defaultTo;
    },

     /**
     * DEBUGGING : Output the tree to the console
     */
    logTree: function(level) {
      level || (level = 1);
      console.log(emptyStr(level) + this.cid + ' (' + this.type + ')');
      if (this.type != 'dash/widget') {
        for (var i = 0, l = this.childViews.length; i < l; i++) {
          this.childViews[i].logTree(level + 2);
        }
      }
    },

    // -----------------------------------------------------------------------
    //    Relationship Management
    // -----------------------------------------------------------------------

    /**
     * Get the child views as attribute objects
     */
    getViews: function() {
      return _.map(this.childViews, function(view) {
        return view.get();
      });
    },

    /**
     * Set the child views as attribute objects
     * (close all existing child views before adding new ones)
     *
     * @param {object|array} views (views to re-set with)
     */
    setViews: function(views) {
      var view;

      Tile.reflow.block();
      while ((view = this.childViews.pop())) {
        view.close();
      }
      this.addView(views);
      Tile.reflow.unblock();
    },

    /**
     * Get the number of child views
     */
    childCount: function() {
      return this.childViews.length;
    },

    /**
     * Get the view at a specific index
     *
     * @param {integer} index
     */
    viewAt: function(index) {
      return this.childViews[index];
    },

    /**
     * Get the index of a view
     *
     * @param {object} view
     */
    indexOf: function(view) {
      return _.indexOf(this.childViews, view);
    },

    /**
     * Add one or more child views
     *
     * @param {(object|fn|array|string)} view
     * @param {integer} index (insertion index / optional)
     * @param {object} extend (extend tile options / optional)
     */
    addView: function(view, index, extend) {
      if (view) {
        Tile.reflow.block();

        // add a single view
        if (!_.isArray(view)) {
          this._attachView(this._toView(view, extend), index);
        }
        // add multiple views
        else for (var i = 0, l = view.length; i < l; i++) {
          this._attachView(this._toView(view[i], extend), index);
        }
        Tile.reflow.unblock();
      }
    },

    /**
     * Add a child view
     *
     * @param {object} view (child to add)
     * @param {integer} index (position of child)
     */
    _attachView: function(view, index) {

      // ensure we have an index
      if (index === undefined) {
        index = this.childViews.length;
      }
      // add DOM child, view child & parent
      this._attachDOM(view, index);
      this.childViews.splice(index, 0, view);
      view.parentView = this;

      // clear CSS style & init parent options
      view.el.removeAttribute('style');
      view.optionSchema.initOptions(view, true);

      // do parent and child setup
      this.childSetup(view);
      view.localSetup(this);

      // set the reflow flags
      view.setFlag(FLOW_ADDED);
    },

    /**
     * Attach a view to the DOM
     *
     * @param {object} view (view to append)
     * @param {integer} index
     */
    _attachDOM: function(view, index) {
      var len = this.childViews.length;

      if (view.el != this.el) {
        if (index >= len || index === undefined) {
          this.$el.append(view.$el);
        }
        else if (index == 0) {
          this.$el.prepend(view.$el);
        }
        else {
          if (index < 0) index = len - index;
          this.$el.children().eq(index).before(view.$el);
        }
      }
    },

    /**
     * Ensure we have a detached instance of a view
     *
     * @param {View|view|string|object} view (4 types of input)
     * @param {object} extend (extend view options. Optional)
     * @return {object} constructed view
     */
    _toView: function(view, extend) {
      var Type;

      // detach instantiated view
      if (view instanceof View) {
        view.detachThis();
        view.set(extend);
        return view;
      }
      // if view is a function
      if (_.isFunction(view)) {
        Type = view;
        view = extend;
      }
      else {
        // ensure view is an object
        if (!_.isObject(view)) {
          view = { type: view };
        }
        // apply the default values
        if (_.isObject(extend)) {
          view = _.extend({}, view, extend);
        }
        // use default view type
        if (view.type === undefined) {
          view.type = this.childType;
        }
        // look-up the view type
        Type = Tile.Views[view.type] || view.type;

        // default to loader if not valid
        if (!_.isFunction(Type)) {
          Type = Tile.Loader;
        }
      }
      // Create the view & schedule render
      view = (new Type(view));
      view.scheduleJob(JOB_RENDER);
      return view;
    },

    /**
     * Detach this view from its parent
     */
    detachThis: function() {
      if (this.parentView) {
        this.parentView.detachView(this);
      }
    },

    /**
     * Detach a child view from this
     */
    detachView: function(view) {
      view.parentView = null;
      view.$el.detach();
      this.childViews = _.without(this.childViews, view);
      this.setFlag(FLOW_VIEWS);
    },

    /**
     * Replace this view with another
     *
     * @param {object} view (to replace this one with)
     */
    replaceWith: function(view) {
      if (!this.parentView) return;

      Tile.reflow.block();
      var index = this.parentView.indexOf(this);
      this.parentView.addView(view, index);
      this.detachThis();
      Tile.reflow.unblock();
    },

    /**
     * Find a view by cid in the tree
     *
     * @param {string} cid (Backbone Id)
     */
    findView: function(cid) {
      var len = this.childViews.length
        , view = this.cid == cid ? this : undefined;

      for (var i = 0; i < len && !view; i++) {
        view = this.childViews[i].findView(cid);
      }
      return view;
    },

    childSetup: function(child) {},

    localSetup: function(parent) {},

    // -----------------------------------------------------------------------
    //    Reflow System
    // -----------------------------------------------------------------------

    /**
     * Set a flag and schedule a reflow
     *
     * @param {integer} flags (flow flags)
     * @param {boolean} silent (set to true to prevent reflow)
     */
    setFlag: function(flags, silent) {
      if (flags) {
        this.flowFlags |= flags;
        if (!silent) {
          Tile.reflow.schedule(JOB_TRACE, this);
        }
      }
    },

    /**
     * Schedule a job for this tile
     *
     * @param {integer} job (flag)
     */
    scheduleJob: function(job) {
      Tile.reflow.schedule(job, this);
    },

    /**
     * Set attribute values & schedule reflow
     *
     * @param {object} options (view options)
     * @param {boolean} silent (set to true to prevent reflow)
     */
    set: function(options, silent) {
      Tile.reflow.block();

      var count = options ? this.optionSchema.setOptions(this, options) : 0;

      if (count && !silent) {
        Tile.reflow.schedule(JOB_TRACE, this);
      }
      Tile.reflow.unblock();

      return count;
    },

    /**
     * Get the attribute value(s)
     *
     * @param {string} name (optional name)
     */
    get: function(name) {
      return this.optionSchema.get(this, name);
    },

    /**
     * Wrapper for rendering and flagging via a reflow job
     */
    renderView: function() {
      this.render();
      this.setFlag(FLOW_RENDERED);
    },

    /**
     * Pre-size the view (used by positioner to pre-set sizing)
     * NOTE: We want to call the parent for sizing.
     */
    presizeView: function() {
      if (this.parentView) {
        this.parentView.presizeChild(this);
      }
    },

    /**
     * Pre-size the child view (define in the parent view)
     */
    presizeChild: function(view) {},

    /**
     * Start reflow by tracing up to root
     */
    traceView: function() {
      // Measure the PAD if added to new DOM context
      // - think about how to repress this on widgets when dragging
      // - think about how to cascade this down to children
      if (this.flowFlags & STYLED_ADDED) {
        this.measurePad();
      }

      // Trigger change on view
      //this.traceChange(this, null, 0);

      // recurse up the tree
      if (this.parentView) {

        // flag parent dirty if child added or has super option change
        if (this.flowFlags & SUPER_ADDED) {
          this.parentView.flowFlags |= FLOW_VIEWS;
        }
        this.parentView.traceBubble(this, this, 1);
      }
    },

    /**
     * Trace all changes up the tree to root
     *
     * @param {Array} array of views that represent the traced path
     * @param {Object} immediate child view
     */
    traceBubble: function(orig, child, depth) {

      // add child to flowViews and flag tracing state
      if (!(this.flowFlags & FLOW_TRACED)) {
   //     console.log("ADDING TRACE BUBBLE", this.cid, child.cid, this.flowFlags);
        this.flowFlags |= FLOW_TRACED;
        if (this.flowViews) this.flowViews.push(child)
        else this.flowViews = [child];
      } else {
   //     console.log("DIDNT ADD TRACE", this.cid, child.cid, this.flowFlags);
      }

      // call the view change event
      this.traceChange(orig, child, depth);

      // recurse up the tree
      if (this.parentView) {
        this.parentView.traceBubble(orig, this, depth + 1);
      }
    },

    /**
     * Bubble view changes - Do attribute importing here!
     *
     * @param {integer} depth (how deep the origin of the change is)
     * @param {object} view (origin view of the change)
     * @param {object} child (child view of the change)
     * @return {boolean} true = stop bubbling
     */
    traceChange: function(orig, child, depth) {},

    /**
     * Flow all changes down the tree
     *
     * @param {object} attrs to set while flowing down
     */
    flow: function(options) {
      this.set(options, true);
      this.layout();
      this.flowViews = null;
      this.flowFlags = 0;
    },

    /**
     * Re-layout the child views
     */
    layout: function() {
      var views = this.flowViews || this.childViews;
      for (var i = 0, l = views.length; i < l; i++) {
        this.views[i].flow();
      }
    },

    // -----------------------------------------------------------------------
    //    Measurement Routines
    // -----------------------------------------------------------------------

    /**
     * Measure the inner size of the view
     *
     * @param {boolean} scroll = true for scroll size instead of inner
     */
    measureView: function() {
      var size = Tile.dom.innerSize(this);
      return this.set(size, true);
    },

    /**
     * Measure the pad size of the view
     */
    measurePad: function() {
      var hash = this.styleHash()
        , size = Tile.dom.padSize(this, hash);
      return this.set(size, true);
    },

    /**
     * Get the DOM hash for the view
     *
     * @returns {String} hash value for DOM element path with style
     */
    styleHash: function() {
      if (!this._styleHash) {
        var pre = this.parentView ? this.parentView.styleHash() : '';
        this._styleHash = pre + '/' + this.tagName + ':' + this.className;
      }
      return this._styleHash;
    },

      // ----------------------------------------------------------------------
    //    DRAG
    // ----------------------------------------------------------------------

    /**
     * Make the tile draggable
     *
     * NOTE: all this does is add a .drag class to the element
     * NOTE: manually add .drag class to any element to make draggable
     */
    setDrag: function(state) {
      this.$el.toggleClass('drag', this.options.drag = state);
    },

    /**
     * Set-up the drag operation
     *
     * @return {true|false} (true=handle the drag, false=pass to parent}
     */
    dragInit: function(ev, dd) {},

    // Start the drag
    dragStart: function(ev, dd) {},

    // Move within a drag
    dragMove: function(ev, dd) {},

    // End the drag
    dragEnd: function(ev, dd) {},

    // Clean up initialization
    dragFinish: function(ev, dd) {},

    // ----------------------------------------------------------------------
    //    DROP
    // ----------------------------------------------------------------------

    /**
     * Enable Drop support within a tile
     */
    setDrop: function(state) {
      this.$el.toggleClass('drop', this.options.drop = state);
    },

    //  the drop-zones
    dropInit: function(ev, dd) {
      return true;
    },

    // Enter a drop-zone
    dropOver: function(ev, dd) {},

    // Move within a drop-zone
    dropMove: function(ev, dd) {},

    // Exit a drop-zone
    dropOut: function(ev, dd) {},

    // Commit a drop
    dropCommit: function(ev, dd) {
      return true;
    },

    // Finish the drop-zone
    dropFinish: function(ev, dd) {},

    // ----------------------------------------------------------------------
    //    EVENT CAPTURE - Instead of bubbling
    // ----------------------------------------------------------------------

    addEvent: function(obj, types, fn) {
      types = types.split(' ');
      for (var i = 0, l = types.length; i < l; i++) {
        obj.addEventListener(types[i], fn, true);
      }
    },

    removeEvent: function(obj, types, event) {
      types = types.split(' ');
      for (var i = 0, l = types.length; i < l; i++) {
        obj.removeEventListener(types[i], event, true);
      }
    }

  });


  // ------------------------------------------------------------------------
  //    TILE : DRAGGER (for containing HTML elements for drag-and-drop)
  // ------------------------------------------------------------------------

  var Dragger = Tile.Dragger = Tile.View.extend({

    /**
     * Internal Properties
     */
    dragData: null,       // Drag-Data used by the drag operation
    $source: null,        // Source element initiating the drag
    sourceDisplay: '',    // Source element css 'display' property value

    /**
     * API Schema
     */
    optionSchema: Tile.View.prototype.optionSchema.extend({
      dragData: {
        adapter: 'setter',
        isPrivate: true
      }
    }),

    /**
     * DragData Setter
     */
    setDragData: function(dragData) {

      this.dragData = dragData;
      this.$source = dragData.tile;

      this.setElement(this.$source
        .clone()
        .removeAttr('id')
        .css('display', 'block')
      );

      if (dragData.copyable) {
        this.$source = null;
      }
      else if (dragData.restorable) {
        this.sourceDisplay = this.$source.css('display');
        this.$source.css('display', 'none');
      } else {
        this.$source.remove();
        this.$source = null;
      }

      this.setDrag(true);
    },

    /**
     * Initialize the Drag
     */
    dragInit: function(ev, dd) {
      return dd.handler;
    },

    /**
     * Restore a Failed Drag
     */
    dragRestore: function() {
      this.$source.css('display', this.sourceDisplay);
      this.$source = null;
      this.close();
    },

    /**
     * Close the Dragger
     */
    close: function() {
      if (this.$source) {
        this.$source.remove();
      }
      this.$source = null;
      this.dragData = null;

      Dash.Tile.prototype.close.apply(this, arguments);
    }

  });


  // ------------------------------------------------------------------------
  //    TILE : LOADER
  // ------------------------------------------------------------------------

  var Loader = Tile.Loader = Tile.View.extend({

    _configure: function(options) {
      this.optionBuffer = {};
      this.options = {};
      this.childViews = [];
    },

    initialize: function(options) {
      var that = this;

      require(['tile!' + options.type],
        function() {
          that.replaceWith(options);
        },
        function(error) {
          options.error = error;
          that.replaceWith(new Tile.Error(options));
        }
      );
    }

  });


  // ------------------------------------------------------------------------
  //    TILE : Error
  // ------------------------------------------------------------------------

  var Error = Tile.Error = Tile.View.extend({

    className: 'error',

    initialize: function(options) {
      this.error = options.error;
    },

    render: function() {

      console.log("Require Loading Error:", this.error);

      this.$el.html([
        '<li><h2>Load Error!</h2></li>',
        '<li>Type: ', this.error.type, '</li>',
        '<li>Name: ', this.error.name, '</li>',
        '<li>Path: ', this.error.path, '</li>',
      ].join(''));

      return this;
    }

  });

  return Tile;

});
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
      scrollWidth: {
        adapter: 'options',
        flowFlags: FLOW_SIZED,
        isPrivate: true,
        defaultValue: 0
      },
      scrollHeight: {
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
    traceChange: function(orig, child, depth) {
 //     console.log("-----> traceChange(",this.cid, depth, ")", this.parentView ? this.parentView.cid : 'noparent');
      // - Call this.measureInner || this.measureScroll when depth == 1 ????
    },

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
     * Measure the scroll size of the view
     */
    measureScroll: function() {
      var size = Tile.dom.scrollSize(this);
      return this.set(size, true);
    },

    /**
     * Measure the inner size of the view
     */
    measureInner: function() {
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

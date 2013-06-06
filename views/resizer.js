define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    VIEW : RESIZER
  // ------------------------------------------------------------------------

  var MIN_SIZE = 20
    , vproto = Tile.View.prototype
    , round	= Math.round
    , floor = Math.floor

    , Edge = Tile.View.extend({
      isEdge: true,
      className: 'view edge drag'
    });

  return Tile.View.extend({

    className: 'tile resizer',

     /**
     * Set-up the child when attached
     */
    childSetup: function(child) {
      child.$el.css('position', 'absolute');
    },

    /**
     * Define child attribute schema
     */
    optionSchema: Tile.View.prototype.optionSchema.extend({
      axis: {
        flowFlags: FLOW_LOCAL,
        filter: 'options',
        options: {
          inherit: 0,
          horizontal: 1,
          vertical: 2
        },
        defaultValue: 0
      },
      edging: {
        flowFlags: FLOW_LOCAL,
        filter: 'integer',
        defaultValue: 7
      },
      prune: {
        flowFlags: FLOW_LOCAL,
        filter: 'boolean',
        defaultValue: true
      }
    }, {
      size: {
        flowFlags: FLOW_SUPER,
        filter: 'integer',
        defaultValue: 0
      },
      flex: {
        flowFlags: FLOW_SUPER,
        filter: 'boolean',
        defaultValue: true
      }
    }),

    /**
     * Should we prune this view ???
     *
     * @return {boolean} true = view needs to be pruned
     */
    shouldPrune: function() {
      return (this.childViews.length < 2
        && this.parentView
        && this.options.prune);
    },

    /**
     * Convert axis to provided values
     *
     * @param {*} w (what will be returned if axis = horizontal)
     * @param {*} h {what will be returned if axis = vertical}
     * @return {*} provided w or h value
     */
    axisTo: function(w, h) {
      var superAxis = this.superFn('axisTo', 1, 2, 1);
      return (this.options.axis || superAxis) == 1 ? w : h;
    },

    /**
     * Total edge count
     *
     * @return {integer} total number of edge children
     */
    edgeCount: function() {
      return floor(this.childViews.length / 2);
    },

    /**
     * Get the number of non-edge children
     *
     * @return {integer} total number of non-edge children
     */
    childCount: function() {
      return floor((this.childViews.length + 1) / 2);
    },

    /**
     * Get the index of a child view
     *
     * @param {object} view to find the index of
     * @return {integer} index of a non-edge child view
     */
    indexOf: function(view) {
      return floor(vproto.indexOf.call(this, view) / 2);
    },

    /**
     * Get the non-edge view at a specified index
     */
    viewAt: function(index) {
      return vproto.viewAt.call(this, index * 2);
    },

    /**
     * Override Tile.View.getViews
     * NOTE: we override to get only non-edge views
     *
     * @return {array} non-edge child views
     */
    getViews: function() {
      var views = [];

      for (var i = 0, l = this.childViews.length; i < l; i++) {
        var view = this.childViews[i];
        if (!view.isEdge) {
          views.push(view.get());
        }
      }
      return views;
    },

    /**
     * Override Tile.View._attachView
     * NOTE: we override to insert an edge for every view
     *
     * @param {object} view to attach
     * @param {integer} index (index to insert at)
     * @return {object} view
     */
    _attachView: function(view, index) {
      var attach = vproto._attachView
        , pos = (index === undefined) ? undefined : index * 2;

      if (this.childCount()) {
        attach.call(this, this._toView(Edge), pos);
      }
      attach.call(this, view, pos);

      return view;
    },

    /**
     * Override Tile.View._detachView
     * NOTE: we override to detach an edge for every view
     *
     * @param {object} view to detach
     */
    _detachView: function(view) {
      var detach = vproto._detachView
        , index = this.indexOf(view)
        , offset = (index < (this.childCount() - 1) ? 0 : 1);

      detach.call(this, view);

      var edge = this.childViews[index * 2 - offset];
      if (edge && edge.isEdge) {
        detach.call(this, edge).close();
      }
      Tile.reflow.schedule(JOB_PRUNE, this);
    },

    /**
     * Deferred prunning callback
     * NOTE: we 'prune' resizer views when they no longer have children. If
     *  we didn't prune, removing the last child from a resizer would leave
     *  an empty resizer view that lingers as an empty hole in the UI. That
     *  behavior might be desirable in some situations... but not most.
     */
    pruneView: function() {
      if (this.shouldPrune()) {
        if (this.childViews.length) {
          var move = this.childViews[0];
          if (!move.options.axis) {
            move.options.axis = this.axisTo(2, 1);
          }
          this.replaceWith(move);
        }
        this.close();
      }
    },

    // --------------------------------------------------------------------
    //    Render
    // --------------------------------------------------------------------

    layout: function() {
      var tpc = 0, cpc = 0, cno = 0, px, i, view
        , opts = this.options
        , end = this.childViews.length - 1
        , edging = this.options.edging
        , wx = opts.innerWidth
        , hx = opts.innerHeight
        , hz = this.axisTo(true, false)
        , tx = hz ? wx : hx
        , ax = tx
        , off = 0;

      // calculate aggregate totals
      for (i = 0; i <= end; i++) {
        view = this.childViews[i];
        opts = view.options;
        if (view.isEdge) tx -= edging;
        else if (!opts.size) cno++;
        else if (!opts.flex) tx -= opts.size;
        else {
          tpc += opts.size;
          cpc++;
        }
      }
      var avg = 100 / (cno + cpc);

      // size all the children
      for (i = 0; i <= end; i++) {
        view = this.childViews[i];
        opts = view.options;

        if (i == end) px = ax;
        else if (view.isEdge) px = edging;
        else if (!opts.size) px = round((avg * tx) / 100);
        else if (!opts.flex) px = opts.size;
        else px = round((opts.size * avg * cpc * tx) / (tpc * 100));
        ax -= px;

        var wsize = hz ? px : wx;
        var hsize = hz ? hx : px;

        view.$el.css({
          width: wsize - opts.padWidth,
          height: hsize - opts.padHeight,
          left: hz ? off : '',
          top: hz ? '' : off,
          cursor: !view.isEdge ? '' : hz ? 'col-resize' : 'row-resize'
        });

        off += px;

        view.flow({
          size: px,
          innerWidth: wsize,
          innerHeight: hsize
        });
      }
      return this;
    },

    // --------------------------------------------------------------------
    //    Drag an Edge
    // --------------------------------------------------------------------

    /**
     * Inform the drag sub-system that we will roll-our-own drag
     *
     * @param {object} ev (javascript/jquery event object)
     * @param {object} dd (dash drag-and-drop object)
     * @param {boolean} true (to handle the drag)
     */
    dragInit: function(ev, dd) {
      dd.autodrag = false;
      return true;
    },

    /**
     * Take a snapshot of the children's sizes before the drag
     *
     * @param {object} ev (javascript/jquery event object)
     * @param {object} dd (dash drag-and-drop object)
     */
    dragStart: function(ev, dd) {
      //Tile.root.set('cover', this.axisTo('col-resize', 'row-resize'));

      dd.index = this.indexOf(dd.tile) + 1;
      dd.len = this.childCount();

      // take a snapshot of the current child sizes
      _.each(this.childViews, function(view) {
        var options = view.options;
        options._size = options.size;
      });
    },

    /**
     * Do the math to drag an edge (and resize siblings)
     *
     * @param {object} ev (javascript/jquery event object)
     * @param {object} dd (dash drag-and-drop object)
     */
    dragMove: function(ev, dd) {
      var off = this.axisTo(dd.deltaX, dd.deltaY)
        , after = off > 0;

      Tile.reflow.block();

      var carry = this.dragShift(dd,
        dd.index - (after ? 0 : 1),
        after ? off : -off,
        after ? 1 : -1
      );

      this.dragShift(dd,
        dd.index - (after ? 1 : 0),
        carry + (after ? -off : off),
        after ? -1 : 1
      );

      Tile.reflow.unblock();
    },

    /**
     * Recursively resize siblings in one direction
     *
     * @param {object} dd (dash drag-and-drop object)
     * @param {integer} index (index of child to resize)
     * @param {integer} offset (amount to shift child)
     * @param {integer} next (amount to pass on to next sibling)
     */
    dragShift: function(dd, index, offset, next) {
      if (index < 0 || index == dd.len) return offset;

      var overflow = 0
        , view = this.viewAt(index)
        , size = view.options._size - offset;

      if (size < MIN_SIZE) {
        overflow = MIN_SIZE - size;
        size = MIN_SIZE;
      }
      view.set({ size: size });

      return this.dragShift(dd, index + next, overflow, next);
    }

  });

});
define([
  'jQuery',
  'Underscore',
  'Backbone',
  'Tile',
  'tile!layouts/flexer'
  ], function($, _, Backbone, Tile, Flexer) {

  // ------------------------------------------------------------------------
  //    VIEW : RESIZER
  // ------------------------------------------------------------------------

  var vproto = Flexer.prototype
    , floor = Math.floor
    , abs = Math.abs

    , Edge = Tile.View.extend({
      className: 'tile edge drag',
      isEdge: true,
      type: '_edge',
      options: {
        flex: false,
        size: 7
      }
    });

  return Flexer.extend({

    className: 'tile resizer',

    /**
     * Default child type is resizer
     */
    childType: true,

    /**
     * Define child attribute schema
     */
    optionSchema: Flexer.prototype.optionSchema.extend({
      edging: {
        flowFlags: FLOW_LOCAL,
        filter: 'integer',
        defaultValue: 7
      }
    }),

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
     * Set CSS
     */
    setCSS: function(view, row, css) {
      if (view.isEdge) {
        css.cursor = row ? 'col-resize' : 'row-resize';
      }
      view.$el.css(css);
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
      var pos = (index === undefined) ? undefined : index * 2;

      if (this.childCount()) {
        vproto._attachView.call(this, this._toView(Edge), pos);
      }
      vproto._attachView.call(this, view, pos);

      return view;
    },

    /**
     * Override Tile.View._detachView
     * NOTE: we override to detach an edge for every view
     *
     * @param {object} view to detach
     */
    detachView: function(view) {
      var index = this.indexOf(view)
        , offset = (index < (this.childCount() - 1) ? 0 : 1);

      vproto.detachView.call(this, view);

      if (!view.isEdge) {
        var edge = this.childViews[index * 2 - offset];
        if (edge && edge.isEdge) {
          edge.close();
        }
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
console.log("pruneView", this.cid, this.childViews.length, this.options.prune, this._isRunning);
      if (this.childViews.length < 2
        && this.parentView
        && this.options.prune
        && this._isRunning
      ) {
        console.log("pruning...", this.cid);
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

      var side = this.axisTo('innerWidth', 'innerHeight');
      this._index = _.indexOf(this.childViews, dd.tile);

      // take a snapshot of the current child sizes
      _.each(this.childViews, function(view) {
        view._size = view.options[side];
      });
    },

    /**
     * Do the math to drag an edge (and resize siblings)
     *
     * @param {object} ev (javascript/jquery event object)
     * @param {object} dd (dash drag-and-drop object)
     */
    dragMove: function(ev, dd) {
      var total = this.axisTo(dd.deltaX, dd.deltaY)
        , inc = total > 0 ? 1 : -1
        , views = this.childViews
        , length = views.length;

      Tile.reflow.block();

      total = abs(total);
      var carry = this.dragShift(this._index, inc, total, length, views);
      var view = this.childViews[this._index - inc];
      view.set({ size: view._size + total - carry });

      Tile.reflow.unblock();
    },

    /**
     * Shift the tiles during a drag
     */
    dragShift: function(index, inc, total, length, views) {
      if (total && (index += inc) >= 0 && index < length) {
        var view = views[index]
          , min = view.options.minsize
          , size;

        if (!view.isEdge) {
          size = view._size - total;
          if (size < min) {
            total = min - size;
            size = min;
          } else total = 0;
          view.set({ size: size });
        }
        this.dragShift(index, inc, total, length, views);
      }
      return total;
    }

  });

});
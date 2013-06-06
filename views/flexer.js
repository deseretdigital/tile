define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    VIEW : RESIZER
  // ------------------------------------------------------------------------

  var round	= Math.round;

  return Tile.View.extend({

    className: 'tile flexer',

    /**
     * Default child type is resizer
     */
    childType: true,

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
      },
      minsize: {
        flowFlags: FLOW_SUPER,
        filter: 'integer',
        defaultValue: 20
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
          innerWidth: wsize,
          innerHeight: hsize
        });
      }
      return this;
    }

  });

});
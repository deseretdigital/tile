define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    TILE : BALANCER - equal sized blocks without edges
  // ------------------------------------------------------------------------

  var floor = Math.floor;

  return Tile.View.extend({

    className: 'tile balancer',

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
        adapter: 'options',
        filter: 'options',
        options: {
          inherit: 0,
          horizontal: 1,
          vertical: 2
        },
        defaultValue: 0
      }
    }),

    /**
     * Convert Axis to Values
     */
    axisTo: function(w, h) {
      return (this.options.axis || this.superFn('axisTo', 1, 2, 1)) == 1 ? w : h;
    },

    /**
     * Layout the children
     */
    layout: function() {
      var options = this.options
        , horiz = this.axisTo(true, false)
        , width = options.innerWidth
        , height = options.innerHeight
        , total = horiz ? width : height
        , length = this.childViews.length
        , average = length ? floor(total / length) : total
        , offset = 0
        , end = length - 1;

      for (var i = 0; i < length; i++) {
        var view = this.childViews[i]
          , size = (i != end) ? average : total
          , opts = view.options
          , vwidth = (horiz ? size : width) - opts.padWidth
          , vheight = (horiz ? height : size) - opts.padHeight;

        view.$el.css({
          width: vwidth,
          height: vheight,
          left: horiz ? offset : '',
          top: horiz ? '' : offset
        });

        view.flow({
          innerWidth: vwidth,
          innerHeight: vheight
        });

        total -= size;
        offset += size;
      }
      return this;
    }

  });

});
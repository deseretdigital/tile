define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    TILE : Positioner
  //
  //    Mode: screen, offset, center, target, dock
  // ------------------------------------------------------------------------

  var round	= Math.round;

  return Tile.View.extend({

    className: 'tile positioner',

    /**
     * Set-up the child when attached
     */
    childSetup: function(child) {
      var style = child.el.style;
      style.position = 'absolute';
    },

    /**
     * Define child attribute schema
     */
    optionSchema: Tile.View.prototype.optionSchema.extend({}, {
      mode: {
        flowFlags: FLOW_SUPER,
        flowJobs: JOB_PRESIZE,
        filter: 'options',
        options: {
          screen: 'screenMode',
          offset: 'offsetMode',
          center: 'centerMode',
          target: 'targetMode'
        },
        defaultValue: 'screenMode'
      },
      anchor: {
        flowFlags: FLOW_SUPER,
        filter: 'options',
        options: {
          topleft: 0,
          topright: 1,
          bottomleft: 2,
          bottomright: 3
        },
        defaultValue: 0
      },
      axis: {
        flowFlags: FLOW_SUPER,
        filter: 'options',
        options: {
          vertical: 0,
          horizontal: 1
        },
        defaultValue: 0
      },
      target: {
        flowFlags: FLOW_SUPER
      },
      zindex: {
        flowFlags: FLOW_SUPER,
        filter: 'integer',
        defaultValue: 0
      },
      width: {
        flowFlags: FLOW_SUPER,
        flowJobs: JOB_PRESIZE,
        filter: 'integer',
        defaultValue: 0
      },
      height: {
        flowFlags: FLOW_SUPER,
        flowJobs: JOB_PRESIZE,
        filter: 'integer',
        defaultValue: 0
      },
      overflow: {
        flowFlags: FLOW_SUPER,
        filter: 'options',
        options: [
          'auto',
          'hidden'
        ],
        defaultValue: 'auto'
      },
      x: {
        flowFlags: FLOW_SUPER,
        filter: 'integer',
        defaultValue: 0
      },
      y: {
        flowFlags: FLOW_SUPER,
        filter: 'integer',
        defaultValue: 0
      }
    }),

    /**
     * REFLOW JOB : Pre-size the child view if one axis is auto-sized.
     * - Triggered by by option.mode, option.width, option.height change.
     *
     * NOTE: If both are fixed, no need to presize because we know the
     *    dimensions and don't have to measure.  If one of the dimensions
     *    is auto sizing, then we should apply what we know here so we can
     *    pre-measure during the tracing phase.  The downside to measuring
     *    here is that we can't animate during flow.  But, since we can't
     *    animate an auto size, we might as well set here for efficiency.
     */
    presizeChild: function(view) {
      var options = view.options
        , width = options.width
        , height = options.height
        , mode = options.mode
        , style = view.el.style;

      if ((mode == 'centerMode' || mode == 'targetMode') && !(width && height)) {
        style.width = width ? (width + 'px') : '';
        style.height = height ? (height + 'px') : '';
        style.right = style.bottom = '';
      }
    },

    /**
     * TRACE CHANGE EVENT : Pre-measure view if one or more axis is auto-sized
     *
     * NOTE: consider looking for deeper decendents changes that might affect
     *    the sizing of auto-sized views.
     */
    traceChange: function(orig, child, depth) {
      if (depth == 1) {
        var options = child.options;

        if (!(options.width && options.height)
            && !(child.flowFlags & FLOW_MEASURED)) {

          child.flowFlags |= FLOW_MEASURED;
          child.measureView();
        }
      }
    },

    /**
     * Layout the children
     */
    layout: function() {
      var sized = this.flowFlags & FLOW_SIZED ? true : false
        , views = sized ? this.childViews : (this.flowViews || this.childViews)
        , width = this.options.innerWidth
        , height = this.options.innerHeight;
/*
c = '';
if (this.flowViews) {
  c = _.reduce(this.flowViews, function(m,v) { return m + ' ' + v.cid; }, 'views: ');
}
console.log("positioner...", this.flowFlags & FLOW_SIZED ? true : false, c);
*/

      for (var i = 0, l = views.length; i < l; i++) {
        var view = views[i]
          , style = view.el.style
          , options = view.options
          , modeFn = options.mode
          , data = undefined;

        data = this[modeFn](view, options, style, width, height, sized);
        view.flow(data);
      }
    },

    /**
     * Cover the entire parent view
     *
     * @attr.mode {'screen'}
     */
    screenMode: function(view, options, style, width, height, sized) {
      if (!(sized || view.flowFlags & SUPER_ADDED)) {
        return undefined;
      }

      view.$el.css({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: '',
        height: ''
      });

      return {
        innerWidth: width - options.padWidth,
        innerHeight: height - options.padHeight
      }
    },

    /**
     * Center the view within the parent
     *
     * @attr.mode {string} = 'center'
     * @attr.width {integer} width = 0 (auto size)
     * @attr.height {integer} height = 0 (auto size)
     * @attr.x {integer} x-offset from center
     * @attr.y {integer} y-offset from center
     */
    centerMode: function(view, options, style, width, height, sized) {
      if (!(sized || view.flowFlags & SUPER_ADDED_RENDERED_SIZED)) {
        return undefined;
      }
      var size = this.sizeView(options, style)
        , yspace = height - size.innerHeight - options.padHeight
        , xspace = width - size.innerWidth - options.padWidth
        , ypos = round(yspace / 2) + options.y
        , xpos = round(xspace / 2) + options.x;

      // Don't go off the screen
      if (xpos < 0) xpos = 0;
      if (ypos < 0) ypos = 0;

      style.top = ypos + 'px';
      style.left = xpos + 'px';
      style.right = style.bottom = '';

      return size;
    },

    /**
     * Offset the view from one of the corners
     *
     * @attr.mode {'offset'}
     * @attr.anchor {'topleft'|'topright'|'bottomright'|'bottomleft'}
     * @attr.width {integer} width = 0 (auto)
     * @attr.height {integer} height = 0 (auto)
     * @attr.x {integer}
     * @attr.y {integer}
     */
    offsetMode: function(view, options, style, width, height, sized) {
      if (!(view.flowFlags & SUPER_ADDED)) {
        return undefined;
      }
      var size = this.sizeView(options, style)
        , top = options.anchor < 2
        , left = !(options.anchor % 2)
        , ypos = options.y + 'px'
        , xpos = options.x + 'px';

      style.top = top ? ypos : '';
      style.bottom = top ? '' : ypos;
      style.left = left ? xpos : '';
      style.right = left ? '' : xpos;

      return undefined;
    },

    /**
     * Position the view relative to a target view
     *
     * @attr.mode {'target'}
     * @attr.anchor {'topleft'|'topright'|'bottomright'|'bottomleft'}
     * @attr.width {integer} width = 0 (auto)
     * @attr.height {integer} height = 0 (auto)
     * @attr.x {integer}
     * @attr.y {integer}
     * @attr.target {element}
     * @attr.axis {'vertical', 'horizontal'}
     */
    targetMode: function(view, options, style, pwidth, pheight, sized) {
     var top = options.anchor < 2
        , left = !(options.anchor % 2)
        , tw = options.target.outerWidth()
        , th = options.target.outerHeight()
        , off = options.target.offset()
        , width = options.width
        , height = options.height;

      var size = this.sizeView(options, style);

      // Render the tile before positioning
      //tile.render();

      // Calculate the tile geometry
      var h = view.$el.outerHeight()
        , w = view.$el.outerWidth()
        , x = this.xPos(options, tw, off.left, left, pwidth)
        , y = this.yPos(options, th, off.top, top, pheight)
        , overflow = options.overflow;

      // Rectify the positioning if overflowing edge of screen
      if (this.rectify(w, x, pwidth)) {
        x = this.xPos(options, tw, off.left, left = !left, pwidth);
      }
      if (this.rectify(h, y, pheight)) {
        y = this.yPos(options, th, off.top, top = !top, pheight);
      }

      // Crop if still overflowing edge of screen
      if (w + x > pwidth) {
        width = pwidth - x - 10;
        overflow = 'auto';
      }
      if (h + y > pheight) {
        height = pheight - y - 10;
        overflow = 'auto';
      }

      // Set the tile geometry
      view.$el.css({
        overflow: overflow,
        top: top ? y : 'auto',
        bottom: top ? 'auto' : y,
        left: left ? x : 'auto',
        right: left ? 'auto' : x
      });
    },

    // Rectify x or y coordinate
    rectify: function(size, offset, screen) {
      return (size + offset > screen
        && (offset * 100 / screen) > 60);
    },

    // Calculate Y coordinate
    yPos: function(options, th, ty, top, pheight) {
      return ((top ? ty + th : pheight - ty)
        + options.y - (options.axis ? th : 0)
      );
    },

    // Calculate X coordinate
    xPos: function(options, tw, tx, left, pwidth) {
      return ((left ? tx : pwidth - tx - tw)
        + options.x + (options.axis ? tw : 0)
      );
    },

    // ---------------------------------------------------------------------

    sizeView: function(options, style) {
      var width = options.width
        , height = options.height;

      style.width = width ? (width + 'px') : '';
      style.height = height ? (height + 'px') : '';

      return {
        innerWidth: width || options.innerWidth,
        innerHeight: height || options.innerHeight
      };
    }

  });

});
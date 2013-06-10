define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    VIEW : RESIZER
  // ------------------------------------------------------------------------

  var round	= Math.round
    , FIXED_AUTO = 0        // Fixed-Auto sizing (flex: false, size: 0)
    , FIXED_SIZE = 1        // Fixed sizing (flex: false, size: 1234)
    , FLEX_AUTO = 2         // Flex-Auto sizing (flex: true, size: 0)
    , FLEX_SIZE = 3;        // Flex sizing (flex: true, size: 1234)

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
      align: {
        flowFlags: FLOW_SUPER,
        filter: 'options',
        options: {
          start: 0,
          end: 1,
          center: 2,
          stretch: 3
        },
        defaultValue: 3
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

    /**
     * Trace the changes as they bubble up
     *
     * @param {object} orig (origin tile of change event)
     * @param {object} child (child tile of change path)
     * @param {integer} depth (depth of change path)
     */
    traceChange: function(orig, child, depth) {
      if (depth == 1) {
        var flags = child.flowFlags
          , options = child.options;

        // Determine Child Flow Mode
        // _mode = FIXED_AUTO | FIXED_SIZE | FLEX_AUTO | FLEX_SIZE
        if (flags & Tile.SUPER_ADDED) {
          options._mode = (options.size ? 1 : 0) + (options.flex ? 2 : 0);
        }

        // Measure new or rendered children that are FIXED_AUTO
        if (flags & Tile.RENDERED_ADDED
          && (options._mode == FIXED_AUTO || this.options.align != 3)) {

          child.measureInner();

          // If measurement is different than known size, flag re-layout
          if (flags & Tile.FLOW_SIZED) {
            this.flowFlags |= Tile.FLOW_VIEW;
          }
        }
      }
    },

    /**
     * Re-Calculate the children's Layout
     */
    layout: function() {
      var i, view
        , options = this.options
        , align = options.align
        , views = this.childViews
        , end = views.length
        , row = this.axisTo(true, false)
        , axisSize = row ? options.innerWidth : options.innerHeight
        , flipSize = row ? options.innerHeight : options.innerWidth
        , flexSize = 0
        , flexAvg = 0
        , flexMult
        , autoCount = 0
        , sizeCount = 0
        , offset = 0
        , carry = 0.01
        , innerSize
        , outerSize
        , crossSize
        , crossBeg
        , crossEnd
        , flowAxis
        , flowCross
        , pad
        , val
        , dims
        ;

      // ------------------------------------------------------------------
      //    Calculate the Flex Direction Values
      // ------------------------------------------------------------------

      for (i = 0; i < end; i++) {
        options = views[i].options;
        options._pad = pad = row ? options.padWidth : options.padHeight;

        switch (options._mode) {
          case FIXED_AUTO:
            options._size = row ? options.innerWidth : options.innerHeight;
            options.outerSize = options._size + pad;
            axisSize -= options.outerSize;
            break;

          case FIXED_SIZE:
            options.outerSize = options.size + pad;
            axisSize -= options.outerSize;
            break;

          case FLEX_AUTO:
            autoCount++;
            break;

          case FLEX_SIZE:
            sizeCount++;
            flexSize += options.size;
        }
      }

      flexAvg = sizeCount ? round(flexSize / sizeCount) : 10;
      flexSize += flexAvg * autoCount;
      flexMult = axisSize / flexSize;

      // ------------------------------------------------------------------
      //    Calculate the Child Size
      // ------------------------------------------------------------------

      for (i = 0; i < end; i++) {
        view = views[i];
        options = view.options;

        // ------------------------------------------------------------------
        //    Calculate the Axis Size
        // ------------------------------------------------------------------

        switch (options._mode) {
          case FIXED_AUTO:
            innerSize = '';
            outerSize = options.outerSize;
            flowAxis = undefined;
            break;

          case FIXED_SIZE:
            innerSize = options.size;
            outerSize = options.outerSize;
            flowAxis = innerSize;
            break;

          case FLEX_AUTO:
          case FLEX_SIZE:
            val = ((options.size || flexAvg) * flexMult) + carry;
            outerSize = val | 0;
            carry = val % 1;
            innerSize = outerSize - options._pad;
            flowAxis = innerSize;
        }

        // ------------------------------------------------------------------
        //    Calculate the Cross Size
        // ------------------------------------------------------------------

        switch (align) {
          case 0: // start
            crossSize = '';
            crossBeg = 0;
            crossEnd = '';
            flowCross = undefined;
            break;

          case 1: // end
            crossSize = '';
            crossBeg = '';
            crossEnd = 0;
            flowCross = undefined;
            break;

          case 2: // center
            crossSize = (row ? options.innerHeight : options.innerWidth)
              + (row ? options.padHeight : options.padWidth);
            crossBeg = round((flipSize - crossSize) / 2);
            crossEnd = '';
            flowCross = undefined;
            break;

          case 3: // stretch
            crossSize = '';
            crossBeg = 0;
            crossEnd = 0;
            flowCross = flipSize - (row ? options.padHeight : options.padWidth);
        }

        // ------------------------------------------------------------------
        //    Set the child CSS Geometry
        // ------------------------------------------------------------------

        view.$el.css(row ? {
          width: innerSize,
          height: crossSize,
          left: offset,
          right: '',
          top: crossBeg,
          bottom: crossEnd
        } : {
          width: crossSize,
          height: innerSize,
          left: crossBeg,
          right: crossEnd,
          top: offset,
          bottom: ''
        });

        offset += outerSize;

        // ------------------------------------------------------------------
        //    Set the child flow dimensions
        // ------------------------------------------------------------------

        dims = undefined;
        if (flowAxis !== undefined) {
          if (!dims) dims = {};
          if (row) dims.innerWidth = flowAxis;
          else dims.innerHeight = flowAxis;
        }
        if (flowCross !== undefined) {
          if (!dims) dims = {};
          if (row) dims.innerHeight = flowCross;
          else dims.innerWidth = flowCross;
        }
        view.flow(dims);
      }
    }

  });

});
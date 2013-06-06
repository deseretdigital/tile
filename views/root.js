define([
  'jQuery',
  'Underscore',
  'Backbone',
  'Tile',
  'tile!layouts/positioner'
  ], function($, _, Backbone, Tile, Positioner) {

  // ------------------------------------------------------------------------
  //    TILE : ROOT - single-page application root
  // ------------------------------------------------------------------------

  return Positioner.extend({

    /**
     * Internal Properties
     */
    cover: false,         // iFrame cover status (set by schema setter)
    $cover: null,         // iFrame cover DOM element
    el : 'body',          // Bind to the <body> element within the DOM

    /**
     * API Schema
     */
    optionSchema: Tile.prototype.optionSchema.extend({
      cover: {
        adapter: 'setter'
      }
    }),

    /**
     * Initialize the Root View
     */
    initialize: function() {
      var that = this
        , dd = null;

      // Add to Tile namespace
      Tile.root = this;

      // Create the iframe cover
      this.$cover = $('<div class="cover" />');

      // Immediately measure but don't trigger reflow
      this.measureInner(true);

      // Bind to window resize
      $(window).resize(function() {
        that.measureInner();
      });

      // Bind to mouse-down - return false on drag to prevent scrolling
      $(document).on('mousedown touchstart', '.drag', function(ev) {
        if ((dd = new Tile.Dragdrop(ev)) && dd.handler) return false;
        return (dd = undefined);
      });

      // Bind to mouse-move (prevent propagation for better performance)
      this.addEvent(document, 'mousemove touchmove', function(ev) {
        if (dd) dd.move(that, ev);
      });

      // Bind to mouse-up
      $(document).on('mouseup touchend', function(ev) {
        dd && (dd = dd.end(that, ev));
      });

      // Initialize the Options
      this.optionSchema.initOptions(this);
    },

    /**
     * Measure the inner size of the view
     */
    measureInner: function(silent) {
      return this.set({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
        }, silent
      );
    },

    /**
     * iFrame Cover Setter
     */
    setCover: function(status) {
      if (this.cover && !status) {
        this.$cover.detach();
      }
      else if (!this.cover && status) {
        this.$cover
          .css('cursor', _.isString(status) ? status : '')
          .prependTo(this.$el);
      }
      this.cover = status ? true : false;
    },

    /**
     * iFrame Cover Getter
     */
    getCover: function(value) {
      return this.cover;
    }

  });

});
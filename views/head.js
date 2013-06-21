define(['jquery', 'underscore', 'backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    TILE : TEST
  // ------------------------------------------------------------------------

  return Tile.View.extend({

    className: 'tile head',

    options: {
      flex: false,
      drag: true
    },

    // Set the drag.tile to parent widget
    dragInit: function(ev, dd) {
      dd.tile = this.parentView;
    },

    // Render the header
    render: function() {
      this.$el.html(
        '<a href="#" class="close">x</a><h2>' + this.parentView.cid + '</h2>'
      );
      return this;
    },

    // DOM Events
    events: {
      "click .close": "closeBtn"
    },

    // Close Event
    closeBtn: function() {
      this.superFn('close');
    }

  });

});
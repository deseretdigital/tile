define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    TILE : TEST
  // ------------------------------------------------------------------------

  return Tile.View.extend({

    className: 'tile test',

    count: 0,

    render: function() {
      this.count++;
      this.$el.html('<div style="float: right; font-weight: bold; color: #900; font-size: 20px;">'
        + this.count
        + '</div>'
        + '<div class="btn drag" style="cursor: move; margin-bottom: 7px;">Drag This</div>'
        + '<a href="#modal">Modal</a>'
        + '<a href="#flyout">Flyout</a>'
        + '<a href="#menu">Menu</a>'
      );

      return this;
    }

  });

});
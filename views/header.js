define(['jquery', 'underscore', 'backbone', 'Tile'],
  function($, _, Backbone, Tile) {

  // ------------------------------------------------------------------------
  //    TILE : TEST
  // ------------------------------------------------------------------------

  return Tile.View.extend({

    className: 'tile header',

    count: 0,

    render: function() {
      this.$el.html("<h1>Tilejs Dashboard</h1>");
      return this;
    }

  });

});
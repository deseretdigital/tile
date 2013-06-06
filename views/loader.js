
  // ------------------------------------------------------------------------
  //    TILE : LOADER
  // ------------------------------------------------------------------------

  var Loader = Dash.Loader = Tile.extend({

    initialize: function(options) {
      var that = this;

      require(['tile!' + options.type],
        function(Tile) {
          that.replaceWith(new Tile(options));
        },
        function(error) {
          options.error = error;
          that.replaceWith(new Error(options));
        }
      );
    }

  });

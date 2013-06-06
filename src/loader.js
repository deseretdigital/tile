
  // ------------------------------------------------------------------------
  //    TILE : LOADER
  // ------------------------------------------------------------------------

  var Loader = Tile.Loader = Tile.extend({

    initialize: function(options) {
      var that = this;

      require(['tile!' + options.type],
        function(Tile) {
          that.replaceWith(new Tile(options));
        },
        function(error) {
          options.error = error;
          that.replaceWith(new Tile.Error(options));
        }
      );
    }

  });

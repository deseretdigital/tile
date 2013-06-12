
  // ------------------------------------------------------------------------
  //    TILE : LOADER
  // ------------------------------------------------------------------------

  var Loader = Tile.Loader = Tile.View.extend({

    _configure: function(options) {
      this.optionBuffer = {};
      this.options = {};
      this.childViews = [];
    },

    initialize: function(options) {
      var that = this;

      require(['tile!' + options.type],
        function() {
          that.replaceWith(options);
        },
        function(error) {
          options.error = error;
          that.replaceWith(new Tile.Error(options));
        }
      );
    }

  });

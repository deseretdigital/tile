define(['jQuery', 'Underscore', 'Backbone', 'Tile', 'tile!layouts/flexer'],
  function($, _, Backbone, Tile, Flexer) {

  // ------------------------------------------------------------------------
  //    TILE : TEST
  // ------------------------------------------------------------------------

  return Flexer.extend({

    className: 'tile widget',

    /**
     * Drop views, model & collection by default
     * - widgets can add these back if they want.
     */
    optionsSchema: Tile.View.prototype.optionSchema.extend({
      views: false,
      model: false,
      collection: false
    }),

    /**
     * Add the Widget head and menu
     */
    initialize: function(options) {
      /*
      this.addView({
        type: 'layouts/head',
        title: 'Widget Title',
        flex: false
      });
      */
      this.optionSchema.initOptions(this);
    },

    /**
     * Default Render Function
     */
    render: function() {
      this.$el.html("THIS IS A WIDGET");
      return this;
    }

  });

});
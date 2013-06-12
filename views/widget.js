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
    optionSchema: Flexer.prototype.optionSchema.extend({
      views: false,
      model: false,
      collection: false,
      prune: false,
      axis: {
        defaultValue: 2,
        isPrivate: true
      }
    }),

    /**
     * Add the Widget head and menu
     */
    initialize: function(options) {
      this.addView([{
        type: 'layouts/head',
        title: 'Widget Title'
      },{
        type: 'layouts/test',
        flex: true
      }]);
      this.optionSchema.initOptions(this);
    }

  });

});
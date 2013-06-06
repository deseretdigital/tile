requirejs.config({

  // ---------- REQUIRE PATHS ----------
  paths: {

    // --- View Paths ---
    layouts: 'lib/tile/views',
    widgets: 'app/views',

    // --- Require View Loader ---
    Tile: 'lib/tile/dist/tile-0.0.1',
    tile: 'lib/tile/require/tile',

    // --- Library Paths ---
    jQuery: 'lib/jquery/jquery-1.9.1.min',
    Underscore: 'lib/underscore/underscore.1.4.4',
    Backbone: 'lib/backbone/backbone.1.0.0'
  },

  // ---------- REQUIRE SHIMS ----------
  shim: {
    jQuery: {
      exports: 'jQuery'
    },
    Underscore: {
      exports: '_'
    },
    Backbone: {
      deps: ['Underscore', 'jQuery'],
      exports: 'Backbone'
    }
  }
});

// --------------------------------------------------------------------------
//    MAIN FUNCTION
// --------------------------------------------------------------------------

requirejs([
  'Tile',
  'tile!layouts/root',
  'tile!layouts/test',
  'tile!layouts/resizer',
  ], function(Tile, Root) {

    tree = new Root({
      views: [
      {
        type: 'layouts/resizer',
        views: [
          { views: [
            { type: 'layouts/test' },
            { type: 'layouts/test' }
          ]},
          { views: [
            { views: [
              { type: 'layouts/test' },
              { type: 'layouts/test' },
              { type: 'layouts/test' }
            ]},
            { views: [
              { type: 'layouts/test' },
              { type: 'layouts/test' },
              { type: 'layouts/test' }
            ]},
            { views: [
              { type: 'layouts/test' },
              { type: 'layouts/test' },
              { type: 'layouts/test' }
            ]}
          ]},
          { views: [
            { type: 'layouts/test' },
            { type: 'layouts/test' },
            { type: 'layouts/test' }
          ]}
        ]
      }
    ]});

  }
);
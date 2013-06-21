
    return Tile;

  }

  // Support AMD loaders
  if(typeof define !== 'undefined' && define.amd) {
    define(['jquery', 'underscore', 'backbone'], function($, _, Backbone) {
      return load($, _, Backbone);
    });
  } else if(typeof exports !== 'undefined') {
    var $ = require('jquery'),
        _ = require('_'),
        Backbone = require('backbone');
    if(!module) module = {};
    exports = module.exports = load($, _, Backbone);
  } else {
    this.Tile = load(this.jQuery, this._, this.Backbone);
  }
}).call(this);
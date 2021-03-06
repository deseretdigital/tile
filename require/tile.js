define(['Tile'], function(Tile) {

  /**
   * Throw an error
   */
  function error(onload, err) {
    onload.error(err);
    console.log('Error Loading View: "' + err.path + '"', err.type);
  }

  /**
   * Return the plugin object
   */
  return {
    load: function(name, req, onload, config) {

      var path = name;

      // Use require to load the tile
      req([path], function(View) {

        // Add the tile to the global tile registry
        Tile.Views[name] = View;

        // Add the normalized name to the tile as .type
        View.prototype.type = name;

        // Add default child type if defined to true
        if (View.prototype.childType === true) {
          View.prototype.childType = name;
        }

        // Return the tile as the loaded value
        onload(View);

      // There was an error loading the tile...
      }
      /*
      , function(err) {
        error(onload, {
          type: err.requireType,
          name: name,
          path: path
        });
      }
      */
      );
    }
  };

});
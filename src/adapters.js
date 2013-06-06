 /**
   * Tile Adapters Object
   */
  Tile.adapters = {};

  /**
   * Setter & Getter for Options Adapter
   */
  Tile.adapters['options'] = function(binding) {
    return {
      setter: function(value) {
        this.options[binding.name] = value;
      },
      getter: function() {
        return this.options[binding.name];
      }
    }
  };

  /**
   * Setter & Getter for Property Adapter
   */
  Tile.adapters['property'] = function(binding) {
    return {
      setter: function(value) {
        this[binding.name] = value;
      },
      getter: function() {
        return this[binding.name];
      }
    }
  };

  /**
   * Setter & Getter for Generic
   */
  Tile.adapters['setter'] = function(binding) {
    var name = binding.name
      , setter = binding.setter || ('set' + classify(name))
      , getter = binding.getter || ('get' + classify(name));

    return {
      setter: _.isFunction(setter) ? setter
        : function(value) {
          var set = this[setter];
          if (_.isFunction(set)) {
            set.call(this, value);
          } else if (_.isObject(set)) {
            set.set(value);
          }
        },
      getter: _.isFunction(getter) ? getter
        : function() {
          var get = this[getter];
          if (_.isFunction(get)) {
            get.call(this);
          } else if (_.isObject(get)) {
            get.get();
          }
      }
    }
  };
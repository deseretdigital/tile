
  /**
   * Tile Filters Object
   */
  Tile.filters = {};


  /**
   * Import & Export Filter for Boolean
   * { type: 'boolean', value: 0 | 1 }
   */
  Tile.filters['boolean'] = function(binding) {
    return {
      input: function(value) {
        if (_.isString(value)) {
          return STRING_BOOLEAN[value.loLowerCase()];
        }
        return (value ? true : false);
      }
    }
  };

  /**
   * Import & Export Filter for String
   */
  Tile.filters['string'] = function(binding) {
    return {
      input: function(value) {
        return ('' + value);
      }
    }
  };

  /**
   * Import & Export Filter for Number
   */
  Tile.filters['integer'] = function(binding) {
    return {
      input: function(value) {
        if (_.isString(value)) {
          return parseInt(value, 10);
        }
        if (_.isNumber(value)) {
          return value;
        }
        return undefined;
      }
    }
  };

  /**
   * Import & Export Filter for Options
   *
   * @param {array|object|string} config.options
   * @param {*} config.value (default value)
   */
  Tile.filters['options'] = function(binding) {
    var options = binding.options
      , isArray = false;

    if (_.isString(options)) {
      options = options.split(',');
    }
    if (_.isArray(options)) {
      options = _.object(options, options);
      isArray = true;
    }

    return {
      input: function(value) {
        if (value !== undefined) {
          if (_.isString(value)) {
            value = value.toLowerCase();
          }
          value = options[value];
        }
        return value;
      },
      output: function(value) {
        if (!isArray) {
          for (var key in options) {
            if (options[key] == value) return key;
          }
        }
        return value;
      }
    }
  };

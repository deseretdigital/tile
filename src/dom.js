
  // -----------------------------------------------------------------------
  //    DOM Object
  // -----------------------------------------------------------------------

  Tile.dom = function() {

    /**
     * DOM Globals
     */
    var CACHE_NAME = null
      , cache = {};

    /**
     * Clear the style cache from local storage
     */
    function clearCache() {
      cache = {};
      localStorage.setItem(CACHE_NAME, undefined);
    }

    /**
     * Save the style cache to local storage
     */
    function saveCache() {
      var json = JSON.stringify(cache);
      localStorage.setItem(CACHE_NAME, json);
    }

    /**
     * Load the style cache from local storage
     */
    function loadCache() {
      var json = localStorage.getItem(CACHE_NAME);
      cache = json ? JSON.parse(json) : {};
    }

    /**
     * Measure the element scroll size
     */
    function scrollSize(view) {
      return {
        scrollWidth: view.$el.width(), // <<<<<<<<<<<<<<<<< NOT RIGHT
        scrollHeight: view.$el.height() // <<<<<<<<<<<<<<<< NOT RIGHT
      }
    }

    /**
     * Measure the inner element size
     */
    function innerSize(view) {
      return {
        innerWidth: view.$el.width(),
        innerHeight: view.$el.height()
      }
    }

    /**
     * Get the cached pad size or generate and cache it
     *
     * @param {element} view - DOM element
     * @param {string} hash - path of tag and class names
     */
    function padSize(view, hash) {
      return (cache[hash] || (cache[hash] = _pad(view.$el)));
    }

    /**
     * Get the pad size for a DOM element
     */
    function _pad($el) {
      var innerWidth = $el.width()
        , outerWidth = $el.outerWidth(true)
        , innerHeight = $el.height()
        , outerHeight = $el.outerHeight(true);

      return {
        padWidth: outerWidth - innerWidth,
        padHeight: outerHeight - innerHeight
      }
    }

    function _padOld(el) {
      var style = document.defaultView.getComputedStyle(el, '');
      return {
        padWidth: _side(style, 'left') + _side(style, 'right'),
        padHeight: _side(style, 'top') + _side(style, 'bottom')
      };
    }

    /**
     * Get the pad side size given a style object
     *
     * @param {object} style - DOM element style object
     * @param {string} side - top | right | bottom | left
     */
    function _side(style, side) {
      var margin = parseInt(style.getPropertyValue('margin-' + side), 10)
        , padding = parseInt(style.getPropertyValue('padding-' + side), 10)
        , border = parseInt(style.getPropertyValue('border-' + side), 10);

      return ((margin || 0) + (padding || 0) + (border || 0));
    }

    /**
     * Public DOM Object Properties
     */
    return {
      padSize: padSize,
      innerSize: innerSize,
      scrollSize: scrollSize,
      loadCache: loadCache,
      saveCache: saveCache,
      clearCache: clearCache
    };

  }();
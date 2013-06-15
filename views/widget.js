define(['jQuery', 'Underscore', 'Backbone', 'Tile', 'tile!layouts/flexer'],
  function($, _, Backbone, Tile, Flexer) {

  var round	= Math.round;

  // ------------------------------------------------------------------------
  //    TILE : TEST
  // ------------------------------------------------------------------------

  var Widget = Flexer.extend({

    className: 'tile widget',

    /**
     * Global Widgets Object
     */
    _widgets: {
      $cover: null
    },

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
      },
      drop: {
        adapter: 'setter',
        defaultValue: true,
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
    },

    // ----------------------------------------------------------------------
    //    DRAG & DROP
    // ----------------------------------------------------------------------

    dragInit: function(ev, dd) {
  //    dd.saved = this.saveState.call(this.parentView, this, this);
      return true;
    },

    dragFinish: function(ev, dd) {
      if (dd.started && !dd.committed) {
    //    dd.saved.parentView.addTile(dd.saved.child, dd.saved.index);
      }
    },

    // Save the state of the widget before dragging
    saveState: function(child, tiles) {
      if (this.options.prune && this.childViews.length == 1 && this.parentView) {
        return Widget.prototype.saveState.call(this.parentView, this, {
          type: this.type,
          childViews: tiles
        });
      } else return {
        index: this.indexOf(child),
        parentView: this,
        views: tiles
      }
    },

    //  the drop-zones
    dropInit: function(ev, dd) {
      if (dd.tile instanceof Widget && this.parentView != Tile.root) {
        if (!this._widgets.$cover) {
          this._widgets.$cover = $('<div class="drop-cover">'
            + '<div class="cover-inner">'
            + '<div class="cover-head">&nbsp;</div>'
            + '<div class="cover-body">&nbsp;</div>'
            + '<div class="cover-foot">&nbsp;</div>'
            + '</div></div>'
          )
          .css('visibility', 'hidden')
          .appendTo(Tile.root.$el);
        }
        return true;
      }
      return false;
    },

    // Enter a drop-zone
    dropOver: function(ev, dd) {
      this._widgets.$cover.css('visibility', 'visible');
    },

    // Move within a drop-zone
    dropMove: function(ev, dd) {
      var w = dd.dropWidth
        , h = dd.dropHeight
        , px = round(dd.dropX * 100 / w)
        , py = round(dd.dropY * 100 / h)
        , qa = px > py
        , qb = (100 - px) > py
        , ch = round(h / 2)
        , cw = round(w / 2)
        , xor = !(!qa ^ !qb);

      dd.dropSide = (qb ? 2 : 1) + (xor ? 2 : 0);

      this._widgets.$cover.css({
        left: dd.dropLeft + ((qa && !qb) ? cw : 0),
        top: dd.dropTop + ((!qa && !qb) ? ch : 0),
        width: (xor ? w : cw) - 2,
        height: xor ? ch : h
      });
    },

    // Exit a drop-zone
    dropOut: function(ev, dd) {
      this._widgets.$cover.css('visibility', 'hidden');
    },

    // Commit a drop
    // dd.dropSide = 1(right), 2(left), 3(bottom), 4(top)
    dropCommit: function(ev, dd) {
      var axis = this.superFn('axisTo', 0, 1, 2)
        , daxis = (dd.dropSide < 3) ? 1 : 2
        , after = dd.dropSide % 2
        , index = this.parentView.indexOf(this);

      if (!axis || daxis != axis) {
        var views = [dd.tile];
        after ? views.unshift(this) : views.push(this);
        this.parentView.addView({
          type: this.parentView.type,
          views: views
          }, index
        );
      } else {
        this.parentView.addView(dd.tile, index + (after ? 1 : 0));
      }
      return true;
    },

    // Finish the drop-zone
    dropFinish: function(ev, dd) {
      if (this._widgets.$cover) {
        this._widgets.$cover.remove();
        this._widgets.$cover = null;
      }
    }

  });

  return Widget;

});
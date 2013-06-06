
  // ------------------------------------------------------------------------
  //    TILE : DRAGGER (for containing HTML elements for drag-and-drop)
  // ------------------------------------------------------------------------

  var Dragger = Tile.Dragger = Tile.View.extend({

    /**
     * Internal Properties
     */
    dragData: null,       // Drag-Data used by the drag operation
    $source: null,        // Source element initiating the drag
    sourceDisplay: '',    // Source element css 'display' property value

    /**
     * API Schema
     */
    optionSchema: Tile.View.prototype.optionSchema.extend({
      dragData: {
        adapter: 'setter',
        isPrivate: true
      }
    }),

    /**
     * DragData Setter
     */
    setDragData: function(dragData) {

      this.dragData = dragData;
      this.$source = dragData.tile;

      this.setElement(this.$source
        .clone()
        .removeAttr('id')
        .css('display', 'block')
      );

      if (dragData.copyable) {
        this.$source = null;
      }
      else if (dragData.restorable) {
        this.sourceDisplay = this.$source.css('display');
        this.$source.css('display', 'none');
      } else {
        this.$source.remove();
        this.$source = null;
      }

      this.setDrag(true);
    },

    /**
     * Initialize the Drag
     */
    dragInit: function(ev, dd) {
      return dd.handler;
    },

    /**
     * Restore a Failed Drag
     */
    dragRestore: function() {
      this.$source.css('display', this.sourceDisplay);
      this.$source = null;
      this.close();
    },

    /**
     * Close the Dragger
     */
    close: function() {
      if (this.$source) {
        this.$source.remove();
      }
      this.$source = null;
      this.dragData = null;

      Dash.Tile.prototype.close.apply(this, arguments);
    }

  });

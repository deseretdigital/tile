define(['jQuery', 'Underscore', 'Backbone', 'Tile', 'tile!layouts/label'],
    function($, _, Backbone, Tile, Label) {

        // ------------------------------------------------------------------------
        //    VIEW : RESIZER
        // ------------------------------------------------------------------------

        return Tile.View.extend({

            className: 'tile flexer',

            /**
             * Default child type is resizer
             */
            childType: true,

            /**
             * Set-up the child when attached
             */
            childSetup: function(child) {
                child.$el.css('position', 'absolute');
            },

            /**
             * Define child attribute schema
             */
            optionSchema: Tile.View.prototype.optionSchema.extend({
                axis: {
                    flowFlags: FLOW_LOCAL,
                    filter: 'options',
                    options: {
                        inherit: 0,
                        horizontal: 1,
                        vertical: 2
                    },
                    defaultValue: 0
                },
            }, {
            }),

            /**
             * Convert axis to provided values
             *
             * @param {*} w (what will be returned if axis = horizontal)
             * @param {*} h {what will be returned if axis = vertical}
             * @return {*} provided w or h value
             */
            axisTo: function(w, h) {
                var superAxis = this.superFn('axisTo', 1, 2, 1);
                return (this.options.axis || superAxis) == 1 ? w : h;
            },

            /**
             * Trace the changes as they bubble up
             *
             * @param {object} orig (origin tile of change event)
             * @param {object} child (child tile of change path)
             * @param {integer} depth (depth of change path)
             */
            traceChange: function(orig, child, depth) {
                if (depth == 1) {
                    var flags = child.flowFlags
                        , options = child.options;

                    // Measure new or rendered children that are FIXED_AUTO
                    if (flags & Tile.RENDERED_ADDED) {
                        child.measureInner();
                    }
                }
            },

            /**
             * Re-Calculate the children's Layout
             */
            layout: function() {
                var i, view
                    , options = this.options
                    , views = this.childViews
                    , end = views.length
                    , menuWidth = options.innerWidth
                    , fixedWidth = 0
                    , carry = .01
                    , hideTitle = false
                    , hideLabels = false
                    , offset = 0
                    , flexSize = 0
                    , innerWidth = 0
                    , innerSum = 0
                    , padSum = 0
                    , autoCount = 0
                    , flexSum = 0
                    ;

                // ------------------------------------------------------------------
                //    Calculate the Flex Direction Values
                // ------------------------------------------------------------------

                for (i = 0; i < end; i++) {
                    var view = views[i];
                    options = view.options;
                    if(view instanceof Label) {
                        autoCount++;
                        if(options.title) {
                            flexSum += options.innerWidth + options.padWidth;
                        }
                    } else {
                        padSum += options.padWidth;
                        innerSum += options.innerWidth;
                    }
                }

                if(menuWidth < padSum) {
                    // breakpoint one
                    // tentatively, transform menu into vertical menu w/ hamburger button
                    hideTitle = true;
                    hideLabels = true;
                    fixedWidth = padSum;
                } else if(menuWidth < padSum + innerSum + flexSum) {
                    // breakpoint two
                    // tentatively, drop titles
                    hideTitle = true;
                    fixedWidth = padSum;
                } else {
                    // display all menu items, including labels
                    hideTitle = false;
                    fixedWidth = padSum + innerSum;
                }

                flexSize = (autoCount > 0 ? (menuWidth - fixedWidth) / autoCount : 0);

                // ------------------------------------------------------------------
                //    Calculate the Child Size
                // ------------------------------------------------------------------

                for (i = 0; i < end; i++) {
                    var view = views[i];
                    options = view.options;
                    if(view instanceof Label) {
                        innerWidth = flexSize + carry;
                        carry = innerWidth % 1;
                    } else {
                        innerWidth = (hideTitle ? 0 : options.innerWidth);
                    }
                    view.$el.css({
                        width: innerWidth,
                        left: offset,
                    });
                    offset += innerWidth + options.padWidth;
                }
            },
        });

    });
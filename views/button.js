define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
    function($, _, Backbone, Tile) {

        return Tile.View.extend({
            className: 'tile button',
            options: {
                flex: false,
                size: 20
            },
            optionSchema: Tile.View.prototype.optionSchema.extend({
                icon: {
                    filter: 'string',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER
                },
                title: {
                    filter: 'string',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER
                },
                mode: {
                    filter: 'options',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER,
                    options: {
                        toggle: 1,
                        momentary: 0
                    },
                    defaultValue: 0
                },
                state: {
                    filter: 'boolean',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER,
                    defaultValue: false
                },
                show: {
                    filter: 'boolean',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER,
                    defaultValue: true
                }
            },{}),
            render: function() {
                this.$el.html(this.options.title);
                this.$el.toggle(this.options.show);
                return this;
            }

        });
    });
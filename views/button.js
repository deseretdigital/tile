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
                    flowFlags: FLOW_LOCAL|FLOW_SUPER,
                    flowJob: JOB_RENDER
                },
                title: {
                    filter: 'string',
                    flowFlags: FLOW_LOCAL|FLOW_SUPER,
                    flowJob: JOB_RENDER
                },
                mode: {
                    filter: 'options',
                    flowFlags: FLOW_LOCAL|FLOW_SUPER,
                    flowJob: JOB_RENDER,
                    options: {
                        toggle: 1,
                        momentary: 0
                    },
                    defaultValue: 0
                },
                state: {
                    filter: 'boolean',
                    flowFlags: FLOW_LOCAL|FLOW_SUPER,
                    flowJob: JOB_RENDER,
                    defaultValue: false
                },
                show: {
                    filter: 'boolean',
                    flowFlags: FLOW_LOCAL|FLOW_SUPER,
                    flowJob: JOB_RENDER,
                    defaultValue: true
                }
            },{}),
            render: function() {
                console.log('is this rendering?');
                this.$el.html(this.options.title + ' test text ?');
                this.$el.toggle(this.options.show);
                return this;
            }

        });
    });
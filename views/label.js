define(['jquery', 'underscore', 'backbone', 'Tile'],
    function($, _, Backbone, Tile) {

        return Tile.View.extend({
            className: 'tile toolbar-label',
            options: {
                flex: false,
            },
            optionSchema: Tile.View.prototype.optionSchema.extend({
                title: {
                    filter: 'string',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER
                },
                show: {
                    filter: 'boolean',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER,
                    defaultValue: true
                },
            },{}),
            render: function() {
                this.$el.html(this.options.title ? this.options.title : '');
                this.$el.toggle(this.options.show);
                return this;
            },
        });
    });
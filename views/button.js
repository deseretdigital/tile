define(['jQuery', 'Underscore', 'Backbone', 'Tile'],
    function($, _, Backbone, Tile) {

        return Tile.View.extend({
            className: 'tile tool button',
            options: {
                flex: false,
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
                },
                showTitle: {
                    filter: 'boolean',
                    flowFlags: Tile.FLOW_LOCAL,
                    flowJob: Tile.JOB_RENDER,
                    defaultValue: true
                }
            },{}),
            render: function() {
                if(this.options.icon) {
                    this.$el.addClass('icon').addClass('icon-'+this.options.icon);
                } else {
                    this.$el.removeClass('icon');
                }
                //this.$el.html((this.options.showTitle ? this.options.title : ''));
                this.$el.html((this.options.title ? '<div class="title">'+ this.options.title +'</div>' : ''));
                this.$el.toggle(this.options.show);
                return this;
            },


        });
    });
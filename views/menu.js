define(['jQuery', 'Underscore', 'Backbone', 'Tile','tile!layouts/flexer'],
 function($,_,Backbone,Tile,Flexer) {

     return Flexer.extend({
         className: 'tile menu',
         layout: function() {
             Flexer.prototype.layout.call(this);
         },
         traceChange: function(orig, child, depth) {
             if (depth) {
                 var options = child.options;

                 if (child.flowFlags & FLOW_SUPER) {
                     this.flowFlags |= FLOW_VIEWS;
                 }
                 if (child.flowFlags & SUPER_ADDED) {
                     child.measureInner();
                     child.options.size = child.options.innerWidth; // hack! change this.
                 }
             }
         }
     });
 });
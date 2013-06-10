define(['jQuery', 'Underscore', 'Backbone', 'Tile','tile!layouts/flexer'],
 function($,_,Backbone,Tile,Flexer) {

     return Flexer.extend({

         className: 'tile menu',

         layout: function() {
             Flexer.prototype.layout.call(this);
         }

     });
 });
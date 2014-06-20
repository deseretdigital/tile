# Tile

The Tile framework is designed to handle the layout and rendering of Backbone-extended views. It adds support for
various concepts, including:

* optionSchema: Tile.Schema (src/schema.js)
    * filters: Tile.Filters (src/filters.js)
* reflow: Tile.Reflow (src/reflow.js)
* drag and drop: Tile.DragDrop (src/dragdrop.js)
* DOM measurement: Tile.dom (src/dom.js)

## Views

### Tile.View

The basic Tile

#### Options

* views
* spawner
* drag
* drop
* model
* collection
* innerWidth
* innerHeight
* padWidth
* padHeight

#### Methods

* initialize(options): Initialize the optionSchema
* close(delspawned): Stop running, remove all views, and remove the view from the tree
* superFn(name, defaultTo): Execute a parent function. defaultTo is used if the specified function doesn't exist in the parent.

**Views**

* getViews(): Return all child views
* setViews(views): Remove all child views, then add passed views
* childCount(): Return the number of childViews
* viewAt(index): Return child views at an index
* indexOf(view): Return index of specified view
* addView(view, index, extend): Attach the specified view (or object turned into a view) or sets of views (iterating over an array)
* detachThis(): A shortcut to this.parentView.detachView(this)
* detachView(view): Remove the view from the childViews
* replaceWith(view): Replace the current view with another view
* findView(cid): Search the tree of childViews for the specified cid
* setFlag(flags, silent): Set a flag, schedule a reflow
* scheduleJob(job): Schedule a job
* set(options, silent): Set options, and if not silent, schedule a reflow
* get(name): Get an option from the optionSchema
* setClickout(state): Set the clickout monitoring state
* isClickIn(): Is clicking on this tile a click-in?

**Spawning**

* setSpawner(view): Set the spawner parent view
* spawn(tile): Spawn a child view into the root
* despawn(tile): Undo a spawn relationship

**Flow**

* traceView(): Start a reflow by tracing up to root
* traceBubble(orig,child,depth): Trace all changes up the tree to root
* traceChange(orig, child, depth): does nothing by default
* flow(options): Set options, layout, clear flags and views
* layout(): Flow and layout child views
* renderView(): Render and set a flag
* presizeView(): Parent pre-sizes the current view
* presizeChild(view): Pre-size the parent view ... does not do anything by default

**Measurement**

* measureView()
* measurePad()

**Drag and drop**

* setDrag(state)
* setDrop(state)
* dragInit(ev, dd)
* dragStart(ev, dd)
* dragMove(ev, dd)
* dragEnd(ev, dd)
* dragFinish(ev, dd)
* dropInit(ev, dd)
* dropOver(ev, dd)
* dropMove(ev, dd)
* dropOut(ev, dd)
* dropFinish(ev, dd)

**Events**

* addEvent(obj,types,fn): Add event listeners
* removeEvent(obj,types,fn): remove event listeners

**Debug functions**

* logTree(level): console.log the tree

### Root

The Tile beneath all tiles.

#### Options

* cover: Currently unsure exactly the function of this one.

### Balancer

A balancer splits the available space equally between all child views.

#### Options

* axis ['inherit'|'vertical'|'horizontal']: Axis by which to lay out elements

### Flexer

An approximation of what Flexbox will bring to layout -- this will be refactored into a flexbox-producing element
when it's stable.

#### Options

* axis ['inherit'|'vertical'|'horizontal']: The axis by which to layout elements
* align ['start'|'end'|'center'|'stretch']
* prune [true|false]: When no view remains inside the flexer, do we remove the flexer itself?
* size [int]: The size of the element ... changes based on whether `flex` is true or false.
* flex [true|false]: Change size based on content?
* minsize: Minimum size of the element

#### Layout basics

**Modes**

* FIXED_AUTO
* FIXED_SIZE
* FLEX_AUTO
* FLEX_SIZE

### Resizer

#### Options

* edging [int]: Width of edge between views

### Positioner

#### Options

* mode
* anchor
* axis
* target
* zindex
* width
* height
* overflow
* x
* y


## Adapters

Used in optionSchema

* options: Get/set values by options
* property: Get/set/ value by property
* setter: Get/set value by get[Field] and set[Field]

## Filters

Used in optionSchema

* boolean: Ensure value is a boolean
* string: Ensure value is a string
* integer: Ensure value is an integer
* options: Set up input and output for options


# To-do

* Gulp instead of Grunt for build process
* Document layout more fully
* Document reflow
* Document Tile Jobs and scheduling
* Document loaders
* Document drag and drop
* Document DOM
* Document rationale for approach
* Provide example usage
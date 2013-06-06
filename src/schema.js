
  /**
   *  Schema Object
   */
  Tile.Schema = function(localBindings, childBindings) {

    /**
     * Define the Schemas
     */
    var local = {};
    var child = {};

    /**
     * Initialize the Schemas
     */
    addBindings(localBindings);
    addBindings(childBindings, true);

    /**
     * Extend the schema
     *
     * @param {object} localExtend schema
     * @param {object} childExtend schema
     */
    function extend(localExtend, childExtend) {
      return Tile.Schema(
        _.extend({}, local, localExtend),
        _.extend({}, child, childExtend)
      );
    }

    /**
     * Add Bindings to a Schema
     *
     * @param {object} bindings (schema)
     * @param {boolean} isChild schema
     */
    function addBindings(bindings, isChild) {
      for (var name in bindings) {
        addBinding(name, bindings[name], isChild);
      }
    }

    /**
     * Add a Binding to a Schema
     */
    function addBinding(name, bindIn, isChild) {
      var aname = bindIn.adapter || 'options'
        , adapter = Tile.adapters[aname]
        , filter, props, bindOut;

      if (bindIn._bound) {
        bindOut = bindIn;
      }
      else {
        // add the name to the bindIn
        bindIn.name = name;
        bindOut = {
          _bound: true,
          name: name,
          flowFlags: bindIn.flowFlags || 0,
          flowJobs: bindIn.flowJobs || 0,
          isPrivate: bindIn.isPrivate ? true : false,
          defaultValue: bindIn.defaultValue
        };

        // add the input & output filters to the bindIn
        if (bindIn.filter && (filter = Tile.filters[bindIn.filter])) {
          props = filter(bindIn);
          bindOut.filter = bindIn.filter;
          if (!bindIn.input) bindOut.input = props.input;
          if (!bindIn.output) bindOut.output = props.output;
        }

        // ensure there is a bindIn type
        bindIn.adapter || (bindIn.adapter = 'options');
        if (!adapter) {
          console.error("Adapter " + aname + " on schema.option." + name);
        }
        props = adapter(bindIn);
        bindOut.setter = props.setter;
        bindOut.getter = props.getter;
      }
      // add the binding to the schema
      (isChild ? child : local)[name] = bindOut;
    }

    /**
     * Set Options
     *
     * @param {object} view
     * @param {object} options
     * @return {integer} number of changes made
     */
    function setOptions(view, options) {
      var parent = view.parentView
        , pchild = parent ? parent.optionSchema.child : null
        , changes = 0
        , binding;

      for (var name in options) {
        var value = options[name];

        // Has the option value changed?
        if (view.options[name] != value) {

          // found filter in the local scope
          if ((binding = local[name])) {
            changes += importOption(view, binding, value);
          }
          // found filter in parent scope
          else if (pchild && (binding = pchild[name])) {
            changes += importOption(view, binding, value);
          }
          // didn't find, so store in option buffer
          else {
            view.optionBuffer[name] = value;
          }
        }
      }
      return changes;
    }

    /**
     * Get Options
     *
     * @param {object} view
     * @param {string} name
     */
    function getOptions(view, name) {
      // >>>>>>>>> look at binding.isPrivate property <<<<<<<<<
    }

    /**
     * Initialize Options by Scope
     *
     * @param {object} view
     * @param {boolean} isParent (true = parent | false = child)
     */
    function initOptions(view, isParent) {
      var options = view.options
        , buffer = view.optionBuffer
        , parent = isParent ? view.parentView : null
        , bindings = isParent ? parent.optionSchema.child : local
        , name, value, binding;

      // iterate through all filters within the scope
      for (name in bindings) {
        binding = bindings[name];

        // found buffered option
        if ((value = buffer[name]) !== undefined)  {
          importOption(view, binding, value);
          delete buffer[name];
        }
        // no existing option, but there is a default (setup)
        else if (options[name] === undefined
          && ((value = binding.defaultValue) !== undefined)) {
            importOption(view, binding, value, true);
        }
      }
    }

    /**
     * Import an Option
     *
     * @private
     * @param {object} view
     * @param {object} binding
     * @param {*} value
     * @param {boolean} noFilter (Don't filter value - for default value)
     */
    function importOption(view, binding, value, noFilter) {
      var input, flag, job;

      // Filter the input value
      if (!noFilter && (input = binding.input)) {
        value = input(value);
      }
      // Set value with adapter
      binding.setter.call(view, value);

      // Set the flow flag
      if ((flag = binding.flowFlags)) {
        view.flowFlags |= flag;
      }
      // Set the flow job
      if ((job = binding.flowJobs)) {
        Tile.reflow.schedule(job, view, true);
      }
      // return change count
      return 1;
    }

    // ---------------------------------------------------------------------

    /**
     * Export an Option
     *
     * @private
     * @param {object} view
     * @param {object} binding
     * @param {*} value
     */
    function exportOption(view, binding, value) {

    }

    /**
     * Return the public filter object methods
     */
    return {
      extend: extend,
      addBindings: addBindings,
      addBinding: addBinding,
      initOptions: initOptions,
      setOptions: setOptions,
      getOptions: getOptions,
      local: local,
      child: child
    };

  };

  // -----------------------------------------------------------------------
  //    Reflow Object
  // -----------------------------------------------------------------------

  Tile.reflow = function() {

    /**
     * Local counting and queue variables
     */
    var cycles = 0,           // To prevent infinite reflow loop
        blocked = 0,          // To trigger reflow after end of nested blocks
        jobs = 0,             // To know when there are jobs to be done
        queues = {};

    queues[JOB_RENDER] = {
      jobs: [],
      method: 'render'
    }
    /**
     * For resizer to prune itself
     */
    queues[JOB_PRUNE] = {
      jobs: [],
      method: 'pruneView'
    };
    /**
     * For positioner to apply geometry
     */
    queues[JOB_PRESIZE] = {
      jobs: [],
      method: 'presizeView'
    };
    /**
     * For all changes to be traced and flowed
     */
    queues[JOB_TRACE] = {
      jobs: [],
      method: 'traceView'
    };

    /**
     * Enter a protected reflow block of code
     * - Prevent reflow from happening within this block
     */
    function block() {
      blocked++;
    }

    /**
     * Leave a protected reflow block of code
     * - Start the reflow jobs if end of all nested blocks
     */
    function unblock(silent) {
      blocked--;
      if (!silent) dispatch();
    }

    /**
     * Schedule an async reflow job
     *
     * @param {integer} job id flag of queue to add to
     * @param {object} view to callback
     */
    function schedule(job, view, silent) {
//var jobname = job == 1 ? 'prune' : job == 2 ? 'presize' : 'trace';
//console.log("REFLOW.schedule(", jobname, ",", view.cid, ")");
      if (!(view.flowJobs & job)) {
        view.flowJobs |= job;
        queues[job].jobs.push(view);
        jobs++;
      }
      if (!silent) {
        dispatch();
      }
    }

    /**
     * Dispatch the reflow jobs
     */
    function dispatch() {
      if (blocked || cycles || !jobs) return;
//      console.time('DOM_REFLOW_TIME');

      cycles = 3;

      // reflow job queue loop
      while (cycles-- && jobs) {
        for (var type in queues) {
          runQueue(type, queues[type]);
        }
        // start the depth-first flow tree traversal
        if (Tile.root.flowViews || Tile.root.flowFlags) {
          Tile.root.flow();
        }
      }

      // check for loop overflow
      if (!cycles) {
        console.error('Reflow Dispatch Cycle Overflow');
        console.trace();
      }
      cycles = 0;

      // measure time for DOM to reflow
      _.defer(function() {
//        console.timeEnd('DOM_REFLOW_TIME');
      });
    }

    /**
     * Run a job queue
     *
     * @param {integer} flag (bitwise job flag)
     * @param {object} queue
     */
    function runQueue(flag, queue) {
      var qjobs = queue.jobs
        , method = queue.method;

      if (!qjobs.length) return;

//      console.log("reflow.runQueue(" + method + ") len=" + qjobs.length);
//      console.time('DISPATCH_TIME');
      for (var i = 0; i < qjobs.length; i++, jobs--) {
        var view = qjobs[i];

        view[method]();
        view.flowJobs &= ~flag;
      }
      queue.jobs = [];
//      console.timeEnd('DISPATCH_TIME');
    }

    /**
     * Return the reflow object
     */
    return {
      block: block,
      unblock: unblock,
      schedule: schedule,
      dispatch: dispatch
    };

  }();
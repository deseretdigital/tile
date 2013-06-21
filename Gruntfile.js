module.exports = function(grunt) {

  grunt.initConfig({

    // Fetch the package.json config data
    pkg: grunt.file.readJSON('package.json'),

    // Watch Plugin Configuration
    watch: {
      scripts: {
        files: [ 'src/*.js' ],
        tasks: [ 'liveconcat' ],
        options: {
            nospawn: false,
            debounceDelay: 500,
            forever: true
        }
      }
    },

    // Concat Plugin Configuration
    concat: {
      options: {
        separator: "\n",
        stripBanners: true,
        banner: grunt.file.read('src/tile-head.tpl'),
        footer: grunt.file.read('src/tile-foot.tpl')
      },
      dist: {
        src: [
          'src/global.js',
          'src/filters.js',
          'src/adapters.js',
          'src/schema.js',
          'src/reflow.js',
          'src/dom.js',
          'src/dragdrop.js',
          'src/view.js',
          'src/dragger.js',
          'src/loader.js',
          'src/error.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },

    // Uglify Plugin Configuration
    uglify: {
      my_target: {
        options: {
          beautify: true,
          mangle: true,
          compress: true
        },
        files: {
          'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': [
            'dist/<%= pkg.name %>-<%= pkg.version %>.js'
          ]
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('prod', ['concat', 'uglify']);
  grunt.registerTask('liveconcat', ['concat']);

};
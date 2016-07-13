module.exports = function(grunt) {
  grunt.loadNpmTasks("grunt-contrib-coffee");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.initConfig({
    coffee: {
      compile: {
        files: {
          "lib/js/date-just.js": "src/coffee/date-just.coffee",
          "docs/dist/js/docs.js": "docs/src/coffee/docs.coffee"
        }
      }
    },
    less: {
      development: {
        files: {
          "lib/css/date-just.css": "src/less/date-just.less",
          "docs/dist/css/docs.css": "docs/src/less/docs.less"
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          "lib/js/date-just.min.js": "lib/js/date-just.js"
        }
      }
    },
    cssmin: {
      my_target: {
        src: "lib/css/date-just.css",
        dest: "lib/css/date-just.min.css"
      }
    },
    watch: {
      files: ["src/less/*", "src/coffee/*", "docs/src/less/*", "docs/src/coffee/*"],
      tasks: ["coffee", "less", "uglify", "cssmin"],
      options: {
        livereload: true
      }
    }
  });
};
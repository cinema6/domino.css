'use strict';

var TESTS = ['test/spec/**/*.ut.js'];
var LIBS = [
    'lib/**/*.js',
    'index.js'
];
var CODE = LIBS.concat(TESTS);

module.exports = function gruntfile(grunt) {
    var pkg = require('./package.json');
    var npmTasks = Object.keys(pkg.devDependencies).filter(function(name) {
        return (name !== 'grunt-cli') && (/^grunt-/).test(name);
    });

    npmTasks.forEach(function(name) {
        grunt.task.loadNpmTasks(name);
    });
    grunt.task.loadTasks('./tasks');

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: true
            },
            code: {
                src: CODE
            }
        },
        karma: {
            options: {
                configFile: 'test/karma.conf.js'
            },
            tdd: {
                options: {
                    autoWatch: true
                }
            },
            test: {
                options: {
                    singleRun: true
                }
            }
        },

        clean: {
            build: ['dist'],
            server: ['examples/.build']
        },
        browserify: {
            options: {
                browserifyOptions: {
                    standalone: 'dominoCSS'
                }
            },

            build: {
                files: [
                    {
                        src: 'index.js',
                        dest: 'dist/domino-css.js'
                    },
                    {
                        src: 'runtime.js',
                        dest: 'dist/domino-css--runtime.js'
                    }
                ]
            },
            server: {
                options: {
                    watch: true
                },
                files: [
                    {
                        src: 'index.js',
                        dest: 'examples/.build/domino-css.js'
                    },
                    {
                        src: 'runtime.js',
                        dest: 'examples/.build/domino-css--runtime.js'
                    }
                ]
            }
        },
        uglify: {
            build: {
                options: {
                    screwIE8: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'dist',
                        src: '*.js',
                        dest: 'dist/',
                        ext: '.min.js',
                        extDot: 'last'
                    }
                ]
            }
        },

        connect: {
            server: {
                options: {
                    base: 'examples',
                    livereload: true,
                    open: true
                }
            }
        },
        watch: {
            server: {
                options: {
                    livereload: true
                },
                files: [
                    'examples/**'
                ]
            }
        }
    });

    grunt.registerTask('test', [
        'karma:test',
        'jshint:code'
    ]);

    grunt.registerTask('build', [
        'clean:build',
        'browserify:build',
        'uglify:build'
    ]);

    grunt.registerTask('server', [
        'browserify:server',
        'connect:server',
        'watch:server'
    ]);

    grunt.registerTask('tdd', ['karma:tdd']);
};

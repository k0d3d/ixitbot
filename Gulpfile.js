var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jasmineNode = require('gulp-jasmine-node');

gulp.task('lint', function() {
    gulp.src([
      './models/*.js',
      './tests/*.js',
      './index.js',
      ])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


gulp.task('test', function () {
      gulp.src([
        'tests/*Spec.js'
      ])
      .pipe(
        jasmineNode({
          timeout: 5000
        })
      );
});

gulp.task('linttest', ['lint', 'test']);
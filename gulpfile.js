const  gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  env = require('gulp-env'),
  browserify = require('browserify'),
  babelify = require('babelify'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  JSX_FILES = ['app/src/client/**/*.js']

function runCommand (command) {
  return function (cb) {
    exec(command, function (err, stdout, stderr) {
      console.log(stdout)
      console.log(stderr)
      cb(err)
    })
  }
}

/*
 * GULP tasks
 */

 gulp.task('default', ['jsxbuild', 'nodemon'], ()=>{
   gulp.watch(JSX_FILES, ['jsxbuild'])
 });

  gulp.task('jsxbuild', () => {
  return browserify({
    entries: ['./app/src/client/main.js'],
    debug: true
  })
  .transform(babelify, {
    presets: ["es2015", "react"],
    plugins: []
  })
  .bundle()
  .on('error', swallowError)
  .pipe(source('main.js'))
  .pipe(buffer())
  .pipe(gulp.dest('./app/public'));
})

/* Development */
gulp.task('nodemon', function (cb) {
  var called = false
  env({
    file: '.env.json'
  })
  return nodemon({
    script: './app.js',
    watch: ['./app.js'],
    ignore: [
      'test/',
      'node_modules/'
    ],
  })
    .on('start', function onStart () {
      // ensure start only got called once
      if (!called) { cb() }
      called = true
    })
    .on('restart', function onRestart () {
      console.log('NODEMON: restarted server!')

    })
})

function swallowError (error) {
	console.log(error.toString());
	this.emit('end');
}

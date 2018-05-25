'use strict';

import gulp from 'gulp';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import babelify from 'babelify';
import del from 'del';
import source from 'vinyl-source-stream';
import colors from 'colors/safe';
import buffer from 'gulp-buffer';
import sourcemaps from 'gulp-sourcemaps'
import watchify from 'watchify';
import envify from 'envify/custom';

const dirs = {
  src: 'src',
  dest: 'build',
  public: 'public',
}

const globs = {
  html: '/**/*.html',
  scripts: '/**/*.js',
}

let isWatchify = false;
function setupWatch(done) {
  isWatchify = true;
  done();
}
function watchAssets() {
  gulp.watch(dirs.src + globs.html, views)

  browserSync.init({
    server: {
      baseDir: dirs.dest
    }
  })
}

export function views() {

  return gulp.src(dirs.src + globs.html)
    .pipe(gulp.dest(dirs.dest))
    .on('end', browserSync.reload)
}

export function scripts(done) {

  let b = browserify(dirs.src + '/gameboy/gameboy.js', {debug: isWatchify, fullPaths: isWatchify});
  b.transform(babelify, {
    presets: ["env"],
    sourceMaps: isWatchify
  });

  const rebundle = () => {
    return b.bundle()
    .on('error', function(e) {
      console.log(colors.red('script error ' + e));
    })
    .pipe(source('gameboy.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dirs.dest))
    .pipe(browserSync.stream());
  }

  if (isWatchify) {
    b.plugin(watchify);
    b.on('update', rebundle);
    b.on('log', (msg) => console.log(`Bundle created: ${msg}`));
  }

  return rebundle();
}

const clean = () => del([dirs.dest])
export { clean }

const build = gulp.series(clean, scripts, views)
export { build }

const watch = gulp.series(setupWatch, build, watchAssets)
export { watch }

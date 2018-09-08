import gulp from 'gulp';
import mocha from 'gulp-mocha';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import babelify from 'babelify';
import del from 'del';
import source from 'vinyl-source-stream';
import colors from 'colors/safe';
import buffer from 'gulp-buffer';
import sourcemaps from 'gulp-sourcemaps';
import watchify from 'watchify';

/* eslint no-console: 0 */

const dirs = {
  src: 'src',
  dest: 'build',
  public: 'public',
};

const globs = {
  html: '/**/*.html',
  scripts: '/**/*.js',
};

let isWatchify = false;
function setupWatch(done) {
  isWatchify = true;
  done();
}

function views() {
  return gulp.src(dirs.src + globs.html)
    .pipe(gulp.dest(dirs.dest))
    .on('end', browserSync.reload)
    .on('error', (err) => { console.log(err); this.emit('end'); });
}

function watchAssets() {
  gulp.watch(dirs.src + globs.html, views);
  browserSync.init({
    server: {
      baseDir: dirs.dest,
    },
  });
}

function runTests() {
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      require: ['@babel/register'],
    }));
}

export function scripts() {
  // Runner
  browserify(`${dirs.src}/runner.js`)
    .transform('babelify', { presets: ['@babel/env'] })
    .bundle()
    .pipe(source('runner.js'))
    .pipe(gulp.dest(dirs.dest));

  const b = browserify(`${dirs.src}/gameboy/bundle.js`, { debug: isWatchify, fullPaths: isWatchify, standalone: 'Gameboy' });
  b.transform(babelify, {
    presets: ['@babel/env'],
    global: true,
    sourceMaps: isWatchify,
  });

  const rebundle = () => b.bundle()
    .on('error', (e) => {
      console.log(colors.red(`script error ${e}`));
    })
    .pipe(source('gameboy.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dirs.dest))
    .pipe(browserSync.stream());

  if (isWatchify) {
    b.plugin(watchify);
    b.on('update', runTests);
    b.on('update', rebundle);
    b.on('log', msg => console.log(`Bundle created: ${msg}`));
  }

  return rebundle();
}

export const clean = () => del([dirs.dest]);
export const build = gulp.series(runTests, clean, scripts, views);
export const watch = gulp.series(setupWatch, build, watchAssets);
export const test = () => runTests();

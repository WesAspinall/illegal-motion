import gulp from 'gulp';
import concat from 'gulp-concat';
import wrap from 'gulp-wrap';
import uglify from 'gulp-uglify';
import htmlmin from 'gulp-htmlmin';
import htmlhint from 'gulp-htmlhint';
import eslint from 'gulp-eslint';
import gulpif from 'gulp-if';
import sass from 'gulp-sass';
import yargs from 'yargs';
import ngAnnotate from 'gulp-ng-annotate';
import templateCache from 'gulp-angular-templatecache';
import server from 'browser-sync';
import del from 'del';
import path from 'path';
import chalk from 'chalk';
import child from 'child_process';
import sourcemaps from 'gulp-sourcemaps';
import notify from 'gulp-notify';


const exec = child.exec;
const argv = yargs.argv;
const root = 'src/';
const paths = {
  dist: './dist/',
  scripts: [`${root}/app/**/*.js`, `!${root}/app/**/*.spec.js`],
  tests: `${root}/app/**/*.spec.js`,
  styles: `${root}/sass/**/*.scss`,
  templates: `${root}/app/**/*.html`,
  modules: [
    'angular/angular.min.js',
    'd3/d3.min.js',
    'nvd3/build/nv.d3.min.js',
    'angular-nvd3/dist/angular-nvd3.js',
    'angular-ui-router/release/angular-ui-router.js',
    'angular-loading-bar/build/loading-bar.min.js',
    'angular-animate/angular-animate.min.js',
    'angular-touch/angular-touch.min.js',
    'angular-ui-bootstrap/dist/ui-bootstrap.js',
    'angular-ui-bootstrap/dist/ui-bootstrap-tpls.js'
  ],
  static: [
    `${root}/index.html`,
    `${root}/fonts/**/*`,
    `${root}/img/**/*`
  ]
};

server.create();

// Function to handle errors.
// Prevents Gulp from stopping.
var handleError = function(err) {
  notify.onError("Error, check terminal for details.")(err);
  console.log(chalk.white.bgRed(' ------------------------------ '));
  console.log(chalk.white(err.message));
  console.log(chalk.white.bgRed(' ------------------------------ '));
  this.emit('end');
}


gulp.task('clean', cb => del(paths.dist + '**/*', cb));

gulp.task('templates', () => {
  return gulp.src(paths.templates)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(templateCache({
      root: 'app',
      standalone: true,
      transformUrl: function (url) {
        return url.replace(path.dirname(url), '.');
      }
    }))
    .pipe(gulp.dest('./'));
});


//linting
gulp.task('style:js', () => {
    return gulp.src('./src/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format())
});

gulp.task('hint:html', () => {
    return gulp.src('./src/**/*.html')
        .pipe(htmlhint('.htmlhintrc'))
        .pipe(htmlhint.failReporter());
});
 
gulp.task('lint', ['style:js', 'hint:html']);
//end linting


gulp.task('modules', ['templates'], () => {
  return gulp.src(paths.modules.map(item => 'node_modules/' + item))
    .pipe(concat('vendor.js'))
    .pipe(gulpif(argv.deploy, uglify()))
    .pipe(gulp.dest(paths.dist + 'js/'));
});

gulp.task('tree', () => {
  return gulp.src('node_modules/angular-ivh-treeview/dist/angular-ivh-treeview.min.css')
  .pipe(gulp.dest(paths.dist + 'css/'));
});

gulp.task('styles', () => {
  return gulp.src([paths.styles])
    .pipe(sass({outputStyle: 'compressed', includePaths: require('node-neat').includePaths}))
    .on('error', handleError)
    .pipe(gulp.dest(paths.dist + 'css/'));
});


gulp.task('scripts', ['modules'], () => {
  return gulp.src([
      `!${root}/app/**/*.spec.js`,
      `${root}/app/**/*.module.js`,
      ...paths.scripts,
      './templates.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(wrap('(function(angular){\n\'use strict\';\n<%= contents %>})(window.angular);'))
    .pipe(concat('bundle.js'))
    .pipe(ngAnnotate())
    .pipe(gulpif(argv.deploy, uglify()))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.dist + 'js/'));
});

gulp.task('serve', () => {
  return server.init({
    files: [`${paths.dist}/**`],
    port: 4000,
    open: false,
    notify: false,
    server: {
      baseDir: paths.dist
    }
  });
});

gulp.task('copy', ['clean'], () => {
  return gulp.src(paths.static, { base: 'src' })
    .pipe(gulp.dest(paths.dist));
});

gulp.task('watch', ['serve', 'scripts'], () => {
  gulp.watch([paths.scripts, paths.templates], ['scripts']);
  gulp.watch(paths.styles, ['styles']);
});



gulp.task('default', [
  'copy',
  'styles',
  'serve',
  'watch',
  'lint'
]);

gulp.task('production', [
  'copy',
  'scripts'
]);
// generated on 2015-09-10 using generator-gulp-webapp 1.0.3
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {stream as wiredep} from 'wiredep';

const $ = gulpLoadPlugins(),
	reload = browserSync.reload,
	create = browserSync.create(),
	pkg = require('./package.json'),
	webpack = require('webpack-stream'),
	gutil = require('gutil'),
	chalk = require('chalk'),
	nunjucksRender = require('gulp-nunjucks-render'),
	autoprefixer = require('autoprefixer'),
	center = require('postcss-center'),
	cssmqpacker = require('css-mqpacker'),
	cssnano = require('cssnano'),
	cssnext = require("cssnext"),
	precss = require('precss'),
	pxtorem = require('postcss-pxtorem'),
	size = require('postcss-size'),
	assets = require('postcss-assets'),
	rucksack = require('rucksack-css'),
	functions = require('postcss-functions'),
	base = 'html/wp/wp-content/themes/yamate-office',
	baseAssets = base + '/assets',
	src = 'src/wp', //retirer le wp
	srcAssets = src + '/wp-content/themes/yamate-office/assets',
	tmp = '.tmp/wp/wp-content/themes/yamate-office',
	tmpAssets = '.tmp/wp/wp-content/themes/yamate-office/assets',
	banner = ['/**',
		' * <%= pkg.name %> - <%= pkg.title %>',
		' * @version v<%= pkg.version %>',
		' * @link <%= pkg.url %>',
		' * @author <%= pkg.author %>',
		' * @license <%= pkg.license %>',
		' */',
	''].join('\n');

const onError = (err) => {  
	//gutil.beep();
	console.log(err);
};

gulp.task('postcss', () => {
	var processors = [
		precss,
		functions({
			functions: {
				cz: function (value) {
					return 8 * value + 'px';
				},
				grid: function ($width, $columns, $margin) {
					return ($width / $columns) - ($margin * 2);
				}
			}
		}),
		center,
		size,
		//pxtorem,
		cssnext,
		rucksack,
		cssmqpacker,
		autoprefixer({ browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'] }),
		cssnano
	];
	return gulp.src(src + '/css/*.css')
	.pipe($.plumber({
		errorHandler: function(error) {
			gutil.log(
				chalk.cyan('Plumber') + chalk.red(' found unhandled error:\n'),
				error.toString()
			);
			this.emit('end');
		}
	}))
	//.pipe($.sourcemaps.init())
	.pipe($.postcss(processors))
	.pipe($.postcss([assets({
		basePath: 'src/',
		loadPaths: ['wp-content/themes/yamate-office/assets/images/']
	})]))
	//.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest(tmp))
	.pipe($.header(banner, { pkg : pkg } ))
	.pipe(gulp.dest(base))
	//.pipe(create.stream({match: base + '/*.css'}));
	.pipe(reload({stream: true}));
	//.pipe(connect.reload());
});

function lint(files, options) {
	return () => {
		return gulp.src(files)
		.pipe(reload({stream: true, once: true}))
		.pipe($.eslint(options))
		.pipe($.eslint.format())
		.pipe($.if(!browserSync.active, $.eslint.failAfterError()));
	};
}
const testLintOptions = {
	env: {
		mocha: true
	}
};

gulp.task('html', ['postcss', 'nunjucks'], () => {
	const assets = $.useref.assets({searchPath: [tmp, src, '.']});

	return gulp.src('.tmp/**/*.html')
	.pipe(assets)
	.pipe($.if('**/*.js', $.uglify()))
	//.pipe($.if('**/*.css', $.minifyCss({compatibility: '*'})))
	.pipe(assets.restore())
	.pipe($.useref())
	.pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
	.pipe(gulp.dest(base));
});

gulp.task('replace', function(){
	gulp.src(['.tmp/**/*.html'])
	//.pipe($.replace('assets/js/scripts.js', 'assets/js/scripts.min.js'))
	//.pipe($.replace('/images', '/assets/images'))
	.pipe(gulp.dest(tmp));
});

gulp.task('nunjucks', () => {
	
	nunjucksRender.nunjucks.configure([src + '/template/layout/'], {
		tags: {
			blockStart: '<%--',
			blockEnd: '--%>',
			variableStart: '{{%',
			variableEnd: '%}}',
			commentStart: '<#',
			commentEnd: '#>'
		}
	});

	return gulp.src(src + '/template/pages/**/*.nunjucks')

	//.pipe($.data(function() {
	//	return require('./src/template/data.json')
	//}))
	.pipe($.plumber({
		errorHandler: function(error) {
			gutil.log(
				chalk.cyan('Plumber') + chalk.red(' found unhandled error:\n'),
				error.toString()
			);
			this.emit('end');
		}
	}))
	.pipe(nunjucksRender({
		projectName: 'Yamate Office'
	}))
	.pipe(gulp.dest('.tmp'));
});

gulp.task('images', () => {
	return gulp.src(srcAssets + '/images/**/*')
	.pipe($.if($.if.isFile, $.cache($.imagemin({
		progressive: true,
		interlaced: true,
		// don't remove IDs from SVGs, they are often used
		// as hooks for embedding and styling
		svgoPlugins: [{cleanupIDs: false}]
	}))
	.on('error', function (err) {
		console.log(err);
		this.end();
	})))
	.pipe(gulp.dest(baseAssets + '/images'));
});

gulp.task('fonts', () => {
	return gulp.src(require('main-bower-files')({
		filter: '**/*.{eot,svg,ttf,woff,woff2}'
	}).concat(srcAssets + '/fonts/**/*'))
	.pipe(gulp.dest('.tmp/assets/fonts'))
	.pipe(gulp.dest(baseAssets + '/fonts'));
});

gulp.task('webpack', () => {
	return gulp.src(srcAssets + '/js/scripts.js')
	.pipe($.plumber({
		errorHandler: function(error) {
			gutil.log(
				chalk.cyan('Plumber') + chalk.red(' found unhandled error:\n'),
				error.toString()
			);
			this.emit('end');
		}
	}))
	.pipe(webpack( require('./webpack.config.js') ))
	.pipe(gulp.dest(tmpAssets + '/js'))
	.pipe($.uglify())
	.pipe(gulp.dest(baseAssets + '/js/'))
});

gulp.task('js', () => {
	return gulp.src([
		!srcAssets + '/js/scripts.js',
		srcAssets + '/js/**/*.js',
	], {
		dot: true
	})
	.pipe($.uglify())
	.pipe(gulp.dest(baseAssets + '/js/'))
});

gulp.task('scripts', () => {
	return gulp.src(srcAssets + '/js/scripts.js')
	//.pipe($.uglify())
	.pipe($.rename('scripts.min.js'))
	.pipe(gulp.dest(tmpAssets + '/js'))
	.pipe($.uglify())
	.pipe(gulp.dest(baseAssets + '/js'));
	//.pipe(connect.reload());
});

gulp.task('extras', () => {
	return gulp.src([
		src + '/*.*',
		!src + '/template/*'
	], {
		dot: true
	}).pipe(gulp.dest(base));
});

gulp.task('clean', del.bind(null, [tmp, 'html']));

gulp.task('serve', ['postcss', 'fonts', 'nunjucks'], () => {
	browserSync({
		notify: false,
		port: 9000,
		server: {
			baseDir: ['.tmp', src],
			routes: {
				'/bower_components': 'bower_components'
			}
		}
	});

	gulp.watch([
		'.tmp/**/*.html',
		srcAssets + '/js/**/*.js',
		srcAssets + '/images/**/*',
		srcAssets + '/fonts/**/*'
	]).on('change', reload);

	gulp.watch(src + '/template/**/*.nunjucks', ['nunjucks', reload]);
	gulp.watch(srcAssets + '/js/**/*.js', ['webpack']);
	gulp.watch(src + '/css/**/*.css', ['postcss']);
	gulp.watch(srcAssets + '/fonts/**/*', ['fonts']);
	gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', ['replace'], () => {
	browserSync({
		notify: false,
		port: 9000,
		server: {
			baseDir: [base]
		}
	});
});

gulp.task('serve:test', () => {
	browserSync({
		notify: false,
		port: 9000,
		ui: false,
		server: {
			baseDir: 'test',
			routes: {
				'/js': 'src/assets/js',
				'/bower_components': 'bower_components'
			}
		}
	});

	gulp.watch('test/spec/**/*.js').on('change', reload);
	gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
	gulp.src(src + '/css/*.css')
	.pipe(wiredep({
		ignorePath: /^(\.\.\/)+/
	}))
	.pipe(gulp.dest(src + '/css'));

	gulp.src(src + '/template/layout/*.nunjucks')
	.pipe(wiredep({
		//exclude: ['bootstrap-sass'],
		ignorePath: /^(\.\.\/)*\.\./
	}))
	.pipe(gulp.dest(src + '/template/layout'));
});

gulp.task('build', ['postcss', 'images', 'fonts', 'webpack', 'html', 'extras'], () => {
	return gulp.src(src + '/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', () => {
	gulp.start('build');
	gulp.start('serve');
});
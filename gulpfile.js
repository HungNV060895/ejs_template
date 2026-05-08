// ============================================================
// gulpfile.js  –  ES Modules / Gulp 4+ 推奨スタイル
// ============================================================
// 環境変数で dev / prod を切り替える
// 開発時 : NODE_ENV=development npx gulp dev
// 本番時 : NODE_ENV=production  npx gulp build
// ============================================================

import gulp        from 'gulp';
import htmlMin     from 'gulp-htmlmin';
import prettify    from 'gulp-prettify';          // ② dev 用 HTML 整形
import plumber     from 'gulp-plumber';
import rename      from 'gulp-rename';
import gulpEjs     from 'gulp-ejs';
import gulpSass    from 'gulp-sass';
import * as sassComp from 'sass';
import sourcemaps  from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS    from 'gulp-clean-css';

import imageMin    from 'gulp-imagemin';
import pngQuant    from 'imagemin-pngquant';
import mozJpeg     from 'imagemin-mozjpeg';
import svgMin      from 'gulp-svgmin';
import gulpWebp    from 'gulp-webp';

import babel       from 'gulp-babel';
import terser      from 'gulp-terser';
import mergeStream from 'merge-stream';
import changed     from 'gulp-changed';
import { deleteSync } from 'del';

import { readFile } from 'fs/promises';            // ⑧ async 化

const sass = gulpSass(sassComp);

// ============================================================
// 環境フラグ
// ============================================================
const isProd = process.env.NODE_ENV === 'production';

// ============================================================
// Paths configuration
// ============================================================
const paths = {
	ejs: {
		dist: './',
	},
	styles: {
		src:  ['./scss/**/*.scss', '!./scss/**/_*.scss'], // ① partial を除外
		dist: './css/',
	},
	scripts: {
		src:    ['./src/js/**/*.js', '!./src/js/**/vendors/**/*.js'],
		vendors: './src/js/**/vendors/**/*',              // ⑥ vendors を分離
		dist:   './js/',
	},
	images: {
		raster:  './src/img/**/*.{jpg,jpeg,png,gif}',
		svg:     './src/img/**/*.svg',
		srcWebp: './src/img/**/*.{jpg,jpeg,png}',
		dist:    './img/',
		distWebp:'./img/webp/',
	},
	fonts: {
		src:  './fonts/**/*.{otf,ttf,woff,woff2}',
		dist: './fonts/',
	},
};

// ============================================================
// Utility: breadcrumbs
// ============================================================
function generateBreadcrumbs(page) {
	const { bread1, bread2, bread3, bread4, bread1_url, bread2_url, bread3_url } = page;

	if (!bread1) return '';

	const crumbs = ['<span><a href="/">ホーム</a></span>'];

	if (bread1) crumbs.push(bread1_url ? `<span><a href="${bread1_url}">${bread1}</a></span>` : `<span>${bread1}</span>`);
	if (bread2) crumbs.push(bread2_url ? `<span><a href="${bread2_url}">${bread2}</a></span>` : `<span>${bread2}</span>`);
	if (bread3) crumbs.push(bread3_url ? `<span><a href="${bread3_url}">${bread3}</a></span>` : `<span>${bread3}</span>`);
	if (bread4) crumbs.push(bread4_url ? `<span><a href="${bread4_url}">${bread4}</a></span>` : `<span>${bread4}</span>`);

	// 最後のパンくずからリンクを除去
	const lastCrumb = crumbs[crumbs.length - 1].replace(/<a[^>]*>|<\/a>/g, '');
	crumbs[crumbs.length - 1] = lastCrumb;

	return `<span>${crumbs.join(' ')}</span>`;
}

// ============================================================
// Utility: relative path
// ============================================================
function getRelativePath(depth) {
	const relativePaths = ['./', '../', '../../', '../../../', '../../../../'];
	return relativePaths[depth] !== undefined ? relativePaths[depth] : './';
}

// ============================================================
// Utility: parent path
// ============================================================
function buildParentPath(parentId1, parentId2, parentId3, parentId4) {
	const parts = [parentId1, parentId2, parentId3, parentId4].filter(Boolean);
	return parts.join('/');
}

// ============================================================
// EJS Task  ⑧ readFileSync → readFile (async)
// ============================================================
export const ejsTask = async function (done) {
	const templateFile = './ejs/template.ejs';
	const jsonFile     = './ejs/data/pages.json';

	// ⑧ ノンブロッキングで JSON を読み込む
	const raw      = await readFile(jsonFile, 'utf8');
	const pageData = JSON.parse(raw).pages;

	const buildPromises = pageData.map(page =>
		new Promise((resolve, reject) => {
			const relativePath = getRelativePath(page.depth);
			const breadcrumbs  = generateBreadcrumbs(page);
			const parentPath   = buildParentPath(page.parentId1, page.parentId2, page.parentId3, page.parentId4);

			const stream = gulp.src(templateFile)
				.pipe(plumber())
				.pipe(gulpEjs({
					pageData:      page,
					RELATIVE_PATH: relativePath,
					template:      page.template,
					BREADCRUMBS:   breadcrumbs,
				}))
				.pipe(rename(page.id + '.html'));

			// ② 本番: minify / 開発: prettify
			if (isProd) {
				stream.pipe(htmlMin({
					removeComments:              true,
					collapseWhitespace:          false,
					collapseInlineTagWhitespace: true,
					preserveLineBreaks:          true,
					conservativeCollapse:        true,
					minifyCSS:                   true,
					minifyJS:                    true,
					removeRedundantAttributes:   true,
					removeScriptTypeAttributes:  true,
					removeStyleLinkTypeAttributes: true,
				}));
			} else {
				stream.pipe(prettify({
					indent_size: 2,
					preserve_newlines: true,
				}));
			}

			stream
				.pipe(gulp.dest(paths.ejs.dist + parentPath))
				.on('end', resolve)
				.on('error', reject);
		})
	);

	return Promise.all(buildPromises).catch(error => {
		console.error('EJS build error:', error);
		throw error;
	});
};

// ============================================================
// Sass Task  ① partial 除外 / ④ sourcemap は dev のみ
// ============================================================
export const sassTask = function () {
	let stream = gulp.src(paths.styles.src)    // ① partial (_*.scss) を除外済み
		.pipe(plumber());

	if (!isProd) stream = stream.pipe(sourcemaps.init()); // ④ dev のみ sourcemap

	stream = stream
		.pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
		.pipe(autoprefixer({ cascade: false }))   // browserslist は package.json で管理
		.pipe(cleanCSS({ compatibility: 'ie8', level: 2 }));

	if (!isProd) stream = stream.pipe(sourcemaps.write('./maps')); // ④ dev のみ出力

	return stream.pipe(gulp.dest(paths.styles.dist));
};

// ============================================================
// JavaScript Task  ⑥ main / vendors の watch を分離
// ============================================================
export const jsMainTask = function () {
	return gulp.src(paths.scripts.src)
		.pipe(plumber())
		.pipe(babel({ presets: [['@babel/preset-env']] })) // browserslist は package.json で管理
		.pipe(terser({ keep_fnames: false, mangle: { toplevel: true } }))
		.pipe(gulp.dest(paths.scripts.dist));
};

export const jsVendorTask = function () {
	return gulp.src(paths.scripts.vendors)        // ⑥ vendors は copy のみ・babel 不要
		.pipe(changed(paths.scripts.dist))
		.pipe(gulp.dest(paths.scripts.dist));
};

export const jsTask = gulp.parallel(jsMainTask, jsVendorTask);

// ============================================================
// Image Optimization Task  ⑦ SVGO v3 形式 / ⑨ changed() 済み
// ============================================================
export const imgRasterTask = function () {
	return gulp.src(paths.images.raster, { encoding: false })
		.pipe(plumber())
		.pipe(changed(paths.images.dist))          // ⑨ 差分のみ処理
		.pipe(imageMin([
			mozJpeg({ quality: 80 }),
			pngQuant({ quality: [0.6, 0.8], speed: 1 }),
		], { verbose: true }))
		.pipe(gulp.dest(paths.images.dist));
};

export const imgSvgTask = function () {
	return gulp.src(paths.images.svg, { encoding: false })
		.pipe(plumber())
		.pipe(changed(paths.images.dist))          // ⑨ 差分のみ処理（バグ修正: .pipe が抜けていた）
		.pipe(svgMin({
			// ⑦ SVGO v3 形式: { name, params } または { name, active: false }
			plugins: [
				{ name: 'removeViewBox',             active: false },
				{ name: 'removeMetadata',            active: false },
				{ name: 'convertColors',             active: false },
				{ name: 'removeUnknownsAndDefaults', active: false },
				{ name: 'convertShapeToPath',        active: false },
				{ name: 'collapseGroups',            active: false },
				{ name: 'cleanupIds',                active: false }, // ⑦ v3: cleanupIDs → cleanupIds
			],
		}))
		.pipe(gulp.dest(paths.images.dist));
};

export const imgTask = gulp.parallel(imgRasterTask, imgSvgTask);

// ============================================================
// WebP Conversion Task  ⑨ changed() 済み
// ============================================================
export const webpTask = function () {
	return gulp.src(paths.images.srcWebp, { encoding: false })
		.pipe(plumber())
		.pipe(changed(paths.images.distWebp, { extension: '.webp' })) // ⑨ 差分のみ
		.pipe(gulpWebp({ quality: 80, preset: 'photo', method: 3 }))
		.pipe(gulp.dest(paths.images.distWebp));
};

// ============================================================
// Clean Task
// ============================================================
export const cleanTask = function (done) {
	console.log('Clean task - Add cleanup logic here');
	done();
};

// ============================================================
// Watch Task  ⑥ main / vendors を別 watch に分離
//             ⑤ dev 時は img / webp を watch しない
// ============================================================
export const watchTask = function (done) {
	gulp.watch('ejs/**/*.ejs',       gulp.series(ejsTask));
	gulp.watch('scss/**/*.scss',     gulp.series(sassTask));
	gulp.watch(paths.scripts.src,   gulp.series(jsMainTask));  // ⑥ main のみ
	gulp.watch(paths.scripts.vendors, gulp.series(jsVendorTask)); // ⑥ vendors のみ
	// ⑤ 画像は dev watch では自動実行しない → npx gulp imgTask / webpTask で手動実行
	done();
};

// ============================================================
// ③ dev / build を明確に分離
// ============================================================

// 開発用: 画像最適化・webp を除外し高速に回す
export const dev = gulp.series(
	gulp.parallel(ejsTask, sassTask, jsTask),
	watchTask
);

// 本番用: 全タスクを実行
export const build = gulp.series(
	gulp.parallel(ejsTask, sassTask, jsTask),
	gulp.parallel(imgTask, webpTask)
);

// default は dev（NODE_ENV=development で起動）
export default dev;
/* globals require, module */
const gobble = require('gobble');
const path = require('path');
const compile = require('diamond-compiler').default;
const resolve = require('rollup-plugin-node-resolve');
const common = require('rollup-plugin-commonjs');

function diamond(source){
	return compile(source);
}

diamond.defaults = {
	accept: [ '.js' ],
	ext: '.js'
};

const tests = gobble('test/tests')
	.exclude('*.onhold.js')
	.transform(diamond)
	.transform('flatten');

const index = tests
	.include(['**/*.js'])
	.transform(function importFiles(/*code*/) {
		const filename = this.filename;
		const basename = path.basename(filename, path.extname(filename));	
		return `import './${basename}';`;
	})
	.transform('concat', { 
		dest: 'index.js', 
		separator: '\n' 
	});
	
const qunit = gobble('test').include('qunit.js');

const test = gobble([qunit, index, tests, 'src'])
	.transform('rollup', {
		entry: 'index.js',
		dest: 'test.js',
		format: 'iife',
		plugins: [ 
			resolve({ jsnext: true }),
			common() 
		],
		cache: false
	});

// const build = gobble([ index, 'src' ])
// 	.transform('rollup', {
// 		// plugins: [ buble() ],
// 		entry: 'main.js',
// 		dest: 'diamond.js',
// 		format: 'iife'
// 	});

// const min = build.transform('uglifyjs', { ext: '.min.js' });

const html = gobble('test').include('index.html');
const research = gobble('research').moveTo('research');

module.exports = gobble([ test, /*build, min,*/ html, research ]);

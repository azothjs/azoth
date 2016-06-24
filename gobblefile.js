const gobble = require( 'gobble' );
const buble = require( 'rollup-plugin-buble' );
const path = require( 'path' );
const nodeResolve = require( 'rollup-plugin-node-resolve' );

const tests = gobble( 'test/tests' )
	.exclude( 'perf.test.js' )
	.transform( 'flatten' );

const index = tests.include( '**/*.js' )
	.transform( function importFiles( /*code*/ ) {
		const filename = this.filename;
		const basename = path.basename( filename, path.extname( filename ) );	
		return `import './${basename}';`;
	})
	.transform( 'concat', { 
		dest: 'index.js', 
		separator: '\n' 
	});
	
const qunit = gobble( 'test' ).include( 'qunit.js' );



class RollupNG2 {
	constructor(options){
		this.options = options;
	}
	resolveId( id ){
		if(id.startsWith('rxjs/')){
			return `${__dirname}/node_modules/rxjs-es/${id.replace('rxjs/', '')}.js`;
		}
	}
}

const rollupNG2 = config => new RollupNG2(config);

const test = gobble( [ index, tests, qunit, 'src' ] )
	.transform( 'rollup', {
		// plugins: [ buble() ],
		entry: 'index.js',
		dest: 'test.js',
		format: 'iife',
		globals: {
			'rxjs/Observable': 'Rx.Observable',
			'rxjs/BehaviorSubject': 'Rx.BehaviorSubject'
		}
	});

const build = gobble( [ index, 'src' ] )
	.transform( 'rollup', {
		// plugins: [ buble() ],
		entry: 'main.js',
		dest: 'diamond.js',
		format: 'iife'
	});

// const min = build.transform( 'uglifyjs', { ext: '.min.js' });

const html = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );

module.exports = gobble( [ test, build, /*min,*/ html, research ] );

const gobble = require( 'gobble' );
// const bundleNpm = require( './bundle-npm' );
// const package = require( './package.json' );

const js = gobble( [ 'assets', 'test/tests' ] )
	.transform( 'babel', {
		sourceMaps: true,
		whitelist: [ 'es6.parameters', 'es6.destructuring' ]
	})
	.transform( 'rollup', {
  		entry: 'test.queue.js',
  		dest:  'test.js',
		format: 'umd'
	});

const index = gobble( 'test' ).include( 'index.html' );
const research = gobble( 'research' ).moveTo( 'research' );

// var modules = gobble( 'assets/npm' )
// 	.transform( bundleNpm, {
// 		modules: Object.keys( package.dependencies ),
// 		dest: 'modules.js'
// 	});

module.exports = gobble( [ js, /*modules,*/ index, research ] );

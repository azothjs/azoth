const gobble = require( 'gobble' );

const js = gobble( [ 'assets', 'test/tests' ] )
	// .transform( 'babel', {
	// 	sourceMaps: true,
	// 	hlist: ['es6.modules', 'strict']
	// })
	.transform( 'rollup', {
  		entry: 'test.new.index.js',
  		dest:  'test.js',
		format: 'umd'
	});

const index = gobble( 'test' ).include( 'index.html' );

module.exports = gobble( [ js, index ] );

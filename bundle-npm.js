const browserify = require( 'browserify' );
const fs = require( 'fs' );
const join = require( 'path' ).join;

module.exports = function bundleModules( inputdir, outputdir, options, callback ) {
	options = options || {};
	const modules = options.modules;
	if ( !modules || !modules.length ) { return; }

	const b = browserify();
	modules.forEach( module => b.require( module ) );

	const outfile = join( outputdir, options.dest || 'modules.js' );

	const myFile = fs.createWriteStream( outfile );
	b.bundle().pipe( myFile ).on( 'finish', callback );
};
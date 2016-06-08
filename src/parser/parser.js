import { makeDiv, toFragment } from './domUtil'; 
import toBindings from './mapDefsToBindings';
import getTextParser from './text-parser';
import getSectionParser from './section-parser';
import getAttrParser from './attr-parser';

const staticBundle = ( host, defs ) => ({
	html: host.innerHTML.replace( /=""/g, '' ),
	defs
});

const liveBundle = ( host, defs ) => {
	return {
		fragment: toFragment( host.childNodes ),
		bindings: toBindings( defs )
	};
};

const BINDING_ATTR = 'data-bind';
const parsers = [
	getSectionParser,
	getAttrParser,
	getTextParser
].map( get => get( BINDING_ATTR ) );

export default function parser( raw, options = { live: false } ){
	
	var { html, hash } = processMustaches( raw );
	const div = makeDiv( html, { clean: false } );
	
	const bundle = options.live ? liveBundle : staticBundle;

	return makeBindings( div, { hash, bundle } );
}

function processMustaches( html ) {
	const hash = Object.create( null );
	
	return {
		hash,
		html: parsers.reduce( ( html, p ) => {
			return p.replace( html, hash );
		}, html.trim() )
	};
}

function makeBindings( host, template ) {
	parsers.forEach( p => p.make( host, template, makeBindings ) );
	return template.bundle( host, rollupBindings( host, template.hash ) );
}

function rollupBindings( host, hash ) {
	
	const getBindings = n => {
		const bind = n.dataset.bind;
		if ( bind ) return bind.split( ',' ).map( n => hash[n] );
	};
	
	const getBinding = bindings => {
		return bindings.length === 1 ? bindings[0] : { binder: 'wrap', wrapped: bindings };
	};
	
	const nodeList = host.querySelectorAll( `[${BINDING_ATTR}]` );
	var ordered = [].slice.call( nodeList )
		.map( node => {
			const bindings = getBindings( node );
			node.setAttribute( BINDING_ATTR,  '' );
			return bindings ? getBinding( bindings ) : null;
		})
		// filter out orphans, foster parent will manage below
		.filter( bindings => bindings );
	
	const orphans = getBindings( host );
	if ( orphans ) {
		host.removeAttribute( BINDING_ATTR );
		ordered.push( getBinding( orphans ) );
	}
	
	return ordered;
}
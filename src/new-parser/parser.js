import { Context, Mapping } from './context';
import { Component, ComponentInvocation } from './component';
import { makeDiv } from '../parser/domUtil';

const BINDING_ATTR = 'data-bind';
const TEMP_ATTR = 'data-attr';

class Bindings {

	constructor() {
		this.hash = Object.create( null );
		this.b = 0;
	}
	
	add( binding ) {
		const name = `b${this.b++}`;
		this.hash[ name ] = binding;
		return name;
	}
}

class When {
	constructor( condition, truthy, falsey ) {
		this.binding = {
			type: 'when',
			condition: condition.toString(),
			truthy: truthy.toString(),
			falsey: falsey ? falsey.toString() : null
		};
	}
}

export function when( condition, truthy, falsey ) {
	return new When( condition, truthy, falsey );
}

export const getContext = Context.get;

export function $(strings, ...values) {
	const bindings = new Bindings();

	// template strings array(s) are frozen
	const newStrings = strings.slice();
	newStrings.raw = strings.raw.slice();
	
	function addTextBinding( binding, key, omitQuotes = false ) {
		if ( key ) binding.name = key;
		if ( !binding.type ) binding.type = key ? 'attr' : 'text';
		const name = bindings.add( binding );
		const prefix = omitQuotes ? '' : '"" ';
		return key
			? `${prefix}${TEMP_ATTR}-${name}`
			: `<text-node data-bind="${name}"></text-node>`;
	}

	const attrPattern = /\s*?([a-zA-Z0-9\-]+?)=$/;

	const mapped = values.map( ( value, i ) => {
		if ( value instanceof Mapping || value instanceof When ) {	
			const name = bindings.add( value.binding );	
			return `<section-node data-bind="${name}"></section-node>`;
		}
		const match = strings[i].match( attrPattern );
		const attr = match ? match[1] : '';

		if ( attr.startsWith( 'on-' ) ) {
			const events = attr.slice(3).split( '-' );
			newStrings[i] = newStrings[i].replace( attrPattern, ' ' );
			newStrings.raw[i] = newStrings.raw[i].replace( attrPattern, ' ' );
			const name = bindings.add({ 
				expr: value.toString(),
				type: 'event',
				events 
			});
			return `${TEMP_ATTR}-${name}`;	 
		}
		
		if ( value instanceof Context ) {
			return addTextBinding( { ref: value.getPath() }, attr );
		}
		
		if ( value instanceof ComponentInvocation ) {
			const name = bindings.add({
				type: 'component',
				constructor: value.Component
			});
			return `component data-attr-${name}`;
		}
		
		if ( value.prototype instanceof Component ) {
			return 'component';
		}

		if( typeof value === 'function' ) {
			return addTextBinding( { expr: value.toString() }, attr );
		}

		else {
			console.log( `unexpected value ${value}` );
			return value;
		}
	});
	const raw = String.raw( newStrings, ...mapped ).trim()
		.replace( /<component([^\/]*?\/)>/g, match => {
			return `${match.slice(0, -2)}></component>`;
		});

	const { hash } = bindings;
	const host = makeDiv( raw.trim() /*, { clean: false }*/ );
	rollupAttributes( host, hash );
	const ordered = rollupBindings( host, hash );

	return {
		html: host.innerHTML.replace( /=""/g, '' ),
		bindings: ordered
	};
}


function rollupAttributes( host, hash ) {
	Object.keys( hash )
		.map( key => [ key, hash[key] ] )
		.filter( ([ , val ]) => val.type === 'attr' || val.type === 'event' || val.type === 'component' )
		.forEach( ([ key ]) => {
			const attr = `${TEMP_ATTR}-${key}`;
			const node = host.querySelector( `[${attr}]` );
			addBinding( node, key );
			node.removeAttribute( attr );
		});
}

function addBinding( node, name ) {
	var attr = node.getAttribute( BINDING_ATTR ) || '';
	if ( attr ) attr += ',';
	node.setAttribute( BINDING_ATTR, attr += name );
}

function rollupBindings( host, hash ) {
	
	const getBindings = n => {
		const bind = n.dataset.bind;
		if ( bind ) return bind.split( ',' ).map( n => hash[n] );
	};
	
	const getBinding = bindings => {
		return bindings.length === 1 ? bindings[0] : { type: 'wrap', bindings };
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
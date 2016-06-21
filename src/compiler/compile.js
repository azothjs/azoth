import getTagged from './getTagged';
import htmlparser from 'htmlparser2';

const attrPattern = /\s*?([a-zA-Z0-9\-]+?)=$/;
const specials = {
	on: 'event',
	class: 'class'
};

export default function compile( source ){
	const tagged = getTagged( source );
	// TODO: more than one
	// this all needs to be roled back into AST
	// or new generated source file
	return parse( tagged[0].quasi );
}

function parse( { expressions, quasis } ){

	const getEl = ( name = 'root' ) => ({
		name, 
		attributes: {}, 
		bindings: [],
		childBindings: [],
		childCount: -1
	});

	const fragment = getEl();
	const html = [];
	const stack = [];
	let currentEl = fragment;
	let inElTag = false;
	let currentAttr = null;

	const handler = {
		onopentagname( name ) {
			currentEl.childCount++;
			stack.push( currentEl );
			
			currentEl = getEl( name );
			inElTag = true;
		},
		onattribute( name, value ) {
			currentEl.attributes[ currentAttr = name ] = value;
		},
		bindAttr( expr ){
			const name = currentAttr;
			const el = currentEl;
			const attrs = el.attributes;

			el.bound = true;

			const binding = { 
				el, 
				type: 'attr',
				name,
				expr: expr.name 
			};

			el.bindings.push( binding );

			const parts = name.split( '-' );
			let special = ''; 
			if( parts.length > 1 && ( special = specials[ parts[0] ] ) ) {
				delete attrs[ name ];
				binding.type = special;
			}

		},
		onopentag( name ) {
			const el = currentEl;
			const attrs = el.attributes;
			const attrsText = Object.keys( el.attributes ).map( key => {
				const val = attrs[key];
				return val == null ? key : `${key}="${val}"`;
			}).join(' ');

			el.htmlIndex = -2 + html.push(
				`<${name}${attrsText ? ' ' + attrsText : ''}`,
				'',
				`>`
			);
			delete el.attributes;
			currentAttr = null;
			inElTag = false;
		},
		ontext( text ) {
			html.push( text );
			if( currentEl ) currentEl.childCount++;
		},
		bindText( expr ){
			const el = currentEl;
			el.bound = true

			el.bindings.push({  
				el, 
				type: 'child-text',
				expr: expr.name,
				index: el.childCount
			});
		},
		onclosetag( name ) {
			html.push( `</${name}>` );
			const el = currentEl;
			currentEl = stack.pop();
			if( el.bound ) {
				html[ el.htmlIndex ] = ` data-bind`;
				currentEl.childBindings = currentEl.childBindings.concat( el.bindings );
			}
			if ( el.childBindings ) {
				currentEl.childBindings = currentEl.childBindings.concat( el.childBindings );
			}
		},
		onend() {
			if( fragment.childBindings.length ) {
				fragment.bindings = fragment.bindings.concat( fragment.childBindings );
			}
		}
	};

	var parser = new htmlparser.Parser( handler );

	quasis.forEach( ( quasi, i ) => {
		const raw =  quasi.value.raw;
		parser.write( raw );
		if( currentAttr ) {
			if ( !attrPattern.test( raw ) ) throw 'unexpected ${...} in attributes';
			// finish the attr
			parser.write( '""' );
			handler.bindAttr( expressions[i] );
		}
		else if ( i < expressions.length && !inElTag ) {
			parser.write( '<text-node></text-node>' );
			handler.bindText( expressions[i] );
		}
	});

	parser.end();

	let count = 0;
	const map = new Map();
	fragment.bindings.forEach( b => {
		let index;
		if ( map.has( b.el ) ) {
			index = map.get( b.el );	
		}
		else {
			index = count++;
			map.set( b.el, index );
		}
		delete b.el;
		b.elIndex = index;
	})
	
	return { 
		html: html.join( '' ),
		bindings: fragment.bindings
	};
}
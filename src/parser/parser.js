import { makeDiv, toFragment } from './fragmentUtil'; 

const textMustache = /({{[^#\/]+?}})/g;
const mustacheBrackets = /[{{|}}]/g;
const anyMustache = /({{.+?}})/g;

const textElName = 'text-node';
const sectionElName = 'section-node';
const tempName = 'temp-name';

const staticBundle = ( host, bindings ) => ({
	html: host.innerHTML.replace( /data-bind=""/g, 'data-bind' ),
	defs: bindings
});

const liveBundle = ( host, bindings ) => ({
	fragment: toFragment( host ),
	bindings
});

export default function parser( raw, options = { live: false } ){
	
	var { html, hash } = processMustaches( raw );
	const div = makeDiv( html, { clean: false } );
	
	const bundle = options.live ? liveBundle : staticBundle;

	return makeBindings( div, { hash, bundle } );
}

function processMustaches( html ) {
	const hash = Object.create( null );
	
	var i = 0;
	html = html.trim().replace( textMustache, match =>  {
		const name = `t${i++}`;
		const ref = match.replace( mustacheBrackets, '' ).trim();
		hash[ name ] = { ref, binder: 'text' };
		return `<${textElName} ${tempName}="${name}"></${textElName}>`;
	});
	
	i = 0;
	html = html.replace( anyMustache, match => {
		const name = `s${i++}`;
		const words = match
			.replace( mustacheBrackets, '' )
			.trim()
			.split( ' ' );
			
		const first = words.shift();
		var replace = '';
		if ( first[0] === '#' ) {
			const type = first.slice(1);
			const ref = words.join( ' ' );
			hash[ name ] = { type, ref, binder: 'section' };
			replace = `<${sectionElName} ${tempName}="${name}">`;
		}
		else {
			replace = `</${sectionElName}>`;	
		}
		
		return replace;
	});
	
	return { html, hash };
}

const BINDING_ATTR = 'data-bind';

function makeBindings( host, template ) {
	makeSectionBindings( host, template );
	makeTextBindings( host, template );
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

function makeSectionBindings( host, template ) {
	
	const bindings = template.hash;
	
	[].slice.call( host.querySelectorAll( sectionElName ) )
		.forEach( node => {
			const name = node.getAttribute( tempName );
			const parent = node.parentNode;
			const isOrphan = parent === host;
			const binding = bindings[ name ];
			node.removeAttribute( tempName );

			// add the binding name to the parent element
			var attr = parent.getAttribute( BINDING_ATTR ) || '';
			if ( attr ) attr += ',';
			parent.setAttribute( BINDING_ATTR, attr += name );
			// orphans need to be tagged with binding attr
			if ( isOrphan ) node.setAttribute( BINDING_ATTR, '' );
			
			const pos = getPosition( node );
			// record non-zero index
			if ( pos ) binding.index = pos;

			// replace the section node with a clone of top-level <section-node>
			parent.replaceChild( node.cloneNode(), node );
			// remove the data-bind from the node as "host" for child bindings
			node.removeAttribute( BINDING_ATTR );
			// recurse!
			binding.children = makeBindings( node, template );
		});
}

function makeTextBindings( host, template ) {
	
	const bindings = template.hash;

	[].slice.call( host.querySelectorAll( textElName ) )
		.filter( node => {
			const name = node.getAttribute( tempName );
			const parent = node.parentNode;
			const isOrphan = parent === host;
			const binding = bindings[ name ];
			node.removeAttribute( tempName );

			// add the binding name to the parent element
			var attr = parent.getAttribute( BINDING_ATTR ) || '';
			if ( attr ) attr += ',';
			parent.setAttribute( BINDING_ATTR, attr += name );
			// orphans need to be tagged with binding attr
			if ( isOrphan ) node.setAttribute( BINDING_ATTR, '' );
			
			const pos = getPosition( node );
			// record non-zero index
			if ( pos ) binding.index = pos;
			
			// assume we can remove the <text-node>
			var remove = true;
			// unless orphan or not the only childNode
			if ( isOrphan || parent.childNodes.length > 1 ) {
				binding.binder = 'childText';
				remove = false;
			}
			
			return remove;	
		})
		// remove the indicated elements from the dom
		.forEach( node => node.parentNode.removeChild( node ) );
}

function getPosition( node ) {
	var i = 0, prev = node;
	while( prev = prev.previousSibling ) i++;
	return i;
}
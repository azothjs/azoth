import parseTaggedTemplate from './parseTaggedTemplate';
import { parse } from 'acorn';
// import { recursive, ancestor, base } from 'acorn/src/walk';
/* global require */
const { recursive, ancestor, base } = require( 'acorn/dist/walk' );

const options = {
	ecmaVersion: 7,
	preserveParens: true,
	sourceType: 'module'
};

export default function findTemplates( source ) {
	const ast = parse( source, options );
	const tag = getTagName( ast );
	return getTaggedTemplates( tag, ast );
}



const MODULE_NAME = 'diamond';
const SPECIFIER_NAME = 'html';

function getTagName( ast ) {
	let tag = '';
	recursive( ast, {}, {
		ImportDeclaration( node, state, c ) {
			if( node.source.value !== MODULE_NAME ) return;
			const s = node.specifiers.find( s => s.imported.name === SPECIFIER_NAME );
			c( s, state, 'ImportSpecifier' );
		},
		ImportSpecifier( node ) {
			tag = node.local.name;
		}
	});
	return tag || '$';
}

const noNestedTTE = Object.assign( base, { TaggedTemplateExpression(){} } );

function getTaggedTemplates( tag, ast ) {
	const templates = [];
	ancestor( ast, {
		TaggedTemplateExpression( node, ancestors ) {
			if( node.tag.name !== tag ) return;
			
			const { html, bindings } = parseTaggedTemplate( node.quasi );
			const scope = getFnScope( ancestors );
			templates.push( { html, bindings, scope } );
		}
	}, noNestedTTE );
	return templates;
}

const isFn = /function/i;

function getFnScope( ancestors ) {
	// current child node is in stack
	let i = ancestors.length - 2;
	let node = null;
	while( node = ancestors[i--] ) {
		if ( isFn.test( node.type ) ) return node;
	}
}


import { addBinding } from './domUtil';

const attrMustache = /\s+(.[^=]+=['|"]{{[^#\/]+?}}['|"])/g;
const attrBrackets = /['{{|"{{|'}}'}}]/g;

const tempAttr = 'temp-attr';


export default function getAttrParser( BINDING_ATTR ) {
	return {
		
		replace( html, hash ) {
			var i = 0;
			return html.replace( attrMustache, match =>  {
				const name = `a${i++}`;
				var [ attr, val ] = match.split( '=' ); 
				attr = attr.trim();
				const ref = val.replace( attrBrackets, '' ).trim();
				hash[ name ] = { ref, name: attr, binder: 'attribute' };
				return ` ${attr} ${tempAttr}-${name} ${tempAttr}`;
			});
		},
		
		make( host, template ) {
			const bindings = template.hash;
			const sliceAt = tempAttr.length + 1;

			[].slice.call( host.querySelectorAll( `[${tempAttr}]` ) )
				.forEach( node => {
					node.removeAttribute( tempAttr );
					[].slice.call( node.attributes )
						.filter( attr => {
							const name = attr.name;
							if ( name.indexOf( tempAttr ) !== 0 ) return false;
							const binder = name.slice( sliceAt );
							const binding = bindings[ binder ];
							if ( binding.name in node ) binding.binder = 'property';
							addBinding( node, BINDING_ATTR, binder );
							return true;
						})
						.forEach( attr => node.removeAttributeNode( attr ) );
				});
		}
	};
}
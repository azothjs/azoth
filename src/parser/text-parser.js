import { getPosition } from './domUtil';

const textMustache = /({{[^#\/]+?}})/g;
const mustacheBrackets = /[{{|}}]/g;

const textElName = 'text-node';
const tempName = 'temp-name';

export default function getTextParser( BINDING_ATTR ) {
	return {
		replace( html, hash ) {
			var i = 0;
			return html.replace( textMustache, match =>  {
				const name = `t${i++}`;
				const ref = match.replace( mustacheBrackets, '' ).trim();
				hash[ name ] = { ref, binder: 'text' };
				return `<${textElName} ${tempName}="${name}"></${textElName}>`;
			});
		},
		make( host, template ) {
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
				// remove the indicated elements
				.forEach( node => node.parentNode.removeChild( node ) );
		}
	};
}
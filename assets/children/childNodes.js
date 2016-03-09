import { getChildNode } from './getChild';

export function getChildren( parent, children ) {
	if ( !children || !children.length ) return;
	const childNodes = new ChildNodes( parent, children );
	if ( childNodes.renderers ) {
		return childNodes;
	}
}

export class ChildNodes {

	constructor ( parent, children ) {

		const l = children.length;

		let i = 0, renderers = null;

		for( ; i < l; i++ ) {
			const child = children[i];
			const Renderer = getChildNode( child.type );
			const renderer = new Renderer( child, i );
	    	parent.appendChild( renderer.create() );

	    	if ( renderer.isBound ) {
				if ( !renderers ) renderers = [ renderer ];
				else renderers.push( renderer );
			}
		}

		this.renderers = renderers;
	}

	render ( childNodes, context) {
		const children = this.renderers;
		const l = children.length;
		const binders = new Array(l);
		let i = l;

		while( i-- ) {
			binders[i] = children[i].render( childNodes );
		}

		while( ++i < l ) {
			binders[i]( context );
		}
	}
}

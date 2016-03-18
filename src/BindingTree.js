export default class BindingTree {
	
	constructor ( index = 0 ) {
		this.index = index;
		this._children = null;
		this._renderers = null;
	}

	createChild( index ) {
		var child = new BindingTree( index );
		this.children.push( child );
		return child;
	}
	
	get renderers() {
		const renderers = this._renderers;
		return renderers ? renderers : ( this._renderers = [] );
	}
	
	get children() {
		return this._children ? this._children : ( this._children = [] );
	}
	
	iterate( node, queue = [] ) {
		queueRenderers( this._renderers, queue, node );		
		iterateChildren( this._children, queue, node);
		return queue;
	}
}

function queueRenderers( renderers, queue, node ) {
	if ( !renderers )  return;
	
	for( var i = 0, l = renderers.length; i < l; i++ ) {
		queue.push( { fn: renderers[i], node } );
	}
}

function iterateChildren( children, queue, node ) {
	if ( !children ) return;
	
	var childNodes = node.childNodes;
	var child;
	for( var i = 0, l = children.length; i < l; i++ ){
		child = children[i];
		child.iterate( childNodes[ child.index ], queue );	
	}
}

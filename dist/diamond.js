(function () {
	'use strict';

	var Context = function Context ( data ) {
		this.data = data;
	};

	Context.prototype.get = function get ( ref ) {
		return ref === '.' ? this.data : this.data[ ref ];
	};

	var Binding = function Binding ( binding ) {
		this.binding = binding;
	};

	function $( children ) {
		return $.section( children );
	}

	$.section = function( children ) {
		var fragment = document.createDocumentFragment();
		appendChildren( fragment, children );
		return fragment;
	};
		
	$.text = function( text ) {
		return document.createTextNode( text );
	};
		
	$.comment = function( comment ) {
		return document.createComment( comment );
	};
		
	$.el = function( name, children ) {
		var element = document.createElement( name );
		appendChildren( element, children );
		return element;
	};

	function appendChildren( parent, children ) {
		var child;
		
		for ( var i = 0, l = children.length; i < l; i++ ) {
			child = children[ i ];
			if ( child instanceof Binding ){
				child = getNodeFromBinding( child );
			};
			parent.appendChild( child );
		}
	}

	function getNodeFromBinding( binding ) {
		var node = binding.node();
		node._binding = binding;
		return node;
	}

	function getBindings( clone, bindingTree ) {
				
		var queue = [];
		
		function queueBindings( node, bindingTree ) {
			if ( !bindingTree ) return;
			
			var childNodes = node.childNodes;
			
			var map, index, childNode, bindings;
			
			for( var i = 0, l = bindingTree.length; i < l; i++ ){
				map = bindingTree[i];
				bindings = map.bindings;
				index = map.index || 0;
				childNode = childNodes[ index ];
				
				if ( bindings ) {
					for( var j = 0, bl = bindings.length; j < bl; j++ ) {
						queue.push({ 
							binding: bindings[j],
							node: childNode,
							parent: node,
							index: index,
						});
					}
				}
				
				queueBindings( childNode, map.children );	
			}
		}	
		
		queueBindings( clone, bindingTree );
		
		return queue;
	}

	function getBindingTree( childNodes ) {
		
		if ( !childNodes ) return;
		var l = childNodes.length;
		if ( !l ) return;
		
		var results, childNode, result, children, binding
		
		for( var i = 0; i < l; i++ ) {
		
			childNode = childNodes[i];
			result = null;
			 
			children = getBindingTree( Array.isArray( childNode ) ? childNode : childNode.childNodes );
			
			if ( children ) {
				result = { children: children };
			}
			
			binding = childNode._binding;
			
			if( binding ) {
				result = result || {};
				result.bindings = [ binding ];
				delete childNode._binding;
			}
			
			if ( result ) {
				if (i) result.index = i;
				results = results || [];
				results.push( result );
			}	
		}
		
		return results && results.length ? results : null;	
	}

	var DOMTemplate = function DOMTemplate ( fragment, bindingTree ) {
		if ( bindingTree === void 0 ) bindingTree = getBindingTree( fragment.childNodes );

			this.fragment = fragment;
		this.bindingTree = bindingTree;
			
		// console.log( JSON.stringify(bindingTree, true, 2) );
	};
		
	DOMTemplate.prototype.node = function node () {
		return document.createDocumentFragment();
	};
		
	DOMTemplate.prototype.render = function render() {
		var node = this.fragment.cloneNode( true );
		// const queue = [];
		// queueBindings( queue, node, this.bindingTree );
		var queue = getBindings( node, this.bindingTree )
		return { node: node, queue: queue };
	};

	function bind( queue, context ) {
		var each;
		for ( var i = 0, l = queue.length; i < l; i++ ) {
			each = queue[i];
			each.binding.bind( context, each );
		}
	}

	var ForBlock = function ForBlock () {};

	ForBlock.prototype.bind = function bind( context, binding, add ) {
		var value = context.get( binding.ref );
		if ( Array.isArray( value ) ) {
			for ( var i = 0, l = value.length; i < l; i++ ) {
				add( new Context( value[i] ) );
			}
		}
	};

	var IfBlock = function IfBlock () {};

	IfBlock.prototype.bind = function bind( context, binding, add ) {
		var value = context.get( binding.ref );
		if ( value ) add( context );
	};

	var WithBlock = function WithBlock () {};

	WithBlock.prototype.bind = function bind( context, binding, add ) {
		var value = context.get( binding.ref );
		if ( value != null ) add( new Context( value ) );
	};

	var blocks = {
		for: ForBlock,
		if: IfBlock,
		with: WithBlock
	};

	var Section = (function (Binding) {
		function Section ( binding, template ) {
			Binding.call( this, binding );
			
			this.template = new DOMTemplate( 
				template.fragment, 
				template.bindingTree 
			);
			
			var Block = blocks[ binding.type ];
			
			if ( !Block ) throw new Error( ("Unrecognized section type " + (binding.type)) );

			this.block = new Block();
		}

		Section.prototype = Object.create( Binding && Binding.prototype );
		Section.prototype.constructor = Section;
		
		Section.prototype.node = function node () {
			return $.comment( this.binding.type );
		};
		
		Section.prototype.bind = function bind$1 ( context, target ) {
			var anchor = target.node;
			var template = this.template;
			
			function add( addContext ) {
				var ref = template.render(), queue = ref.queue, node = ref.node;
				bind( queue, addContext );
				anchor.parentNode.insertBefore( node, anchor );
			}
			
			this.block.bind( context, this.binding, add );
			
		};

		return Section;
	}(Binding));

	var DOMText = (function (Binding) {
		function DOMText () {
			Binding.apply(this, arguments);
		}

		DOMText.prototype = Object.create( Binding && Binding.prototype );
		DOMText.prototype.constructor = DOMText;

		DOMText.prototype.node = function node () {
			return $.text( '' );
		};
		
		DOMText.prototype.bind = function bind ( context, target ) {
			target.node.textContent = context.get( this.binding.ref );
		};

		return DOMText;
	}(Binding));

	function Đ( binding, children ) {
		return Đ.section( binding, children );
	}

	Đ.text = function( binding ) {
		return new DOMText( binding );
	};

	Đ.section = function( binding, template ) {
		return new Section( binding, template );
	};

	var dom = { 
		type: 'dom',
		$tatic: $, 
		bound: Đ,
		getTemplate: function getTemplate( fragment, bindingTree ) { 
			return new DOMTemplate( fragment, bindingTree ); 
		}  
	};

	var Diamond = function Diamond( ref ) {
		var template = ref.template;
			var data = ref.data;
			var el = ref.el;

			var fragment = template.fragment, bindingTree = template.bindingTree;
		var rendered = dom.getTemplate( fragment, bindingTree );
		var ref$1 = rendered.render(), queue = ref$1.queue, node = ref$1.node;
		var context = new Context( data );
		bind( queue, context );
		el.appendChild( node );
	};

	Diamond.dom = dom;

	self.Diamond = Diamond;

}());
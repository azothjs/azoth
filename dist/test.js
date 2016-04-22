(function () {
	'use strict';

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

	var Context = function Context ( data ) {
		this.data = data;
	};

	Context.prototype.get = function get ( ref ) {
		return ref === '.' ? this.data : this.data[ ref ];
	};

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

	var test = QUnit.test;
	var module$1 = QUnit.module;

	QUnit.dump.maxDepth = 0;

	var fixture = document.getElementById( 'qunit-fixture' );

	var $tatic = dom.$tatic;
	var bound = dom.bound;
	(function(){	
		
		module$1( 'create' );

		var t1 = bound.text({ ref: 'place' });
		
		var fragment = $tatic([
			$tatic.el( 'div', null, [
				$tatic.el( 'span', null, [ 
					$tatic.text( 'Hello ' ),  
					t1
				])
			])
		]);

		test( 'dom fragment', function ( t ) {
			fixture.appendChild( fragment.cloneNode( true ) );
			t.equal( fixture.innerHTML, '<div><span>Hello </span></div>' );	
		});

		test( 'binding tree', function ( t ) {
			t.deepEqual( getBindingTree( fragment.childNodes ), [{
				children: [{
					children: [{
						index: 1,
						bindings: [ t1 ]
					}]	
				}]
			}]);
		});

	})();

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

	var test$1 = QUnit.test;
	var module$2 = QUnit.module;
	var fixture$1 = document.getElementById( 'qunit-fixture' );
	module$2( 'dom render' );

	var ref = Diamond.dom;
	var $tatic$1 = ref.$tatic;
	var bound$1 = ref.bound;
	test$1( 'elements and text', function ( t ) {
		
		var t1 = bound$1.text({ ref: 'foo' });
		var t2 = bound$1.text({ ref: 'bar' });
		
		var fragment = $tatic$1([
			$tatic$1.el( 'div', [
				$tatic$1.el( 'span', [ t1 ] ),
				$tatic$1.el( 'span', [ $tatic$1.text( 'label: ' ), t2 ] )
			])
		]);
		
		new Diamond( { 
			template: { fragment: fragment }, 
			data: { foo: 'foo', bar: 'bar' }, 
			el: fixture$1 
		});
		
		t.equal( fixture$1.innerHTML, '<div><span>foo</span><span>label: bar</span></div>' );
	});

	test$1( 'static section', function ( t ) {
		
		var t1 = bound$1.text({ ref: 'foo' });
		
		var fragment = $tatic$1([
			$tatic$1.el( 'div', [ t1 ] )
		]);
		
		new Diamond( { 
			template: { fragment: fragment }, 
			data: { foo: 'foo' }, 
			el: fixture$1 
		});
		
		t.equal( fixture$1.innerHTML, '<div>foo</div>' );
	});

	test$1( '#for section', function ( t ) {
		
		var t1 = bound$1.text({ ref: '.' });
		
		var fragment = $tatic$1([
			bound$1( { type: 'for', ref: 'items' }, {
				fragment: $tatic$1( [ $tatic$1.el( 'li', [ t1 ] ) ] )
			})
		]);
		
		new Diamond( { 
			template: { fragment: fragment }, 
			data: { items: [ 1, 2, 3 ] }, 
			el: fixture$1 
		});	
		
		t.equal( fixture$1.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );

	});

	(function () {
		
		var t1 = bound$1.text({ ref: 'foo' });
		
		var fragment = $tatic$1([
			bound$1( { type: 'if', ref: 'condition' }, {
				fragment: $tatic$1( [ $tatic$1.el( 'li', [ t1 ] ) ] )
			})
		]);
			
		test$1( '#if section true', function ( t ) {
			new Diamond( { 
				template: { fragment: fragment }, 
				data: { condition: true, foo: 'foo' }, 
				el: fixture$1 
			});	
			t.equal( fixture$1.innerHTML, '<li>foo</li><!--if-->' );
		});

		
		test$1( '#if section false', function ( t ) {
			new Diamond( { 
				template: { fragment: fragment }, 
				data: { condition: false, foo: 'foo' }, 
				el: fixture$1 
			});	
			t.equal( fixture$1.innerHTML, '<!--if-->' );
		});
		
	})();

	(function () {
		
		var t1 = bound$1.text({ ref: 'a' });
		var t2 = bound$1.text({ ref: 'b' });
		
		var fragment = $tatic$1([
			bound$1( { type: 'with', ref: 'obj' }, {
				fragment: $tatic$1( [ $tatic$1.el( 'p', [ t1, t2 ] ) ] )
			})
		]);
			
		test$1( '#with section', function ( t ) {
			new Diamond( { 
				template: { fragment: fragment }, 
				data: { obj: { a: 'A', b: 'B' } }, 
				el: fixture$1 
			});	
			t.equal( fixture$1.innerHTML, '<p>AB</p><!--with-->' );
		});

		test$1( '#with section, no object', function ( t ) {
			new Diamond( { 
				template: { fragment: fragment }, 
				data: {}, 
				el: fixture$1 
			});	
			t.equal( fixture$1.innerHTML, '<!--with-->' );
		});

	})();

	var Diamond$1 = function Diamond( ref ) {
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

	Diamond$1.dom = dom;

	function deepSlice( array ) {
		
		function copy( arr ) {
			arr = arr.slice();
			
			var child;
			
			for( var i = 0, l = arr.length; i < l; i++ ) {
				if ( Array.isArray( child = arr[i] ) ) {
					arr[i] = copy( child );
				}
			}
			
			return arr;
		}
		
		return copy( array );
		
	}

	var StringTemplate = function StringTemplate ( fragment, bindingTree ) {
		if ( bindingTree === void 0 ) bindingTree = getBindingTree( fragment.childNodes );

			this.fragment = fragment;
		this.bindingTree = bindingTree;
	};
		
	StringTemplate.prototype.clone = function clone() {
		return deepSlice( this.fragment );
	};
		
	StringTemplate.prototype.getChildren = function getChildren( node ) {
		return node;
	};
		
	StringTemplate.prototype.render = function render(){};

	var StringSection = (function (Binding) {
		function StringSection ( binding, template ) {
			Binding.call( this, binding );
			
			this.template = new StringTemplate( 
				template.fragment, 
				template.bindingTree 
			);
			
			var Block = blocks[ binding.type ];
			
			if ( !Block ) throw new Error( ("Unrecognized section type " + (binding.type)) );

			this.block = new Block();
		}

		StringSection.prototype = Object.create( Binding && Binding.prototype );
		StringSection.prototype.constructor = StringSection;
		
		StringSection.prototype.node = function node () {
			return [];
		};
		
		StringSection.prototype.bind = function bind$1 ( context, target ) {
			var anchor = target.node;
			var template = this.template;
			
			function add( addContext ) {
				var ref = template.render(), queue = ref.queue, node = ref.node;
				bind( queue, addContext );
				target.node.push( node );
			}
			
			this.block.bind( context, this.binding, add );
			
		};

		return StringSection;
	}(Binding));

	var Placeholder = function Placeholder () {};

	Placeholder.prototype.toString = function toString() { return '' };;

	var StringText = (function (Binding) {
		function StringText () {
			Binding.apply(this, arguments);
		}

		StringText.prototype = Object.create( Binding && Binding.prototype );
		StringText.prototype.constructor = StringText;

		StringText.prototype.node = function node () {
			return new Placeholder();
		};
		
		StringText.prototype.bind = function bind ( context, target ) {
			target.parent[ target.index ] = context.get( this.binding.ref );
		};

		return StringText;
	}(Binding));

	var test$2 = QUnit.test;
	var module$3 = QUnit.module;
	var fixture$2 = document.getElementById( 'qunit-fixture' );
	module$3( ("" + (dom.type) + " performance") );

	var ref$1 = Diamond$1.dom;
	var $tatic$2 = ref$1.$tatic;
	var bound$2 = ref$1.bound;
	var count = 1500;
	var treshhold = 150;

	test$2( ("jsBlocks 12 column table with " + count + " rows < " + treshhold + "ms"), function ( t ) {
		
		var items = [];
		var columns = [ 'message', 'number', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth' ];
		
		for( var i = 0; i < count; i++ ) {        
			items[i] = {
				message: ("message " + i),
				number: i,
				first: ("first " + i),
				second: ("second " + i),
				third: ("third " + i),
				fourth: ("fourth " + i),
				fifth: ("fifth " + i),
				sixth: ("sixth " + i),
				seventh: ("seventh " + i),
				eighth: ("eighth " + i),
				ninth: ("ninth " + i),
				tenth: ("tenth " + i),
			};
		}
		var start = performance.now();
		
		var bindings = columns.map( function ( ref ) { return bound$2.text({ ref: ref }); } );
		var tds = bindings.map( function ( b ) { return $tatic$2.el( 'td', [ b.node() ] ); } );
		
		var s1 = bound$2( { type: 'for', ref: 'items' }, {
			fragment: $tatic$2([
				$tatic$2.el( 'tr', tds ) 
			]),
			bindingTree: [{
				children: bindings.map( function ( b, index ) {
					return {
						index: index,
						children: [ { bindings: [ b ] } ]
					}; 
				})
			}]
		});
		
		var template = {
			fragment: $tatic$2([
				$tatic$2.el( 'table', [ s1.node() ])
			]),
			bindingTree: [{
				children: [{
					bindings: [ s1 ]
				}]
			}]
		};
		
		new Diamond$1( { 
			template: template, 
			data: { items: items }, 
			el: fixture$2 
		});
		
		var elapsed = performance.now() - start;
				
		t.ok( elapsed < treshhold, ("render took " + elapsed + "ms") );
		console.log( ("" + (dom.type) + " render " + count + " items: " + elapsed + "ms") );
	});


	test$2( ("mithril 150 simple items"), function ( t ) {
		
		var items = [{name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}, {name: "a"}, {name: "b"}, {name: "c"}];
		
		var start = performance.now();
		
		var t2 = bound$2.text({ ref: 'name' });
		
		var s1 = bound$2( { type: 'for', ref: 'items' }, {
			fragment: $tatic$2([
				$tatic$2.el( 'span', [ t2.node() ]) 
			]),
			bindingTree: [{
				children: [{
					bindings: [ t2 ]
				}]
			}]
		});
		
		var template = {
			fragment: $tatic$2([ s1.node() ]),
			bindingTree: [{
				bindings: [ s1 ]
			}]
		};
		
		new Diamond$1( { 
			template: template, 
			data: { items: items }, 
			el: fixture$2 
		});
				
		var elapsed = performance.now() - start;
		
		t.ok( true, ("render took " + elapsed + "ms") );
		
		console.log( ("" + (dom.type) + " mithril test render: " + elapsed + "ms") );
		
	});

}());
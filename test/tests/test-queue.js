import Context from './Context';
import BindingTree from './BindingTree';
import create from './create';
import render from './render';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );
const skip = { test: () => {} };

// template helpers
const getTextRef = ref => ({ type: 'text', ref });
const getElement = ( name, children ) => ({ type: 'element', name, children });
const getLI = children => getElement( 'li', children );
const getP = children => getElement( 'p', children );
const getSPAN = children => getElement( 'span', children );
const getDIV = children => getElement( 'div', children );

const staticText = { type: 'text', text: 'label:' };
const fooRef = getTextRef( 'foo' );
const barRef = getTextRef( 'bar' );
const span1 = getSPAN([ fooRef ]);
const span2 = getSPAN([ staticText, barRef ]);
const divWithSpans = getDIV([ span1, span2 ]);
const contextText = { type: 'text', ref: '.' };
const liWithContextText = getLI( [ contextText ] );

// check renderers in the binding tree
function countRenderers( bindingTree ) {
	const initial = bindingTree._renderers ? 1 : 0;
	const children = bindingTree._children;
	if ( !children ) return initial;
	
	return bindingTree.children.reduce( ( sum, child ) => {
		return sum + countRenderers( child );
	}, initial );
}

module( 'elements and text' );

test( 'render', t => {
    const template = { 
		children: [ divWithSpans ] 
	};

	const queue = new BindingTree();
	const result = create( template, queue );
	
	// append for purposes of inspection, normally would be "rendered" first
    fixture.appendChild( result.cloneNode( true ) );
    t.equal( fixture.innerHTML, '<div><span></span><span>label:</span></div>' );

	t.equal( countRenderers( queue ), 2 );
	t.equal( queue.children[0].children[0].children[0].renderers.length, 1 );
	t.equal( queue.children[0].children[1].children[1].renderers.length, 1 );
	
	fixture.innerHTML = '';
	const rendered = render( result, queue, new Context({ foo: 'foo', bar: 'bar'}) );
	fixture.appendChild( rendered );
	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label:bar</span></div>' );
});

module( '#static section' );

test( 'render', t => {
    const template = { 
		children: [{
			type: 'section',
			children: [ liWithContextText ]
		}] 
	};
	
	const queue = new BindingTree();
	const result = create( template, queue );
	
	// append for purposes of inspection, normally would be "rendered" first
    fixture.appendChild( result.cloneNode( true ) );
    t.equal( fixture.innerHTML, '<!--section-->' );

	t.equal( countRenderers( queue ), 1 );
	t.equal( queue.children[0].renderers.length, 1 );
	
	fixture.innerHTML = '';
	fixture.appendChild( render( result, queue, new Context( 'foo' ) ) );
	t.equal( fixture.innerHTML, '<li>foo</li><!--section-->' );
});

function renderToFixture( template, data ){
	const queue = new BindingTree();
	const result = create( template, queue );
	
	const rendered = render( result, queue, new Context( data ) );
	fixture.appendChild( rendered );
	// document.getElementById('paint').appendChild( rendered );
}

// inspecting whether spurious child elements get created - they do :( 
// module( 'binding tree' );

// test( 'limit', t => {
// 	renderToFixture({ 
// 		children: [ getDIV( [ getSPAN(), getSPAN() ] )] 
// 	});
// 	t.equal( fixture.innerHTML, '<div><span></span><span></span></div>' );
// });

module( '#for section' );

test( 'render', t => {
	renderToFixture({ 
		children: [{
			type: 'section',
			subtype: 'for',
			ref: 'items',
			children: [ liWithContextText ]
		}] 
	}, {
    	items: [ 1, 2, 3 ]
	});
	
	t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );
});

(function () {
	
	module( '#if section' );
	
	const ifTemplate = { 
		children: [{
			type: 'section',
			subtype: 'if',
			ref: 'conditional',
			children: [ getLI( [ fooRef ] ) ]
		}] 
	};

	test( 'true render', t => {
		renderToFixture( ifTemplate, { conditional: true, foo: 'foo' } );
		t.equal( fixture.innerHTML, '<li>foo</li><!--if-->');
	});

	
	test( 'false render', t => {
		renderToFixture( ifTemplate, { conditional: false, foo: 'foo' } );
		t.equal( fixture.innerHTML, '<!--if-->');
	});
	
})();


(function () {
	
	module( '#with section' );

	const withTemplate = { 
		children: [{
			type: 'section',
			subtype: 'with',
			ref: 'obj',
			children: [ getP( [ getTextRef('a'), getTextRef('b') ] ) ]
		}] 
	};
	
	test( 'context render', t => {
		renderToFixture( withTemplate, { obj: { a: 'A', b: 'B' } } );
		t.equal( fixture.innerHTML, '<p>AB</p><!--with-->');
	});

	test( 'no ref context, no render', t => {
		renderToFixture( withTemplate, {} );
		t.equal( fixture.innerHTML, '<!--with-->');
	});

})();

module( 'big template' );

test( 'renderer big template', t => {
    const template = {
		children: [{
			type: 'element',
			name: 'table',
			children: [{
				type: 'section',
				subtype: 'for',
				ref: 'items',
				children: [{
					type: 'element',
					name: 'tr',
					children: [{
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'message'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'number'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'first'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'second'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'third'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'fourth'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'fifth'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'sixth'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'seventh'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'eighth'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'ninth'
						}]
					}, {
						type: 'element',
						name: 'td',
						children: [{
							type: 'text',
							ref: 'tenth'
						}]
					}]
				}]
			}]
		}]
    };

	const number = 200;
	const run = `render ${number} rows`;
    const items = new Array( number );
	
    for( var i = 0, l = items.length; i < l; i++ ){
        items[i] = {
            message: `message ${i}`,
            number: i,
            first: `first ${i}`,
            second: `second ${i}`,
            third: `third ${i}`,
            fourth: `fourth ${i}`,
            fifth: `fifth ${i}`,
            sixth: `sixth ${i}`,
            seventh: `seventh ${i}`,
            eighth: `eighth ${i}`,
            ninth: `ninth ${i}`,
            tenth: `tenth ${i}`,
        };
    }
	
    const dataContext = { items };

    console.time( run );
    renderToFixture( template, dataContext );
    console.timeEnd( run );

    // console.log( fixture.innerHTML );
    t.ok( true );

});




import Context from './Context';
import create from './create';
import render from './render';

const test = QUnit.test;
const module = QUnit.module;
const fixture = document.getElementById( 'qunit-fixture' );

const getTextRef = ref => ({ type: 'text', ref });
const getElement = ( name, children ) => ({ type: 'element', name, children });
const getLI = children => getElement( 'li', children );
const getSPAN = children => getElement( 'span', children );
const getDIV = children => getElement( 'div', children );

const staticText = { type: 'text', text: 'label:' };
const fooRef = getTextRef( 'foo' );
const barRef = getTextRef( 'bar' );
const span1 = getSPAN([ fooRef ]);
const span2 = getSPAN([ staticText, barRef ]);
const divWithSpans = getDIV([ span1, span2 ]);

const contextText = { type: 'text', ref: '.' };

const li = getLI( [ contextText ] );

const data = {
	foo: 'foo',
    bar: 'bar',
	isTrue: true,
	isFalse: false,
    items: [ 1, 2, 3 ],
	obj: {
		a: 'A',
		b: 'B'
	}
};

const context = new Context( data );
const stringContext = new Context( 'foo' );

function countFn( queue ) {
	const initial = queue.renderers ? 1 : 0;
	const children = queue.children;
	if ( !children ) return initial;
	
	return queue.children.reduce( ( sum, child ) => {
		return sum + countFn( child );
	}, initial );
}

function getQueue(){
	return { index: 0 };
}

// module( 'elements and text' );

// test( 'render', t => {
//     const template = { 
// 		children: [ divWithSpans ] 
// 	};

// 	const queue = getQueue();
// 	const result = create( template, queue );
	
// 	// console.log( JSON.stringify( queue, true, 2 ) );

// 	// append for purposes of inspection, normally would be "rendered" first
//     fixture.appendChild( result.cloneNode( true ) );
//     t.equal( fixture.innerHTML, '<div><span></span><span>label:</span></div>' );

// 	t.equal( countFn( queue ), 2 );
// 	t.equal( queue.children[0].children[0].children[0].renderers.length, 1 );
// 	t.equal( queue.children[0].children[1].children[1].renderers.length, 1 );
	
// 	fixture.innerHTML = '';
// 	fixture.appendChild( render( result, queue, context ) );
// 	t.equal( fixture.innerHTML, '<div><span>foo</span><span>label:bar</span></div>' );
// });

// module( '#static section' );

// test( 'render', t => {
//     const template = { 
// 		children: [{
// 			type: 'section',
// 			children: [ li ]
// 		}] 
// 	};

// 	const queue = getQueue();
// 	const result = create( template, queue );
	
// 	// append for purposes of inspection, normally would be "rendered" first
//     fixture.appendChild( result.cloneNode( true ) );
//     t.equal( fixture.innerHTML, '<!--section-->' );

// 	t.equal( countFn( queue ), 1 );
// 	t.equal( queue.children[0].renderers.length, 1 );
	
// 	fixture.innerHTML = '';
// 	fixture.appendChild( render( result, queue, stringContext ) );
// 	t.equal( fixture.innerHTML, '<li>foo</li><!--section-->' );
// });

function renderToFixture( template, cxt = context ){
	console.time('create');
	const queue = getQueue();
	const result = create( template, queue );
	console.timeEnd('create');
	
	console.time('render');
	const rendered = render( result, queue, cxt );
	// console.log( JSON.stringify( queue, true, 2 ) );
	fixture.appendChild( rendered );
	console.timeEnd('render');
}

// module( '#for section' );

// test( 'render', t => {
// 	renderToFixture({ 
// 		children: [{
// 			type: 'section',
// 			subtype: 'for',
// 			ref: 'items',
// 			children: [ li ]
// 		}] 
// 	});
// 	t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--for-->' );
// });

// module( '#if section' );

// const ifTemplate = { 
// 	children: [{
// 		type: 'section',
// 		subtype: 'if',
// 		ref: 'isTrue',
// 		children: [ getLI( [ fooRef ] ) ]
// 	}] 
// };

// test( 'true render', t => {
// 	renderToFixture( ifTemplate );
// 	t.equal( fixture.innerHTML, '<li>foo</li><!--if-->');
// });

// test( 'false render', t => {
//     ifTemplate.children[0].ref = 'isFalse';
// 	renderToFixture( ifTemplate );
// 	t.equal( fixture.innerHTML, '<!--if-->');
// });

// module( '#with section' );

// const withTemplate = { 
// 	children: [{
// 		type: 'section',
// 		subtype: 'with',
// 		ref: 'obj',
// 		children: [ getLI( [ getTextRef('a'), getTextRef('b') ] ) ]
// 	}] 
// };

// test( 'context render', t => {
// 	renderToFixture( withTemplate );
// 	t.equal( fixture.innerHTML, '<li>AB</li><!--with-->');
// });

// test( 'no context, no render', t => {
//     withTemplate.children[0].ref = 'noref';
// 	renderToFixture( withTemplate );
// 	t.equal( fixture.innerHTML, '<!--with-->');
// });

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

    const items = new Array( 1000 );
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
    const dataContext = new Context( { items } );

    console.time('total');
    renderToFixture( template, dataContext );
    console.timeEnd('total');

    // console.log( fixture.innerHTML );
    t.ok( true );

});




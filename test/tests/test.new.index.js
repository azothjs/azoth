import Section from './dom/section';
import Element from './dom/element';
import Text from './dom/text';
import Context from './Context';

const test = QUnit.test;
const fixture = document.getElementById( 'qunit-fixture' );

const div = { type: 'element', name: 'div' };
const text = { type: 'text', text: 'foo' };
const divWithText = { type: 'element', name: 'div', children: [ text ] };
const divWithDiv = { type: 'element', name: 'div', children: [ div ] };

const data = {
	foo: 'foo',
    bar: 'bar',
    items: [ 1, 2, 3 ]
};

const context = new Context( data );

test( 'static text node', t => {
    const template = { text: 'foo' };

    const renderer = new Text( template );
    fixture.appendChild( renderer.create() );

    t.notOk( renderer.isBound );
    t.equal( fixture.innerHTML, 'foo' );
});

test( 'ref text node', t => {
	const template = { ref: 'foo' };
    const renderer = new Text( template );
    fixture.appendChild( renderer.create() );

    t.ok( renderer.isBound );

    const bind = renderer.render( fixture.childNodes );
    bind( context );

    t.equal( t.equal( fixture.innerHTML, 'foo' ) );
});

test( 'section of two text nodes', t => {

    const template = {
        type: 'section',
        children: [
            { type: 'text', ref: 'foo' },
            { type: 'text', ref: 'bar' }
        ],
    };

    const section = new Section( template );
    fixture.appendChild( section.create() );

    t.ok( section.isBound );

    const bind = section.render( fixture.childNodes );
    bind( context );

    t.equal( fixture.innerHTML, 'foobar<!--section 0 anchor-->' );
});


test( 'section of two elements', t => {
    const el = { type: 'element', name: 'p' };
    const template = {
        type: 'section',
        children: [ el, el ]
    };

    const section = new Section( template );
    fixture.appendChild( section.create() );

    t.ok( section.isBound );

    const bind = section.render( fixture.childNodes );
    bind( context );

    t.equal( fixture.innerHTML, '<p></p><p></p><!--section 0 anchor-->' );
});

test( 'element with children', t => {
	const template = {
        type: 'element',
        name: 'div',
        children: [
            { type: 'element', name: 'p' },
            { type: 'element', name: 'p' },
        ]
    };

    const element = new Element( template );
    fixture.appendChild( element.create() );
    t.notOk( element.isBound );
    t.equal( fixture.innerHTML, '<div><p></p><p></p></div>' );
});

test( 'element with children and ref text node great-grand child', t => {
    const template = {
        type: 'element',
        name: 'div',
        children: [{
            type: 'element',
            name: 'ul',
            children: [{
				type: 'element',
				name: 'li',
				children: [
					{ type: 'text', ref: 'foo' }
				]
			}]
        }]
    };

    const element = new Element( template );

    fixture.appendChild( element.create() );
    const bind = element.render( fixture.childNodes );
    // TODO: is this ok that we don't know till after render?
    t.ok( element.isBound );

    bind( context );

    t.equal( fixture.innerHTML, '<div><ul><li>foo</li></ul></div>' );
});

test( 'repeated section', t => {
    const el = { type: 'element', name: 'p' };
    const template = {
        type: 'section',
        ref: 'items',
        children: [{
            type: 'element',
            name: 'li',
            children: [{ type: 'text', ref: '.' }]
        }]
    };

    const section = new Section( template );
    fixture.appendChild( section.create() );

    t.ok( section.isBound );

    const bind = section.render( fixture.childNodes );
    bind( context );

    t.equal( fixture.innerHTML, '<li>1</li><li>2</li><li>3</li><!--section 0 anchor-->' );
});

// test( 'element with attr and ref text node', t => {
// 	const template = {
// 		name: 'p',
// 		attributes: {
// 			style: { text: 'color: red;' }
// 		},
// 		children: [
// 			{ type: 'text', ref: 'foo' },
// 			{ type: 'text', text: 'bar' },
// 		]
// 	};
//     const renderer = element( template, 0 );

//     fixture.appendChild( renderer.node );

// 	const gen = renderer.binder( context );
//     const index = gen.next().value;
//     const instance = fixture.childNodes[ index ];
//     gen.next( instance );

//     t.equal( t.equal( fixture.innerHTML, `<p style="color: red;">foobar</p>` ) );
// });

test( 'renderer big template', t => {
    const template = {
        type: 'section',
        children: [{
            type: 'element',
            name: 'table',
            children: [{
                type: 'section',
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

    console.time('render');
    const section = new Section( template );
    const fragment = document.createDocumentFragment();
    fragment.appendChild( section.create() );

    const bind = section.render( fragment.childNodes );
    bind( dataContext );

    fixture.appendChild( fragment );

    console.timeEnd('render');

    // console.log( fixture.innerHTML );
    t.ok( true );

});

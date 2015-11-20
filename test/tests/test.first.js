import Template from './template';
import DOMRenderer from './renderers/DOMRenderer';
import TextRenderer from './renderers/TextRenderer';

const test = QUnit.test;
const fixture = document.getElementById( 'qunit-fixture' );

const div = { type: 'element', name: 'div' };
const text = { type: 'text', text: 'foo' };
const divWithText = { type: 'element', name: 'div', children: [ text ] };
const divWithDiv = { type: 'element', name: 'div', children: [ div ] };

test( 'renderer elements', t => {
    const template = [ div, div, div ];

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render() );
    t.equal( fixture.innerHTML, '<div></div><div></div><div></div>' );

    const text = new TextRenderer( template, { isRoot: true } );
    const out = text.render();
    t.equal( out, '<div></div><div></div><div></div>' );

});

test( 'renderer elements with attributes', t => {
    const template = [{ type: 'element', name: 'div',
        attributes: [{
            type: 'attribute',
            name: 'class',
            ref: 'class'
        }, {
            type: 'attribute',
            name: 'style',
            text: 'color: red;'
        }]
    }];

    const data = { class: 'myClass' };
    const context = {
        get( ref ) { return data[ref]; }
    };

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render( context ) );
    t.equal( fixture.innerHTML, '<div style="color: red;" class="myClass"></div>' );
});

test( 'renderer elements with attribute section', t => {
    const template = [{ type: 'element', name: 'div',
        attributes: [{
            type: 'section',
            ref: 'show',
            content: [{
                type: 'attribute',
                name: 'class',
                ref: 'class'
            }, {
                type: 'attribute',
                name: 'style',
                text: 'color: red;'
            }]
        }]
    }];

    const data = { class: 'myClass', show: true };
    const context = {
        get( ref ) { return data[ref]; }
    };

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render( context ) );
    t.equal( fixture.innerHTML, '<div style="color: red;" class="myClass"></div>' );
});

test( 'renderer elements with children', t => {
    const template = [ divWithText, div, divWithDiv ];

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render() );
    t.equal( fixture.innerHTML, '<div>foo</div><div></div><div><div></div></div>' );

    const text = new TextRenderer( template, { isRoot: true } );
    const out = text.render();
    t.equal( out, '<div>foo</div><div></div><div><div></div></div>' );

});

test( 'renderer element with text ref content', t => {
    const textRef = { type: 'text', ref: 'bar' };
    const divWithRef = { type: 'element', name: 'div', children: [ textRef ] };
    const template = [ divWithRef ];
    const data = {
        bar: 'yes'
    };
    const context = {
        get( ref ) { return data[ref]; }
    };

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render( context ) );
    t.equal( fixture.innerHTML, '<div>yes</div>' );

    const text = new TextRenderer( template, { isRoot: true } );
    var out = text.render( context );
    t.equal( out, '<div>yes</div>' );

});

test( 'renderer element with section', t => {
    const section = { type: 'section', content: [ { type: 'element', name: 'li' } ] }
    const div = { type: 'element', name: 'div' };
    const template = [ div, section, div ];
    const context = { get() { return [1, 2, 3] } };

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render( context ) );
    t.equal( fixture.innerHTML, '<div></div><li></li><li></li><li></li><!--section 1 anchor--><div></div>' );

    const text = new TextRenderer( template, { isRoot: true } );
    var out = text.render( context );
    t.equal( out, '<div></div><li></li><li></li><li></li><div></div>' );

});

test( 'renderer element with two sections', t => {
    const section1 = { type: 'section', ref: 'foos', content: [ { type: 'element', name: 'li' } ] };
    const section2 = { type: 'section', ref: 'bars', content: [ { type: 'element', name: 'p' } ] };
    const div = { type: 'element', name: 'div' };
    const template = [ div, section1, section2, div ];
    const data = {
        foos: [],
        bars: [ 1, 2 ]
    };
    const context = {
        get( ref ) { return data[ref]; }
    };

    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render( context ) );
    t.equal( fixture.innerHTML, '<div></div><!--section 1 anchor--><p></p><p></p><!--section 2 anchor--><div></div>' );

    const text = new TextRenderer( template, { isRoot: true } );
    var out = text.render( context );
    t.equal( out, '<div></div><p></p><p></p><div></div>' );

});

test( 'renderer big template', t => {
    const template = [{
        type: 'element',
        name: 'table',
        children: [{
            type: 'section',
            content: [{
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
    }];

    const items = new Array( 1500 );
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

    const context = { get() { return items } };

    console.time('dom renderer');
    const dom = new DOMRenderer( template, { isRoot: true } );
    fixture.appendChild( dom.render( context ) );
    //t.equal( fixture.innerHTML, '<div></div><li></li><li></li><li></li><!--section 1 anchor--><div></div>' );
    console.timeEnd('dom renderer');


    console.time('text renderer');
    const text = new TextRenderer( template, { isRoot: true } );
    var out = text.render( context );
    // t.equal( out, '<div></div><li></li><li></li><li></li><div></div>' );
    console.timeEnd('text renderer');

    t.ok( true );

});


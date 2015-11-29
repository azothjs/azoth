import sectionRenderer from './dom/section';
import elementRenderer from './dom/element';
import textRenderer from './dom/text';

const test = QUnit.test;
const fixture = document.getElementById( 'qunit-fixture' );

const div = { type: 'element', name: 'div' };
const text = { type: 'text', text: 'foo' };
const divWithText = { type: 'element', name: 'div', children: [ text ] };
const divWithDiv = { type: 'element', name: 'div', children: [ div ] };

const data = {
	foo: 'foo',
};

const context = {
    get( ref ) { return data[ref]; }
};

test( 'static text node', t => {
	const template = { text: 'foo' };
    const renderer = textRenderer( template, 0 );

    fixture.appendChild( renderer.node );

    t.notOk( renderer.binder );
    t.equal( fixture.innerHTML, 'foo' );
});

test( 'ref text node', t => {
	const template = { ref: 'foo' };
    const renderer = textRenderer( template, 0 );

    fixture.appendChild( renderer.node );

    const gen = renderer.binder( context );
    const index = gen.next().value;
    const instance = fixture.childNodes[ index ];
    gen.next( instance );

    t.equal( t.equal( fixture.innerHTML, 'foo' ) );
});


test( 'static element', t => {
	const template = { name: 'p' };
    const renderer = elementRenderer( template, 0 );

    fixture.appendChild( renderer.node );
    t.notOk( renderer.binder );
    t.equal( fixture.innerHTML, '<p></p>' );
});

test( 'section of two elements', t => {
	const el = { type: 'element', name: 'p' };
	const template = [ el, el ];
    const renderer = sectionRenderer( template, 0 );

    fixture.appendChild( renderer.node );

	const gen = renderer.binder( context );
    const index = gen.next().value;
    const instance = fixture.childNodes[ 0 ];
    gen.next( instance );

    t.equal( fixture.innerHTML, '<p></p><p></p><!--section 0 anchor-->' );
});

test( 'element with attr and ref text node', t => {
	const template = {
		name: 'p',
		attributes: {
			style: { text: 'color: red;' }
		},
		children: [
			{ type: 'text', ref: 'foo' },
			{ type: 'text', text: 'bar' },
		]
	};
    const renderer = elementRenderer( template, 0 );

    fixture.appendChild( renderer.node );

	const gen = renderer.binder( context );
    const index = gen.next().value;
    const instance = fixture.childNodes[ index ];
    gen.next( instance );

    t.equal( t.equal( fixture.innerHTML, `<p style="color: red;">foobar</p>` ) );
});

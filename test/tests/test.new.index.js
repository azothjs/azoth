
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
	const el = { name: 'p' };
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
			{ ref: 'foo' },
			{ text: 'bar' },
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


function sectionRenderer( template, index ) {
	const node = document.createComment( `section ${index} anchor` );
	const frag = document.createDocumentFragment();
	const binder = getSectionBinder( frag, template, index );
	return { node, binder };
}

function getSectionBinder( fragment, template, index ) {
	if ( !template || !template.length ) return;

	const binders = [];

	template.forEach( ( child, index ) => {
		const r = elementRenderer( child, index );
		fragment.appendChild( r.node );
		if ( r.binder ) binders.push( r.binder );
	});

	return function* bind( context ) {
		const anchor  = yield index;
		const parentNode = anchor.parentNode;
		const clone = fragment.cloneNode( true );

		if ( binders.length ) {
			const generators = binders.map( b => b( context ) );
			const instances = generators.map( g => clone.childNodes[ g.next().value ] );
			generators.forEach( ( g, i ) => g.next( instances[i] ) );
		}

		parentNode.insertBefore( clone, anchor );
	};
}

function elementRenderer( template, index ) {

	const node = document.createElement( template.name );
	const binder = getElementBinder( node, template, index );

	return { node, binder };
}

function getElementBinder( node, template, index ){
	const children = template.children;
	const attributes = template.attributes;
	if ( !children && !attributes ) return;

	const binders = [], attrs = [];

	if ( children ) {
		children.forEach( ( child, index ) => {
			const r = textRenderer( child, index );
			node.appendChild( r.node );
			if ( r.binder ) binders.push( r.binder );
		});
	}

	if ( attributes ) {
		const names = Object.keys( attributes );
		names.forEach( name => {
			const r = attributeRenderer( attributes[name], name );
			node.setAttributeNode( r.attr );
			if ( r.binder ) attrs.push( r.binder );
		});
	}

	if ( !binders.length && !attrs.legnth ) return;

	return function* bind( context ) {
		const instance  = yield index;

		if ( attrs.length ) {
			attrs.forEach( instance, context );
		}

		if ( binders.length ) {
			const generators = binders.map( b => b( context ) );
			const instances = generators.map( g => instance.childNodes[ g.next().value ] );
			generators.forEach( ( g, i ) => g.next( instances[i] ) );
		}
	};
}


function textRenderer( template, index ) {

	const node = document.createTextNode( template.text );
	const binder = getTextBinder( template, index );

	return { node, binder };
}

function getTextBinder( template, index ){
	if ( !template.ref ) return;

	return function* bind( context ) {
		const instance  = yield index;
		instance.textContent = context.get( template.ref );
	};
}

function attributeRenderer( template, name ) {

	const attr = document.createAttribute( name );
	const binder = getAttributeBinder( template );

	if ( !binder ) {
		attr.nodeValue = template.text;
	}

	return { attr, binder };
}

function getAttributeBinder( template, name ){
	if ( !template.ref ) return;

	return function bind( element, context ) {
		element.setAttribute( name, context.get( template.ref ) );
	};
}




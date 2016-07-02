import { test, module, fixture } from './qunit';
import renderer from './renderer2';
import Diamond from './Diamond';
// import compile from './compiler/compile';
import BehaviorSubject from 'rxjs/BehaviorSubject';

const { makeFragment } = Diamond;

function orphanTextBinding ( index = 0 ) {
	return node => {
		const text = node.childNodes[ index ];
		return val => text.nodeValue = val;
	};
}

const otb = [0,1,2,3,4,5,6,7,8,9].map( (_, i) => orphanTextBinding(i) );

module( 'fragment', () => {
	
	test( 'Rx single observable node', t => {
		
		// const template = foo => html`*${foo}`;

		const template = (() => {
			const render = renderer( makeFragment( '<text-node></text-node>' ) );
			const otb0 = otb[0];
			return foo => {
				const nodes = render();
				foo.subscribe( otb0( nodes[ nodes.length ] ) );
				return nodes[ nodes.length ];
			};
		})();
		
		const foo = new BehaviorSubject( 'foo' );
		fixture.appendChild( template(foo) );
		
		t.equal( fixture.innerHTML, 'foo' );
		foo.next( 'bar' );
		t.equal( fixture.innerHTML, 'bar' );

		fixture.appendChild( template(foo) );
		t.equal( fixture.innerHTML, 'barbar' );

		foo.next( 'foo' );
		t.equal( fixture.innerHTML, 'foofoo' );

	});

	test( 'Rx observable nodes with expression', t => {

		const template = ( x, y ) => html`*${x} + *${y} = *${x + y}`;
		
		const fragment = (() => {
			const render = renderer( makeFragment( 
				'<text-node></text-node> + <text-node></text-node> = <text-node></text-node>' 
			));
			const otb0 = otb[0];
			const otb2 = otb[2];
			const otb4 = otb[4];
			
			return ( x, y ) => {
				const nodes = render();
				const __n1 = nodes[0];
				x.subscribe( otb0( __n1 ) );
				y.subscribe( otb2( __n1 ) );
				x.combineLatest(y, (x, y) => x + y )
					.subscribe( otb4( __n1 ) );

				return nodes[ nodes.length ];
			};
		})();
		
		// const template = ( x, y ) => html`*${x} + *${y} = *${x + y}`;
		
		const x = new BehaviorSubject( 5 );
		const y = new BehaviorSubject( 2 );
		fixture.appendChild( fragment( x, y ) );
		
		t.equal( fixture.innerHTML, '5 + 2 = 7' );

		x.next( 3 );

		t.equal( fixture.innerHTML, '3 + 2 = 5' );

		y.next( 1 );

		t.equal( fixture.innerHTML, '3 + 1 = 4' );

		fixture.appendChild( fragment( x, y ) );

		t.equal( fixture.innerHTML, '3 + 1 = 43 + 1 = 4' );

	});

	test( 'Mixed observer/value expression', t => {

		// const template = ( x, y ) => html`*${x} + ${y} = *${x + y}`;

		const fragment = (() => {
			const render = renderer( makeFragment( 
				'<text-node></text-node> + <text-node></text-node> = <text-node></text-node>' 
			));
			const otb0 = otb[0];
			const otb2 = otb[2];
			const otb4 = otb[4];
			
			return ( x, y ) => {
				const nodes = render();
				x.subscribe( otb0( nodes[0] ) );
				y.subscribe( otb2( nodes[0] ) );
				x.combineLatest(y, (x, y) => x + y )
					.subscribe( otb4( nodes[0] ) );

				return nodes[ nodes.length ];
			};
		})();
		
		// const template = ( x, y ) => html`*${x} + *${y} = *${x + y}`;
		const x = new BehaviorSubject( 5 );
		const y = new BehaviorSubject( 2 );
		fixture.appendChild( fragment( x, y ) );
		
		t.equal( fixture.innerHTML, '5 + 2 = 7' );

		x.next( 3 );

		t.equal( fixture.innerHTML, '3 + 2 = 5' );

		y.next( 1 );

		t.equal( fixture.innerHTML, '3 + 1 = 4' );

		// fixture.appendChild( fragment( x, y ) );

	});

});
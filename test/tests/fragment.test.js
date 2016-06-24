import { test, module, fixture } from './qunit';
import renderer from './renderer2';
import Diamond from './Diamond';
import Observable from 'rxjs/Observable';
import BehaviorSubject from 'rxjs/BehaviorSubject';

const { bound, makeFragment } = Diamond;

function orphanTextBinding ( { index } = { index: 0 } ) {
	return nodes => {
		const node = nodes[0].childNodes[ index ];
		return val => node.nodeValue = val;
	};
}

module( 'fragment', () => {
	

	test( 'Rx single observable node', t => {
		//const template = foo => $`*${foo}`;

		const fragment = (() => {
			const render = renderer( makeFragment( '<text-node></text-node>' ) );
			const bindText = orphanTextBinding();
			const bind = ( nodes, foo ) => {
				foo.subscribe( bindText( nodes ) );
				return nodes[ nodes.length ];
			};
			return foo => bind( render(), foo );
		})();
		
		const foo = new BehaviorSubject( 'foo' );
		fixture.appendChild( fragment(foo) );
		
		t.equal( fixture.innerHTML, 'foo' );
		foo.next( 'bar' );
		t.equal( fixture.innerHTML, 'bar' );

		fixture.appendChild( fragment(foo) );
		t.equal( fixture.innerHTML, 'barbar' );

		foo.next( 'foo' );
		t.equal( fixture.innerHTML, 'foofoo' );

	});

	test( 'Rx observable nodes with expression', t => {
		// const template = ( x, y ) => $`*${x} + *${y} = *${x + y}`;

		const fragment = (() => {
			const render = renderer( makeFragment( 
				'<text-node></text-node> + <text-node></text-node> = <text-node></text-node>' 
			));
			const b1 = orphanTextBinding();
			const b2 = orphanTextBinding({ index: 2 });
			const b3 = orphanTextBinding({ index: 4 });
			
			const bind = ( nodes, x, y ) => {
				x.subscribe( b1( nodes ) );
				y.subscribe( b2( nodes ) );
				x.combineLatest(y, (x, y) => x + y )
					.subscribe( b3( nodes ) );

				return nodes[ nodes.length ];
			};
			// could inline bind call...
			return ( x, y ) => bind( render(), x, y );
		})();
		
		const x = new BehaviorSubject( 5 );
		const y = new BehaviorSubject( 2 );
		fixture.appendChild( fragment( x, y ) );
		
		t.equal( fixture.innerHTML, '5 + 2 = 7' );

		x.next( 3 );

		t.equal( fixture.innerHTML, '3 + 2 = 5' );

		fixture.appendChild( fragment( x, y ) );

	});

});
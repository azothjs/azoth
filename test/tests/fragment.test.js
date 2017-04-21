import { module, test, fixture } from './qunit';
import BehaviorSubject from 'rxjs/BehaviorSubject';
import combineLatest from 'rxjs/operator/combineLatest';
import { html as _ } from './diamond';

const clean = html => html
	.replace(/ data-bind=""/g, '')
	.replace(/<!--block-->/g, '')
	.replace(/<!--block start-->/g, '');

fixture.cleanHTML = function cleanHtml() {
	return clean(this.innerHTML);
};

module('fragment', () => {

	module('RxJS assumptions', () => {

		test('Rx combineLatest works with multiple observers', t => {
			const foo = new BehaviorSubject('foo');
			const bar = new BehaviorSubject('bar');
			const qux = new BehaviorSubject('qux');

			const expr = combineLatest(foo, bar, qux, (foo, bar, qux) => `${foo}-${bar}-${qux}`);
			let val = '';
			expr.subscribe(v => val = v);
			t.equal(val, 'foo-bar-qux');
			foo.next('faux');
			bar.next('barre');
			t.equal(val, 'faux-barre-qux');
			foo.next('foo');
			t.equal(val, 'foo-barre-qux');
		});

		test('pluck destructured property', t => {
			const obj = { foo: 'foo' };
			const observer = new BehaviorSubject(obj);
			const pluck = observer.pluck('foo').distinctUntilChanged();

			let plucked = '';
			pluck.subscribe(val => plucked = val);

			t.equal(plucked, 'foo');

			plucked = 'nochange';
			observer.next(obj);
			t.equal(plucked, 'nochange');

			pluck.next({ foo: 'qux' });
			t.equal(plucked, 'qux');

			observer.next({ foo: 'bar' });
			t.equal(plucked, 'bar');

		});
	});
	

	test('hello diamond', t => {
		
		const template = name => _`<span>Hello *${name}!</span>`;

		const name = new BehaviorSubject('diamond');
		const fragment = template(name);
		fixture.appendChild(fragment);

		t.equal(fixture.cleanHTML(), '<span>Hello diamond!</span>');

		name.next('pdx');
		t.equal(fixture.cleanHTML(), '<span>Hello pdx!</span>');

		fragment.unsubscribe();
		name.next('rxjs');
		t.equal(fixture.cleanHTML(), '<span>Hello pdx!</span>');
	});

	test('single observable node', t => {
		
		const template = foo => _`*${foo}`;

		const foo = new BehaviorSubject('foo');
		const fragment1 = template(foo);
		fixture.appendChild(fragment1);
		
		t.equal(fixture.cleanHTML(), 'foo');
		foo.next('bar');
		t.equal(fixture.cleanHTML(), 'bar');

		const fragment2 = template(foo);
		fixture.appendChild(document.createTextNode('|'));
		fixture.appendChild(fragment2);
		t.equal(fixture.cleanHTML(), 'bar|bar');

		foo.next('foo');
		t.equal(fixture.cleanHTML(), 'foo|foo');
		
		fragment1.unsubscribe();
		foo.next('qux');
		t.equal(fixture.cleanHTML(), 'foo|qux');
		fragment2.unsubscribe();
	});

	test('observable nodes with an expression', t => {

		const template = (x, y) => _`*${x} + *${y} = *${x + y}`;
				
		const x = new BehaviorSubject(5);
		const y = new BehaviorSubject(2);

		const fragment1 = template(x, y);
		fixture.appendChild(fragment1);
		
		t.equal(fixture.cleanHTML(), '5 + 2 = 7');

		x.next(3);

		t.equal(fixture.cleanHTML(), '3 + 2 = 5');

		y.next(1);

		t.equal(fixture.cleanHTML(), '3 + 1 = 4');
		
		const fragment2 = template(x, y);
		fixture.appendChild(document.createTextNode('|'));
		fixture.appendChild(fragment2);

		t.equal(fixture.cleanHTML(), '3 + 1 = 4|3 + 1 = 4');

		fragment1.unsubscribe();

		x.next(0);

		t.equal(fixture.cleanHTML(), '3 + 1 = 4|0 + 1 = 1');

		fragment2.unsubscribe();

	});

	test('external variables not parameterized', t => {

		const upper = s => s.toUpperCase();

		const template = x => _`*${upper(x)}`;
				
		const x = new BehaviorSubject('foo');

		const fragment = template(x);
		fixture.appendChild(fragment);
		
		t.equal(fixture.cleanHTML(), 'FOO');

		x.next('bar');

		t.equal(fixture.cleanHTML(), 'BAR');

		fragment.unsubscribe();

	});

	test('destructed property', t => {
		
		const template = ({ foo }) => _`*${foo}`;

		const obj = new BehaviorSubject({ foo: 'foo' });
		const fragment = template(obj);
		fixture.appendChild(fragment);
		
		t.equal(fixture.cleanHTML(), 'foo');
		obj.next({ foo: 'bar' });
		t.equal(fixture.cleanHTML(), 'bar');

		fragment.unsubscribe();
	});

	test('simple nested block', t => {
		
		const template = ({ foo }) => _`#${ _`<span>hello *${foo}</span>` }`;

		const obj = new BehaviorSubject({ foo: 'foo' });
		const fragment = template(obj);
		fixture.appendChild(fragment);
		
		t.equal(fixture.cleanHTML(), '<span>hello foo</span>');
		obj.next({ foo: 'bar' });
		t.equal(fixture.cleanHTML(), '<span>hello bar</span>');
		// TODO: this doesn't work in RxJS
		// obj.pluck('foo').next('qux');
		obj.next({ foo: 'qux' });

		t.equal(fixture.cleanHTML(), '<span>hello qux</span>');
		fragment.unsubscribe();
	});

	test('conditional block', t => {
		
		// const simple = choice => _`<div>${ choice ? _`<span>Yes</span>` : _`<span>No</span>` }`;
		
		const template = choice => _`*#${ choice ? _`<span>Yes</span>` : _`<span>No</span>` }`;

		const obj = new BehaviorSubject(true);
		const fragment = template(obj);
		fixture.appendChild(fragment);
		
		t.equal(fixture.cleanHTML(), '<span>Yes</span>');
		obj.next(false);
		t.equal(fixture.cleanHTML(), '<span>No</span>');

		fragment.unsubscribe();
	});

	// test('block with array', t => {
		
	// 	const template = items => _`
	// 		<ul>
	// 			#${ items.map(item => _`
	// 				<li>${item.name}</li>	
	// 			`)}
	// 		</ul>
	// 	`;

	// 	const items = new BehaviorSubject([
	// 		{ name: 'baloon' },
	// 		{ name: 'hammer' },
	// 		{ name: 'lipstick' },
	// 	]);
	// 	const fragment = template(items);
	// 	fixture.appendChild(fragment);
		
	// 	t.equal(fixture.cleanHTML(), '<ul><li>baloon</li><li>hammer</li><li>baloon</li></ul>');

	// 	fragment.unsubscribe();
	// });

	// test('Mixed observer/value expression', t => {

	// 	// const template = (x, y) => html`*${x} + ${y} = *${x + y}`;

	// 	const fragment = (() => {
	// 		const render = renderer(makeFragment(
	// 			'<text-node></text-node> + <text-node></text-node> = <text-node></text-node>' 
	// 		));
	// 		const otb0 = otb[0];
	// 		const otb2 = otb[2];
	// 		const otb4 = otb[4];
			
	// 		return (x, y) => {
	// 			const nodes = render();
	// 			x.subscribe(otb0(nodes[0]));
	// 			y.subscribe(otb2(nodes[0]));
	// 			x.combineLatest(y, (x, y) => x + y)
	// 				.subscribe(otb4(nodes[0]));

	// 			return nodes[ nodes.length ];
	// 		};
	// 	})();
		
	// 	// const template = (x, y) => html`*${x} + *${y} = *${x + y}`;
	// 	const x = new BehaviorSubject(5);
	// 	const y = new BehaviorSubject(2);
	// 	fixture.appendChild(fragment(x, y));
		
	// 	t.equal(fixture.cleanHTML(), '5 + 2 = 7');

	// 	x.next(3);

	// 	t.equal(fixture.cleanHTML(), '3 + 2 = 5');

	// 	y.next(1);

	// 	t.equal(fixture.cleanHTML(), '3 + 1 = 4');

	// 	// fixture.appendChild(fragment(x, y));

	// });

});